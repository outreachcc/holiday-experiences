<?php
/* Countdown page shown out of season, and the small banner shown while previewing. */

function h(string $s): string { return htmlspecialchars($s, ENT_QUOTES | ENT_HTML5, 'UTF-8'); }

function longDate(DateTimeImmutable $d): string { return $d->format('l, F j, Y'); }

function dateRange(DateTimeImmutable $a, DateTimeImmutable $b): string
{
    return $a->format('Y') === $b->format('Y')
        ? $a->format('F j') . ' – ' . $b->format('F j, Y')
        : $a->format('F j, Y') . ' – ' . $b->format('F j, Y');
}

function previewInfo(array $st, ?string $asof, string $base): array
{
    return [
        'state'   => $st['open'] ? 'Open to the public until ' . $st['end']->format('D, M j') : 'Public opens ' . $st['start']->format('D, M j, Y'),
        'asof'    => $asof,
        'landing' => $base . '?landing',
        'enter'   => $base,
        'off'     => $base . '?preview=off',
        'clear'   => $base . '?asof=off',
    ];
}

function previewBanner(array $p): string
{
    $asof = $p['asof'] ? ' · <b>Test date ' . h($p['asof']) . '</b> <a href="' . h($p['clear']) . '">use today</a>' : '';
    return <<<HTML
<div id="xpPreview" style="position:fixed;z-index:99999;top:8px;left:50%;transform:translateX(-50%);max-width:calc(100% - 16px);box-sizing:border-box;padding:6px 12px;border-radius:999px;background:rgba(150,20,30,.92);color:#fff;font:600 12px/1.4 system-ui,sans-serif;box-shadow:0 2px 10px rgba(0,0,0,.4);text-align:center;user-select:none">
  PREVIEW · {$p['state']}{$asof} · <a href="{$p['landing']}">countdown page</a> · <a href="{$p['off']}">exit preview</a>
  <button onclick="this.parentNode.remove()" aria-label="Hide" style="all:unset;cursor:pointer;margin-left:6px">✕</button>
</div>
<style>#xpPreview a{color:#ffe7a8}</style>
HTML;
}

function renderLanding(array $cfg, array $st, DateTimeImmutable $now, array $prev, ?array $sib, ?array $preview): string
{
    $L = $cfg['landing'];
    $t = $L['theme'];
    $label = $st['label'];
    $opensMs = $st['opensAt']->getTimestamp() * 1000;
    $nowMs = (int) round((float) $now->format('U.u') * 1000);
    $range = dateRange($st['start'], $st['end']);
    $open = $st['open'];          // only true when a previewer asks for this page in season

    // Shortly after last year's season: say thank you as well as "see you next year".
    $daysSince = (int) floor(($now->getTimestamp() - $prev[1]->getTimestamp()) / 86400);
    $thanks = !$open && $daysSince >= 1 && $daysSince <= 120
        ? '<p class="thanks">Thank you for visiting ' . h($st['name'] . ' ' . ($st['year'] - 1)) . '.</p>' : '';

    $headline = $open ? 'Open now' : 'Opens ' . h(longDate($st['start']));
    $sibling = $sib ? '<a class="sibling" href="' . h($sib['url']) . '"><span>Open now</span>' . h($sib['label']) . ' →</a>' : '';
    $enter = $open ? '<a class="enter" href="' . h($preview['enter'] ?? '/') . '">Enter the experience</a>' : '';
    $banner = $preview ? previewBanner($preview) : '';
    $clockAttr = $open ? 'hidden' : '';
    $openJs = $open ? 'true' : 'false';
    $E = array_map(fn($v) => is_string($v) ? h($v) : $v, $L);   // escaped copy of the wording
    $name = h($st['name']);
    $label = h($label);
    $motif = $t['motif'] === 'leaves' ? 'leaves' : 'stars';

    return <<<HTML
<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>{$label}</title>
<meta name="description" content="{$label} — {$range}. {$E['blurb']}">
<meta name="theme-color" content="{$t['bg']}">
<style>
@font-face { font-family: "Cormorant"; src: url(fonts/cormorant-garamond-latin-600-normal.woff2) format("woff2"); font-weight: 600; font-display: swap; }
@font-face { font-family: "Cormorant"; src: url(fonts/cormorant-garamond-latin-500-italic.woff2) format("woff2"); font-weight: 500; font-style: italic; font-display: swap; }
@font-face { font-family: "Nunito"; src: url(fonts/nunito-latin-400-normal.woff2) format("woff2"); font-weight: 400; font-display: swap; }
@font-face { font-family: "Nunito"; src: url(fonts/nunito-latin-800-normal.woff2) format("woff2"); font-weight: 800; font-display: swap; }
:root { --bg: {$t['bg']}; --bg2: {$t['bg2']}; --ink: {$t['ink']}; --dim: {$t['dim']}; --accent: {$t['accent']};
  --serif: "Cormorant", Georgia, serif; --sans: "Nunito", "Segoe UI", system-ui, sans-serif; }
* { box-sizing: border-box; }
html, body { margin: 0; min-height: 100%; }
body { background: radial-gradient(ellipse at 50% 120%, var(--bg2), var(--bg) 70%) fixed, var(--bg); color: var(--ink);
  font-family: var(--sans); display: grid; place-items: center; min-height: 100vh; min-height: 100dvh; padding: 32px 16px; overflow-x: hidden; }
#sky { position: fixed; inset: 0; pointer-events: none; }
main { position: relative; text-align: center; max-width: 760px; width: 100%; }
.eyebrow { font-weight: 800; letter-spacing: .32em; text-transform: uppercase; color: var(--accent); font-size: clamp(11px, 1.4vw, 14px); }
h1 { font-family: var(--serif); font-weight: 600; font-size: clamp(40px, 8vw, 92px); line-height: .98; margin: .3em 0 .1em;
  text-shadow: 0 0 40px color-mix(in srgb, var(--accent) 35%, transparent); text-wrap: balance; }
h1 .yr { color: var(--accent); }
.tagline { font-family: var(--serif); font-style: italic; font-size: clamp(20px, 2.6vw, 28px); color: var(--dim); margin: 0 0 1.6em; }
.thanks { color: var(--dim); margin: -.8em 0 1.4em; }
.when { font-weight: 800; letter-spacing: .14em; text-transform: uppercase; font-size: clamp(13px, 1.6vw, 16px); margin: 0 0 1em; }
.clock { display: flex; justify-content: center; gap: clamp(8px, 2.4vw, 22px); margin: 0 0 1.4em; }
.unit { min-width: clamp(64px, 16vw, 120px); padding: 14px 6px 10px; border-radius: 16px;
  background: color-mix(in srgb, var(--ink) 6%, transparent); border: 1px solid color-mix(in srgb, var(--accent) 30%, transparent); }
.unit b { display: block; font-family: var(--serif); font-weight: 600; font-size: clamp(36px, 7vw, 64px); line-height: 1; font-variant-numeric: tabular-nums; }
.unit span { display: block; margin-top: 6px; font-size: 11px; letter-spacing: .2em; text-transform: uppercase; color: var(--dim); }
.range { color: var(--dim); margin: 0 0 .4em; }
.blurb { max-width: 34em; margin: 0 auto 1.8em; line-height: 1.55; color: var(--dim); }
.enter, .sibling { display: inline-flex; align-items: center; gap: 10px; text-decoration: none; border-radius: 999px; padding: 12px 22px; font-weight: 800; }
.enter { background: var(--accent); color: #1a1000; margin-bottom: 1.4em; }
.sibling { color: var(--ink); border: 1px solid color-mix(in srgb, var(--accent) 45%, transparent); margin-bottom: 1.8em; }
.sibling span { font-size: 11px; letter-spacing: .16em; text-transform: uppercase; color: var(--accent); }
footer { color: var(--dim); font-size: 14px; line-height: 1.7; }
footer a { color: var(--accent); }
@media (prefers-reduced-motion: reduce) { #sky * { animation: none !important; } }
</style>
</head>
<body>
<div id="sky" aria-hidden="true"></div>
<main>
  <div class="eyebrow">{$E['church']}</div>
  <h1>{$name} <span class="yr">{$st['year']}</span></h1>
  <p class="tagline">{$E['tagline']}</p>
  {$thanks}
  <p class="when">{$headline}</p>
  <div class="clock" id="clock" role="timer" aria-live="off" aria-label="Time until it opens" {$clockAttr}>
    <div class="unit"><b id="d">–</b><span>Days</span></div>
    <div class="unit"><b id="h">–</b><span>Hours</span></div>
    <div class="unit"><b id="m">–</b><span>Minutes</span></div>
    <div class="unit"><b id="s">–</b><span>Seconds</span></div>
  </div>
  {$enter}
  <p class="range">{$range}</p>
  <p class="blurb">{$E['blurb']}</p>
  {$sibling}
  <footer>{$E['services']}<br><a href="{$E['website']}">{$E['websiteLabel']}</a></footer>
</main>
{$banner}
<script>
(function () {
  var opens = {$opensMs}, offset = {$nowMs} - Date.now(), open = {$openJs};
  var el = function (id) { return document.getElementById(id); };
  function tick() {
    var left = Math.max(0, opens - (Date.now() + offset));
    var s = Math.floor(left / 1000);
    el("d").textContent = Math.floor(s / 86400);
    el("h").textContent = String(Math.floor(s / 3600) % 24).padStart(2, "0");
    el("m").textContent = String(Math.floor(s / 60) % 60).padStart(2, "0");
    el("s").textContent = String(s % 60).padStart(2, "0");
    if (left <= 0) { clearInterval(timer); setTimeout(function () { location.reload(); }, 1500 + Math.random() * 4000); }
  }
  var timer = open ? 0 : setInterval(tick, 1000);
  if (!open) tick();

  // background: {$motif}
  var sky = el("sky"), motif = "{$motif}", s = "";
  if (motif === "leaves") {
    var cols = ["#c8521e", "#e2862a", "#a83a1a", "#d8a030", "#8a3416"];
    for (var i = 0; i < 28; i++) s += '<g transform="translate(' + (Math.random() * 1700 - 100) + ',' + (Math.random() * 300 - 200) + ') scale(' + (.8 + Math.random() * 1.4).toFixed(2) + ')"><path class="lf" d="M0,0 C5,-9 17,-10 24,0 C17,10 5,9 0,0 Z" fill="' + cols[i % 5] + '" opacity=".45" style="animation-duration:' + (16 + Math.random() * 14) + 's;animation-delay:-' + (Math.random() * 30) + 's"/></g>';
    s = '<svg viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice" width="100%" height="100%"><style>.lf{animation:lf linear infinite}@keyframes lf{0%{transform:translate(0,-60px) rotate(0)}100%{transform:translate(160px,1100px) rotate(620deg)}}</style>' + s + '</svg>';
  } else {
    for (var j = 0; j < 110; j++) s += '<circle class="tw" cx="' + Math.random() * 1600 + '" cy="' + Math.random() * 900 + '" r="' + (Math.random() * 1.6 + .4) + '" fill="#fff8e6" style="animation-delay:-' + Math.random() * 3 + 's"/>';
    s = '<svg viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice" width="100%" height="100%"><style>.tw{animation:tw 3s ease-in-out infinite}@keyframes tw{50%{opacity:.2}}</style>' + s + '</svg>';
  }
  sky.innerHTML = s;
})();
</script>
</body>
</html>
HTML;
}
