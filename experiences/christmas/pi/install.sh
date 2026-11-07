#!/usr/bin/env bash
# Christmas Experience — Raspberry Pi station installer
# Tested target: Raspberry Pi OS (Bookworm or newer, 64-bit, Desktop) on Pi 4 / Pi 5.
#
#   sudo ./pi/install.sh 3            # make this Pi Station 3 (1-7, or "carols")
#   sudo ./pi/install.sh 4 --leds spi # also set up an SPI LED strip
#   sudo ./pi/install.sh 5 --watch    # watch-only loop, no buttons needed
set -euo pipefail

STATION="${1:-1}"; shift || true
LEDS="none"; MODE="interactive"
while [[ $# -gt 0 ]]; do
  case "$1" in
    --leds) LEDS="$2"; shift 2;;
    --watch) MODE="watch"; shift;;
    *) echo "Unknown option $1"; exit 1;;
  esac
done

[[ $EUID -eq 0 ]] || { echo "Run with sudo"; exit 1; }
APP_DIR="$(cd "$(dirname "$0")/.." && pwd)"
KIOSK_USER="${SUDO_USER:-$(logname 2>/dev/null || echo pi)}"
KIOSK_HOME="$(getent passwd "$KIOSK_USER" | cut -d: -f6)"
echo "==> Installing Station $STATION ($MODE, LEDs: $LEDS) from $APP_DIR for user $KIOSK_USER"

echo "==> Packages"
apt-get update -qq
apt-get install -y -qq python3-gpiozero python3-lgpio python3-venv unclutter-xfixes 2>/dev/null || apt-get install -y -qq python3-gpiozero python3-lgpio python3-venv
command -v chromium >/dev/null || command -v chromium-browser >/dev/null || apt-get install -y -qq chromium || apt-get install -y -qq chromium-browser

echo "==> Python environment"
python3 -m venv --system-site-packages "$APP_DIR/pi/venv"
if [[ "$LEDS" == "spi" ]]; then
  raspi-config nonint do_spi 0 || true
  "$APP_DIR/pi/venv/bin/pip" install -q adafruit-blinka adafruit-circuitpython-neopixel-spi
fi
usermod -aG gpio,spi,video "$KIOSK_USER" 2>/dev/null || true

echo "==> Station config"
CFG="$APP_DIR/pi/config.json"
[[ -f "$CFG" ]] || cp "$APP_DIR/pi/config.example.json" "$CFG"
python3 - "$CFG" "$STATION" "$MODE" "$LEDS" <<'PY'
import json, sys
p, st, mode, leds = sys.argv[1:]
c = json.load(open(p)); c["station"] = st; c["mode"] = mode; c.setdefault("leds", {})["driver"] = leds
json.dump(c, open(p, "w"), indent=2)
PY
chown -R "$KIOSK_USER": "$APP_DIR"

echo "==> Agent service"
cat > /etc/systemd/system/xmas-station.service <<UNIT
[Unit]
Description=Christmas Experience station agent
After=network.target

[Service]
User=$KIOSK_USER
WorkingDirectory=$APP_DIR/pi
ExecStart=$APP_DIR/pi/venv/bin/python $APP_DIR/pi/station_agent.py --config $CFG
Restart=always
RestartSec=2

[Install]
WantedBy=multi-user.target
UNIT
systemctl daemon-reload
systemctl enable --now xmas-station.service

echo "==> Kiosk browser autostart"
install -m 755 "$APP_DIR/pi/kiosk.sh" /usr/local/bin/xmas-kiosk
mkdir -p "$KIOSK_HOME/.config/autostart"
cat > "$KIOSK_HOME/.config/autostart/xmas-kiosk.desktop" <<DESK
[Desktop Entry]
Type=Application
Name=Christmas Experience Kiosk
Exec=/usr/local/bin/xmas-kiosk
X-GNOME-Autostart-enabled=true
DESK
# labwc (Pi OS default since late 2024) also reads its own autostart file
if [[ -d "$KIOSK_HOME/.config/labwc" ]] || command -v labwc >/dev/null; then
  mkdir -p "$KIOSK_HOME/.config/labwc"
  grep -q xmas-kiosk "$KIOSK_HOME/.config/labwc/autostart" 2>/dev/null || echo "/usr/local/bin/xmas-kiosk &" >> "$KIOSK_HOME/.config/labwc/autostart"
fi
chown -R "$KIOSK_USER": "$KIOSK_HOME/.config"

echo "==> Desktop auto-login and no screen blanking"
raspi-config nonint do_boot_behaviour B4 || true
raspi-config nonint do_blanking 1 || true

echo
echo "Done. Station $STATION is installed. Reboot to start the kiosk:  sudo reboot"
echo "Test from another device:  http://$(hostname -I | awk '{print $1}'):8080/?station=$STATION"
echo "Fake a button press:       curl http://localhost:8080/api/press/go"
