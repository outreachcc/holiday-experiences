<?php
/*
 * Holiday date rules. Each holiday in config.php has an 'opens' and a 'closes' rule; both days are
 * included (open from 00:00 on the first day until 00:00 the day after the last, local time).
 * If 'closes' falls before 'opens' in the same year, it means the next year (e.g. Christmas -> Jan 6).
 *
 * A rule is an anchor, optionally followed by an offset in days:
 *
 *   11-01              a fixed month-day (November 1)
 *   advent             First Sunday of Advent (the Sunday from Nov 27 to Dec 3)
 *   easter             Easter Sunday (Western)
 *   thanksgiving       US Thanksgiving Day (4th Thursday of November)
 *   nth 2 sun 5        2nd Sunday of May (1-5, or "last"; sun mon tue wed thu fri sat; month 1-12)
 *   nth last mon 5     last Monday of May
 *
 *   advent -1          the Saturday before Advent        easter -7   Palm Sunday
 *   easter +49         Pentecost                         12-25 +11   Jan 5 of the next year
 */
declare(strict_types=1);

final class Seasons
{
    private const DOW = ['sun' => 0, 'mon' => 1, 'tue' => 2, 'wed' => 3, 'thu' => 4, 'fri' => 5, 'sat' => 6];

    /** The date a rule gives in a year, at 00:00 local. */
    public static function date(string $rule, int $year, DateTimeZone $tz): DateTimeImmutable
    {
        $parts = preg_split('/\s+/', strtolower(trim($rule)));
        $off = 0;
        if (count($parts) > 1 && preg_match('/^[+-]\d+$/', end($parts))) $off = (int) array_pop($parts);
        $a = implode(' ', $parts);

        if (preg_match('/^(\d{1,2})-(\d{1,2})$/', $a, $m) && checkdate((int) $m[1], (int) $m[2], $year)) {
            $d = self::ymd($year, (int) $m[1], (int) $m[2], $tz);
        } elseif ($a === 'advent') {
            $d = self::adventSunday($year, $tz);
        } elseif ($a === 'easter') {
            $d = self::easter($year, $tz);
        } elseif ($a === 'thanksgiving') {
            $d = self::nth($year, 11, 4, 4, $tz);
        } elseif (preg_match('/^nth ([1-5]|last) (sun|mon|tue|wed|thu|fri|sat) (\d{1,2})$/', $a, $m) && (int) $m[3] >= 1 && (int) $m[3] <= 12) {
            $d = self::nth($year, (int) $m[3], self::DOW[$m[2]], $m[1] === 'last' ? -1 : (int) $m[1], $tz);
        } else {
            throw new InvalidArgumentException("Unknown date rule: $rule");
        }
        return $off ? $d->modify(sprintf('%+d days', $off)) : $d;
    }

    /** [first day, last day] of a holiday's season that opens in $year. */
    public static function window(array $h, int $year, DateTimeZone $tz): array
    {
        $start = self::date($h['opens'], $year, $tz);
        $end = self::date($h['closes'], $year, $tz);
        if ($end < $start) $end = self::date($h['closes'], $year + 1, $tz);
        return [$start, $end];
    }

    /**
     * The season of this holiday running on $now, or else its next one.
     * Returns: id, name, year, label ("The Christmas Experience 2026"), open (bool),
     *          start / end (first and last day), opensAt / closesAt (exact instants).
     */
    public static function status(string $id, array $h, DateTimeImmutable $now, DateTimeZone $tz): array
    {
        $today = new DateTimeImmutable($now->setTimezone($tz)->format('Y-m-d'), $tz);
        $y = (int) $today->format('Y');
        foreach ([$y - 1, $y, $y + 1] as $year) {   // a season that began last year may still be running
            [$start, $end] = self::window($h, $year, $tz);
            if ($today <= $end) {
                return [
                    'id' => $id, 'name' => $h['name'], 'year' => $year, 'label' => $h['name'] . ' ' . $year,
                    'open' => $today >= $start, 'start' => $start, 'end' => $end,
                    'opensAt' => $start, 'closesAt' => $end->modify('+1 day'),
                ];
            }
        }
        throw new LogicException("Season for $id never ends");
    }

    public static function adventSunday(int $year, DateTimeZone $tz): DateTimeImmutable
    {
        $d = self::ymd($year, 11, 27, $tz);
        $dow = (int) $d->format('w');
        return $dow === 0 ? $d : $d->modify('+' . (7 - $dow) . ' days');
    }

    /** Western Easter Sunday (anonymous Gregorian algorithm; no calendar extension needed). */
    public static function easter(int $y, DateTimeZone $tz): DateTimeImmutable
    {
        $a = $y % 19; $b = intdiv($y, 100); $c = $y % 100;
        $d = intdiv($b, 4); $e = $b % 4; $f = intdiv($b + 8, 25); $g = intdiv($b - $f + 1, 3);
        $h = (19 * $a + $b - $d - $g + 15) % 30;
        $i = intdiv($c, 4); $k = $c % 4;
        $l = (32 + 2 * $e + 2 * $i - $h - $k) % 7;
        $m = intdiv($a + 11 * $h + 22 * $l, 451);
        $n = $h + $l - 7 * $m + 114;
        return self::ymd($y, intdiv($n, 31), $n % 31 + 1, $tz);
    }

    /** The $n-th $dow (0 = Sunday) of a month; $n = -1 for the last one. */
    public static function nth(int $year, int $month, int $dow, int $n, DateTimeZone $tz): DateTimeImmutable
    {
        if ($n < 0) {
            $d = self::ymd($year, $month, 1, $tz)->modify('last day of this month');
            return $d->modify('-' . (((int) $d->format('w') - $dow + 7) % 7) . ' days');
        }
        $d = self::ymd($year, $month, 1, $tz);
        $d = $d->modify('+' . (($dow - (int) $d->format('w') + 7) % 7) . ' days');
        return $n > 1 ? $d->modify('+' . (7 * ($n - 1)) . ' days') : $d;
    }

    private static function ymd(int $y, int $m, int $d, DateTimeZone $tz): DateTimeImmutable
    {
        return new DateTimeImmutable(sprintf('%04d-%02d-%02d', $y, $m, $d), $tz);
    }
}
