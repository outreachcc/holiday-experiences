# Holiday Experiences (Outreach Christian Church)

The seasonal experiences (Thanksgiving, Christmas, and Easter when it's built) and the gated holidays site that serves them at **https://holidays.theoutreachcc.com**.

```
holiday-experiences/
  experiences/
    christmas/       the Christmas Experience: pages, css, its own js, audio, media, pi/, tools/, gate/, server/
    thanksgiving/    the Thanksgiving Experience (same layout, plus social-shorts/)
  shared/            files every experience uses, kept ONCE here
    js/              film-core.js  bridge.js  season.js
    vendor/          qrcode.js
    fonts/
  holidays/          the web gate: .htaccess, gate/ (config.php = holiday list and dates), README
  build.py           assembles dist/ and lists what to upload  (build.bat = double-click version)
  deployed.json      fingerprint of what's on IONOS now (updated by --mark-deployed)
  dist/              build output, never committed
```

Each experience keeps its own `app.js`, `audio.js`, `content.js`, `film-scenes.js` and `css/`; they have real per-holiday differences.
**Edit shared files in `shared/`, not in an experience** (an experience has no copy of them until you build).

## Everyday workflow
1. Edit files under `experiences/<holiday>/` or `shared/`.
2. `build.bat --local`: builds `dist\` and copies the web folder into `C:\Apache24\htdocs\outreach\holidays` so you can test at http://occ.local/holidays/.
3. Commit: `git add -A` then `git commit -m "what changed"`.
4. Deploy: FTP the files that `build.bat` listed, from `dist\holidays\` to `/holidays/` on IONOS.
5. `python build.py --mark-deployed`, then commit `deployed.json` ("deployed").

`build.py` output:
* `dist\holidays\`: exactly what goes on the web host.
* `dist\christmas\`, `dist\thanksgiving\`: complete standalone copies, the same as the old `C:\<holiday>-experience` folders (what the Pis run).

Narration tools (`tools\make_narration_kokoro.py`, `tools\make_mouth_data.py`) run inside `experiences\<holiday>\` as before.

## Tags
Tag each season when it goes live, so next year starts from a known-good version:
```
git tag thanksgiving-2026
git push --tags
```

## Raspberry Pi stations
```
git clone <repo url> holiday-experiences && cd holiday-experiences
python3 build.py
sudo ./dist/christmas/pi/install.sh 3        # Station 3 (see the experience README for options)
```
To update a Pi before an event: `git pull && python3 build.py`, then reboot. The build keeps the Pi's own `pi/venv` and `pi/config.json`.

## Not in git
* `preview-key.php` (the preview-switch secret). Copy `gate/preview-key.example.php` to `preview-key.php` and set a key. It stays on this PC and the web host.
* `dist/`, Python caches and venvs, Kokoro model weights, and the rendered social-short `.mp4`s (rebuild with `social-shorts/tools`).

## Adding a holiday
Add `experiences/<key>/` (with `index.html` using `js/film-core.js` etc. from `shared/`) and its entry in `holidays/gate/config.php` under the same key. See `holidays/README.md`.
