# The Thanksgiving Experience

Six Bible stories about giving thanks, told as short animated films. The scenes are painted, the camera moves slowly, and the people in the story speak their own lines with moving mouths. Visitors tap things to move each story along. The same web app runs in two places:

* **On Raspberry Pis**: one Pi per station as a full-screen kiosk, with a touchscreen, big arcade buttons and LED strips.
* **Online**: the same files on your own web server, where visitors walk all six stations in order on a phone or computer.

It uses the same engine as the Christmas Experience (captions, GO and BACK buttons, attract screen, Pi agent and LEDs), so anything you learned setting that one up applies here too.

| # | Station | Who speaks | What visitors do | Scripture (KJV) |
|---|---------|------------|------------------|-----------------|
| 1 | Enter His Gates | King David | Opens on the Pilgrims' 1621 harvest feast; play David's harp, open the gates of Jerusalem | Ps 100:1-2, 100:4, 107:1 |
| 2 | Bread from Heaven | Moses | Bring the sunrise, gather the manna | Ex 16:15, Lam 3:22-23 |
| 3 | The One Who Came Back | Jesus, the ten lepers | Send the ten men on their way, then tap the one who turns back | Luke 17:12-19 |
| 4 | Loaves and Fishes | Andrew, Jesus | Open the boy's basket, share the food, gather twelve baskets | John 6:9, 11, 12, 13 |
| 5 | Songs at Midnight | Paul | Paul and Silas sing, then the earthquake opens the prison; ends with the Pilgrims' first winter and Lincoln's 1863 Thanksgiving proclamation | Acts 16:25-26, 1 Thess 5:18, Phil 4:6 |
| 6 | Count Your Blessings | — | Starts at a Thanksgiving table; add a golden leaf to the Thankful Tree, sing the Doxology (follow-the-bouncing-ball words, always on screen), church invitation + QR code | James 1:17, 2 Cor 9:15 |

Every station works three ways at once: **touch** the glowing thing, **press GO** (the green arcade button, or Enter on a keyboard; on kiosk stations the spacebar too), or just **watch**.

## 1. Try it on your computer

Double-click `index.html`. It works straight from the folder, including the voices.

To see exactly what a Pi will show:
```bash
python3 pi/station_agent.py --station 3 --port 8080
```
Then open <http://localhost:8080/>. Enter = GO, Spacebar = pause (the spacebar is GO on kiosk stations), Backspace = BACK.

Handy URL switches: `?station=5&mode=watch` (plays itself on a loop), `&kiosk=0` (show the nav buttons), `&next=left` (end-screen arrow), `&idle=60`, `&captions=plain`.

## 2. Change the words

Everything a visitor reads or hears is in **`js/content.js`**: church name, service times, address, website (used for the QR code), every narration line and verse, and the Doxology. Before the event, fill in `"address"` and `"special"`. For example: `"special": "Thanksgiving Eve service · Nov 25, 7 PM"`.

**The Doxology's bouncing ball.** Each line of the song in `"carols"` has a `"sing"` version split into syllables, one per note: `"Praise God, from whom all bless- ings flow;"`. A syllable ending in `-` joins the next one into a word, and `_` means "hold the same syllable over the next note". The ball lands on each syllable exactly when its note plays. If the number of syllables doesn't match the number of notes, that line just lights up as a whole instead.

The Thankful Tree counts leaves across **all** visitors when it runs on a Pi; the count is kept in `pi/counts.json`. Online, each visitor starts with a fresh tree.

## 3. Voices and moving mouths

All narration is pre-recorded with Kokoro, a free, natural-sounding voice that runs offline (`audio/narration/`, 64 MP3s). The narrator tells the story and reads every reference. Each Bible character speaks his own words:

| Part | Voice | Part | Voice |
|---|---|---|---|
| Narrator | af_heart | Jesus | am_michael+am_fenrir (same as Christmas) |
| David | am_liam+am_michael | Andrew | am_eric |
| Moses | bm_george+am_onyx | Paul | bm_lewis+bm_daniel |
| The ten lepers | 4 voices together + echo | Healed men | am_puck, am_adam |

**Emotion.** Each verse has a `"mood"` in `js/content.js`: joy, excited, plea, awe, sorrow, tender, earnest, doubt or warm. A mood sets the pace and, for the characters, lifts or lowers the pitch a little. A verse can also have a `"spoken"` version, which is what the voice says while the screen still shows the exact KJV text. The spoken version can add exclamation marks for energy, or `[word](+2)` to stress a word (use stress marks sparingly; they can make a line sound uneven). The narrator keeps her natural pitch, so only her pace changes; the characters also get a slight lift or drop in pitch. The lepers are three voices calling out a moment apart, like a real crowd. When a verse is split between speakers, a part can be written as `[who, text, spoken, mood]`. Narration lines that end with "!" are read a little brighter automatically. The moods are tuned in `MOODS` at the top of `tools/make_narration_kokoro.py`.

When a verse is split between speakers (narrator, then Jesus), the recording stores where each one starts and stops. The film cuts to that person's close-up as he begins, and his jaw follows how loud his voice is.

**After you change any words or voices**, re-record (Python 3.10–3.12) and then rebuild the mouth data:
```bash
pip install "misaki[en]" kokoro-onnx soundfile && python -m spacy download en_core_web_sm
python3 tools/make_narration_kokoro.py --download   # once: ~350 MB model into voices/
python3 tools/make_narration_kokoro.py              # re-records only lines that changed
python3 tools/make_mouth_data.py                    # mouth movement + who-speaks-when
```

**Browsers and old recordings:** `make_mouth_data.py` also gives every recording a short fingerprint in the manifest, and the page asks for `…mp3?v=<fingerprint>`. The web server lets browsers keep audio for 30 days, so without this a visitor (or you, testing) could keep hearing an old take after a line is re-recorded. Always run `make_mouth_data.py` after re-recording.
The tool trims a stray puff of breath that Kokoro sometimes adds after the last word, but leaves words that really end in a hard sound alone (it used to clip "eaten" to "eat"), and it lifts a soft final syllable after a "t" or "d" so a word like "eaten" doesn't fade into "eat". If a word sounds wrong, add a respelling to `SAY_AS` at the top of `tools/make_narration_kokoro.py`. "Shew", "Philippi", "LORD" and "eaten" are already fixed. A line whose text no longer matches its recording falls back to captions, so an edit never plays the wrong audio.

## 4. Raspberry Pi stations

The hardware, wiring and installer are the same as the Christmas Experience. A Pi set up for Christmas can run this one too, because the service names differ (`thanks-station`, `thanks-kiosk`). Run only one of the two at a time.

```bash
cd ~/thanksgiving-experience
sudo ./pi/install.sh 3                 # this Pi is Station 3
sudo ./pi/install.sh 4 --leds spi      # ...with an LED strip on SPI
sudo ./pi/install.sh 5 --watch         # watch-only loop, no buttons needed
sudo reboot
```

**Buttons (BCM, each between the pin and GND):** GO = GPIO 17 (pin 11), BACK = GPIO 27 (pin 13), GO lamp = GPIO 12 through a transistor. Every station needs only GO.

**LEDs:** the light scenes are `harvest` (warm amber, breathing like a sunset), `night`, `journey`, `star`, `candle` and `celebrate` (orange and gold chase). For WLED, make presets 1–9 in this order: idle, night, star, angel, manger, journey, candle, celebrate, harvest.

**Room layout:** each end screen says "Next stop: Station N →". Set `"next"` in each Pi's `pi/config.json` to `left`, `right`, `ahead` or `none` to match your floor plan. Station 6 holds the invitation and QR code until the visitor presses GO (or 60 seconds pass).

**Updating a station:** after you change anything (words, scenes, voices), copy this folder to the Pi again over the old one (your `pi/config.json` there is kept, since this folder only has `config.example.json`), then `sudo reboot` (or `sudo systemctl restart thanks-station` and reload the kiosk). The Pi serves the files straight from that folder.

## 5. Online version (shared hosting, open in season only)

The online version is a once-a-year event. It is open from **November 1** through the **Saturday before the First Sunday of Advent** (always includes Thanksgiving weekend, and hands straight off to the Christmas Experience): 2026: Sun Nov 1 – Sat Nov 28. Out of season, visitors get a countdown page ("The Thanksgiving Experience 2027 · Opens …") instead, and while the Christmas Experience is open the countdown page links to it.

### Combined holidays site (one folder for every holiday)
On the church site, all the holiday experiences live together in one gated folder, `holidays/` (locally `C:\Apache24\htdocs\outreach\holidays\`, browsed at `http://occ.local/holidays/`). Its main page sends visitors straight into whichever holiday is open, or counts down to the next one; this experience lives at `holidays/thanksgiving/`. That folder has its own gate (`holidays/gate/`, with the holiday list and dates in `config.php`) and README.

* **This project lives in the `holiday-experiences` git repo** (`C:\Users\ed\source\repos\holiday-experiences\experiences\thanksgiving\`). `film-core.js`, `bridge.js`, `season.js`, `vendor/` and `fonts/` are shared with the other experiences and live once in the repo's `shared/` folder. **After changing it, run `build.bat`** (or `build.bat --local`) to assemble `dist\thanksgiving\` (standalone, for the Pis) and `dist\holidays\thanksgiving\` (for the web), and to list the files to upload. See the repo README.
* **Dev server:** on `localhost` or any `*.local` name, from this PC or the local network, every holiday opens directly (green DEV pill), no preview key needed.
* The season dates for the combined site are in `holidays/gate/config.php`. If you change this experience's dates, change them there too, as well as in `gate/season.php` and `js/season.js` here.

The rest of this section is for publishing this experience **on its own** (e.g. its own subdomain).

### Upload (FTP)
Needs an Apache or LiteSpeed host with PHP 7.4 or newer (any normal cPanel-style shared host). Upload these to the site's web folder (e.g. the folder for `thanksgiving.theoutreachcc.com`):

```
index.html   css/   js/   fonts/   vendor/   audio/   gate/
```
Then upload `server/apache.htaccess` and rename it to **`.htaccess`** in that same folder. Your FTP client may hide files starting with a dot; turn on "show hidden files" to see it. It also works in a subfolder (e.g. `theoutreachcc.com/thanksgiving/`).

Don't upload `pi/`, `tools/`, `server/` or `voices/` (the gate would refuse to serve them anyway).

**Check it after uploading.** Out of season, open `https://thanksgiving.theoutreachcc.com/js/app.js`: it must say **Not found**. If you see JavaScript instead, the `.htaccess` file is missing or the host is ignoring it, and the experience is not protected.

### How the gate works
Every request goes through `gate/gate.php`, which decides on the server's clock (America/New_York), not the visitor's. Out of season every script, audio file and stylesheet answers 404, so typing a file's address gets nothing; only the fonts (for the countdown page) are served all year. Anything not listed in `publish` in `gate/config.php` is never served, in season or out. The page itself is sent `no-cache`, so it closes the moment the season ends.

### Preview switch (for testing)
The key is in `gate/preview-key.php` (not in git; copy `gate/preview-key.example.php`) (a PHP file, so it can't be read over the web).
* `https://thanksgiving.theoutreachcc.com/?preview=<key>`: this browser gets in for 30 days (signed, HttpOnly cookie). A red PREVIEW pill shows at the top so you know you're not seeing what the public sees.
* `?asof=2026-11-20`: while previewing, pretend it's that date (year-stamp and countdown follow it). `?asof=off` goes back to today.
* `?landing`: see the countdown page as the public would.
* `?preview=off`: leave preview in this browser.

To retire the switch, delete `gate/preview-key.php` from the host. To change the key, edit it and re-upload; that also cancels every existing pass. A wrong key gets no hint.

### Year-stamp
The title reads "The Thanksgiving Experience 2026" everywhere (home page, attract screens, browser tab). Online the year comes from the server; on the Pis `js/season.js` works it out from the Pi's clock. For January, the Christmas year stays with the season that started in December. Force a year with `"year": 2026` in `js/content.js`, or turn it off with `"yearStamp": false`. The season dates live in `gate/season.php` and `js/season.js` (same rules, kept in step).

The Raspberry Pi stations are not gated: they run whenever you set them up.

(`server/docker-compose.yml` and `server/nginx.conf` are an alternative for a Docker/nginx server; not needed for shared hosting.)

### Phones and tablets

- **No flicker:** on phones and tablets, the film switches off the effects that make mobile browsers flicker (screen-wide blend modes, the film-grain and noise textures, and frosted-glass blur behind the controls) and uses cheap look-alikes. It also keeps the picture from redrawing when nothing in the story is moving: background motion (twinkling stars, drifting clouds, swaying wheat, flickering flames) holds still, the "tap here" glow pulses in small steps, the GO button's pulse and the caption words no longer redraw the picture, and mouths update 25 times a second. On a PC, add `?lite=1` to the address to see the phone version; `?lite=0` turns it off on a phone.
- **Full screen:** on a phone held sideways, the first tap goes full screen (browsers only allow full screen after a tap). If the viewer leaves full screen, it isn't forced again until they turn the phone again. The ⛶ button at the end of the station controls switches full screen on or off on any device. iPhones don't allow web pages to go full screen, so on an iPhone the button does nothing. Kiosk stations (the Pi) are left alone.
- Both live in `js/film-core.js`, which is the same file in both projects.
- **Pause:** the ❚❚ button in the station controls (or the P key) freezes everything: voices, music, sound effects, the film's movement and the timing between steps. Tap anywhere, or the button again, to carry on. It also pauses by itself when a phone is locked or the viewer switches apps.
- **Keeps the screen awake:** while the experience is open, phones and tablets are asked not to dim or lock (Android Chrome/Samsung Internet, and iPhone/iPad on iOS 16.4 or newer).
- **iPad/iPhone speed:** Safari draws SVG blur and texture effects on the processor, every frame, so camera moves slowed to a crawl. On phones and tablets the clouds become soft gradients, the stone texture a light tint, and glows that are already soft lose their extra blur (`K.liteArt` in `js/film-core.js`).
- **Captions follow the voice:** each word lights when the narrator reaches it, using the loudness data in `audio/narration/envelopes.js`, so pauses in the narration don't let the words run ahead. Re-run `tools/make_mouth_data.py` after re-recording, as before, and the captions stay in step too.
- **Voices don't drop out:** narration reuses one audio player (and character lines two) instead of making a new one per line. Phones and tablets only allow so many players on a page; running out silenced every line from about station 3 or 4 on. On phones and tablets the narration plays through the sound engine (Web Audio) rather than an audio player: iPad/iPhone Safari blocks a player that starts by itself between taps (the voice dropped out at scene changes until the next GO), but once a tap has started the engine it can play every line. PCs and the Pi still use the player; add `?audio=player` to force the player on a phone for testing (`js/audio.js`).
- **Phone held upright:** the station controls sit along the bottom, with the verse, sing-along words and captions just above them; verse text never shrinks below 15px (end of `css/style.css`).
- **Mute:** the speaker button only silences the voices. The story, captions and mouths keep going, and the voices come back mid-line when it's turned on again.


## 6. How the screens work

Each station is one web page made of **layers stacked on top of each other**. At the bottom is the painted, moving picture (the "film"). On top of it are ordinary page elements: the verse card, captions, prompt and buttons. The picture and the words are kept separate on purpose: the words stay sharp and readable at any screen size, and the picture can move, zoom and dissolve without affecting them.

```
 top      pause "tap to continue" card (only when paused)
   │      station badge · progress dots · control buttons
   │      GO prompt ("Tap the harp")
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
3. If there's a `task`, shows the GO prompt (e.g. "Tap the harp") and waits. The station carries on when the glowing thing is tapped, or GO is pressed (GO taps it for you, so the Pi's arcade button can play every station).
4. If there's a `verse`, shows the verse card and plays the reading. The character who is speaking gets a close-up and their mouth moves.
5. Plays the `after` narration.
6. Waits about 2 seconds (a tap or GO skips this), then goes on to the next step.

Every timer in this sequence uses `A.after` rather than an ordinary timer, so pause can freeze it and resume it exactly where it was.

### Motion (the film)

- **Painted in code.** The picture is an SVG (vector drawing) made from shapes written in `film-scenes.js`: skies, hills, villages, people. Nothing is a video, so it stays crisp on any screen and is small to download. The drawing is 1600×900. On a wide screen it fills the screen and trims the top/bottom; on a tall screen the whole picture shows.
- **Shots.** Each station has a few *shots* (e.g. the road, a close-up of Jesus). They're all in the picture at once, stacked; only the current one is visible. Changing shot is a **dissolve**: the new shot fades in over the old (about a second, longer for big scene changes).
- **Camera.** Each shot sits inside a "camera" group. A camera move is a zoom/pan (`scale(…) translate(…)`) that the browser slides to over about 9 seconds, which gives the slow Ken Burns drift.
- **Characters.** People are built from parts (head, jaw, eyelid, arms, robe). Many times a second the engine reads how loud the voice is right now from `envelopes.js` and opens the speaker's jaw to match, tilts the head slightly, and blinks every few seconds. When a verse names a speaker, the film cuts to that character's close-up (`closeups` in `film-scenes.js`).
- **Little animations** (twinkling stars, drifting clouds, swaying wheat, candle flicker, people walking or bobbing, sparkles, rising music notes) are CSS animations on parts of the drawing.
- **Tap targets.** Anything tappable has a `data-hit` name. When a task starts it glows and gets a pulsing ring. A tap anywhere over it counts, even if another part of the picture is on top.
- **Phones and tablets** get a lighter version of the same picture (see *Phones and tablets* above): no blend effects or film grain, gradient clouds instead of noise textures, background motion held still, and mouths updated 25 times a second. The look is nearly identical; the device just has much less drawing to do.

### Text: the verse card

- When a step has a verse, `app.js` writes the scripture and reference ("Luke 17:12-13 KJV") into the verse card and fades it in.
- In the film edition it sits along the bottom like a film subtitle. On a phone held upright it sits just above the buttons.
- It stays up while the verse is read and is cleared when the next step starts.

### Closed captions

- When narration plays, each word of the line is put in the caption box as its own piece, dimmed.
- As the recording plays, the words light up when the narrator reaches them. This uses the recording's loudness data (`envelopes.js`): only the moments when the voice is actually speaking count, and longer words get more time, so a pause between sentences doesn't let the words run ahead. If there's no recording (computer voice or no audio), the words light up at an even pace instead.
- Verse readings don't use captions, because the words are already on the verse card. When the verse card is showing, any caption moves up above it.
- The **CC** button cycles between *follow along* (words light up as spoken), *plain* (whole line at once) and *off*. Captions are only a display: turning them off never changes the narration or timing.
- Songs inside a station (e.g. the Doxology) use the **sing-along** box instead, which always shows: a ball bounces onto each syllable exactly when its note plays.

### Pause, mute and the controls

- **Pause** (❚❚, Space or P online) freezes the sound, the film's movement, the caption progress and every step timer; tap anywhere to resume. It also pauses on its own when a phone is locked or you switch apps.
- **Mute** silences the voices only; the story, captions and mouths keep going, so turning it back on picks up mid-line.
- **Replay** (↺) re-reads the current step. **Previous/Next** change station. **⛶** toggles full screen.
- On the Raspberry Pi stations (kiosk mode) the controls are hidden; the arcade buttons and touch screen do everything, and `js/bridge.js` passes the button presses in and sends the LED light scenes out to `pi/station_agent.py`.

### Changing things

- **Words:** edit `js/content.js`, then re-record that line (section 3). Until it's re-recorded, that line falls back to the computer voice, because the recording no longer matches the text.
- **Timing of a camera move or what happens on a tap:** that step's `enter(i…)` or `tasks` in `js/film-scenes.js`.
- **Where the overlays sit, sizes, colors:** `css/style.css`.
- **Anything in `js/film-core.js`:** make the same change in every holiday's copy, because the file is shared.

## Files
```
index.html            the app (online + kiosk)
js/content.js         ← all text, verses, voices, church details, the Doxology
js/film-scenes.js     the six painted stations: shots, characters, taps
js/film-core.js       film engine: camera moves, dissolves, cuts to whoever is speaking, moving mouths
                      (the same file as the Christmas Experience's; keep them identical)
js/app.js             story engine, modes, input (touch/keys/gamepad/GPIO), attract screen
js/audio.js           narration playback, music synthesizer, sound effects (harp, earthquake…)
js/bridge.js          talks to the Pi agent (buttons, LEDs, leaf counter)
css/thanksgiving.css  autumn colours on top of css/style.css
audio/narration/      recordings, manifest, envelopes.js (mouth data)
pi/                   station agent, installer, kiosk launcher
tools/                narration + mouth-data tools
server/               nginx / docker / apache configs
gate/                 season gate + countdown page for the online version (season.php = the dates)
js/season.js          season rules for the year-stamp
```
Fonts: Cormorant Garamond and Nunito (SIL Open Font License). QR: qrcode-generator (MIT). Scripture: King James Version (public domain). Doxology: Thomas Ken (1674) to the Old Hundredth (1551), public domain, synthesized in the browser.
