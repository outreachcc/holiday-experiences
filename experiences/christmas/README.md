# The Christmas Experience

A walk-through Nativity story in seven stations, plus a Carol Corner, told as short animated films: painted scenes, slow camera moves, and the people of the story (the prophets, Gabriel, Mary, the angel, a wise man, Jesus) speaking their own lines with moving mouths. One web app runs everywhere:

* **On Raspberry Pis** — one Pi per station, full-screen kiosk, touchscreen, big arcade buttons, LED strips.
* **Online** — the same files on your own web server; visitors walk all seven stations in order on any phone or computer.

| # | Station | What visitors do | Scripture (KJV) |
|---|---------|------------------|-----------------|
| 1 | The Promise | Light three prophecy stars | Isa 7:14, Mic 5:2, Isa 9:6, 9:2 |
| 2 | An Angel Visits Mary | Tap the window to reveal Gabriel; tap the heart for Mary's answer | Luke 1:30-31, 37, 38 |
| 3 | The Road to Bethlehem | Walk Joseph and Mary 90 miles; knock on inn doors | Luke 2:4, 2:7 |
| 4 | Born in Bethlehem | Build the Nativity piece by piece, then *Silent Night* | Luke 2:7 |
| 5 | Shepherds and Angels | Round up lost sheep; fill the sky with an angel choir | Luke 2:10-11, 14, 16 |
| 6 | The Wise Men | Follow the star; open the three gifts | Matt 2:2, 10, 11 |
| 7 | The Greatest Gift | Light a candle (counted across visitors); church invitation + QR code | John 3:16, 8:12 |
| ♪ | Carol Corner | Sing-along lyrics with music: *Silent Night, Joy to the World, The First Noel, O Come All Ye Faithful* | |

**Film edition (the main page).** `index.html` is the film edition, with every station painted and animated (it uses the same film engine as the Thanksgiving Experience). The earlier flat-illustration version is still here as `classic.html`, and the old `film.html` link now forwards to `index.html`.

| # | In the film | Close-ups that speak |
|---|-------------|----------------------|
| 1 | Night over Bethlehem; three prophecy stars | Isaiah, Micah |
| 2 | Dusk in Nazareth, then Mary's room; light floods the window and Gabriel appears | Gabriel, Mary |
| 3 | Joseph walks Mary and the donkey toward Bethlehem as the hills roll by and the mile sign counts down; then a night street of inn doors, each opening on an innkeeper, and the glowing stable | (innkeepers' voices) |
| 4 | A thatched stable; tap each glowing spot to place the star, manger, Mary, Joseph, animals and the baby; *Silent Night* with a bouncing ball | |
| 5 | Shepherds by a campfire; bring back five wandering sheep; the angel in glory; tap the sky to fill it with angels; the shepherds set off for Bethlehem | the angel |
| 6 | Wise men on a palace roof see the star; the caravan crosses the desert following it; the gifts laid before Mary and the child | a wise man |
| 7 | The star over Bethlehem; a wall of candles; this visitor lights the big one and the light spreads | Jesus |

Every station works three ways at once: **touch** the glowing things, **press GO** (green arcade button, or Enter on a keyboard; on kiosk stations the spacebar too), or just **watch** — narration, captions, verse cards and music carry the story either way.

---

## 1. Try it on your computer (2 minutes)

```bash
cd christmas-experience
python3 pi/station_agent.py --station 3 --port 8080
```
Open <http://localhost:8080/> — that's exactly what Station 3's Pi will show. Enter = GO, Spacebar = pause (the spacebar is GO on kiosk stations), Backspace = BACK, arrows = left/right.
Open `http://localhost:8080/?station=` (blank) or just `index.html` on any web server for the online version.

Handy URL switches: `?station=5&mode=watch` (self-playing loop), `&kiosk=0` (show nav buttons), `&next=left` (end-screen arrow), `&idle=60`, `&captions=plain`.

**Captions** have three modes, and changing them affects nothing else (narration, timing and taps stay the same):
* `follow` (default): words light up as they are spoken
* `plain`: the whole sentence shows at once
* `off`: no narration captions (verse cards and the invitation still show)

Set per Pi with `"captions"` in `pi/config.json`, per link with `?captions=…`, or online with the **CC** button (the visitor's choice is remembered on their device).

**Station 7 invitation:** the QR card stays up until the visitor presses GO (or 60 s; 30 s on watch-only stations), and the final thank-you screen repeats the QR code. Change the hold time with `"inviteHold"` in `pi/config.json` (seconds).

## 2. Customize the words

**Songs inside a station** (Silent Night at Station 4) show big sing-along words with a **bouncing ball**: each line in `"carols"` can have a `"sing"` version split into syllables, one per note, e.g. `"Si- lent night, _ ho- ly night, _"`. A syllable ending in `-` joins the next one into a word, and `_` holds the same syllable over another note. If the count doesn't match the notes, the line just lights up as a whole.

Everything a visitor reads or hears lives in **`js/content.js`**: church name, service times, address, website (used for the QR code), every narration line, verse and carol. Fill in `"address"` and `"christmasEve"` (e.g. `"Christmas Eve candlelight service · Dec 24, 7 PM"`) before the event.

## 3. Voices

All narration is pre-recorded (`audio/narration/`, ~60 MP3s) with Kokoro, a free natural-sounding neural voice, paced like a relaxed storyteller (~150 words/min, Scripture a little slower). Each Bible quotation is spoken by its speaker; the narrator tells the story and reads every verse reference:

| Part | Voice | Part | Voice |
|---|---|---|---|
| Narrator | af_heart | Angel to the shepherds | am_fenrir |
| Isaiah | am_onyx+am_fenrir (blend) | Angel choir | 4 voices + echo |
| Micah | am_echo+am_michael (blend) | Wise man | bm_fable |
| Gabriel | am_michael | Jesus | am_michael+am_fenrir (blend) |
| Mary | af_bella | Innkeepers | am_puck, af_sarah, bm_george |

**Change a voice or who speaks a verse** in `js/content.js`: the `"cast"` list, a verse's `"voice"`, or `"speak"` to split a verse between speakers. Then re-record (Python 3.10–3.12):
```bash
pip install misaki num2words spacy espeakng-loader phonemizer-fork kokoro-onnx soundfile
pip install https://github.com/explosion/spacy-models/releases/download/en_core_web_sm-3.8.0/en_core_web_sm-3.8.0-py3-none-any.whl
python3 tools/make_narration_kokoro.py --download   # once: ~350 MB model into voices/
python3 tools/make_narration_kokoro.py              # re-records only changed lines/voices
```
Then rebuild the mouth movements for the film: `python3 tools/make_mouth_data.py` (it also works out who is speaking when, so the film cuts to Gabriel as he begins and back to the room when the narrator reads the reference).

**Browsers and old recordings:** `make_mouth_data.py` also gives every recording a short fingerprint in the manifest, and the page asks for `…mp3?v=<fingerprint>`. The web server lets browsers keep audio for 30 days, so without this a visitor (or you, testing) could keep hearing an old take after a line is re-recorded. Always run `make_mouth_data.py` after re-recording.
`misaki` is Kokoro's own pronunciation dictionary (without it the tool still works, slightly less accurately). If a word sounds wrong, add a respelling to `SAY_AS` at the top of the tool. Lines whose text no longer matches their recording fall back to captions, so an edit never plays the wrong audio.

## 4. Raspberry Pi stations

### Shopping list (per station)
* Raspberry Pi 4 (2 GB+) or Pi 5, power supply, 32 GB microSD
* Monitor/TV with speakers (HDMI audio) or a small powered speaker on the 3.5 mm jack (Pi 4) / USB
* Optional: HDMI or DSI **touchscreen** — works with no setup
* Optional: **arcade buttons** — either a USB "zero-delay" encoder kit (plug and play, shows up as a gamepad) **or** wired to GPIO (below)
* Optional: **WS2812B LED strip** (5 V, ~60 LEDs) + 5 V supply, or an **ESP32 running WLED**

### Install
Flash **Raspberry Pi OS (64-bit, with desktop)**, copy this folder to the Pi (e.g. `~/christmas-experience`), then:

```bash
cd ~/christmas-experience
sudo ./pi/install.sh 3                 # this Pi is Station 3
sudo ./pi/install.sh 4 --leds spi      # ...with an LED strip on SPI
sudo ./pi/install.sh 5 --watch         # watch-only loop, no buttons needed
sudo reboot
```
The installer sets up the agent as a service, auto-login, Chromium kiosk autostart with audio allowed, and turns off screen blanking. Each Pi's settings live in `pi/config.json` (station, mode, next-arrow direction, idle timeout, pins, LEDs).

Test from your laptop: `http://<pi-ip>:8080/` · fake a button: `curl http://<pi-ip>:8080/api/press/go` · status: `/api/status`.

### GPIO wiring (BCM numbering; each button between the pin and GND — no resistors needed)

| Button | GPIO | Physical pin |
|--------|------|--------------|
| GO (green, big) | 17 | 11 |
| BACK / hear again (red) | 27 | 13 |
| LEFT (Carol Corner) | 22 | 15 |
| RIGHT (Carol Corner) | 23 | 16 |
| GND | — | 9, 14, 20… |
| GO button lamp | 12 | 32 → via NPN transistor/MOSFET (arcade lamps are 5–12 V; don't drive them straight from GPIO) |

Most stations only need GO; BACK is nice to have. LEFT/RIGHT matter only at the Carol Corner.

### LEDs
* **SPI strip (simplest wiring):** data → GPIO 10 / MOSI (pin 19), ideally through a 74AHCT125 level shifter; strip 5 V and GND from its own supply, GND shared with the Pi. Works on Pi 4 and Pi 5. Set `"leds": {"driver": "spi", "count": 60}`.
* **WLED (easiest overall):** flash an ESP32 with WLED, make presets 1–8 (idle, night, star, angel, manger, journey, candle, celebrate), set `"driver": "wled", "wled_host": "<esp ip>"`. Great for lighting a whole Nativity set piece.

Scenes change automatically with the story: dark twinkling night, a gold sweeping star, bright angel glow, warm flickering manger, red/green celebration.

### Suggested room layout
Number the stations along a path. Each end screen shows "Next stop: Station N →" — set `"next"` in each Pi's config to `left`, `right`, `ahead` or `none` to match your floor plan. Station 7's QR code takes families to the church website; the Carol Corner is a great waiting area.

**Updating a station:** after you change anything (words, scenes, voices), copy this folder to the Pi again over the old one (your `pi/config.json` there is kept, since this folder only has `config.example.json`), then `sudo reboot` (or `sudo systemctl restart xmas-station` and reload the kiosk). The Pi serves the files straight from that folder.

**Which version the Pis show:** the Pis open `index.html`, which is the film edition. To run a Pi with the classic version instead, start the kiosk with `XMAS_URL=http://localhost:8080/classic.html` (in the kiosk autostart).

## 5. Online version (shared hosting, open in season only)

The online version is a once-a-year event. It is open from **First Sunday of Advent** (the Sunday from Nov 27 to Dec 3) through **January 6** (Epiphany): 2026: Sun Nov 29 – Wed Jan 6, 2027. Out of season, visitors get a countdown page ("The Christmas Experience 2027 · Opens …") instead, and while the Thanksgiving Experience is open the countdown page links to it.

### Combined holidays site (one folder for every holiday)
On the church site, all the holiday experiences live together in one gated folder, `holidays/` (locally `C:\Apache24\htdocs\outreach\holidays\`, browsed at `http://occ.local/holidays/`). Its main page sends visitors straight into whichever holiday is open, or counts down to the next one; this experience lives at `holidays/christmas/`. That folder has its own gate (`holidays/gate/`, with the holiday list and dates in `config.php`) and README.

* **This project lives in the `holiday-experiences` git repo** (`C:\Users\ed\source\repos\holiday-experiences\experiences\christmas\`). `film-core.js`, `bridge.js`, `season.js`, `vendor/` and `fonts/` are shared with the other experiences and live once in the repo's `shared/` folder. **After changing it, run `build.bat`** (or `build.bat --local`) to assemble `dist\christmas\` (standalone, for the Pis) and `dist\holidays\christmas\` (for the web), and to list the files to upload. See the repo README.
* **Dev server:** on `localhost` or any `*.local` name, from this PC or the local network, every holiday opens directly (green DEV pill), no preview key needed.
* The season dates for the combined site are in `holidays/gate/config.php`. If you change this experience's dates, change them there too, as well as in `gate/season.php` and `js/season.js` here.

The rest of this section is for publishing this experience **on its own** (e.g. its own subdomain).

### Upload (FTP)
Needs an Apache or LiteSpeed host with PHP 7.4 or newer (any normal cPanel-style shared host). Upload these to the site's web folder (e.g. the folder for `christmas.theoutreachcc.com`):

```
index.html   css/   js/   fonts/   vendor/   audio/   gate/
```
Then upload `server/apache.htaccess` and rename it to **`.htaccess`** in that same folder. Your FTP client may hide files starting with a dot; turn on "show hidden files" to see it. It also works in a subfolder (e.g. `theoutreachcc.com/christmas/`).

Don't upload `pi/`, `tools/`, `server/` or `voices/` (the gate would refuse to serve them anyway).

**Check it after uploading.** Out of season, open `https://christmas.theoutreachcc.com/js/app.js`: it must say **Not found**. If you see JavaScript instead, the `.htaccess` file is missing or the host is ignoring it, and the experience is not protected.

### How the gate works
Every request goes through `gate/gate.php`, which decides on the server's clock (America/New_York), not the visitor's. Out of season every script, audio file and stylesheet answers 404, so typing a file's address gets nothing; only the fonts (for the countdown page) are served all year. Anything not listed in `publish` in `gate/config.php` is never served, in season or out. The page itself is sent `no-cache`, so it closes the moment the season ends.

### Preview switch (for testing)
The key is in `gate/preview-key.php` (not in git; copy `gate/preview-key.example.php`) (a PHP file, so it can't be read over the web).
* `https://christmas.theoutreachcc.com/?preview=<key>`: this browser gets in for 30 days (signed, HttpOnly cookie). A red PREVIEW pill shows at the top so you know you're not seeing what the public sees.
* `?asof=2026-12-24`: while previewing, pretend it's that date (year-stamp and countdown follow it). `?asof=off` goes back to today.
* `?landing`: see the countdown page as the public would.
* `?preview=off`: leave preview in this browser.

To retire the switch, delete `gate/preview-key.php` from the host. To change the key, edit it and re-upload; that also cancels every existing pass. A wrong key gets no hint.

### Year-stamp
The title reads "The Christmas Experience 2026" everywhere (home page, attract screens, browser tab). Online the year comes from the server; on the Pis `js/season.js` works it out from the Pi's clock. For January, the Christmas year stays with the season that started in December. Force a year with `"year": 2026` in `js/content.js`, or turn it off with `"yearStamp": false`. The season dates live in `gate/season.php` and `js/season.js` (same rules, kept in step).

The Raspberry Pi stations are not gated: they run whenever you set them up.

(`server/docker-compose.yml` and `server/nginx.conf` are an alternative for a Docker/nginx server; not needed for shared hosting.)

### Phones and tablets

- **No flicker:** on phones and tablets, the film switches off the effects that make mobile browsers flicker (screen-wide blend modes, the film-grain and noise textures, and frosted-glass blur behind the controls) and uses cheap look-alikes. It also keeps the picture from redrawing when nothing in the story is moving: background motion (twinkling stars, drifting clouds, swaying wheat, flickering flames) holds still, the "tap here" glow pulses in small steps, the GO button's pulse and the caption words no longer redraw the picture, and mouths update 25 times a second. On a PC, add `?lite=1` to the address to see the phone version; `?lite=0` turns it off on a phone.
- **Full screen:** on a phone held sideways, the first tap goes full screen (browsers only allow full screen after a tap). If the viewer leaves full screen, it isn't forced again until they turn the phone again. The ⛶ button at the end of the station controls switches full screen on or off on any device. iPhones don't allow web pages to go full screen, so on an iPhone the button does nothing. Kiosk stations (the Pi) are left alone.
- Both live in `js/film-core.js`, which is the same file in both projects.
- **Pause:** the ❚❚ button in the station controls (or the P key) freezes everything: voices, music, sound effects, the film's movement and the timing between steps. Tap anywhere, or the button again, to carry on. It also pauses by itself when a phone is locked or the viewer switches apps.
- **Keeps the screen awake:** while the experience is open, phones and tablets don't dim or lock (`js/keep-awake.js`, Christmas only). Where the browser supports it (Android Chrome/Samsung Internet/Firefox, iPhone/iPad on iOS 16.4 or newer) it uses the Screen Wake Lock, asked for again on every tap and whenever the page comes back. Everywhere else it plays a tiny silent, invisible video on a loop from the first tap, which also keeps a phone awake: that covers the Facebook/Instagram/Messenger in-app browsers (where most people opening a link from a social post land), older iPhones, iPhone home-screen web apps before iOS 18.4, and plain-http testing such as `http://occ.local/` (the wake lock only works on https). It's off on kiosk stations (the Pi's screen blanking is already turned off by `pi/install.sh`), and `?awake=0` turns it off for testing. (`js/film-core.js` also asks for the wake lock; holding both is harmless.)
- **iPad/iPhone speed:** Safari draws SVG blur and texture effects on the processor, every frame, so camera moves slowed to a crawl. On phones and tablets the clouds become soft gradients, the stone texture a light tint, and glows that are already soft lose their extra blur (`K.liteArt` in `js/film-core.js`).
- **Captions follow the voice:** each word lights when the narrator reaches it, using the loudness data in `audio/narration/envelopes.js`, so pauses in the narration don't let the words run ahead. Re-run `tools/make_mouth_data.py` after re-recording, as before, and the captions stay in step too.
- **Mouths start with the words:** when a character reads scripture, their mouth only starts once the recording is actually playing (each line is downloaded or buffered first, and the mouth used to start during that wait). Through the sound engine on phones, the speaker's own delay (Bluetooth especially) is also taken off, so mouths and caption words don't run ahead of what you hear (`js/app.js`, `js/audio.js`).
- **Voices don't drop out:** narration reuses one audio player (and character lines two) instead of making a new one per line. Phones and tablets only allow so many players on a page; running out silenced every line from about station 3 or 4 on. On phones and tablets the narration plays through the sound engine (Web Audio) rather than an audio player: iPad/iPhone Safari blocks a player that starts by itself between taps (the voice dropped out at scene changes until the next GO), but once a tap has started the engine it can play every line. PCs and the Pi still use the player; add `?audio=player` to force the player on a phone for testing (`js/audio.js`).
- **Phone held upright:** the station controls sit along the bottom, with the verse, sing-along words and captions just above them; verse text never shrinks below 15px (end of `css/style.css`).
- **Mute:** the speaker button only silences the voices. The story, captions and mouths keep going, and the voices come back mid-line when it's turned on again.


## 6. How the screens work

Each station is one web page made of **layers stacked on top of each other**. At the bottom is the painted, moving picture (the "film"). On top of it are ordinary page elements: the verse card, captions, prompt and buttons. The picture and the words are kept separate on purpose: the words stay sharp and readable at any screen size, and the picture can move, zoom and dissolve without affecting them.

```
 top      pause "tap to continue" card (only when paused)
   │      station badge · progress dots · control buttons
   │      GO prompt ("Tap the window")
   │      captions (narration, word by word)
   │      verse card (the scripture, KJV)
   │      sing-along words (songs inside a station)
 bottom   THE FILM: one SVG picture made of "shots"
```

### Who does what

| File | Job |
|---|---|
| `js/content.js` | **All the words.** Each station is a list of *steps*. A step can have `say` (narration), `task` + `prompt` (something to tap), `verse` (scripture: `text`, `ref`, and who reads it: `voice`, or `speak` for a verse split between the narrator and a character), `after` (narration after the verse), `light` (Pi LED scene), `music`, `invite` and `end`. |
| `js/app.js` | **The director.** Runs the steps in order, shows and hides the verse card, captions, prompt and end card, handles taps, keys, the buttons and pause. |
| `js/audio.js` | **Sound.** Plays the recorded narration, the music and the sound effects; pause, mute and the timer the rest of the code uses (`A.after`). |
| `js/film-core.js` | **The film engine** (identical in every holiday). Builds the picture, moves the camera, dissolves between shots, animates mouths and blinks, handles the tap targets, and the phone/tablet adjustments. |
| `js/film-scenes.js` | **The artwork.** One function per station that paints its shots and says what happens at each step and when each thing is tapped. |
| `audio/narration/` | The recordings (`*.mp3`), `manifest.js` (which recording goes with which line) and `envelopes.js` (how loud the voice is, 30 times a second, for mouths and captions). |
| `css/style.css` | Where every overlay sits and how it looks, including the phone-upright layout. |

### How a step plays

For each step, `app.js` does this:

1. Tells the film which step it is on (`enter(i)` in `film-scenes.js`). The film picks the step's shot and starts a slow camera move.
2. Plays the `say` narration with captions.
3. If there's a `task`, shows the GO prompt (e.g. "Tap the window") and waits. The station carries on when the glowing thing is tapped, or GO is pressed (GO taps it for you, so the Pi's arcade button can play every station).
4. If there's a `verse`, shows the verse card and plays the reading. The character who is speaking gets a close-up and their mouth moves.
5. Plays the `after` narration.
6. Waits about 2 seconds (a tap or GO skips this), then goes on to the next step.

Every timer in this sequence uses `A.after` rather than an ordinary timer, so pause can freeze it and resume it exactly where it was.

### Motion (the film)

- **Painted in code.** The picture is an SVG (vector drawing) made from shapes written in `film-scenes.js`: skies, hills, villages, people. Nothing is a video, so it stays crisp on any screen and is small to download. The drawing is 1600×900. On a wide screen it fills the screen and trims the top/bottom; on a tall screen the whole picture shows.
- **Shots.** Each station has a few *shots* (e.g. Mary's room, a close-up of Gabriel). They're all in the picture at once, stacked; only the current one is visible. Changing shot is a **dissolve**: the new shot fades in over the old (about a second, longer for big scene changes).
- **Camera.** Each shot sits inside a "camera" group. A camera move is a zoom/pan (`scale(…) translate(…)`) that the browser slides to over about 9 seconds, which gives the slow Ken Burns drift.
- **Characters.** People are built from parts (head, jaw, eyelid, arms, robe). Many times a second the engine reads how loud the voice is right now from `envelopes.js` and opens the speaker's jaw to match, tilts the head slightly, and blinks every few seconds. When a verse names a speaker, the film cuts to that character's close-up (`closeups` in `film-scenes.js`).
- **Little animations** (twinkling stars, drifting clouds, swaying wheat, candle flicker, people walking or bobbing, sparkles, rising music notes) are CSS animations on parts of the drawing.
- **Tap targets.** Anything tappable has a `data-hit` name. When a task starts it glows and gets a pulsing ring. A tap anywhere over it counts, even if another part of the picture is on top.
- **Phones and tablets** get a lighter version of the same picture (see *Phones and tablets* above): no blend effects or film grain, gradient clouds instead of noise textures, background motion held still, and mouths updated 25 times a second. The look is nearly identical; the device just has much less drawing to do.

### Text: the verse card

- When a step has a verse, `app.js` writes the scripture and reference ("Luke 1:37 KJV") into the verse card and fades it in.
- In the film edition it sits along the bottom like a film subtitle. On a phone held upright it sits just above the buttons.
- It stays up while the verse is read and is cleared when the next step starts.

### Closed captions

- When narration plays, each word of the line is put in the caption box as its own piece, dimmed.
- As the recording plays, the words light up when the narrator reaches them. This uses the recording's loudness data (`envelopes.js`): only the moments when the voice is actually speaking count, and longer words get more time, so a pause between sentences doesn't let the words run ahead. If there's no recording (computer voice or no audio), the words light up at an even pace instead.
- Verse readings don't use captions, because the words are already on the verse card. When the verse card is showing, any caption moves up above it.
- The **CC** button cycles between *follow along* (words light up as spoken), *plain* (whole line at once) and *off*. Captions are only a display: turning them off never changes the narration or timing.
- Carols use their own lyrics display instead, which always shows whatever the caption setting: songs inside a station use the **sing-along** box, where a ball bounces onto each syllable exactly when its note plays, and the Carol Corner shows the whole carol with the current line lit.

### Pause, mute and the controls

- **Pause** (❚❚, Space or P online) freezes the sound, the film's movement, the caption progress and every step timer; tap anywhere to resume. It also pauses on its own when a phone is locked or you switch apps.
- **Mute** silences the voices only; the story, captions and mouths keep going, so turning it back on picks up mid-line.
- **Replay** (↺) re-reads the current step. **Previous/Next** change station. **⛶** toggles full screen.
- On the Raspberry Pi stations (kiosk mode) the controls are hidden; the arcade buttons and touch screen do everything, and `js/bridge.js` passes the button presses in and sends the LED light scenes out to `pi/station_agent.py`.

### Changing things

- **Words:** edit `js/content.js`, then re-record that line (section 3, Voices). Until it's re-recorded, that line falls back to the computer voice, because the recording no longer matches the text.
- **Timing of a camera move or what happens on a tap:** that step's `enter(i…)` or `tasks` in `js/film-scenes.js`.
- **Where the overlays sit, sizes, colors:** `css/style.css`.
- **Anything in `js/film-core.js`:** make the same change in every holiday's copy, because the file is shared.

The `classic.html` and `media.html` editions use the same director, words, captions and verse card, but draw their pictures with `js/scenes.js` / `js/scenes-media.js` instead of the film engine.

## Files
```
index.html          the app, film edition (online + kiosk)
classic.html        the earlier flat-illustration version · film.html forwards to index.html
js/content.js       ← all text, verses, carols, church details
js/film-scenes.js   the painted film stations 2-7: shots, characters, taps
js/scenes-film.js   the painted film Station 1 (The Promise)
js/film-core.js     film engine: camera moves, dissolves, cuts to whoever is speaking, moving mouths
                    (the same file as the Thanksgiving Experience's; keep them identical)
js/scenes.js        classic artwork for each station, and the Carol Corner backdrop
js/app.js           story engine, modes, input (touch/keys/gamepad/GPIO), attract screen
js/audio.js         narration playback, carol synthesizer, sound effects
js/bridge.js        talks to the Pi agent (buttons, LEDs, counter)
pi/station_agent.py Pi agent: serves the app, GPIO buttons, LEDs, lamp, counter
pi/install.sh       one-shot Pi setup     pi/kiosk.sh  Chromium kiosk launcher
tools/make_narration.py   Piper narration renderer
tools/make_narration_kokoro.py   Kokoro narration renderer · tools/make_mouth_data.py  mouth movement + who-speaks-when
audio/narration/envelopes.js     mouth data for the film (made by make_mouth_data.py)
server/             nginx / docker / apache configs for the online version
gate/               season gate + countdown page for the online version (season.php = the dates)
js/season.js        season rules for the year-stamp
```
Fonts: Cormorant Garamond and Nunito (SIL Open Font License). QR: qrcode-generator (MIT). Scripture: King James Version (public domain). Carols are public-domain melodies, synthesized in the browser.
