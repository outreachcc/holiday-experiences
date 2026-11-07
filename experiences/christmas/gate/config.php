<?php
/* Gate settings for this experience. The season dates themselves are rules in season.php. */
return [
    'season'   => 'christmas',                 // christmas | thanksgiving
    'timezone' => 'America/New_York',

    // What the public may load while the season is open (paths relative to the site root).
    // Anything not listed here is never served, in or out of season.
    'publish'  => ['index.html', 'css/', 'js/', 'fonts/', 'vendor/', 'audio/'],
    // Served all year (the countdown page uses the fonts). Must not include anything that reveals the experience.
    'always'   => ['fonts/'],

    // Optional: link to the other experience from the countdown page while it is open.
    'sibling'  => ['season' => 'thanksgiving', 'url' => 'https://thanksgiving.theoutreachcc.com/'],

    // Countdown page wording and colors
    'landing'  => [
        'church'    => 'Outreach Christian Church',
        'tagline'   => 'Walk the road to Bethlehem',
        'blurb'     => 'An interactive Christmas story in seven stations, open each year from the First Sunday of Advent through Epiphany.',
        'website'   => 'https://theoutreachcc.com',
        'websiteLabel' => 'TheOutreachCC.com',
        'services'  => 'Join us Sundays at 10:00 AM',
        'theme'     => ['bg' => '#070b22', 'bg2' => '#14183d', 'ink' => '#f4ead2', 'dim' => '#c9bfa6', 'accent' => '#f0c26a', 'motif' => 'stars'],
    ],

    // Preview switch for testing: visit /?preview=<key> once and this browser gets in for 30 days.
    // The key lives in gate/preview-key.php (a PHP file, so it can never be read over the web).
    // Delete that file, or make the key shorter than 16 characters, to turn the switch off.
    'preview_key_file' => __DIR__ . '/preview-key.php',
    'preview_days'     => 30,
];
