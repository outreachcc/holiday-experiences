<?php
/*
 * Which holiday is open right now (or opens next), worked out from config.php and seasons.php.
 *
 * Used in two places, so they can never disagree:
 *   - gate.php, for /holidays/status.json
 *   - the church website's Holidays button (assets/inc/holiday-schedule.php), which includes this file
 *     directly whenever the holidays folder is on the same server: no web request, no server settings.
 */
declare(strict_types=1);

require_once __DIR__ . '/seasons.php';

/** Each holiday's dates and whether it is open at $now. $root = the holidays folder, ending in "/". */
function holidays_states(array $cfg, string $root, DateTimeImmutable $now, DateTimeZone $tz): array
{
    $states = [];
    foreach ($cfg['holidays'] as $id => $h) {
        $id = (string) $id;
        $st = Seasons::status($id, $h, $now, $tz);
        // Not built yet ('placeholder', or no index.html in its folder): it never opens. During what would
        // be its season, count down to next year's instead.
        $ready = empty($h['placeholder']) && is_file($root . $id . '/index.html');
        if (!$ready && $st['open']) $st = Seasons::status($id, $h, $st['end']->modify('+1 day'), $tz);
        $states[$id] = $st + ['ready' => $ready];
    }
    return $states;
}

/**
 * The open holiday (else the next to open) as 'current', every holiday's dates and theme, and changesAt:
 * when the answer next changes (the open one closes, or any holiday opens).
 */
function holidays_status(array $cfg, array $states, DateTimeImmutable $now): array
{
    $list = [];
    foreach ($states as $id => $s) {
        $h = $cfg['holidays'][$id];
        $list[$id] = [
            'id' => $id, 'name' => $h['name'], 'short' => $h['short'] ?? $h['name'], 'icon' => $h['icon'] ?? 'star',
            'tagline' => $h['tagline'] ?? '', 'open' => $s['open'], 'ready' => $s['ready'],
            'start' => $s['start']->format('Y-m-d'), 'end' => $s['end']->format('Y-m-d'),
            'opensAt' => $s['opensAt']->format(DATE_ATOM), 'closesAt' => $s['closesAt']->format(DATE_ATOM),
            'theme' => $h['theme'] ?? new stdClass(),
        ];
    }
    $open = array_filter($states, fn($s) => $s['open']);
    if ($open) {
        uasort($open, fn($a, $b) => $b['start'] <=> $a['start']);
        $cur = array_key_first($open);
    } else {
        $up = $states;
        uasort($up, fn($a, $b) => $a['start'] <=> $b['start']);
        $cur = array_key_first($up);
    }
    $changes = $states[$cur]['open'] ? $states[$cur]['closesAt'] : null;
    foreach ($states as $s) if (!$s['open'] && ($changes === null || $s['opensAt'] < $changes)) $changes = $s['opensAt'];

    return [
        'now' => $now->format(DATE_ATOM),
        'changesAt' => $changes ? $changes->format(DATE_ATOM) : null,
        'current' => $list[$cur],
        'holidays' => array_values($list),
    ];
}
