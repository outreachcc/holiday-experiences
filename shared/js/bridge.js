/* Bridge to the Raspberry Pi station agent (pi/station_agent.py).
   When the page is served by the agent, it gets: station config, arcade buttons (Server-Sent Events),
   LED light scenes, button lamps and a shared candle counter. Online, every call quietly does nothing. */
(function () {
  const B = { local: false, config: {}, onButton: () => {} };
  let lastScene = null;

  function timeout(ms) { return new Promise((_, rej) => setTimeout(() => rej(new Error("timeout")), ms)); }

  B.init = async function () {
    try {
      const r = await Promise.race([fetch("api/config", { cache: "no-store" }), timeout(900)]);
      if (r.ok && (r.headers.get("content-type") || "").includes("json")) {
        B.config = await r.json(); B.local = true;
      }
    } catch (e) { B.local = false; }
    if (B.local && "EventSource" in window) {
      const connect = () => {
        const es = new EventSource("api/events");
        es.onmessage = ev => { try { const m = JSON.parse(ev.data); if (m.button) B.onButton(m.button); } catch (e) {} };
        es.onerror = () => { es.close(); setTimeout(connect, 3000); };
      };
      connect();
    }
    return B;
  };

  function call(path, opts) {
    if (!B.local) return Promise.resolve(null);
    return fetch(path, opts).then(r => r.ok ? r.json().catch(() => null) : null).catch(() => null);
  }

  B.scene = function (name) {
    if (!name || name === lastScene) return;
    lastScene = name; call("api/scene/" + encodeURIComponent(name));
  };
  B.lamp = function (mode) { call("api/lamp/" + mode); }; // pulse | on | off

  B.count = async function (key, increment) {
    // Online: counts only this visit (the wall starts dark each time). On a Pi: shared by every visitor.
    const local = () => { sessionCounts[key] = (sessionCounts[key] || 0) + (increment ? 1 : 0); return sessionCounts[key]; };
    if (B.local) {
      const r = await call("api/count/" + encodeURIComponent(key), { method: increment ? "POST" : "GET" });
      if (r && typeof r.count === "number") return r.count;
    }
    return local();
  };

  const sessionCounts = {};
  window.XBridge = B;
})();
