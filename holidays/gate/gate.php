<?php
/*
 * Holidays gate — every request to the holidays folder comes through here (.htaccess sends it).
 *
 *   /holidays/              a holiday is open  -> sent straight to it (e.g. /holidays/thanksgiving/)
 *                           none is open       -> countdown to the next one to open, listing the rest
 *   /holidays/<id>/         open               -> that experience
 *                           closed             -> that holiday's own countdown
 *   /holidays/<id>/<file>   served only while <id> is open and the file is in 'publish'; otherwise 404
 *   /holidays/fonts/...     served all year (the countdown pages use them)
 *   /holidays/status.json   which holiday is open (or next), its dates and colors; read by theoutreachcc.com
 *
 * Preview switch: /holidays/?preview=<key> gives this browser a signed 30-day pass (HttpOnly cookie) to
 * every holiday. While previewing:  ?asof=2026-12-24  pretend it is that date (?asof=off to stop)
 *                                   ?landing          see the countdown page as the public would
 *                                   ?preview=off      end the preview in this browser
 *
 * Decisions use the server's clock, never the visitor's. Runs under Apache (PHP streams the files) or
 * nginx + PHP-FPM (files handed back to nginx with X-Accel-Redirect; set GATE_MODE=accel, GATE_BASE, GATE_ROOT).
 */
declare(strict_types=1);

require_once __DIR__ . '/seasons.php';
require_once __DIR__ . '/status.php';
require __DIR__ . '/landing.php';

$cfg   = require __DIR__ . '/config.php';
$tz    = new DateTimeZone($cfg['timezone']);
$root  = rtrim(str_replace('\\', '/', (string) (srv('GATE_ROOT') ?: dirname(__DIR__))), '/') . '/';
$accel = srv('GATE_MODE') === 'accel';
header_remove('X-Powered-By');

/* ---------- which file was asked for ---------- */
$base = srv('GATE_BASE');
if ($base === '') {                               // Apache: the holidays folder = the folder above gate/
    $base = rtrim(str_replace('\\', '/', dirname((string) srv('SCRIPT_NAME'), 2)), '/') . '/';
}
$uriPath = rawurldecode((string) parse_url((string) srv('REQUEST_URI'), PHP_URL_PATH));
if (strncmp($uriPath, $base, strlen($base)) !== 0) {
    if ($uriPath . '/' === $base) redirectTo($base, $_GET);   // /holidays -> /holidays/
    notFound();
}
$rel = substr($uriPath, strlen($base));
if ($rel === 'index.php' || $rel === 'index.html') $rel = '';
if ($rel !== '' && !safePath($rel)) notFound();

/* ---------- preview switch ---------- */
$key    = previewKey($cfg);
$secure = isHttps();
$q      = $_GET;

if (isset($q['preview'])) {
    $given = (string) $q['preview'];
    unset($q['preview']);
    if ($given === 'off') {
        clearCookie('xp_preview', $base, $secure);
        clearCookie('xp_asof', $base, $secure);
        redirectTo($base . $rel, $q);
    }
    if ($key !== '' && hash_equals($key, $given)) {
        $exp = time() + 86400 * (int) $cfg['preview_days'];
        setcookie('xp_preview', $exp . '.' . sign((string) $exp, $key), cookieOpts($exp, $base, $secure));
        redirectTo($base . $rel, $q);
    }
    usleep(750000);                               // wrong key: no hint, and slow down guessing
}

$dev = isDev($cfg);
$previewing = $dev || ($key !== '' && validPass((string) ($_COOKIE['xp_preview'] ?? ''), $key));

if ($previewing && isset($q['asof'])) {
    $asof = (string) $q['asof'];
    unset($q['asof']);
    if (validDate($asof)) setcookie('xp_asof', $asof, cookieOpts(0, $base, $secure));
    else clearCookie('xp_asof', $base, $secure);
    redirectTo($base . $rel, $q);
}

$asof = $previewing && validDate((string) ($_COOKIE['xp_asof'] ?? '')) ? $_COOKIE['xp_asof'] : null;
$now  = $asof ? new DateTimeImmutable($asof . ' 12:00', $tz) : new DateTimeImmutable('now', $tz);

$holidays = $cfg['holidays'];
$states = holidays_states($cfg, $root, $now, $tz);   // status.php
$wantLanding = $previewing && isset($q['landing']);

/* ---------- status.json: which holiday is open now (or opens next), for the church website's Holidays button ---------- */
if ($rel === 'status.json') sendStatus($cfg, $states, $now);

/* ---------- files shared by every page (fonts) ---------- */
if (listed($rel, $cfg['always'])) serveFile($root, $rel, 'public, max-age=2592000', $accel);

/* ---------- the main page: whichever holiday is open, or the countdown to the next ---------- */
if ($rel === '') {
    $open = array_filter($states, fn($s) => $s['open']);
    if ($open && !$wantLanding) {
        // If seasons ever overlap, the one that opened most recently wins.
        uasort($open, fn($a, $b) => $b['start'] <=> $a['start']);
        redirectTo($base . array_key_first($open) . '/', $q);
    }
    $upcoming = $states;
    uasort($upcoming, fn($a, $b) => [$a['open'], $a['start']] <=> [$b['open'], $b['start']]);
    $nextId = array_key_first($upcoming);
    showLanding($cfg, $nextId, $states, $now, $tz, $base, $previewing ? previewInfo($states[$nextId], $asof, $base, '') : null, true);
}

/* ---------- inside one holiday ---------- */
$slash = strpos($rel, '/');
$id  = $slash === false ? $rel : substr($rel, 0, $slash);
$sub = $slash === false ? null : substr($rel, $slash + 1);
if (!isset($holidays[$id])) notFound();
if ($sub === null) redirectTo($base . $id . '/', $q);   // /holidays/christmas -> /holidays/christmas/
if ($sub === 'index.php') $sub = '';

if (strncmp($sub, 'api/', 4) === 0) { http_response_code(204); exit; }   // Pi-only API: answer quietly online

$st = $states[$id];
$isPage = $sub === '' || $sub === 'index.html';
if (!($st['open'] || ($previewing && $st['ready'])) || $wantLanding) {
    if (!$isPage) notFound();                     // scripts, audio, styles: nothing while it's closed
    showLanding($cfg, $id, $states, $now, $tz, $base, $previewing ? previewInfo($st, $asof, $base, $id . '/') : null, false);
}

if ($isPage) $sub = 'index.html';
if (!listed($sub, $holidays[$id]['publish'] ?? $cfg['publish'])) notFound();
$dir = $root . $id . '/';

if (preg_match('/\.html$/', $sub)) {
    // The page itself: add the season (server clock / test date) and, when previewing, a banner.
    $html = @file_get_contents($dir . $sub);
    if ($html === false) notFound();
    $info = [
        'id' => $st['id'], 'year' => $st['year'], 'label' => $st['label'], 'open' => $st['open'],
        'start' => $st['start']->format('Y-m-d'), 'end' => $st['end']->format('Y-m-d'),
        'preview' => $previewing, 'asof' => $asof,
    ];
    $inject = '<script>window.SEASON=' . json_encode($info, JSON_UNESCAPED_SLASHES | JSON_HEX_TAG) . ';</script>';
    $html = preg_replace('/<head>/i', "<head>\n" . $inject, $html, 1);
    if ($previewing) $html = preg_replace('#</body>#i', previewBanner(previewInfo($st, $asof, $base, $id . '/')) . "\n</body>", $html, 1);
    sendCommon($previewing);
    header('Content-Type: text/html; charset=utf-8');
    header('Cache-Control: ' . ($previewing ? 'no-store' : 'private, no-cache'));
    echo $html;
    exit;
}

$long = preg_match('/\.(mp3|woff2|wav|ogg|png|jpg|webp)$/i', $sub);
serveFile($dir, $sub, $long ? 'private, max-age=2592000' : 'private, max-age=300', $accel, $id . '/');


/* =================================================================== helpers */

function showLanding(array $cfg, string $id, array $states, DateTimeImmutable $now, DateTimeZone $tz, string $base, ?array $preview, bool $mainPage): void
{
    $h = $cfg['holidays'][$id];
    $st = $states[$id];
    // "Thank you for visiting …": the holiday whose last season ended most recently (on the main page,
    // any holiday; on a holiday's own page, that holiday). The landing shows it for 120 days.
    $ended = null;
    foreach ($mainPage ? $states : [$id => $st] as $sid => $s) {
        if (!$s['ready']) continue;                // never ran, so nothing to thank them for
        $last = Seasons::window($cfg['holidays'][$sid], $s['year'] - 1, $tz);
        if ($last[1] < $now && ($ended === null || $last[1] > $ended['end'])) $ended = ['label' => $cfg['holidays'][$sid]['name'] . ' ' . ($s['year'] - 1), 'end' => $last[1]];
    }
    $others = [];
    foreach ($states as $oid => $s) {
        if ($oid === $id) continue;
        $others[] = $s + ['url' => $base . $oid . '/'];
    }
    usort($others, fn($a, $b) => [!$a['open'], $a['start']] <=> [!$b['open'], $b['start']]);
    sendCommon(true);
    header('Content-Type: text/html; charset=utf-8');
    header('Cache-Control: no-store');
    echo renderLanding($cfg, $h, $st, $now, $ended, $others, $base, $preview);
    exit;
}

/**
 * status.json: the same choice the main page makes (open holiday, else the next to open), plus every
 * holiday's dates and theme. The church website's "Holidays" menu button reads this, so the button and
 * the gate can never disagree. changesAt is when the answer next changes; the website re-checks then.
 */
function sendStatus(array $cfg, array $states, DateTimeImmutable $now): void
{
    sendCommon(true);
    header('Content-Type: application/json; charset=utf-8');
    header('Cache-Control: public, max-age=300');
    header('Access-Control-Allow-Origin: *');
    echo json_encode(holidays_status($cfg, $states, $now), JSON_UNESCAPED_SLASHES | JSON_PRETTY_PRINT);   // status.php
    exit;
}

/** Dev server: GATE_DEV=1/0 decides; otherwise a dev host name (and, if local_only, a local visitor). */
function isDev(array $cfg): bool
{
    $env = $_SERVER['GATE_DEV'] ?? $_SERVER['REDIRECT_GATE_DEV'] ?? getenv('GATE_DEV');   // not srv(): "0" must count
    $env = $env === false ? '' : strtolower(trim((string) $env));
    if ($env !== '') return $env === '1' || strtolower($env) === 'on' || strtolower($env) === 'true';
    $d = $cfg['dev'] ?? null;
    if (!$d) return false;
    $host = strtolower((string) preg_replace('/:\d+$/', '', srv('HTTP_HOST')));
    $host = trim($host, '[]');
    $match = false;
    foreach ($d['hosts'] ?? [] as $pat) if (fnmatch(strtolower($pat), $host)) { $match = true; break; }
    if (!$match) return false;
    if (empty($d['local_only'])) return true;
    // Loopback or private address (127.x, ::1, 10.x, 172.16-31.x, 192.168.x, fc00::/7, link-local)
    $ip = (string) ($_SERVER['REMOTE_ADDR'] ?? '');
    return filter_var($ip, FILTER_VALIDATE_IP) !== false
        && filter_var($ip, FILTER_VALIDATE_IP, FILTER_FLAG_NO_PRIV_RANGE | FILTER_FLAG_NO_RES_RANGE) === false;
}

function srv(string $k): string
{
    // Apache adds REDIRECT_ to variables after the internal rewrite to this file.
    return (string) ($_SERVER[$k] ?? $_SERVER['REDIRECT_' . $k] ?? getenv($k) ?: '');
}

function safePath(string $p): bool
{
    if ($p === '' || strpbrk($p, "\0\\") !== false) return false;
    foreach (explode('/', $p) as $i => $seg) {
        if ($seg === '' && $p[-1] === '/') continue;
        if ($seg === '' || $seg[0] === '.') return false;   // no "..", hidden files or empty segments
    }
    return true;
}

function listed(string $rel, array $list): bool
{
    foreach ($list as $item) {
        if (substr($item, -1) === '/' ? strncmp($rel, $item, strlen($item)) === 0 : $rel === $item) return true;
    }
    return false;
}

function previewKey(array $cfg): string
{
    $k = srv('EXPERIENCE_PREVIEW_KEY');
    if ($k === '' && !empty($cfg['preview_key_file']) && is_readable($cfg['preview_key_file'])) {
        $f = $cfg['preview_key_file'];
        $k = substr($f, -4) === '.php' ? (string) (include $f) : (string) file_get_contents($f);
    }
    $k = trim($k);
    return strlen($k) >= 16 ? $k : '';            // too short to be safe = switched off
}

function sign(string $data, string $key): string { return hash_hmac('sha256', 'xp-preview|' . $data, $key); }

function validPass(string $v, string $key): bool
{
    if (!preg_match('/^(\d{9,11})\.([0-9a-f]{64})$/', $v, $m)) return false;
    return (int) $m[1] > time() && hash_equals(sign($m[1], $key), $m[2]);
}

function validDate(string $d): bool
{
    if (!preg_match('/^(\d{4})-(\d{2})-(\d{2})$/', $d, $m)) return false;
    return checkdate((int) $m[2], (int) $m[3], (int) $m[1]);
}

function isHttps(): bool
{
    return (srv('HTTPS') !== '' && strtolower(srv('HTTPS')) !== 'off')
        || strtolower(srv('HTTP_X_FORWARDED_PROTO')) === 'https';
}

function cookieOpts(int $expires, string $path, bool $secure): array
{
    return ['expires' => $expires, 'path' => $path, 'secure' => $secure, 'httponly' => true, 'samesite' => 'Lax'];
}

function clearCookie(string $name, string $path, bool $secure): void { setcookie($name, '', cookieOpts(1, $path, $secure)); }

function redirectTo(string $path, array $q): void
{
    header('Cache-Control: no-store');
    header('Location: ' . $path . ($q ? '?' . http_build_query($q) : ''), true, 302);
    exit;
}

function sendCommon(bool $noindex): void
{
    header('X-Content-Type-Options: nosniff');
    header('Referrer-Policy: strict-origin-when-cross-origin');
    header('Vary: Cookie');
    if ($noindex) header('X-Robots-Tag: noindex');
}

function notFound(): void
{
    http_response_code(404);
    header('Content-Type: text/plain; charset=utf-8');
    header('Cache-Control: no-store');
    echo "Not found\n";
    exit;
}

function mimeType(string $rel): string
{
    static $m = [
        'html' => 'text/html; charset=utf-8', 'css' => 'text/css; charset=utf-8',
        'js' => 'application/javascript; charset=utf-8', 'json' => 'application/json; charset=utf-8',
        'mp3' => 'audio/mpeg', 'wav' => 'audio/wav', 'ogg' => 'audio/ogg', 'woff2' => 'font/woff2',
        'svg' => 'image/svg+xml', 'png' => 'image/png', 'jpg' => 'image/jpeg', 'webp' => 'image/webp',
        'mp4' => 'video/mp4', 'webm' => 'video/webm', 'txt' => 'text/plain; charset=utf-8',
    ];
    return $m[strtolower(pathinfo($rel, PATHINFO_EXTENSION))] ?? 'application/octet-stream';
}

/** Hand the file back to nginx (accel) or stream it ourselves with Range support (Apache). */
function serveFile(string $dir, string $rel, string $cache, bool $accel, string $accelPrefix = ''): void
{
    $file = $dir . $rel;
    if (!is_file($file)) notFound();
    // Make sure it really is inside $dir. Compare with forward slashes: Windows realpath() uses backslashes.
    $real = realpath($file);
    $top  = realpath($dir);
    if ($real === false || $top === false) notFound();
    $real = str_replace('\\', '/', $real);
    $top  = rtrim(str_replace('\\', '/', $top), '/') . '/';
    if (strncmp($real, $top, strlen($top)) !== 0) notFound();

    sendCommon(false);
    header('Content-Type: ' . mimeType($rel));
    header('Cache-Control: ' . $cache);

    if ($accel) {
        header('X-Accel-Redirect: /_release/' . implode('/', array_map('rawurlencode', explode('/', $accelPrefix . $rel))));
        exit;
    }

    $size = filesize($real);
    $mtime = filemtime($real);
    $etag = '"' . dechex($mtime) . '-' . dechex($size) . '"';
    header('Last-Modified: ' . gmdate('D, d M Y H:i:s', $mtime) . ' GMT');
    header('ETag: ' . $etag);
    header('Accept-Ranges: bytes');
    if (trim((string) ($_SERVER['HTTP_IF_NONE_MATCH'] ?? '')) === $etag) { http_response_code(304); exit; }

    $start = 0; $end = $size - 1;
    $range = (string) ($_SERVER['HTTP_RANGE'] ?? '');
    if ($range !== '' && $size > 0) {
        if (!preg_match('/^bytes=(\d*)-(\d*)$/', $range, $m) || ($m[1] === '' && $m[2] === '')) {
            http_response_code(416); header("Content-Range: bytes */$size"); exit;
        }
        if ($m[1] === '') { $start = max(0, $size - (int) $m[2]); }
        else { $start = (int) $m[1]; if ($m[2] !== '') $end = min($end, (int) $m[2]); }
        if ($start > $end || $start >= $size) { http_response_code(416); header("Content-Range: bytes */$size"); exit; }
        http_response_code(206);
        header("Content-Range: bytes $start-$end/$size");
    }
    $len = $size > 0 ? $end - $start + 1 : 0;
    header('Content-Length: ' . $len);
    if (($_SERVER['REQUEST_METHOD'] ?? 'GET') === 'HEAD' || $len === 0) exit;

    // Shared hosts often buffer or gzip PHP output; that would break Content-Length / Range for audio.
    @ini_set('zlib.output_compression', 'Off');
    while (ob_get_level() > 0) ob_end_clean();
    $fh = fopen($real, 'rb');
    fseek($fh, $start);
    while ($len > 0 && !feof($fh) && !connection_aborted()) {
        $chunk = fread($fh, min(65536, $len));
        echo $chunk; flush();
        $len -= strlen($chunk);
    }
    fclose($fh);
    exit;
}
