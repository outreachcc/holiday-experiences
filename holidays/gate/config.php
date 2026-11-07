<?php
/*
 * Holidays gate settings.
 *
 * To add a holiday: copy its experience (index.html, css/, js/, fonts/, vendor/, audio/) into a new
 * folder next to gate/, e.g. holidays/easter/, and add an entry below whose key is that folder name.
 * Add 'placeholder' => true to list a holiday (countdown only) before its experience is built; a holiday
 * whose folder has no index.html is treated the same way, so it never sends visitors to an empty folder.
 * Date rules are explained at the top of seasons.php. Order does not matter: the main page always
 * counts down to whichever holiday opens next, and sends visitors straight in while one is open.
 *
 * The church website's "Holidays" menu button reads /holidays/status.json, so it follows these dates,
 * 'short' labels, 'icon's and theme colors (bg2 + accent) automatically. Nothing to change on the website.
 */
return [
    'timezone' => 'America/New_York',

    // Shared wording on every countdown page
    'church'       => 'Outreach Christian Church',
    'website'      => 'https://theoutreachcc.com',
    'websiteLabel' => 'TheOutreachCC.com',
    'services'     => 'Join us Sundays at 10:00 AM',

    // What an open experience may serve (paths inside its folder). Anything else is never served.
    // A holiday can override this with its own 'publish' list.
    'publish' => ['index.html', 'css/', 'js/', 'fonts/', 'vendor/', 'audio/'],
    // Served all year from the holidays folder itself (the countdown page uses the fonts).
    'always'  => ['fonts/'],

    'holidays' => [
        'thanksgiving' => [
            'name'    => 'The Thanksgiving Experience',
            'short'   => 'Thanksgiving',     // label on the website's Holidays menu button (keep it short)
            'icon'    => 'leaf',             // that button's icon: a Font Awesome 6 Free solid icon name, without "fa-"
            'opens'   => '11-01',
            'closes'  => 'advent -1',             // the Saturday before the First Sunday of Advent
            'tagline' => 'Enter His gates with thanksgiving',
            'blurb'   => 'An animated walk through six Bible stories of giving thanks, open each year from November 1 until the First Sunday of Advent.',
            'theme'   => ['bg' => '#1c0f10', 'bg2' => '#3a1c14', 'ink' => '#f8ecd6', 'dim' => '#d4c0a2', 'accent' => '#f0b85a', 'motif' => 'leaves'],
        ],
        'christmas' => [
            'name'    => 'The Christmas Experience',
            'short'   => 'Christmas',        // label on the website's Holidays menu button (keep it short)
            'icon'    => 'star',             // that button's icon: a Font Awesome 6 Free solid icon name, without "fa-"
            'opens'   => 'advent',                // First Sunday of Advent
            'closes'  => '01-06',                 // Epiphany (next year)
            'tagline' => 'Walk the road to Bethlehem',
            'blurb'   => 'An interactive Christmas story in seven stations, open each year from the First Sunday of Advent through Epiphany.',
            'theme'   => ['bg' => '#070b22', 'bg2' => '#14183d', 'ink' => '#f4ead2', 'dim' => '#c9bfa6', 'accent' => '#f0c26a', 'motif' => 'stars'],
        ],
        'easter' => [
            // Placeholder: holidays/easter/ doesn't exist yet, so Easter only ever shows its countdown.
            // When the experience is built, copy it into holidays/easter/ and delete the 'placeholder' line.
            'placeholder' => true,
            'name'    => 'The Easter Experience',
            'short'   => 'Easter',           // label on the website's Holidays menu button (keep it short)
            'icon'    => 'cross',            // that button's icon: a Font Awesome 6 Free solid icon name, without "fa-"
            'opens'   => 'easter -7',             // Palm Sunday
            'closes'  => 'easter +7',             // the Sunday after Easter
            'tagline' => 'He is not here; He is risen',
            'blurb'   => 'Walk through Holy Week, from the palm branches of Jerusalem to the empty tomb. Open each year from Palm Sunday through the Sunday after Easter.',
            'theme'   => ['bg' => '#0e1a12', 'bg2' => '#1e3a24', 'ink' => '#f4f0e0', 'dim' => '#c4c8b0', 'accent' => '#f0d070', 'motif' => 'none'],
        ],
    ],

    // Dev server: every holiday is open to you, no preview key needed (with a DEV pill at the top).
    // It counts as a dev server when the site is reached by one of these host names AND (if local_only)
    // the visitor is on this machine or the local network, so a faked Host header can't open the live site.
    // Force it either way with an environment variable: SetEnv GATE_DEV 1 (on) or 0 (off) in the vhost.
    'dev' => [
        'hosts'      => ['localhost', '127.0.0.1', '*.local'],
        'local_only' => true,
    ],

    // Preview switch for testing: visit /holidays/?preview=<key> once and this browser gets in for 30 days,
    // to every holiday. The key lives in gate/preview-key.php (a PHP file, so it can never be read over the web).
    // Delete that file, or make the key shorter than 16 characters, to turn the switch off.
    'preview_key_file' => __DIR__ . '/preview-key.php',
    'preview_days'     => 30,
];
