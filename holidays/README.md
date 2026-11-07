# Holidays (Outreach Christian Church)

One gated folder for all the holiday experiences. Locally: http://occ.local/holidays/ or http://localhost/outreach/holidays/

```
holidays/
  .htaccess        sends every request through gate/gate.php (nothing is served straight from disk)
  gate/            config.php (the holiday list), seasons.php (date rules), gate.php, landing.php, preview-key.php
  fonts/           fonts for the countdown pages (served all year)
  thanksgiving/    built from experiences/thanksgiving (index.html css js fonts vendor audio)
  christmas/       built from experiences/christmas
```
In the repo (`C:\Users\ed\source\repos\holiday-experiences`) this folder holds only the gate (`.htaccess`, `gate/`, this README).
`python build.py` assembles the full folder above in `dist\holidays\`; `python build.py --local` also copies it here into Apache.
`gate/preview-key.php` is not in git (copy `preview-key.example.php` and set a key).

## What visitors see
* `/holidays/`: while a holiday is open, visitors go straight into it (`/holidays/thanksgiving/`, `/holidays/christmas/`).
  Otherwise, a countdown to whichever holiday opens next, with the others listed under "Also coming".
* `/holidays/<holiday>/` while it's closed: that holiday's own countdown. Its scripts, audio and styles answer 404.
* The countdown reloads itself the moment a holiday opens, so a visitor waiting on the page is let in.
* Dates come from the server's clock (America/New_York), never the visitor's.

Current rules: Thanksgiving Nov 1 – the Saturday before Advent; Christmas First Sunday of Advent – Jan 6; Easter Palm Sunday – the Sunday after Easter (placeholder: countdown only until it's built).

## The website's Holidays button
`/holidays/status.json` says which holiday is open (or opens next), with every holiday's dates and theme.
The "Holidays" button in theoutreachcc.com's main menu reads it, so the button always matches the gate:
it shows that holiday's `short` label, `icon` (Font Awesome 6 Free, solid) and theme colors (`bg2`, `accent`),
plus a "Soon" tag while it's still counting down. Nothing on the website changes when you edit `gate/config.php`.
It needs no server settings. When this holidays folder is on the same server as the website (inside it, like
`outreach/holidays/`, or right next to it), the button reads the dates straight from `gate/status.php` and links to this
folder; otherwise it asks `https://holidays.theoutreachcc.com/status.json`. On theoutreachcc.com itself the link always goes
to `https://holidays.theoutreachcc.com/`. `gate/status.php` is shared by the gate and the button: upload it with the gate.

## Adding a holiday
1. Put its experience in the repo as `experiences/easter/`. The build adds it to `dist/holidays/easter/` automatically
   (the folder name must match its key in `gate/config.php`).
2. Add an entry under `'holidays'` in `gate/config.php` with that folder name as its key: name, opens, closes,
   short, icon, tagline, blurb and theme (Easter's entry is a good one to copy). Date rules are explained at the top of
   `gate/seasons.php`: fixed dates (`11-01`), `advent`, `easter`, `thanksgiving`, `nth 2 sun 5`, `nth last mon 5`,
   each with an optional day offset (`advent -1`, `easter +49`).
3. Placeholders: a holiday with `'placeholder' => true` (or no `index.html` in its folder) is listed and counted
   down to, but never opens. If its season arrives before it's built, the countdown skips to next year.
   Easter is set up this way now; when it's built, add `experiences/easter/` and delete the `'placeholder'` line in
   `gate/config.php`.

## Preview switch (testing)
* `/holidays/?preview=<key>` (the key is in `gate/preview-key.php`): this browser gets into every holiday for 30 days,
  with a red PREVIEW pill at the top.
* `?asof=2026-12-24` pretend it's that date (`?asof=off` for today) · `?landing` see the countdown · `?preview=off` leave.

## Web host
Needs Apache or LiteSpeed with PHP 7.4+. Upload from `dist\holidays\`; `python build.py` lists exactly which files
changed since the last upload (then run `python build.py --mark-deployed` and commit). Make sure `.htaccess` goes up too (FTP clients may hide dot files).
Check it: out of season, `/holidays/christmas/js/app.js` must say **Not found**.
