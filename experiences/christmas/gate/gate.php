<?php
/*
 * Season gate — every request to the online version comes through here.
 *
 *  In season       -> the experience is served normally.
 *  Out of season   -> the countdown page; every other file of the experience answers 404, so nothing
 *                     can be reached by typing a script, audio or stylesheet URL directly.
 *  Preview switch  -> /?preview=<key> gives this browser a signed 30-day pass (HttpOnly cookie).
 *                     While previewing:  ?asof=2026-12-24  pretend it is that date (?asof=off to stop)
 *                                        ?landing          see the countdown page as the public would
 *                                        ?preview=off      end the preview in this browser
 *
 * The decision is made on the server's clock, never the visitor's. Runs under nginx + PHP-FPM
 * Apache / shared hosting: .htaccess sends every request here and PHP streams the files.
 * (Also runs under nginx + PHP-FPM, handing files back to nginx with X-Accel-Redirect.)
 */
declare(strict_types=1);

require __DIR__ . '/season.php';
require __DIR__ . '/landing.php';

$cfg  = require __DIR__ . '/config.php';
$tz   = new DateTimeZone($cfg['timezone']);
$root = rtrim((string) (srv('GATE_ROOT') ?: dirname(__DIR__)), '/') . '/';
$accel = srv('GATE_MODE') === 'accel';
header_remove('X-Powered-By');

/* ---------- which file was asked for ---------- */
$base = srv('GATE_BASE');
if ($base === '') {                               // Apache: site root = the folder above gate/
    $base = rtrim(str_replace('\\', '/', dirname((string) srv('SCRIPT_NAME'), 2)), '/') . '/';
}
$uriPath = rawurldecode((string) parse_url((string) srv('REQUEST_URI'), PHP_URL_PATH));
if (strncmp($uriPath, $base, strlen($base)) !== 0) notFound();
$rel = substr($uriPath, strlen($base));
if ($rel === '' || $rel === 'index.php') $rel = 'index.html';
if (!safePath($rel)) notFound();

if (strncmp($rel, 'api/', 4) === 0) { http_response_code(204); exit; }   // Pi-only API: answer quietly online

/* ---------- preview switch ---------- */
$key    = previewKey($cfg);
$secure = isHttps();
$q      = $_GET;

if (isset($q['preview'])) {
    $given = (string) $q['preview'];
    unset($q['preview']);
    if ($given === 'off') {
        clearCookie('xp_preview', $secure);
        clearCookie('xp_asof', $secure);
        redirectTo($base . ($rel === 'index.html' ? '' : $rel), $q);
    }
    if ($key !== '' && hash_equals($key, $given)) {
        $exp = time() + 86400 * (int) $cfg['preview_days'];
        setcookie('xp_preview', $exp . '.' . sign((string) $exp, $key), cookieOpts($exp, $secure));
        redirectTo($base . ($rel === 'index.html' ? '' : $rel), $q);
    }
    usleep(750000);                               // wrong key: no hint, and slow down guessing
}

$previewing = $key !== '' && validPass((string) ($_COOKIE['xp_preview'] ?? ''), $key);

if ($previewing && isset($q['asof'])) {
    $asof = (string) $q['asof'];
    unset($q['asof']);
    if (validDate($asof)) setcookie('xp_asof', $asof, cookieOpts(0, $secure));
    else clearCookie('xp_asof', $secure);
    redirectTo($base . ($rel === 'index.html' ? '' : $rel), $q);
}

$asof = $previewing && validDate((string) ($_COOKIE['xp_asof'] ?? '')) ? $_COOKIE['xp_asof'] : null;
$now  = $asof ? new DateTimeImmutable($asof . ' 12:00', $tz) : new DateTimeImmutable('now', $tz);
$st   = Season::status($cfg['season'], $now, $tz);

/* ---------- decide ---------- */
if (listed($rel, $cfg['always'])) serveFile($root, $rel, 'public, max-age=2592000', $accel);

$isPage = $rel === 'index.html';
$showLanding = !($st['open'] || $previewing) || ($previewing && isset($q['landing']));

if ($showLanding) {
    if (!$isPage) notFound();                     // scripts, audio, styles: nothing out of season
    sendCommon(true);
    header('Content-Type: text/html; charset=utf-8');
    header('Cache-Control: no-store');
    $sib = null;
    if (!empty($cfg['sibling']['season'])) {
        $s = Season::status($cfg['sibling']['season'], $now, $tz);
        if ($s['open']) $sib = $s + ['url' => $cfg['sibling']['url']];
    }
    $prev = Season::window($cfg['season'], $st['year'] - 1, $tz);
    echo renderLanding($cfg, $st, $now, $prev, $sib, $previewing ? previewInfo($st, $asof, $base) : null);
    exit;
}

if (!listed($rel, $cfg['publish'])) notFound();

if (preg_match('/\.html$/', $rel)) {
    // The page itself: add the season (server clock / test date) and, when previewing, a banner.
    $html = @file_get_contents($root . $rel);
    if ($html === false) notFound();
    $info = [
        'id' => $st['id'], 'year' => $st['year'], 'label' => $st['label'], 'open' => $st['open'],
        'start' => $st['start']->format('Y-m-d'), 'end' => $st['end']->format('Y-m-d'),
        'preview' => $previewing, 'asof' => $asof,
    ];
    $inject = '<script>window.SEASON=' . json_encode($info, JSON_UNESCAPED_SLASHES | JSON_HEX_TAG) . ';</script>';
    $html = preg_replace('/<head>/i', "<head>\n" . $inject, $html, 1);
    if ($previewing) $html = preg_replace('#</body>#i', previewBanner(previewInfo($st, $asof, $base)) . "\n</body>", $html, 1);
    sendCommon($previewing);
    header('Content-Type: text/html; charset=utf-8');
    header('Cache-Control: ' . ($previewing ? 'no-store' : 'private, no-cache'));
    echo $html;
    exit;
}

$long = preg_match('/\.(mp3|woff2|wav|ogg|png|jpg|webp)$/i', $rel);
serveFile($root, $rel, $long ? 'private, max-age=2592000' : 'private, max-age=300', $accel);


/* =================================================================== helpers */

function srv(string $k): string
{
    // Apache adds REDIRECT_ to variables after the internal rewrite to this file.
    return (string) ($_SERVER[$k] ?? $_SERVER['REDIRECT_' . $k] ?? getenv($k) ?: '');
}

function safePath(string $p): bool
{
    if ($p === '' || strpbrk($p, "\0\\") !== false) return false;
    foreach (explode('/', $p) as $seg) {
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

function cookieOpts(int $expires, bool $secure): array
{
    return ['expires' => $expires, 'path' => '/', 'secure' => $secure, 'httponly' => true, 'samesite' => 'Lax'];
}

function clearCookie(string $name, bool $secure): void { setcookie($name, '', cookieOpts(1, $secure)); }

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
function serveFile(string $root, string $rel, string $cache, bool $accel): void
{
    $file = $root . $rel;
    if (!is_file($file)) notFound();
    // Compare with forward slashes: on Windows realpath() returns backslashes, which made every file 404.
    $real = realpath($file);
    $top  = realpath($root);
    if ($real === false || $top === false) notFound();
    $real = str_replace('\\', '/', $real);
    $top  = rtrim(str_replace('\\', '/', $top), '/') . '/';
    if (strncmp($real, $top, strlen($top)) !== 0) notFound();

    sendCommon(false);
    header('Content-Type: ' . mimeType($rel));
    header('Cache-Control: ' . $cache);

    if ($accel) {
        header('X-Accel-Redirect: /_release/' . implode('/', array_map('rawurlencode', explode('/', $rel))));
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
