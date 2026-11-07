#!/usr/bin/env python3
"""
Christmas Experience — Raspberry Pi station agent

One small process per Pi. It:
  * serves the web app to the kiosk browser (http://localhost:8080/)
  * tells the page which station this Pi is      ->  GET  /api/config
  * reads arcade buttons on GPIO, pushes presses  ->  GET  /api/events   (Server-Sent Events)
  * drives an LED strip in "light scenes"         ->  GET  /api/scene/<name>
  * pulses the GO button's built-in lamp          ->  GET  /api/lamp/<pulse|on|off>
  * keeps a shared counter (candles lit)          ->  GET|POST /api/count/<key>
  * lets you fake a button press for testing      ->  GET  /api/press/<go|back|left|right>
  * status                                        ->  GET  /api/status

Hardware is optional: with no GPIO / LED libraries installed it still runs (great for testing on a laptop).
Standard library only, plus optional: gpiozero (buttons, lamp), adafruit-circuitpython-neopixel-spi (LEDs).

Usage:  python3 station_agent.py --config /path/to/config.json
"""
import argparse, json, math, os, queue, random, threading, time, urllib.request
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from functools import partial

HERE = os.path.dirname(os.path.abspath(__file__))
APP_DIR = os.path.dirname(HERE)

DEFAULTS = {
    "station": "1",              # 1-7 or "carols"
    "mode": "interactive",       # interactive | watch
    "next": "right",             # arrow on the end screen: left | right | ahead | none
    "idle": 90,                  # seconds before returning to the attract screen
    "volume": 0.9,
    "ambient": True,             # soft chimes on the attract screen
    "captions": "follow",        # follow (words light up with the voice) | plain | off
    "inviteHold": 0,             # seconds the Station 7 QR invitation stays up without a GO press (0 = 60, or 30 in watch mode)
    "port": 8080,
    "bind": "0.0.0.0",           # 127.0.0.1 to keep it private to the Pi
    "buttons": {"go": 17, "back": 27, "left": 22, "right": 23},   # BCM pins, button to GND
    "lamp_pin": 12,              # GO button lamp (via transistor). null to disable
    "leds": {
        "driver": "none",        # none | spi | wled
        "count": 60,             # spi: number of pixels
        "brightness": 0.5,
        "order": "GRB",
        "wled_host": "",         # wled: e.g. 192.168.1.50
        "wled_presets": {"off": 0, "idle": 1, "night": 2, "star": 3, "angel": 4, "manger": 5,
                          "journey": 6, "candle": 7, "celebrate": 8}
    },
    "counts_file": "counts.json"
}


def deep_merge(base, over):
    out = dict(base)
    for k, v in (over or {}).items():
        out[k] = deep_merge(base[k], v) if isinstance(v, dict) and isinstance(base.get(k), dict) else v
    return out


def log(*a):
    print(time.strftime("%H:%M:%S"), *a, flush=True)


# ------------------------------------------------------------------ events (SSE)
class Hub:
    def __init__(self):
        self.clients, self.lock = [], threading.Lock()

    def add(self):
        q = queue.Queue(maxsize=50)
        with self.lock:
            self.clients.append(q)
        return q

    def remove(self, q):
        with self.lock:
            if q in self.clients:
                self.clients.remove(q)

    def send(self, msg):
        with self.lock:
            for q in list(self.clients):
                try:
                    q.put_nowait(msg)
                except queue.Full:
                    pass


# ------------------------------------------------------------------ LED scenes
def lerp(a, b, t):
    return tuple(int(a[i] + (b[i] - a[i]) * t) for i in range(3))


GOLD, WARM, BLUE, WHITE, RED, GREEN = (255, 170, 60), (255, 110, 20), (10, 20, 90), (255, 245, 230), (200, 20, 20), (20, 160, 40)


def frame(scene, n, t, rnd):
    """Return a list of n RGB tuples for scene at time t (seconds)."""
    px = [(0, 0, 0)] * n
    if scene == "off":
        return px
    if scene in ("idle", "night", "journey"):
        base = {"idle": (20, 12, 40), "night": BLUE, "journey": (60, 20, 60)}[scene]
        px = [base] * n
        for i in range(n):  # twinkling stars
            s = math.sin(t * (0.6 + (i * 37 % 11) / 9) + i * 1.7)
            if s > 0.86:
                px[i] = lerp(base, WHITE, (s - 0.86) / 0.14)
        return px
    if scene == "star":
        head = (t * 0.25 % 1) * n
        for i in range(n):
            d = min(abs(i - head), n - abs(i - head))
            px[i] = lerp((15, 10, 40), GOLD, max(0, 1 - d / (n * 0.15)))
        return px
    if scene == "angel":
        b = 0.65 + 0.35 * math.sin(t * 2.2)
        return [lerp((40, 40, 60), WHITE, b)] * n
    if scene in ("manger", "candle"):
        out = []
        for i in range(n):
            f = 0.55 + 0.25 * math.sin(t * 7 + i * 1.3) + 0.2 * rnd.random()
            out.append(lerp((40, 10, 0), WARM if scene == "manger" else GOLD, min(1, f)))
        return out
    if scene == "celebrate":
        out = []
        for i in range(n):
            k = int((i + t * 8) // 4) % 3
            out.append([RED, GREEN, GOLD][k])
        return out
    return [(30, 20, 10)] * n


class Lights:
    def __init__(self, cfg):
        self.cfg, self.scene, self.pixels = cfg, "idle", None
        drv = cfg["driver"]
        if drv == "spi":
            try:
                import board, neopixel_spi  # type: ignore
                order = getattr(neopixel_spi, cfg.get("order", "GRB"), neopixel_spi.GRB)
                self.pixels = neopixel_spi.NeoPixel_SPI(board.SPI(), cfg["count"], pixel_order=order,
                                                        brightness=cfg["brightness"], auto_write=False)
                threading.Thread(target=self._loop, daemon=True).start()
                log(f"LEDs: SPI strip, {cfg['count']} pixels")
            except Exception as e:
                log("LEDs: SPI driver unavailable ->", e)
        elif drv == "wled":
            log("LEDs: WLED at", cfg.get("wled_host") or "(no host set)")
        else:
            log("LEDs: none")

    def set(self, name):
        self.scene = name
        if self.cfg["driver"] == "wled" and self.cfg.get("wled_host"):
            preset = self.cfg["wled_presets"].get(name)
            if preset is None:
                return
            body = {"on": False} if preset == 0 else {"on": True, "ps": preset}
            threading.Thread(target=self._post_wled, args=(body,), daemon=True).start()

    def _post_wled(self, body):
        try:
            req = urllib.request.Request(f"http://{self.cfg['wled_host']}/json/state", data=json.dumps(body).encode(),
                                         headers={"Content-Type": "application/json"})
            urllib.request.urlopen(req, timeout=2).read()
        except Exception as e:
            log("WLED error:", e)

    def _loop(self):
        rnd, t0 = random.Random(1), time.time()
        while True:
            try:
                for i, c in enumerate(frame(self.scene, len(self.pixels), time.time() - t0, rnd)):
                    self.pixels[i] = c
                self.pixels.show()
            except Exception as e:
                log("LED frame error:", e)
                time.sleep(1)
            time.sleep(1 / 30)


# ------------------------------------------------------------------ buttons + lamp
class Panel:
    def __init__(self, cfg, hub):
        self.lamp, self.buttons = None, []
        try:
            from gpiozero import Button, PWMLED  # type: ignore
        except Exception as e:
            log("GPIO: gpiozero not available ->", e)
            return
        for name, pin in (cfg.get("buttons") or {}).items():
            if pin is None:
                continue
            try:
                b = Button(pin, pull_up=True, bounce_time=0.04)
                b.when_pressed = partial(self._pressed, hub, name)
                self.buttons.append(b)
                log(f"GPIO: button '{name}' on BCM {pin}")
            except Exception as e:
                log(f"GPIO: button {name} on {pin} failed ->", e)
        if cfg.get("lamp_pin") is not None:
            try:
                self.lamp = PWMLED(cfg["lamp_pin"])
                log("GPIO: GO lamp on BCM", cfg["lamp_pin"])
            except Exception as e:
                log("GPIO: lamp failed ->", e)

    @staticmethod
    def _pressed(hub, name):
        hub.send({"button": name})

    def set_lamp(self, mode):
        if not self.lamp:
            return
        if mode == "pulse":
            self.lamp.pulse(fade_in_time=0.7, fade_out_time=0.7)
        elif mode == "on":
            self.lamp.on()
        else:
            self.lamp.off()


# ------------------------------------------------------------------ counters
class Counts:
    def __init__(self, path):
        self.path, self.lock = path, threading.Lock()
        try:
            with open(path) as f:
                self.data = json.load(f)
        except Exception:
            self.data = {}

    def get(self, k):
        return int(self.data.get(k, 0))

    def inc(self, k):
        with self.lock:
            self.data[k] = self.get(k) + 1
            tmp = self.path + ".tmp"
            with open(tmp, "w") as f:
                json.dump(self.data, f)
            os.replace(tmp, self.path)
            return self.data[k]


# ------------------------------------------------------------------ HTTP
def make_handler(cfg, hub, lights, panel, counts):
    page_cfg = {k: cfg[k] for k in ("station", "mode", "next", "idle", "volume", "ambient", "captions", "inviteHold")}

    class H(SimpleHTTPRequestHandler):
        def __init__(self, *a, **kw):
            super().__init__(*a, directory=APP_DIR, **kw)

        def log_message(self, fmt, *args):
            if "/api/" in (self.path or "") and "/api/events" not in self.path:
                log("http", self.command, self.path)

        def end_headers(self):
            if not self.path.startswith("/api/"):
                self.send_header("Cache-Control", "no-cache")
            super().end_headers()

        def _json(self, obj, code=200):
            body = json.dumps(obj).encode()
            self.send_response(code)
            self.send_header("Content-Type", "application/json")
            self.send_header("Content-Length", str(len(body)))
            self.send_header("Cache-Control", "no-store")
            self.end_headers()
            self.wfile.write(body)

        def do_POST(self):
            if self.path.startswith("/api/count/"):
                return self._json({"count": counts.inc(self.path.rsplit("/", 1)[1])})
            self._json({"error": "not found"}, 404)

        def do_GET(self):
            p = self.path.split("?", 1)[0]
            if not p.startswith("/api/"):
                if p in ("", "/"):
                    self.path = "/index.html"
                if p.startswith(("/pi/", "/server/", "/gate/", "/tools/", "/voices/")):  # never serve config, keys or agent files
                    return self._json({"error": "not found"}, 404)
                return super().do_GET()
            parts = p.strip("/").split("/")
            what, arg = parts[1] if len(parts) > 1 else "", parts[2] if len(parts) > 2 else ""
            if what == "config":
                return self._json(page_cfg)
            if what == "status":
                return self._json({"station": cfg["station"], "scene": lights.scene, "clients": len(hub.clients),
                                   "leds": cfg["leds"]["driver"], "buttons": len(panel.buttons), "counts": counts.data})
            if what == "scene":
                lights.set(arg)
                return self._json({"scene": arg})
            if what == "lamp":
                panel.set_lamp(arg)
                return self._json({"lamp": arg})
            if what == "count":
                return self._json({"count": counts.get(arg)})
            if what == "press" and arg in ("go", "back", "left", "right"):
                hub.send({"button": arg})
                return self._json({"pressed": arg})
            if what == "events":
                return self._events()
            return self._json({"error": "not found"}, 404)

        def _events(self):
            self.send_response(200)
            self.send_header("Content-Type", "text/event-stream")
            self.send_header("Cache-Control", "no-store")
            self.send_header("Connection", "keep-alive")
            self.end_headers()
            q = hub.add()
            try:
                self.wfile.write(b": hello\n\n"); self.wfile.flush()
                while True:
                    try:
                        msg = q.get(timeout=15)
                        self.wfile.write(f"data: {json.dumps(msg)}\n\n".encode())
                    except queue.Empty:
                        self.wfile.write(b": ping\n\n")
                    self.wfile.flush()
            except (BrokenPipeError, ConnectionResetError, OSError):
                pass
            finally:
                hub.remove(q)

    return H


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--config", default=os.path.join(HERE, "config.json"))
    ap.add_argument("--station", help="override the station number")
    ap.add_argument("--port", type=int)
    a = ap.parse_args()

    user = {}
    if os.path.exists(a.config):
        with open(a.config) as f:
            user = json.load(f)
    else:
        log("No config at", a.config, "- using defaults")
    cfg = deep_merge(DEFAULTS, user)
    if a.station:
        cfg["station"] = a.station
    if a.port:
        cfg["port"] = a.port
    counts_path = cfg["counts_file"] if os.path.isabs(cfg["counts_file"]) else os.path.join(os.path.dirname(os.path.abspath(a.config)), cfg["counts_file"])

    hub = Hub()
    lights = Lights(cfg["leds"])
    panel = Panel(cfg, hub)
    counts = Counts(counts_path)
    lights.set("idle")

    srv = ThreadingHTTPServer((cfg["bind"], cfg["port"]), make_handler(cfg, hub, lights, panel, counts))
    srv.daemon_threads = True
    log(f"Station {cfg['station']} ({cfg['mode']}) serving {APP_DIR} on http://{cfg['bind']}:{cfg['port']}/")
    try:
        srv.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        lights.set("off")


if __name__ == "__main__":
    main()
