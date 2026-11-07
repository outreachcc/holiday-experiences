<?php
/*
 * Season rules for the Outreach Christian Church holiday experiences.
 * Identical copy in both projects; js/season.js mirrors these rules for the browser.
 *
 *   Thanksgiving Experience  November 1  ->  the Saturday before the First Sunday of Advent
 *                            (always includes Thanksgiving weekend; ends the day before Christmas opens)
 *   Christmas Experience     First Sunday of Advent (the Sunday from Nov 27 to Dec 3)  ->  January 6 (Epiphany)
 *
 * Dates are whole local days: a season opens at 00:00 on its first day and closes at 00:00
 * the day after its last day, in the configured time zone.
 */

final class Season
{
    public const NAMES = [
        'thanksgiving' => 'The Thanksgiving Experience',
        'christmas'    => 'The Christmas Experience',
    ];

    /** First Sunday of Advent: the Sunday on or after November 27. */
    public static function adventSunday(int $year, DateTimeZone $tz): DateTimeImmutable
    {
        $d = new DateTimeImmutable(sprintf('%04d-11-27', $year), $tz);
        $dow = (int) $d->format('w');                    // 0 = Sunday
        return $dow === 0 ? $d : $d->modify('+' . (7 - $dow) . ' days');
    }

    /** Fourth Thursday of November (US Thanksgiving Day). */
    public static function thanksgivingDay(int $year, DateTimeZone $tz): DateTimeImmutable
    {
        $d = new DateTimeImmutable(sprintf('%04d-11-01', $year), $tz);
        $dow = (int) $d->format('w');
        $first = $d->modify('+' . ((4 - $dow + 7) % 7) . ' days');
        return $first->modify('+21 days');
    }

    /** [first day, last day] of a season, both at 00:00 local. */
    public static function window(string $id, int $year, DateTimeZone $tz): array
    {
        switch ($id) {
            case 'thanksgiving':
                return [
                    new DateTimeImmutable(sprintf('%04d-11-01', $year), $tz),
                    self::adventSunday($year, $tz)->modify('-1 day'),
                ];
            case 'christmas':
                return [
                    self::adventSunday($year, $tz),
                    new DateTimeImmutable(sprintf('%04d-01-06', $year + 1), $tz),
                ];
        }
        throw new InvalidArgumentException("Unknown season: $id");
    }

    /**
     * The season that is running on $now, or else the next one to open.
     * Returns: id, name, year, label ("The Christmas Experience 2026"), open (bool),
     *          start / end (first and last day), opensAt / closesAt (exact instants).
     */
    public static function status(string $id, DateTimeImmutable $now, DateTimeZone $tz): array
    {
        $now = $now->setTimezone($tz);
        $today = new DateTimeImmutable($now->format('Y-m-d'), $tz);
        $y = (int) $today->format('Y');

        // A Christmas season that started last year may still be running in early January.
        foreach ([$y - 1, $y, $y + 1] as $year) {
            [$start, $end] = self::window($id, $year, $tz);
            if ($today <= $end) {
                $closesAt = $end->modify('+1 day');
                return [
                    'id'       => $id,
                    'name'     => self::NAMES[$id],
                    'year'     => $year,
                    'label'    => self::NAMES[$id] . ' ' . $year,
                    'open'     => $today >= $start,
                    'start'    => $start,
                    'end'      => $end,
                    'opensAt'  => $start,
                    'closesAt' => $closesAt,
                ];
            }
        }
        throw new LogicException('unreachable');
    }
}
