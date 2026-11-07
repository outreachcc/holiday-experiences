#!/usr/bin/env bash
# Launch the Thanksgiving Experience full-screen. Re-launches Chromium if it ever exits.
URL="${THANKS_URL:-http://localhost:8080/}"
BROWSER="$(command -v chromium || command -v chromium-browser)"
PROFILE="$HOME/.config/thanks-kiosk"

# wait for the station agent
for i in $(seq 1 60); do curl -sf -o /dev/null http://localhost:8080/api/status && break; sleep 1; done

# hide the mouse pointer where possible (X11); on Wayland the page hides it itself
command -v unclutter >/dev/null && unclutter -idle 0.5 -root &

while true; do
  # clear "Chromium didn't shut down correctly" bubbles after a power cut
  sed -i 's/"exited_cleanly":false/"exited_cleanly":true/; s/"exit_type":"Crashed"/"exit_type":"Normal"/' "$PROFILE/Default/Preferences" 2>/dev/null
  "$BROWSER" --kiosk "$URL" \
    --user-data-dir="$PROFILE" \
    --noerrdialogs --disable-infobars --no-first-run --disable-session-crashed-bubble \
    --autoplay-policy=no-user-gesture-required \
    --check-for-update-interval=31536000 --disable-features=Translate \
    --overscroll-history-navigation=0 --disable-pinch --password-store=basic \
    --enable-features=OverlayScrollbar
  sleep 2
done
