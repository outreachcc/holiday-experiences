/* Thanksgiving Experience — the six painted stations.
   Each station is a little film: wide shots, close-ups of the people who speak, slow camera moves and
   something to tap. Built on js/film-core.js. Stage is 1600 x 900. */
(function () {
  const S = window.XScenes = window.XScenes || {};
  const K = window.FilmKit;
  const { rng, ridge, starfield, glint, ring, village, olive, palm, grass, wheat, folk, figure } = K;
  const f1 = n => n.toFixed(1);
  const BG = (fill, extra = "") => `<rect x="-400" y="-200" width="2400" height="1300" fill="${fill}" ${extra}/>`;
  const sfx = (api, n) => api.sfx(n);

  // Floating music notes (screen space)
  function notes(F, x, y, n = 5, col = "#ffe2a0") {
    for (let i = 0; i < n; i++) F.later(i * 260, () => F.fx(`<text class="rise" x="${x + (Math.random() - .5) * 80}" y="${y}" font-size="${34 + Math.random() * 18}" fill="${col}" style="--dx:${f1((Math.random() - .3) * 140)}px;font-family:serif" filter="url(#fGlow)">${Math.random() < .5 ? "♪" : "♫"}</text>`));
  }
  // A shower of sparkles (screen space)
  function sparkle(F, x, y, n = 8, spread = 60) {
    for (let i = 0; i < n; i++) F.later(i * 70, () => F.fx(`<g class="rise" style="--dx:${f1((Math.random() - .5) * 60)}px" transform="translate(${f1(x + (Math.random() - .5) * spread)},${f1(y + (Math.random() - .5) * spread * .6)})">${glint(2 + Math.random() * 3)}</g>`));
  }

  /* ================================================================== Thanksgiving holiday scenes (shared) */
  const HOLIDAY_DEFS = `
    <linearGradient id="gPlyH" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#4e74ae"/><stop offset=".55" stop-color="#d8b48a"/><stop offset=".8" stop-color="#f4cf92"/><stop offset="1" stop-color="#f8dca4"/></linearGradient>
    <linearGradient id="gPlyW" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#4a5468"/><stop offset=".6" stop-color="#9aa4b4"/><stop offset="1" stop-color="#d4d8e0"/></linearGradient>
    <linearGradient id="gCloth" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e8dcc4"/><stop offset="1" stop-color="#fff6e6"/></linearGradient>
    <linearGradient id="gRoom" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3a1a14"/><stop offset="1" stop-color="#5a2a1c"/></linearGradient>
    <linearGradient id="gPanel" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#2a160c"/><stop offset=".5" stop-color="#4a2a16"/><stop offset="1" stop-color="#2a160c"/></linearGradient>
    <linearGradient id="gDesk" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#6a3a1a"/><stop offset=".2" stop-color="#4a2810"/><stop offset="1" stop-color="#1a0c04"/></linearGradient>
    <linearGradient id="gTurkey" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#d88a3a"/><stop offset=".6" stop-color="#a8561e"/><stop offset="1" stop-color="#6a3010"/></linearGradient>
    <radialGradient id="gCandle"><stop offset="0" stop-color="#ffe2a0" stop-opacity=".9"/><stop offset=".4" stop-color="#ffaa50" stop-opacity=".35"/><stop offset="1" stop-color="#ff7a20" stop-opacity="0"/></radialGradient>`;

  function turkey(x, y, s) {
    return `<g transform="translate(${x},${y}) scale(${s})">
      <ellipse cy="26" rx="150" ry="34" fill="#d8d0c4"/><ellipse cy="22" rx="138" ry="28" fill="#f4eee4"/>
      ${[-110, -80, 80, 110].map((xx, k) => `<circle cx="${xx}" cy="${18 - (k % 2) * 6}" r="11" fill="#5a8a2a"/>`).join("")}
      <path d="M-96,10 C-100,-50 -40,-82 10,-80 C70,-78 104,-40 98,8 C60,26 -60,26 -96,10 Z" fill="url(#gTurkey)"/>
      <path d="M-60,-50 C-30,-70 30,-72 60,-50" stroke="#f0b060" stroke-width="7" fill="none" opacity=".55" stroke-linecap="round"/>
      <path d="M-90,-6 C-120,-14 -136,-34 -128,-46 C-120,-52 -108,-40 -92,-26 Z" fill="#a8561e"/><circle cx="-132" cy="-50" r="7" fill="#f4ead8"/><circle cx="-124" cy="-54" r="7" fill="#f4ead8"/>
      <path d="M90,-6 C120,-14 136,-34 128,-46 C120,-52 108,-40 92,-26 Z" fill="#9a4e1a"/><circle cx="132" cy="-50" r="7" fill="#f4ead8"/><circle cx="124" cy="-54" r="7" fill="#f4ead8"/>
    </g>`;
  }
  const pumpkin = (x, y, s, c = "#d8742a") => `<g transform="translate(${x},${y}) scale(${s})"><ellipse rx="40" ry="28" fill="${c}"/><ellipse cx="-20" rx="20" ry="27" fill="#000" opacity=".12"/><ellipse cx="20" rx="20" ry="27" fill="#fff" opacity=".08"/><path d="M0,-28 C2,-40 8,-44 14,-44" stroke="#4a3a1a" stroke-width="6" fill="none" stroke-linecap="round"/></g>`;
  const corn = (x, y, a) => `<g transform="translate(${x},${y}) rotate(${a})"><ellipse rx="34" ry="10" fill="#e8b830"/>${[-24, -12, 0, 12, 24].map(xx => `<path d="M${xx},-9 V9" stroke="#b88a18" stroke-width="1.5"/>`).join("")}<path d="M30,0 C44,-14 56,-10 62,-4 C52,-2 44,2 30,6 Z" fill="#c8b070"/></g>`;

  // Plymouth colony: autumn 1621 harvest feast, or the hard first winter of 1620-21 (the Mayflower still in the harbor)
  function plymouth(season) {
    const W = season === "winter";
    const r = rng(W ? 1620 : 1621);
    let cottages = "";
    for (let k = 0; k < 9; k++) {
      const x = 80 + k * 172 + (r() - .5) * 40, y = 600 - Math.sin(k / 8 * Math.PI) * 50, s = .9 + r() * .25;
      cottages += `<g transform="translate(${f1(x)},${f1(y)}) scale(${f1(s)})">
        <rect x="-50" y="-50" width="100" height="56" fill="${W ? "#6a5a4a" : "#8a6a4a"}"/>
        <path d="M-50,-50 L-50,6 M-16,-50 L-16,6 M18,-50 L18,6 M50,-50 L50,6 M-50,-24 L50,-24" stroke="#4a3626" stroke-width="3"/>
        <path d="M-62,-46 L0,-108 L62,-46 Z" fill="${W ? "#8a7a5a" : "#b8954a"}"/>
        ${W ? `<path d="M-62,-46 L0,-108 L62,-46 L52,-52 L0,-96 L-52,-52 Z" fill="#f2f4f8"/>` : `<path d="M-50,-58 L50,-58 M-40,-68 L40,-68 M-28,-80 L28,-80" stroke="#8a6a2a" stroke-width="2" opacity=".6"/>`}
        <rect x="26" y="-104" width="14" height="40" fill="#5a4a3a"/>
        ${W ? `<g class="smoke"><circle cx="33" cy="-118" r="9" fill="#d8dce4" opacity=".6"/><circle cx="40" cy="-136" r="12" fill="#d8dce4" opacity=".4"/><circle cx="48" cy="-158" r="15" fill="#d8dce4" opacity=".25"/></g>` : ""}
        <rect x="-36" y="-40" width="16" height="14" fill="${W ? "#ffc060" : "#3a2a1a"}" opacity="${W ? .85 : 1}"/><rect x="-6" y="-24" width="20" height="30" fill="#3a2414"/>
      </g>`;
    }
    let stakes = "";
    for (let x = -300; x < 1900; x += 16) if (x < 640 || x > 980) stakes += `<path d="M${x},700 L${x},654 L${x + 6},646 L${x + 12},654 L${x + 12},700 Z" fill="${W ? "#4a3a2a" : "#6a4a2a"}"/>`;
    const ship = `<g transform="translate(1260,492) scale(.9)">
      <path d="M-110,0 C-100,30 90,32 120,0 L130,-22 L80,-14 L-60,-14 L-118,-30 Z" fill="#3a2a1e"/><path d="M-100,-6 L110,-6" stroke="#8a6a3a" stroke-width="3"/>
      ${[[-60, 110], [10, 140], [80, 100]].map(([x, h]) => `<path d="M${x},-14 L${x},${-14 - h}" stroke="#2a1e14" stroke-width="5"/><path d="M${x - 34},${-14 - h * .75} L${x + 34},${-14 - h * .75} M${x - 26},${-14 - h * .45} L${x + 26},${-14 - h * .45}" stroke="#2a1e14" stroke-width="4"/><rect x="${x - 30}" y="${-18 - h * .75}" width="60" height="8" rx="4" fill="#d8d4c8"/><rect x="${x - 22}" y="${-18 - h * .45}" width="44" height="8" rx="4" fill="#d8d4c8"/>`).join("")}
      <path d="M10,-154 L10,-176 L34,-170 L10,-164" fill="#9a2a2a"/>
    </g>`;
    let feast = "";
    if (!W) {
      const people = [];
      for (let k = 0; k < 11; k++) {
        const x = 330 + k * 92, guest = k % 3 === 1;
        people.push(guest
          ? folk(x, 742, 1.3, { sit: true, robe: "#a8784a", mantle: "#7a4a2a", hair: "#1e140c", skin: "#a86e48", flip: k > 5, shadow: false })
          : folk(x, 742, 1.3, { sit: true, robe: ["#3a3430", "#5a4a3a", "#6a2a22", "#4a5a4a"][k % 4], mantle: "#2a2420", head: "#e8e0d0", hat: k % 2 ? "#1e1a18" : null, collar: "#f4f0e8", skin: "#d8a47c", flip: k > 5, shadow: false }));
      }
      feast = `${people.join("")}
        <path d="M250,742 L1370,742 L1400,800 L220,800 Z" fill="url(#gCloth)"/><path d="M220,800 L1400,800 L1400,812 L220,812 Z" fill="#c8bca4"/>
        ${turkey(560, 728, .5)}${turkey(1080, 728, .45)}${pumpkin(380, 740, .7)}${pumpkin(1270, 740, .65, "#e2862e")}${pumpkin(820, 738, .5, "#c8641e")}
        ${corn(700, 742, -8)}${corn(940, 744, 10)}${corn(460, 748, 6)}
        ${[650, 760, 900, 1000, 1180].map(x => `<ellipse cx="${x}" cy="752" rx="26" ry="8" fill="#8a5a2a"/><ellipse cx="${x}" cy="748" rx="20" ry="5" fill="#c8964a"/>`).join("")}
        <path d="M270,812 L262,880 M1350,812 L1358,880" stroke="#4a3018" stroke-width="10"/>
        ${folk(200, 820, 1.4, { robe: "#4a3a30", mantle: "#2a2420", head: "#e8e0d0", hat: "#1e1a18", collar: "#f4f0e8", skin: "#d8a47c", arms: "out" })}
        ${folk(1440, 820, 1.4, { robe: "#a8784a", mantle: "#6a4020", hair: "#1e140c", skin: "#a86e48", flip: true })}
        ${folk(1500, 830, .9, { robe: "#7a5a3a", mantle: "#4a3020", head: "#e8e0d0", collar: "#f4f0e8", skin: "#d8a47c", flip: true })}`;
    }
    let flakes = "";
    if (W) for (let i = 0; i < 90; i++) flakes += `<circle class="snowF" cx="${f1(-300 + r() * 2200)}" cy="-20" r="${f1(1.5 + r() * 3)}" fill="#fff" opacity="${(.5 + r() * .5).toFixed(2)}" style="animation-duration:${f1(8 + r() * 8)}s;animation-delay:${f1(-r() * 16)}s"/>`;
    const trees = W
      ? [[60, 690, 1.1], [1520, 700, 1.2], [880, 560, .6]].map(([x, y, sc]) => `<g transform="translate(${x},${y}) scale(${sc})" stroke="#2a2420" fill="none" stroke-linecap="round"><path d="M0,0 L0,-160 M0,-80 L-50,-140 M0,-110 L46,-170 M-30,-118 L-60,-150 M24,-140 L40,-190 M0,-160 L-14,-210" stroke-width="9"/></g>`).join("")
      : [olive(60, 700, 1.1, "#a8421c", 5, "#e8862e"), olive(1530, 710, 1.2, "#b8521e", 7, "#f0a030"), olive(900, 560, .6, "#9a3a18", 9, "#d87a2a")].join("");
    return `
      ${BG(W ? "url(#gPlyW)" : "url(#gPlyH)")}
      ${W ? "" : `<ellipse cx="1300" cy="420" rx="600" ry="240" fill="url(#gSunF)" opacity=".6"/>`}
      <g class="drift"><ellipse cx="600" cy="200" rx="560" ry="46" fill="#fff" filter="url(#fCloud)" opacity="${W ? .6 : .45}"/></g>
      <path d="${ridge(470, 16, 11)}" fill="${W ? "#7a8494" : "#8a8a9e"}"/>
      <rect x="-400" y="478" width="2400" height="60" fill="${W ? "#6a7686" : "#5a88a8"}"/>
      ${W ? ship : ""}
      <path d="M-400,560 C200,520 1000,520 2000,560 L2000,1100 L-400,1100 Z" fill="${W ? "#e8eef4" : "#8a8a3a"}"/>
      ${trees}${cottages}${stakes}
      <path d="M-400,700 L2000,700 L2000,1100 L-400,1100 Z" fill="${W ? "#f2f6fa" : "#7a7a30"}"/>
      ${W ? `${folk(520, 790, 1.4, { robe: "#2a2420", mantle: "#1a1614", head: "#e8e0d0", hat: "#1a1614", collar: "#e8e4dc", skin: "#c8987a" })}${folk(600, 800, 1.1, { robe: "#3a2a24", mantle: "#2a1e18", head: "#d8d0c4", collar: "#e8e4dc", skin: "#c8987a" })}${folk(1100, 770, 1.2, { robe: "#2a2a2a", mantle: "#1a1a1a", head: "#e8e0d0", hat: "#1a1614", skin: "#c8987a", flip: true, arms: "pray" })}<path d="M-400,860 C300,840 1100,870 2000,850" stroke="#c8d4e0" stroke-width="40" fill="none" opacity=".5"/>` : grass(700, 13, "#5a5a20", 140, 26)}
      ${feast}
      <g>${flakes}</g>`;
  }

  // The President's proclamation of 1863, on a desk by candlelight
  function proclamation() {
    let stripes = ""; for (let i = 0; i < 13; i++) stripes += `<path d="M-60,${i * 26} C80,${i * 26 - 20} 200,${i * 26 + 24} 340,${i * 26}" stroke="${i % 2 ? "#f2eee4" : "#a8242a"}" stroke-width="26" fill="none"/>`;
    let stars = ""; const r = rng(34); for (let i = 0; i < 34; i++) stars += `<circle cx="${f1(-40 + (i % 7) * 22 + (Math.floor(i / 7) % 2) * 11)}" cy="${f1(6 + Math.floor(i / 7) * 26)}" r="3.4" fill="#fff"/>`;
    return `
      ${BG("url(#gPanel)")}
      <g opacity=".5" stroke="#1a0c06" stroke-width="6" fill="none">${[0, 1, 2, 3, 4].map(k => `<rect x="${-200 + k * 420}" y="60" width="360" height="460" rx="6"/>`).join("")}</g>
      <g transform="translate(170,90) rotate(4)">${stripes}<path d="M-60,-14 L150,-14 L150,170 L-60,170 Z" fill="#1e2a5a"/>${stars}<path d="M-64,-20 L-64,400" stroke="#8a6a2a" stroke-width="10"/><circle cx="-64" cy="-26" r="12" fill="#c8a040"/></g>
      <ellipse class="lampglow" cx="1240" cy="560" rx="720" ry="520" fill="url(#gCandle)" opacity=".85"/>
      <path d="M-400,620 L2000,620 L2000,1100 L-400,1100 Z" fill="url(#gDesk)"/>
      <path d="M-400,620 L2000,620" stroke="#9a5a2a" stroke-width="3" opacity=".6"/>
      <g transform="translate(470,560) rotate(-3)">
        <rect x="6" y="10" width="560" height="340" fill="#000" opacity=".35" filter="url(#fBlur6)"/>
        <rect width="560" height="340" fill="url(#gParch)"/>
        <g fill="#2a1a0e" font-family="Cormorant, Georgia, serif" text-anchor="middle">
          <text x="280" y="38" font-size="17" letter-spacing="2">BY THE PRESIDENT OF THE UNITED STATES OF AMERICA</text>
          <text x="280" y="86" font-size="40" font-weight="700" font-style="italic">A Proclamation</text>
          <g font-size="17" font-style="italic"><text x="280" y="134">“…to set apart and observe the last Thursday</text><text x="280" y="160">of November next, as a day of Thanksgiving</text><text x="280" y="186">and Praise to our beneficent Father</text><text x="280" y="212">who dwelleth in the Heavens.”</text></g>
          <g stroke="#6a4a2a" stroke-width="1.6" opacity=".45">${[240, 256, 272].map(y => `<path d="M60,${y} L500,${y}"/>`).join("")}</g>
          <text x="400" y="312" font-size="30" font-style="italic" font-weight="600">Abraham Lincoln</text>
          <text x="120" y="312" font-size="16">October 3, 1863</text>
        </g>
      </g>
      <g transform="translate(1180,700)"><ellipse cx="0" cy="24" rx="60" ry="14" fill="#000" opacity=".35"/><ellipse cy="10" rx="44" ry="11" fill="#c8a040"/><rect x="-14" y="-110" width="28" height="118" fill="#f2e8d4"/><path class="flickF" d="M0,-112 C12,-132 8,-150 0,-164 C-8,-150 -12,-132 0,-112 Z" fill="#ffcf5a"/><path d="M0,-116 C5,-126 4,-136 0,-144 C-4,-136 -5,-126 0,-116 Z" fill="#fff4d0"/></g>
      <g transform="translate(1110,730)"><ellipse rx="34" ry="10" fill="#1a1414"/><path d="M-26,0 L-26,-40 C-26,-48 26,-48 26,-40 L26,0 Z" fill="#2a2424"/><path d="M8,-40 L-70,-150" stroke="#2a1a0e" stroke-width="3"/><path d="M-30,-96 C-46,-120 -60,-138 -76,-158 C-52,-146 -36,-126 -22,-104 Z" fill="#ece4d4"/></g>
      <g transform="translate(1420,640)"><ellipse cy="60" rx="110" ry="22" fill="#000" opacity=".4"/><ellipse cy="50" rx="100" ry="20" fill="#141010"/><path d="M-56,50 L-50,-150 L50,-150 L56,50 Z" fill="#1c1818"/><rect x="-53" y="20" width="106" height="16" fill="#2c2420"/><ellipse cy="-150" rx="50" ry="10" fill="#2a2424"/><path d="M-46,-140 L-42,30" stroke="#3a3434" stroke-width="5" opacity=".6"/></g>`;
  }

  // A Thanksgiving table, set and waiting for the family
  function thanksTable() {
    const plate = (x, y, sc) => `<g transform="translate(${x},${y}) scale(${sc})"><ellipse rx="70" ry="22" fill="#e8e2d6"/><ellipse rx="50" ry="15" fill="#fbf8f2"/><path d="M-90,-4 L-90,18 M-98,-4 L-98,18" stroke="#c8c0b0" stroke-width="4"/><path d="M90,-6 L90,20" stroke="#c8c0b0" stroke-width="5"/></g>`;
    const candle = (x, y, h) => `<g transform="translate(${x},${y})"><circle cy="${-h - 30}" r="120" fill="url(#gCandle)"/><ellipse cy="4" rx="22" ry="7" fill="#c8a040"/><rect x="-10" y="${-h}" width="20" height="${h}" fill="#f4ead8"/><path class="flickF" d="M0,${-h - 2} C10,${-h - 20} 6,${-h - 34} 0,${-h - 46} C-6,${-h - 34} -10,${-h - 20} 0,${-h - 2} Z" fill="#ffcf5a"/><path d="M0,${-h - 6} C4,${-h - 14} 3,${-h - 22} 0,${-h - 28} C-3,${-h - 22} -4,${-h - 14} 0,${-h - 6} Z" fill="#fff4d0"/></g>`;
    const chair = x => `<g transform="translate(${x},520)"><path d="M-46,0 L-42,-150 C-30,-170 30,-170 42,-150 L46,0" fill="none" stroke="#5a2e14" stroke-width="14"/><path d="M-30,-130 L30,-130 M-34,-90 L34,-90" stroke="#5a2e14" stroke-width="9"/></g>`;
    let trees = ""; const r = rng(19); for (let i = 0; i < 9; i++) trees += `<circle cx="${f1(600 + r() * 400)}" cy="${f1(330 + r() * 70)}" r="${f1(24 + r() * 26)}" fill="${["#b8521e", "#d8862e", "#8a3416"][i % 3]}" opacity=".9"/>`;
    return `
      ${BG("url(#gRoom)")}
      <g opacity=".12" stroke="#f0c070" stroke-width="2">${(() => { let l = ""; for (let x = -400; x < 2000; x += 60) l += `<path d="M${x},-200 L${x},560"/>`; return l; })()}</g>
      <g><rect x="580" y="100" width="440" height="340" fill="url(#gDusk)"/><circle cx="700" cy="330" r="40" fill="#ffe0a0"/>${trees}<path d="M580,400 C700,380 900,390 1020,410 L1020,440 L580,440 Z" fill="#3a1e24"/>
        <path d="M800,100 V440 M580,270 H1020" stroke="#f2e6d4" stroke-width="10"/><rect x="580" y="100" width="440" height="340" fill="none" stroke="#f2e6d4" stroke-width="16"/>
        <path d="M520,80 C560,200 560,360 530,470 L600,470 C620,330 610,190 590,80 Z" fill="#7a2a1e"/><path d="M1080,80 C1040,200 1040,360 1070,470 L1000,470 C980,330 990,190 1010,80 Z" fill="#7a2a1e"/></g>
      <rect x="-400" y="470" width="2400" height="90" fill="#2a120c"/>
      ${[260, 520, 1080, 1340].map(chair).join("")}
      <path d="M140,520 L1460,520 L1700,1000 L-100,1000 Z" fill="url(#gCloth)"/>
      <path d="M720,520 L880,520 L960,1000 L640,1000 Z" fill="#c8641e" opacity=".55"/>
      ${plate(330, 600, .9)}${plate(1270, 600, .9)}${plate(240, 760, 1.15)}${plate(1360, 760, 1.15)}
      ${candle(560, 640, 120)}${candle(1040, 640, 130)}
      ${turkey(800, 700, 1.05)}
      <g transform="translate(440,820)"><ellipse rx="96" ry="28" fill="#c8a070"/><ellipse cy="-6" rx="86" ry="22" fill="#d87a2a"/><path d="M0,-6 L86,-10 L70,8 Z" fill="#f4e6c8"/><path d="M-80,-14 C-40,-26 40,-26 84,-14" stroke="#e8b070" stroke-width="5" fill="none"/></g>
      <g transform="translate(1150,830)"><ellipse rx="70" ry="22" fill="#eae4da"/><ellipse cy="-6" rx="56" ry="16" fill="#a81a2a"/><ellipse cx="-10" cy="-10" rx="20" ry="5" fill="#d84a5a" opacity=".6"/></g>
      <g transform="translate(980,870)"><ellipse rx="80" ry="24" fill="#8a5a2a"/>${[-40, -12, 16, 42, 0].map((x, k) => `<ellipse cx="${x}" cy="${-14 - (k === 4) * 16}" rx="22" ry="14" fill="#d8a056"/>`).join("")}</g>
      ${pumpkin(640, 860, .7)}${corn(560, 900, -14)}
      <g>${(() => { let l = ""; const q = rng(4); for (let i = 0; i < 14; i++) l += `<path d="M0,0 C5,-9 17,-10 24,0 C17,10 5,9 0,0 Z" transform="translate(${f1(620 + q() * 360)},${f1(760 + q() * 60)}) rotate(${f1(q() * 360)}) scale(1.6)" fill="${["#c8521e", "#e2862a", "#a83a1a", "#d8a030"][i % 4]}"/>`; return l; })()}</g>
      <rect x="-400" y="-200" width="2400" height="1300" fill="#ff9a40" opacity=".07" style="mix-blend-mode:screen" pointer-events="none"/>`;
  }

  /* ================================================================== 1. ENTER HIS GATES (David) */
  const DAVID = {
    skin: "#b07a4e", skinLit: "#f2b47c", skinShadow: "#5a3222", rim: "#ffc070",
    beard: "#5a3a22", beardLit: "#a8784c", beardShadow: "#24140a", beardLen: 6, brow: "#3a2414",
    hair: true, hood: "#4a2c18", hoodLit: "#9a6436", hoodShadow: "#1a0e06", band: "#000", crown: true,
    robe: "#6a1e3a", robeLit: "#b8486e", robeShadow: "#24081a",
    mantle: "#c8963a", mantleLit: "#f6d488", mantleShadow: "#5a3a10",
    arm: K.arm({ shoulder: [46, 140], elbow: [100, 300], wrist: [252, 198], handAngle: -18, pose: "open", robe: "#6a1e3a", cuff: "#c8963a", fold: "#24081a",
      skin: "#c48654", shade: "#8a5232", lit: "#eab078", sleeveEnd: .45 })
  };

  function lyre(x, y, s) {
    const top = t => [-46 + t * 120, -280 - t * 12];
    let strings = "";
    for (let k = 0; k < 8; k++) { const t = (k + .5) / 8, bx = -38 + t * 82, [tx, ty] = top(t); strings += `<line class="str" x1="${f1(bx)}" y1="-60" x2="${f1(tx)}" y2="${f1(ty)}" stroke="#fff2c8" stroke-width="1.8" opacity=".85"/>`; }
    return `<g id="lyre" data-hit="lyre" transform="translate(${x},${y}) rotate(-10) scale(${s})">
      <ellipse cx="10" cy="-170" rx="170" ry="210" fill="transparent"/>
      <ellipse class="hotglow" cx="10" cy="-170" rx="120" ry="170" fill="url(#gGlowF)" opacity=".5"/>
      <path d="M-50,-60 C-86,-140 -74,-230 -46,-292" stroke="url(#gWood)" stroke-width="16" fill="none" stroke-linecap="round"/>
      <path d="M52,-60 C78,-150 96,-230 74,-304" stroke="url(#gWood)" stroke-width="16" fill="none" stroke-linecap="round"/>
      <path d="M-58,-284 L86,-300" stroke="#5a3418" stroke-width="13" stroke-linecap="round"/>
      ${[-40, -20, 0, 20, 40, 60].map(t => `<circle cx="${t + 6}" cy="${-286 - (t + 46) * .1}" r="4" fill="#e8c070"/>`).join("")}
      ${strings}
      <path d="M-74,-64 C-80,-10 -60,18 0,20 C60,18 82,-10 76,-64 Z" fill="url(#gWood)"/>
      <path d="M-70,-62 L74,-62" stroke="#d8a868" stroke-width="5"/>
      <ellipse cx="2" cy="-22" rx="18" ry="11" fill="#2a160a"/>
      <path d="M-60,-44 C-40,-36 40,-36 62,-44" stroke="#f0c070" stroke-width="2" fill="none" opacity=".6"/>
      ${ring(120, 10, -170)}
    </g>`;
  }

  // The four travellers on the road. Opening the gates sends them in single file: each ends at its own spot on
  // the road (smaller as it gets further away), so you can tell there are several people, not one blob.
  const WALKERS = [[690, 820, 1.25, "#7a3a2a", "#c89a5a"], [900, 780, 1.1, "#3a4a6a", "#d8c8a0"], [760, 720, .9, "#5a6a3a", "#e0c090"], [850, 690, .8, "#8a5a2a", "#c8b088"]];
  const WALK_TO = [[742, 778], [860, 724], [762, 684], [820, 653]];
  const roadScale = y => .62 + (y - 642) * .00354;     // how big a person looks at that spot on the road
  function walkAt(k, done) {
    const [x, y, s] = WALKERS[k], [tx, ty] = done ? WALK_TO[k] : [x, y], f = done ? roadScale(ty) / s : 1;
    return `translate(${tx}px,${ty}px) scale(${f.toFixed(3)}) translate(${-x}px,${-y}px)`;
  }

  S.gates = function (root, api) {
    const sky = `<linearGradient id="gEve" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1a1440"/><stop offset=".35" stop-color="#55285a"/><stop offset=".62" stop-color="#c85a46"/><stop offset=".8" stop-color="#ffa24e"/><stop offset="1" stop-color="#ffd27a"/></linearGradient>
      <linearGradient id="gWallLit" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#8a4a3a"/><stop offset=".6" stop-color="#c8845a"/><stop offset="1" stop-color="#e8a46a"/></linearGradient>
      <linearGradient id="gRoad" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#c88a5a"/><stop offset="1" stop-color="#6a3a24"/></linearGradient>
      <clipPath id="clipGate"><path d="M740,642 L740,580 A60,60 0 0 1 860,580 L860,642 Z"/></clipPath>`;
    // city wall with towers and a gate
    let crenel = "";
    for (let x = 300; x < 1300; x += 26) if (x < 690 || x > 910) crenel += `<rect x="${x}" y="496" width="14" height="14" fill="url(#gWallLit)"/>`;
    const towers = [300, 560, 1040, 1300].map(x => `<rect x="${x - 45}" y="440" width="90" height="200" fill="url(#gWallLit)"/>${[0, 1, 2].map(k => `<rect x="${x - 45 + k * 34}" y="428" width="20" height="14" fill="#c8845a"/>`).join("")}<rect x="${x - 6}" y="470" width="12" height="26" rx="6" fill="#2a120c"/>`).join("");
    const city = `
      ${BG("url(#gEve)")}
      <g filter="url(#fBlur6)" opacity=".85"><ellipse cx="1180" cy="470" rx="460" ry="280" fill="url(#gSunF)"/></g>
      <circle cx="1180" cy="462" r="64" fill="#ffe6a8"/><circle cx="1180" cy="462" r="160" fill="url(#gGlowF)" opacity=".7"/>
      <g class="drift"><ellipse cx="500" cy="230" rx="520" ry="40" fill="#fff" filter="url(#fCloud)" opacity=".35"/><ellipse cx="1300" cy="320" rx="420" ry="30" fill="#fff" filter="url(#fCloud)" opacity=".3"/></g>
      <path d="${ridge(560, 34, 4)}" fill="#7a3a52" opacity=".9"/>
      <path d="${ridge(600, 26, 6)}" fill="#5e2c44"/>
      <!-- temple + houses inside the walls -->
      ${village(320, 505, .9, 12, { wall: "#c8845a", shade: "#7a3a2a", roof: "#e8a46a", door: "#3a160c", lit: .25 })}
      ${village(930, 505, .9, 15, { wall: "#c8845a", shade: "#7a3a2a", roof: "#e8a46a", door: "#3a160c", lit: .25 })}
      <g>
        <rect x="690" y="356" width="220" height="150" fill="url(#gWallLit)"/>
        <rect x="676" y="344" width="248" height="16" fill="#f0c070"/><rect x="760" y="300" width="80" height="60" fill="url(#gWallLit)"/><rect x="752" y="292" width="96" height="10" fill="#f0c070"/>
        ${[0, 1, 2, 3, 4, 5].map(k => `<rect x="${706 + k * 34}" y="380" width="10" height="120" fill="#f6d8a0"/>`).join("")}
        <rect x="785" y="410" width="30" height="90" fill="#3a1a0c"/>
        <circle cx="800" cy="320" r="120" fill="url(#gGlowF)" opacity=".25"/>
      </g>
      <path d="${ridge(640, 18, 10, -400, 2000, 60)}" fill="#6a3a3a"/>
      <!-- the wall -->
      <rect x="300" y="508" width="1000" height="134" fill="url(#gWallLit)"/>
      <rect x="300" y="508" width="1000" height="134" fill="#000" filter="url(#fStone)" opacity=".35"/>
      ${crenel}${towers}
      <g stroke="#6a3020" stroke-width="1.5" opacity=".35">${(() => { let l = ""; for (let y = 530; y < 640; y += 22) l += `<path d="M300,${y} L1300,${y}"/>`; return l; })()}</g>
      <!-- gatehouse -->
      <rect x="690" y="452" width="220" height="190" fill="url(#gWallLit)"/>
      ${[0, 1, 2, 3, 4, 5].map(k => `<rect x="${692 + k * 38}" y="438" width="22" height="16" fill="#c8845a"/>`).join("")}
      <g clip-path="url(#clipGate)">
        <rect x="730" y="510" width="140" height="140" fill="#fff4d0"/>
        <ellipse cx="800" cy="600" rx="90" ry="80" fill="url(#gWhiteF)"/>
        <rect id="doorL" class="door" x="740" y="510" width="60" height="140" fill="url(#gWood)" style="transform-box:fill-box;transform-origin:0 50%;transition:transform 2s cubic-bezier(.4,.1,.3,1)"/>
        <rect id="doorR" class="door" x="800" y="510" width="60" height="140" fill="url(#gWood)" style="transform-box:fill-box;transform-origin:100% 50%;transition:transform 2s cubic-bezier(.4,.1,.3,1)"/>
        <g id="doorLines" class="fade" stroke="#2a1608" stroke-width="2" opacity=".6"><path d="M755,520 V642 M770,520 V642 M785,520 V642 M815,520 V642 M830,520 V642 M845,520 V642 M800,520 V642" /><path d="M742,560 H858 M742,610 H858" stroke-width="5" stroke="#3a2412"/></g>
      </g>
      <path d="M736,642 L736,580 A64,64 0 0 1 864,580 L864,642" fill="none" stroke="#7a3a24" stroke-width="10"/>
      <g id="rays" class="slowfade hide" style="mix-blend-mode:screen">
        ${[-60, -36, -16, 0, 16, 36, 60].map(a => `<path d="M800,600 L${f1(800 + Math.sin(a * Math.PI / 180) * 900 - 60)},1000 L${f1(800 + Math.sin(a * Math.PI / 180) * 900 + 60)},1000 Z" fill="#fff0c0" opacity=".12"/>`).join("")}
        <ellipse cx="800" cy="610" rx="260" ry="160" fill="url(#gGlowF)" opacity=".9"/>
      </g>
      <!-- people already inside the city, seen through the open gateway (drawn over the light so they read clearly) -->
      <g clip-path="url(#clipGate)">
        <g id="inside" class="hide" style="transition:opacity 1.2s ease .6s">${[[764, 634, .46, "#4a2a1e"], [800, 626, .4, "#2a2a4a"], [840, 632, .44, "#5a3a1e"]].map(([x, y, sc, c], k) =>
          `<g class="insideP" style="transition:transform 5s linear ${(k * .5).toFixed(1)}s">${folk(x, y, sc, { robe: c, mantle: "#1a0e08", head: "#8a6a48", skin: "#6a4228", flip: k === 1, shadow: false })}</g>`).join("")}</g>
      </g>
      <!-- land, road and fields -->
      <path d="M-400,640 L2000,640 L2000,1100 L-400,1100 Z" fill="#5a3020"/>
      <path d="M738,642 L862,642 L1140,1100 L460,1100 Z" fill="url(#gRoad)"/>
      ${wheat(650, 3, 220, -380, 700, "#a8742e", "#e6b45a", 60)}
      ${wheat(650, 5, 220, 900, 1980, "#a8742e", "#e6b45a", 60)}
      ${olive(160, 690, .9, "#3a1a24", 3, "#a85a3a")}${olive(1480, 700, 1, "#3a1a24", 8, "#c86a3a")}
      <g id="walkers">
        ${WALKERS.map(([x, y, s, r, h], k) =>
          `<g id="walker${k}" class="walker" style="transform:${walkAt(k, 0)}"><g class="bobber">${folk(x, y, s, { robe: r, mantle: "#3a2418", head: h, skin: "#a8704a", flip: x > 800 })}</g></g>`).join("")}
      </g>
      ${wheat(780, 9, 120, -400, 520, "#8a5a24", "#f0c060", 110)}${wheat(780, 11, 120, 1100, 2000, "#8a5a24", "#f0c060", 110)}
      <g id="gate" data-hit="gate"><rect x="690" y="440" width="220" height="210" fill="transparent"/>${ring(90, 800, 580)}</g>`;

    const davidShot = `
      ${BG("url(#gEve)")}
      <circle cx="1420" cy="560" r="80" fill="#ffe6a8"/><ellipse cx="1420" cy="560" rx="520" ry="300" fill="url(#gSunF)" opacity=".85"/>
      <g class="drift"><ellipse cx="700" cy="200" rx="560" ry="44" fill="#fff" filter="url(#fCloud)" opacity=".3"/></g>
      <path d="${ridge(620, 30, 21)}" fill="#7a3a52"/>
      ${village(-120, 760, 1.5, 33, { wall: "#b8744e", shade: "#6a3226", roof: "#e8a46a", door: "#3a160c", lit: .3 })}
      ${village(980, 760, 1.4, 37, { wall: "#b8744e", shade: "#6a3226", roof: "#e8a46a", door: "#3a160c", lit: .3 })}
      <rect x="-400" y="770" width="2400" height="40" fill="#a8603e"/><rect x="-400" y="806" width="2400" height="400" fill="#7a3e2a"/>
      ${lyre(1000, 850, 1.05)}
      <g transform="translate(520,430) scale(1.55)">${figure("david", DAVID)}</g>
      <rect x="-400" y="-200" width="2400" height="1300" fill="#ff9a40" opacity=".06" style="mix-blend-mode:screen" pointer-events="none"/>`;

    return K.film(root, api, {
      defs: `<defs>${sky}${HOLIDAY_DEFS}</defs><style>.walker{transition:transform 4.2s cubic-bezier(.4,.05,.45,1)}.insideP{transform-box:fill-box;transform-origin:50% 100%}</style>`,
      shots: [{ name: "plymouth", svg: plymouth("harvest") }, { name: "city", svg: city }, { name: "david", svg: davidShot }],
      chars: ["david"],
      closeups: { david: { shot: "david", from: "scale(1)", to: "scale(1.08) translate(-30px,10px)" } },
      enter(i, step, F) {
        if (i <= 0) {
          F.$("#doorL").style.transform = ""; F.$("#doorR").style.transform = ""; F.show("#rays", false); F.show("#doorLines");
          for (let k = 0; k < 4; k++) { const w = F.$("#walker" + k); w.style.transition = "none"; w.style.transform = walkAt(k, 0); w.getBoundingClientRect(); w.style.transition = ""; w.firstElementChild.classList.remove("bob"); }
          F.show("#inside", false); F.$$("#inside .insideP").forEach(p => p.style.transform = "");
          F.setBase("plymouth", "scale(1.12) translate(0px,30px)", "scale(1.0) translate(0px,0px)");
          return;
        }
        // From 1621 back three thousand years: the feast keeps drifting while a slow dissolve brings up Jerusalem at dusk
        if (i === 1) { F.camSet("plymouth", "scale(1.2) translate(0px,-30px)"); F.setBase("city", "scale(1.1) translate(0px,30px)", "scale(1.0)", 3200); }
        if (i === 2) F.setBase("david", "scale(1)", "scale(1.05) translate(-10px,4px)");
        if (i === 3) F.setBase("city", "scale(1.0)", "scale(1.1) translate(0px,26px)");
        if (i === 4) F.setBase("city", null, "scale(1.28) translate(0px,40px)");
      },
      tasks: {
        harp(F, done) {
          F.arm("lyre", () => {
            sfx(api, "harp");
            F.$$("#lyre .str").forEach((s, k) => setTimeout(() => { s.classList.remove("vib"); s.getBoundingClientRect(); s.classList.add("vib"); }, k * 90));
            notes(F, 1000, 560, 6);
            F.later(2000, done);
          });
        },
        gates(F, done) {
          F.arm("gate", () => {
            sfx(api, "gate");
            F.$("#doorL").style.transform = "scaleX(.1)"; F.$("#doorR").style.transform = "scaleX(.1)"; F.show("#doorLines", false);
            F.later(700, () => { F.show("#rays"); sfx(api, "success"); });
            F.later(700, () => { F.show("#inside"); F.$$("#inside .insideP").forEach((p, k) => p.style.transform = `translate(${[-6, 4, 8][k]}px,-10px) scale(.85)`); });
            // nearest to the gate goes first, so nobody walks through anybody else
            [3, 2, 1, 0].forEach((k, n) => F.later(300 + n * 450, () => { const w = F.$("#walker" + k); w.firstElementChild.classList.add("bob"); w.style.transform = walkAt(k, 1); }));
            F.later(300 + 3 * 450 + 4000, () => F.$$("#walkers .bobber").forEach(b => b.classList.remove("bob")));
            F.later(2400, done);
          });
        }
      }
    });
  };

  /* ================================================================== 2. BREAD FROM HEAVEN (Moses) */
  const MOSES = {
    skin: "#9a6a48", skinLit: "#e8b07e", skinShadow: "#4a2a1a", rim: "#ffd6a0",
    beard: "#e4ded2", beardLit: "#fffaf0", beardShadow: "#8a8478", beardLen: 70, brow: "#e0d8ca",
    hood: "#8a7a5a", hoodLit: "#d0bc90", hoodShadow: "#3a3020", band: "#6a2a1a",
    robe: "#6a4a2a", robeLit: "#a87e4c", robeShadow: "#2a1a0e",
    mantle: "#3a4a6a", mantleLit: "#8090b0", mantleShadow: "#141a2a",
    arm: K.arm({ shoulder: [46, 140], elbow: [92, 300], wrist: [148, 186], handAngle: -4, pose: "grip", robe: "#6a4a2a", cuff: "#3a4a6a", fold: "#2a1a0e",
      skin: "#b07a52", shade: "#7a4a2a", lit: "#dca478", sleeveEnd: .4,
      under: `<path d="M190,-230 L172,440" stroke="#5a3a1e" stroke-width="13" stroke-linecap="round"/><path d="M193,-232 C196,-250 186,-262 174,-256" stroke="#5a3a1e" stroke-width="12" fill="none" stroke-linecap="round"/><path d="M190,-200 L175,420" stroke="#9a6a3a" stroke-width="3" opacity=".6"/>` })
  };

  function tent(x, y, s, col, stripe, lit) {
    return `<g transform="translate(${x},${y}) scale(${s})">
      <path d="M-62,0 L-54,-26 Q-34,-44 -16,-30 Q0,-50 16,-30 Q34,-44 54,-26 L62,0 Z" fill="${col}"/>
      <path d="M-54,-26 Q-34,-44 -16,-30 Q0,-50 16,-30 Q34,-44 54,-26 L52,-20 Q34,-36 16,-24 Q0,-42 -16,-24 Q-34,-36 -52,-20 Z" fill="${stripe}" opacity=".8"/>
      <path d="M-58,-12 L58,-12" stroke="${stripe}" stroke-width="3" opacity=".5"/>
      <path d="M-16,-30 L-16,0 M16,-30 L16,0" stroke="#000" stroke-width="2" opacity=".25"/>
      <path d="M-12,0 L-2,-24 L10,0 Z" fill="#1a0c06"/><path d="M-2,-24 L10,0 L18,0 Z" fill="${stripe}" opacity=".6"/>
      ${lit ? `<path d="M-9,0 L-2,-18 L6,0 Z" fill="#ffb050" class="nightglow"/><circle cy="-8" r="44" fill="url(#gWarmF)" opacity=".5" class="nightglow"/>` : ""}
      <path d="M-62,0 L-80,6 M62,0 L80,6" stroke="#2a1a10" stroke-width="1.5" opacity=".6"/>
    </g>`;
  }

  function basket(id, x, y, s, heap) {
    return `<g id="${id}" ${id ? `data-hit="${id}"` : ""} transform="translate(${x},${y}) scale(${s})">
      <ellipse cx="0" cy="-10" rx="110" ry="80" fill="transparent"/>
      <ellipse class="hotglow" cx="0" cy="-20" rx="100" ry="60" fill="url(#gGlowF)" opacity=".6"/>
      <ellipse cx="0" cy="30" rx="70" ry="10" fill="#000" opacity=".35"/>
      <ellipse cx="0" cy="-40" rx="70" ry="16" fill="#3a2210"/>
      ${heap || ""}
      <path d="M-70,-40 C-66,10 -50,34 0,36 C50,34 66,10 70,-40 C50,-30 -50,-30 -70,-40 Z" fill="url(#gBasket)"/>
      <g stroke="#5a3414" stroke-width="2" opacity=".5" fill="none">${[-24, -10, 4, 18].map(yy => `<path d="M${-68 + Math.abs(yy) * .05},${yy} C-40,${yy + 8} 40,${yy + 8} ${68 - Math.abs(yy) * .05},${yy}"/>`).join("")}${[-50, -30, -10, 10, 30, 50].map(xx => `<path d="M${xx},-34 L${xx * .8},30"/>`).join("")}</g>
      <ellipse cx="0" cy="-40" rx="70" ry="16" fill="none" stroke="#d8a868" stroke-width="5"/>
      ${ring(80, 0, -10)}
    </g>`;
  }

  S.manna = function (root, api) {
    const defs = `<defs>
      <linearGradient id="gNightD" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#03041a"/><stop offset=".6" stop-color="#16184a"/><stop offset="1" stop-color="#3a2a5a"/></linearGradient>
      <linearGradient id="gDawnD" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2a3a7a"/><stop offset=".45" stop-color="#9a7aa8"/><stop offset=".75" stop-color="#f0a888"/><stop offset="1" stop-color="#ffdc98"/></linearGradient>
      <linearGradient id="gSandD" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#c89a6a"/><stop offset="1" stop-color="#7a5236"/></linearGradient>
      <radialGradient id="gMoonGlow"><stop offset="0" stop-color="#e8eeff" stop-opacity=".6"/><stop offset="1" stop-color="#e8eeff" stop-opacity="0"/></radialGradient>
    </defs><style>.dawnOn .nightglow{opacity:0;transition:opacity 3s}.nightglow{transition:opacity 3s}</style>`;
    const r = rng(77); let flakes = "", near = "";
    for (let i = 0; i < 520; i++) {
      const x = -300 + r() * 2200, y = 690 + Math.pow(r(), .8) * 240;
      const k = (y - 650) / 250;
      flakes += `<ellipse cx="${f1(x)}" cy="${f1(y)}" rx="${f1((1.4 + r() * 2.4) * (.6 + k))}" ry="${f1((1 + r() * 1.4) * (.6 + k))}" fill="#fffaf0" opacity="${(.7 + r() * .3).toFixed(2)}"/>`;
    }
    for (let i = 0; i < 46; i++) {
      const x = 1010 + r() * 300, y = 770 + r() * 110;
      near += `<ellipse class="mfly" cx="${f1(x)}" cy="${f1(y)}" rx="${f1(2.4 + r() * 2.6)}" ry="${f1(1.6 + r() * 1.6)}" fill="#fffaf0" style="transition:transform 1.1s cubic-bezier(.5,0,.4,1) ${(r() * .6).toFixed(2)}s, opacity .4s ease ${(1 + r() * .6).toFixed(2)}s"/>`;
    }
    const heap = `<g id="heap" class="pop hide"><path d="M-62,-42 C-44,-82 44,-82 62,-42 Z" fill="#fff6e4"/>${(() => { let s = ""; const q = rng(5); for (let i = 0; i < 40; i++) s += `<circle cx="${f1((q() - .5) * 110)}" cy="${f1(-46 - q() * 26)}" r="${f1(2 + q() * 2.5)}" fill="#fff" opacity=".9"/>`; return s; })()}</g>`;
    const tents = [[180, 640, .9, 1], [330, 628, .75, 0], [470, 645, 1, 1], [610, 632, .8, 0], [760, 650, 1.1, 1], [930, 636, .85, 1], [1080, 648, 1, 0], [1230, 632, .8, 1], [1380, 646, 1.05, 0], [1530, 634, .8, 1], [60, 660, 1.1, 0], [1660, 656, 1, 1],
      [260, 690, 1.4, 1], [1150, 700, 1.5, 0], [560, 702, 1.5, 0], [1460, 712, 1.6, 1]];
    const camp = `
      <g id="skyN">${BG("url(#gNightD)")}${starfield(260, 21, 560)}<g transform="translate(1320,150)"><circle r="120" fill="url(#gMoonGlow)"/><path d="M-6,-34 A34,34 0 1 0 -6,34 A27,30 0 1 1 -6,-34 Z" fill="#f4f0e0" transform="rotate(-20)"/></g></g>
      <g id="skyD" class="slowfade hide">${BG("url(#gDawnD)")}<g class="drift"><ellipse cx="600" cy="300" rx="600" ry="40" fill="#fff" filter="url(#fCloud)" opacity=".4"/></g></g>
      <g id="sun" style="transition:transform 4s ease-out;transform:translateY(140px)"><circle cx="800" cy="560" r="70" fill="#fff0c0"/><ellipse cx="800" cy="580" rx="700" ry="380" fill="url(#gSunF)"/></g>
      <path d="M-400,640 L-100,560 L60,600 L260,420 L330,460 L420,360 L520,450 L640,520 L820,500 L1000,560 L1200,515 L1400,575 L1700,530 L2000,600 L2000,1100 L-400,1100 Z" fill="#2a2448"/>
      <path id="mtnLit" class="slowfade hide" d="M-400,640 L-100,560 L60,600 L260,420 L330,460 L420,360 L520,450 L640,520 L820,500 L1000,560 L1200,515 L1400,575 L1700,530 L2000,600 L2000,1100 L-400,1100 Z" fill="#a86a6a" opacity=".75"/>
      <path d="M420,360 L470,420 L440,430 L520,450 L420,360 Z" fill="#fff" opacity=".08"/>
      <path d="${ridge(650, 16, 31)}" fill="#3a2a40"/><path id="dunesLit" class="slowfade hide" d="${ridge(650, 16, 31)}" fill="#c08a68"/>
      ${tents.slice(0, 12).map(([x, y, s, l]) => tent(x, y, s, "#4a3a3a", "#7a3a2a", l)).join("")}
      <path d="${ridge(700, 12, 35)}" fill="#4a3434"/><path id="groundLit" class="slowfade hide" d="${ridge(700, 12, 35)}" fill="url(#gSandD)"/>
      ${tents.slice(12).map(([x, y, s, l]) => tent(x, y, s, "#5a4440", "#8a3a2a", l)).join("")}
      <g id="gatherers" class="slowfade hide">
        ${[[420, 770, 1.1, "#6a3a2a"], [700, 800, 1.2, "#3a5a6a"], [1600, 760, 1.05, "#7a6a3a"], [880, 740, .9, "#5a3a5a"], [200, 820, 1.3, "#3a4a3a"]].map(([x, y, s, c], k) => `<g class="${k % 2 ? "bob" : ""}">${folk(x, y, s, { robe: c, mantle: "#2a1a10", head: "#d8c8a0", arms: "out", flip: k % 2 === 1 })}</g>`).join("")}
      </g>
      <g id="manna" class="slowfade hide">${flakes}<g id="near">${near}</g></g>
      <g class="slowfade hide" id="mannaShine"><g class="shimmer">${(() => { let s = ""; const q = rng(9); for (let i = 0; i < 26; i++) s += `<g transform="translate(${f1(-200 + q() * 2000)},${f1(700 + q() * 200)})">${glint(1.6 + q() * 1.8)}</g>`; return s; })()}</g></g>
      ${basket("basket", 1160, 820, 1, heap)}
      <g id="sky" data-hit="sky"><rect x="-400" y="-200" width="2400" height="760" fill="transparent"/>${ring(80, 800, 540)}<circle class="hotglow" cx="800" cy="560" r="120" fill="url(#gGlowF)"/></g>`;

    const mosesShot = `
      ${BG("url(#gDawnD)")}
      <g class="drift"><ellipse cx="900" cy="260" rx="700" ry="50" fill="#fff" filter="url(#fCloud)" opacity=".4"/></g>
      <circle cx="1260" cy="640" r="90" fill="#fff0c0"/><ellipse cx="1260" cy="660" rx="760" ry="380" fill="url(#gSunF)"/>
      <path d="M-400,660 L0,560 L200,600 L420,470 L560,560 L800,600 L1100,560 L1400,620 L2000,580 L2000,1100 L-400,1100 Z" fill="#9a6a72" opacity=".9"/>
      ${[[1000, 720, 1.4], [1250, 712, 1.2], [1480, 726, 1.5], [180, 716, 1.3]].map(([x, y, s]) => tent(x, y, s, "#8a6a5a", "#a84a32", 0)).join("")}
      <path d="${ridge(730, 14, 41)}" fill="url(#gSandD)"/>
      ${(() => { let s = ""; const q = rng(44); for (let i = 0; i < 160; i++) { const y = 760 + q() * 140; s += `<ellipse cx="${f1(-300 + q() * 2200)}" cy="${f1(y)}" rx="${f1(2 + q() * 3)}" ry="${f1(1.4 + q() * 1.6)}" fill="#fffaf0" opacity=".9"/>`; } return s; })()}
      <g transform="translate(560,440) scale(1.6)">${figure("moses", MOSES)}</g>
      <rect x="-400" y="-200" width="2400" height="1300" fill="#ffb070" opacity=".07" style="mix-blend-mode:screen" pointer-events="none"/>`;

    return K.film(root, api, {
      defs,
      shots: [{ name: "camp", svg: camp }, { name: "moses", svg: mosesShot }],
      chars: ["moses"],
      closeups: { moses: { shot: "moses", from: "scale(1)", to: "scale(1.07) translate(-26px,8px)" } },
      enter(i, step, F) {
        if (i <= 0) {
          ["#skyD", "#mtnLit", "#dunesLit", "#groundLit", "#gatherers", "#manna"].forEach(s => F.show(s, false));
          F.show("#skyN"); F.show("#heap", false); F.$("#sun").style.transform = "translateY(140px)"; F.show("#mannaShine", false);
          F.svg.classList.remove("dawnOn");
          F.$$(".mfly").forEach(m => { m.style.transform = ""; m.style.opacity = ""; });
          F.setBase("camp", "scale(1.1) translate(0px,20px)", "scale(1.0)");
          return;
        }
        if (i === 1) F.setBase("camp", null, "scale(1.04) translate(0px,-10px)");
        if (i === 2) F.setBase("camp", "scale(1.0)", "scale(1.14) translate(-120px,-50px)");
      },
      tasks: {
        dawn(F, done) {
          F.arm("sky", () => {
            sfx(api, "dawn");
            F.svg.classList.add("dawnOn");
            ["#skyD", "#mtnLit", "#dunesLit", "#groundLit"].forEach(s => F.show(s));
            F.$("#sun").style.transform = "translateY(0)";
            F.later(1800, () => { F.show("#manna"); F.show("#mannaShine"); sfx(api, "sparkle"); });
            F.later(2600, () => F.show("#gatherers"));
            F.later(3600, done);
          });
        },
        gather(F, done) {
          F.arm("basket", () => {
            sfx(api, "sparkle");
            F.$$(".mfly").forEach(m => {
              const x = +m.getAttribute("cx"), y = +m.getAttribute("cy");
              m.style.transform = `translate(${f1(1160 - x + (Math.random() - .5) * 60)}px,${f1(770 - y - Math.random() * 20)}px)`;
              m.style.opacity = "0";
            });
            F.later(1300, () => { F.show("#heap"); sfx(api, "success"); });
            F.later(2200, done);
          });
        }
      }
    });
  };

  /* ================================================================== 3. THE ONE WHO CAME BACK (ten lepers) */
  const JESUS = {
    skin: "#a8724a", skinLit: "#eab482", skinShadow: "#4a2818", rim: "#ffe0a8",
    beard: "#4a2e1a", beardLit: "#8e5e38", beardShadow: "#1e1208", beardLen: 16, brow: "#2e1c10",
    hair: true, hood: "#4a2e1a", hoodLit: "#946238", hoodShadow: "#1a0e06", band: "#000",
    robe: "#e6dac2", robeLit: "#fff8ea", robeShadow: "#8a7a64",
    mantle: "#8a2a24", mantleLit: "#cc5e46", mantleShadow: "#3a0e0c"
  };
  const JSKIN = { skin: "#c48e5e", shade: "#8a5634", lit: "#eab686" };
  const ARM_OUT = K.arm({ id: "jesus-armOut", shoulder: [46, 140], elbow: [118, 292], wrist: [258, 206], handAngle: -28, pose: "open", robe: "#e6dac2", cuff: "#8a2a24", fold: "#8a7a64", sleeveEnd: .45, ...JSKIN });
  const ARM_UP = K.arm({ id: "jesus-armUp", shoulder: [56, 132], elbow: [140, 34], wrist: [222, -78], handAngle: -38, pose: "palmup", robe: "#e6dac2", cuff: "#8a2a24", fold: "#8a7a64", sleeveEnd: .3, ...JSKIN,
    over: `<g transform="translate(222,-78) rotate(-38)"><g transform="translate(40,-34) rotate(32) scale(.9)"><ellipse rx="44" ry="20" fill="#c88a44"/><ellipse cx="-4" cy="-6" rx="40" ry="13" fill="#e2ac62"/><path d="M-22,-10 l8,10 M-4,-12 l8,10 M14,-12 l8,10" stroke="#9a6028" stroke-width="3"/><ellipse cx="8" cy="-28" rx="34" ry="16" fill="#d8a056"/><path d="M-8,-34 l6,8 M8,-36 l6,8" stroke="#9a6028" stroke-width="3"/></g></g>
      <circle cx="250" cy="-130" r="120" fill="url(#gGlowF)" opacity=".3"/>` });

  function lepFolk(x, y, s, k, o = {}) {
    const sick = { robe: "#77736a", mantle: "#5a5650", head: "#8e887c", skin: "#a08a74" };
    const wellCols = [["#3a5a8a", "#d8b060"], ["#8a3a2a", "#e0d0a0"], ["#4a7a4a", "#c8a870"], ["#7a4a8a", "#e8d8b0"], ["#a8682a", "#d0c0a0"]][k % 5];
    const well = { robe: wellCols[0], mantle: "#2a1a10", head: wellCols[1], skin: "#b07a50" };
    const rag = `<path d="M-20,0 l4,-8 l4,8 l4,-7 l4,7 l4,-8 l4,8 l4,-6 l4,6 l4,-8 l3,8 Z" fill="#5a5650" transform="translate(${x},${y}) scale(${s})"/>`;
    return `<g id="lep${k}" class="move lep"><g class="bobber">
      <g class="sick fade">${folk(x, y, s, { ...sick, flip: o.flip })}${rag}</g>
      <g class="cry fade hide">${folk(x, y, s, { ...sick, arms: "up", flip: o.flip })}${rag}</g>
      <g class="well fade hide">${folk(x, y, s, { ...well, arms: "up", flip: o.flip })}</g>
      ${o.kneel ? `<g class="kneel fade hide">${folk(x - 20, y + 4, s * 1.05, { ...well, bow: true })}</g>` : ""}
      ${o.hit ? `<rect x="${x - 40}" y="${y - 130}" width="80" height="140" fill="transparent" data-hit="lep${k}"/>${ring(54, x, y - 50)}` : ""}
    </g></g>`;
  }

  // Where the nine stand at the start, and a transform that moves one of them to (tx,ty) on the road at size f
  const LEP_AT = [[240, 700], [285, 712], [330, 698], [372, 716], [410, 702], [452, 720], [205, 716], [500, 708], [545, 722]];
  const lepTo = (k, tx, ty, f) => { const [x, y] = LEP_AT[k]; return `translate(${tx}px,${ty}px) scale(${f}) translate(${-x}px,${-y}px)`; };

  S.lepers = function (root, api) {
    const defs = `<defs>
      <linearGradient id="gNoon" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#4a7ab8"/><stop offset=".55" stop-color="#c8c0b0"/><stop offset=".8" stop-color="#f2d4a0"/><stop offset="1" stop-color="#f6dca8"/></linearGradient>
      <linearGradient id="gRoadL" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#d8b88a"/><stop offset="1" stop-color="#b08a5a"/></linearGradient>
      <linearGradient id="gFieldL" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#9a8a4a"/><stop offset="1" stop-color="#5a4a26"/></linearGradient>
    </defs>`;
    const backdrop = (seed) => `
      ${BG("url(#gNoon)")}
      <g class="drift"><ellipse cx="500" cy="200" rx="500" ry="50" fill="#fff" filter="url(#fCloud)" opacity=".55"/><ellipse cx="1400" cy="150" rx="420" ry="44" fill="#fff" filter="url(#fCloud)" opacity=".5"/></g>
      <ellipse cx="300" cy="420" rx="900" ry="300" fill="url(#gSunF)" opacity=".28" filter="url(#fBlur12)"/>
      <path d="${ridge(540, 36, seed)}" fill="#a89a8a" opacity=".85"/>
      <path d="${ridge(590, 30, seed + 2)}" fill="#8a7e5a"/>`;
    const road = `
      ${backdrop(51)}
      ${village(1080, 590, .8, 61, { lit: 0 })}
      <path d="M1290,592 L1290,560 A20,20 0 0 1 1330,560 L1330,592 Z" fill="#3a2616"/>
      <path d="${ridge(630, 22, 57)}" fill="url(#gFieldL)"/>
      <path d="M1400,1100 C1150,940 900,860 640,790 C440,738 200,700 -400,660 L-400,644 C200,680 450,716 660,764 C960,830 1250,920 1700,1100 Z" fill="url(#gRoadL)"/>
      ${olive(60, 700, .9, "#5a6a3a", 13, "#9aaa6a")}${olive(820, 690, .7, "#5a6a3a", 15, "#9aaa6a")}${olive(1520, 760, 1.1, "#4a5a2e", 17, "#8a9a5a")}
      ${grass(700, 3, "#7a6a3a", 160, 22)}
      <g id="lepGroup">
        ${LEP_AT.map(([x, y], k) => lepFolk(x, y, .9, k)).join("")}
        ${lepFolk(590, 714, .92, 9, { kneel: true, hit: true })}
        <g id="lepers" data-hit="lepers"><rect x="160" y="580" width="480" height="160" fill="transparent"/>${ring(110, 400, 660)}</g>
      </g>
      <g id="disciples">
        ${folk(1260, 812, 1.2, { robe: "#5a6a8a", mantle: "#2a3048", head: "#c8b48a", skin: "#a8704a", flip: true })}
        ${folk(1330, 842, 1.3, { robe: "#7a5a3a", mantle: "#3a2a1a", head: "#d0c098", skin: "#9a6644", flip: true })}
        ${folk(1210, 790, 1.1, { robe: "#6a7a4a", mantle: "#3a4024", head: "#bca880", skin: "#a8704a", flip: true })}
      </g>
      ${folk(1130, 836, 1.35, { robe: "#e8dcc4", mantle: "#8a2a24", hair: "#4a2e1a", skin: "#b07a50", flip: true, arms: "out" })}
      ${grass(860, 7, "#6a5a2a", 120, 34)}`;
    const jesusShot = `
      ${backdrop(71)}
      ${village(1180, 600, 1, 73, { lit: 0 })}
      <path d="${ridge(650, 22, 77)}" fill="url(#gFieldL)"/>
      <path d="M-400,760 C200,700 600,700 1000,730 C1300,750 1700,790 2000,800 L2000,1100 L-400,1100 Z" fill="url(#gRoadL)" opacity=".9"/>
      <g opacity=".9">${[[120, 690], [160, 700], [200, 686], [240, 702], [90, 704]].map(([x, y]) => folk(x, y, .55, { robe: "#77736a", mantle: "#5a5650", head: "#8e887c", skin: "#a08a74" })).join("")}</g>
      <g transform="translate(1000,430) scale(-1.6,1.6)">${figure("jesus", { ...JESUS, arm: ARM_OUT })}</g>
      <rect x="-400" y="-200" width="2400" height="1300" fill="#ffd090" opacity=".06" style="mix-blend-mode:screen" pointer-events="none"/>`;

    const lep = k => F => F.$("#lep" + k);
    const variant = (el, v) => ["sick", "cry", "well", "kneel"].forEach(c => { const g = el.querySelector(":scope > .bobber > ." + c); if (g) g.classList.toggle("hide", c !== v); });

    return K.film(root, api, {
      defs,
      shots: [{ name: "road", svg: road }, { name: "jesus", svg: jesusShot }],
      chars: ["jesus"],
      closeups: { jesus: { shot: "jesus", from: "scale(1)", to: "scale(1.07) translate(24px,8px)" } },
      onSpeaker(w, prev, F) {
        if (w === "lepers") {
          F.camSet("road", "scale(1.4) translate(360px,-110px)");
          F.$$(".lep").forEach(el => variant(el, "cry"));
        } else if (prev === "lepers") F.$$(".lep").forEach(el => variant(el, "sick"));
      },
      afterVerse(i, F) {
        if (i === 5) {
          F.setBase("road", null, "scale(1.35) translate(-200px,-150px)");
          const s = F.$("#lep9"); variant(s, "well"); s.querySelector(".bobber").classList.add("hop");
          sparkle(F, 800, 420, 10, 120);
          return;
        }
        F.later(300, F.toBase);
      },
      enter(i, step, F) {
        if (i <= 0) {
          F.$$(".lep").forEach(el => { el.style.transition = ""; el.style.transform = ""; el.style.opacity = ""; variant(el, "sick"); el.querySelector(".bobber").setAttribute("class", "bobber"); });
          F.setBase("road", "scale(1.08) translate(0px,10px)", "scale(1.0)");
          return;
        }
        if (i === 1) F.setBase("road", null, "scale(1.06) translate(-60px,0px)");
        if (i === 2) F.setBase("road", "scale(1.0)", "scale(1.12) translate(160px,-40px)");
        if (i === 3) {
          // "Nine of the men kept running, home to their families": the nine carry on down the road and over the hill
          F.setBase("road", null, "scale(1.12) translate(330px,-30px)");
          F.$$(".lep").forEach((el, k) => {
            if (k === 9) return;
            el.querySelector(".bobber").classList.add("bob");
            el.style.transition = `transform ${8 + k * .3}s cubic-bezier(.3,.1,.6,1), opacity 2.5s ease ${5.5 + k * .3}s`;
            el.style.transform = lepTo(k, -330 + k * 28, 668 + (k % 2) * 3, .5); el.style.opacity = "0";
          });
          F.later(12000, () => F.$$(".lep").forEach((el, k) => { if (k !== 9) el.querySelector(".bobber").classList.remove("bob"); }));   // gone over the hill: stop animating them
        }
        if (i === 4) F.setBase("road", null, "scale(1.3) translate(-180px,-140px)");
        if (i === 5) F.setBase("jesus", "scale(1.02)", "scale(1.08) translate(30px,10px)");
      },
      tasks: {
        go(F, done) {
          F.arm("lepers", () => {
            sfx(api, "step");
            F.$$(".lep").forEach((el, k) => {
              // they set off down the road to the left and stay in sight (the healed one, #9, is a step behind)
              el.querySelector(".bobber").classList.add("bob");
              setTimeout(() => { el.style.transform = k === 9 ? "translate(-260px,-32px)" : lepTo(k, -20 + k * 26, 684 + (k % 3) * 3, .8); }, k * 90);
              F.later(1300 + k * 120, () => { variant(el, "well"); });
            });
            F.later(1500, () => { sparkle(F, 360, 560, 12, 260); sfx(api, "sparkle"); });
            F.later(1600, async () => {
              await api.clip("lepers.healed1");
              await api.clip("lepers.healed2");
              F.later(500, () => { F.$$(".lep").forEach(el => el.querySelector(".bobber").classList.remove("bob")); done(); });
            });
          });
        },
        return(F, done) {
          F.arm("lep9", () => {
            const s = F.$("#lep9"), b = s.querySelector(".bobber");
            F.$$(".lep").forEach((el, k) => { if (k !== 9) el.style.opacity = "0"; });   // the nine are long gone by now
            b.classList.add("bob"); sfx(api, "step");
            s.style.transform = "translate(380px,96px)";
            F.camSet("road", "scale(1.3) translate(-180px,-140px)");
            F.later(4000, () => { b.classList.remove("bob"); variant(s, "kneel"); sfx(api, "chime"); F.later(800, done); });
          });
        }
      }
    });
  };

  /* ================================================================== 4. LOAVES AND FISHES */
  const ANDREW = {
    skin: "#9a6644", skinLit: "#dca274", skinShadow: "#4a2616", rim: "#ffe6b0",
    beard: "#3a2414", beardLit: "#7a5434", beardShadow: "#160c06", beardLen: 28, brow: "#24160c",
    hood: "#6a7a54", hoodLit: "#a8b884", hoodShadow: "#2a3220", band: "#8a5a2a",
    robe: "#7a5a3a", robeLit: "#b08a5a", robeShadow: "#2e1e10",
    mantle: "#3a5a7a", mantleLit: "#7a9aba", mantleShadow: "#142030",
    arm: K.arm({ shoulder: [46, 140], elbow: [100, 300], wrist: [248, 240], handAngle: -14, pose: "open", robe: "#7a5a3a", cuff: "#3a5a7a", fold: "#2e1e10",
      skin: "#bc865a", shade: "#7e4c2c", lit: "#e2a676", sleeveEnd: .45 })
  };

  const loaf = (x, y, s = 1) => `<g transform="translate(${x},${y}) scale(${s})"><ellipse rx="20" ry="11" fill="#c88a44"/><ellipse cy="-3" rx="18" ry="7" fill="#e6b066"/><path d="M-9,-6 l4,6 M1,-7 l4,6 M10,-6 l3,5" stroke="#9a6028" stroke-width="2"/></g>`;
  const fish = (x, y, s = 1, flip) => `<g transform="translate(${x},${y}) scale(${flip ? -s : s},${s})"><path d="M-22,0 C-12,-11 10,-11 18,0 C10,11 -12,11 -22,0 Z" fill="#b8c4cc"/><path d="M16,0 L30,-10 L28,10 Z" fill="#8a98a2"/><circle cx="-13" cy="-2" r="2" fill="#223"/><path d="M-6,-6 C-2,-2 -2,2 -6,6" stroke="#8a98a2" stroke-width="1.6" fill="none"/></g>`;

  S.loaves = function (root, api) {
    const defs = `<defs>
      <linearGradient id="gAft" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#4a82c0"/><stop offset=".5" stop-color="#b8c4c8"/><stop offset=".75" stop-color="#f2d6a8"/><stop offset="1" stop-color="#f8dfae"/></linearGradient>
      <linearGradient id="gSea" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#6a90b4"/><stop offset="1" stop-color="#9cc0d6"/></linearGradient>
      <linearGradient id="gHill" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8aa64c"/><stop offset=".5" stop-color="#5e7c30"/><stop offset="1" stop-color="#3a5220"/></linearGradient>
    </defs>`;
    const sky = `${BG("url(#gAft)")}
      <g class="drift"><ellipse cx="400" cy="180" rx="520" ry="46" fill="#fff" filter="url(#fCloud)" opacity=".6"/><ellipse cx="1300" cy="260" rx="460" ry="40" fill="#fff" filter="url(#fCloud)" opacity=".5"/></g>
      <ellipse cx="1300" cy="380" rx="700" ry="240" fill="url(#gSunF)" opacity=".55"/>
      <path d="${ridge(420, 22, 81)}" fill="#8e8aa6"/><path d="${ridge(440, 14, 83)}" fill="#7c7896"/>
      <rect x="-400" y="440" width="2400" height="160" fill="url(#gSea)"/>
      <g stroke="#fff" opacity=".5" stroke-linecap="round">${(() => { let s = ""; const q = rng(8); for (let i = 0; i < 40; i++) { const x = -200 + q() * 2000, y = 452 + q() * 120; s += `<path d="M${f1(x)},${f1(y)} h${f1(8 + q() * 26)}" stroke-width="${f1(1 + q() * 1.5)}"/>`; } return s; })()}</g>`;
    // crowd seated on the slope, in groups that each get bread
    const q = rng(101), groups = []; let crowd = "";
    const robes = ["#7a3a2a", "#3a5a7a", "#6a7a3a", "#8a6a3a", "#5a3a5a", "#a8683a", "#4a6a6a", "#7a5a5a", "#c8b088", "#3a4a3a"];
    for (let row = 0; row < 7; row++) {
      const y = 610 + row * 42, s = .5 + row * .11;
      for (let gx = 0; gx < 5; gx++) {
        const cx = 700 + gx * 230 + (row % 2) * 110 - row * 30 + (q() - .5) * 40;
        if (cx > 1780) continue;
        if (row > 3 && cx < 820) continue;
        const members = [];
        for (let m = 0; m < 4; m++) { const x = cx + (m - 1.5) * 34 * s + (q() - .5) * 10; members.push(x); crowd += folk(x, y + (q() - .5) * 8, s, { sit: true, robe: robes[Math.floor(q() * robes.length)], mantle: "#2a1a10", head: q() < .5 ? "#d8c8a0" : "#a87a4a", skin: "#a8704a", flip: q() < .3, shadow: false }); }
        groups.push([cx, y - 70 * s, s]);
      }
    }
    const breads = groups.map(([x, y, s], k) => `<g id="bread${k}" class="pop hide">${loaf(x - 14 * s, y, s * 1.1)}${fish(x + 20 * s, y + 4, s, k % 2)}<circle cx="${x}" cy="${y}" r="${40 * s}" fill="url(#gGlowF)" opacity=".6"/></g>`).join("");
    const baskets = Array.from({ length: 12 }, (_, k) => {
      const x = 170 + k * 112, y = 862 + (k % 2) * 10;
      const h = `<g>${loaf(-24, -46, .9)}${loaf(10, -50, .9)}${fish(30, -42, .8)}${loaf(-6, -60, .8)}</g>`;
      return `<g id="bk${k}" class="pop hide">${basket("", x, y, .55, h)}</g>`;
    }).join("");
    // the boy's lunch, packed down inside his basket (basket units: the rim is at y -40)
    const lunch = `<g id="lunch">${[[-40, -44, -8], [-10, -48, 4], [20, -45, -4], [46, -40, 10]].map(([x, y, a]) => `<g class="pop hide lunchItem"><g transform="rotate(${a} ${x} ${y})">${loaf(x, y, 1.55)}</g></g>`).join("")}
      ${[[-26, -60, -24, 0], [30, -62, 20, 1]].map(([x, y, a, f]) => `<g class="pop hide lunchItem"><g transform="rotate(${a} ${x} ${y})">${fish(x, y, 1.35, f)}</g></g>`).join("")}
      <g class="pop hide lunchItem">${loaf(4, -58, 1.55)}</g></g>`;
    const hill = `
      ${sky}
      <path d="M-400,520 C100,520 500,560 900,600 C1200,628 1600,646 2000,640 L2000,1100 L-400,1100 Z" fill="url(#gHill)"/>
      ${(() => { let s = ""; const r = rng(55); for (let i = 0; i < 90; i++) s += `<circle cx="${f1(-300 + r() * 2200)}" cy="${f1(600 + r() * 300)}" r="${f1(1.5 + r() * 2)}" fill="${r() < .5 ? "#f6e6a0" : "#f0f0f0"}" opacity=".8"/>`; return s; })()}
      ${olive(-60, 600, 1, "#3e5222", 41, "#7a9440")}
      ${crowd}
      ${folk(300, 640, 1.05, { robe: "#5a6a8a", mantle: "#2a3048", head: "#c8b48a", skin: "#a8704a" })}
      ${folk(360, 622, .95, { robe: "#8a5a3a", mantle: "#3a2a1a", head: "#d0c098", skin: "#9a6644" })}
      ${folk(450, 632, 1.15, { robe: "#e8dcc4", mantle: "#8a2a24", hair: "#4a2e1a", skin: "#b07a50", arms: "out" })}
      ${folk(540, 650, 1.05, { robe: "#7a5a3a", mantle: "#3a5a7a", head: "#a8b884", skin: "#9a6644", flip: true })}
      ${folk(612, 672, .66, { robe: "#a85a2a", mantle: "#6a3a1a", hair: "#2a1a10", skin: "#b88058", flip: true })}
      <g id="boybasket" data-hit="boybasket" transform="translate(640,670)">
        <rect x="-60" y="-140" width="120" height="160" fill="transparent"/>
        <ellipse class="hotglow" cy="-16" rx="50" ry="36" fill="url(#gGlowF)"/>
        ${basket("", 0, 0, .5, lunch)}
        ${ring(54, 0, -18)}
      </g>
      ${breads}
      ${grass(860, 21, "#3a5a1a", 140, 30)}
      ${baskets}
      <g id="gatherHit" data-hit="gatherHit"><rect x="-400" y="560" width="2400" height="540" fill="transparent"/>${ring(70, 800, 820)}</g>`;

    const back = `${sky}<path d="M-400,600 C200,620 900,660 2000,700 L2000,1100 L-400,1100 Z" fill="url(#gHill)"/>
      <g filter="url(#fBlur3)" opacity=".8">${(() => { let s = ""; const r = rng(7); for (let i = 0; i < 40; i++) s += folk(900 + r() * 1000, 690 + r() * 60, .5 + r() * .2, { sit: true, robe: robes[Math.floor(r() * robes.length)], head: "#d8c8a0", skin: "#a8704a", shadow: false }); return s; })()}</g>`;
    const andrewShot = `${back}<g transform="translate(560,440) scale(1.55)">${figure("andrew", ANDREW)}</g>`;
    const jesusShot = `${back}<g transform="translate(600,440) scale(1.6)">${figure("jesus", { ...JESUS, lookUp: true, arm: ARM_UP + ARM_OUT })}</g>
      <rect x="-400" y="-200" width="2400" height="1300" fill="#ffd090" opacity=".07" style="mix-blend-mode:screen" pointer-events="none"/>`;

    const armPose = (F, up) => { F.show("#jesus-armUp", up); F.show("#jesus-armOut", !up); };
    return K.film(root, api, {
      defs: defs + `<style>#jesus-armUp,#jesus-armOut{transition:opacity .6s}</style>`,
      shots: [{ name: "hill", svg: hill }, { name: "andrew", svg: andrewShot }, { name: "jesus", svg: jesusShot }],
      chars: ["andrew", "jesus"],
      closeups: {
        andrew: { shot: "andrew", from: "scale(1)", to: "scale(1.07) translate(-24px,8px)" },
        jesus: { shot: "jesus", from: "scale(1.02)", to: "scale(1.08) translate(-20px,10px)" }
      },
      onSpeaker(w, prev, F) { if (w === "jesus") armPose(F, false); },
      enter(i, step, F) {
        if (i <= 0) {
          F.$$(".lunchItem, [id^=bread], [id^=bk]").forEach(el => F.show(el, false));
          armPose(F, true);
          F.setBase("hill", "scale(1.12) translate(60px,20px)", "scale(1.0)");
          return;
        }
        if (i === 1) F.setBase("hill", null, "scale(1.45) translate(130px,-150px)");
        if (i === 2) { armPose(F, true); F.setBase("jesus", "scale(1.0)", "scale(1.06) translate(-10px,14px)"); }
        if (i === 3) F.setBase("hill", "scale(1.2) translate(40px,-60px)", "scale(1.0)");
        if (i === 4) F.setBase("hill", null, "scale(1.05) translate(0px,-20px)");
        if (i === 5) F.setBase("hill", null, "scale(1.0) translate(0px,-30px)");
      },
      tasks: {
        lunch(F, done) {
          F.arm("boybasket", () => {
            F.$$(".lunchItem").forEach((el, k) => F.later(k * 160, () => { F.show(el); sfx(api, "pop"); }));
            F.later(2600, done);
          });
        },
        share(F, done) {
          F.arm("boybasket", () => {
            sfx(api, "sparkle");
            const n = F.$$("[id^=bread]").length;
            for (let k = 0; k < n; k++) F.later(200 + k * 120, () => { F.show("#bread" + k); if (k % 3 === 0) sfx(api, "pop"); });
            F.later(400 + n * 120, () => sfx(api, "success"));
            F.later(1400 + n * 120, done);
          });
        },
        baskets(F, done) {
          F.arm("gatherHit", () => {
            for (let k = 0; k < 12; k++) F.later(k * 180, () => { F.show("#bk" + k); sfx(api, "pop"); });
            F.later(2400, () => sfx(api, "success"));
            F.later(3400, done);
          });
        }
      }
    });
  };

  /* ================================================================== 5. SONGS AT MIDNIGHT (Paul and Silas) */
  const PAUL = {
    skin: "#a06e48", skinLit: "#e2a272", skinShadow: "#4a2818", rim: "#ffcf8a",
    beard: "#2e2420", beardLit: "#6e5e52", beardShadow: "#120c0a", beardLen: 34, brow: "#1e1610",
    hood: "#5a4a3a", hoodLit: "#9a8a6a", hoodShadow: "#221a12", band: "#6a2a1a",
    robe: "#3a4a5a", robeLit: "#6a7a8a", robeShadow: "#141a22",
    mantle: "#6a3a24", mantleLit: "#a86a44", mantleShadow: "#2a140a"
  };
  const PRISON = {
    ...PAUL, skin: "#6a5a62", skinLit: "#a8a0b8", skinShadow: "#2a2430", rim: "#c8d8ff",
    hood: "#3a3a4a", hoodLit: "#6a6a84", hoodShadow: "#141420", robe: "#2e3442", robeLit: "#4e566a", robeShadow: "#0e1018",
    mantle: "#3a2e2a", mantleLit: "#5e504a", mantleShadow: "#140e0c", beardLit: "#5a5560"
  };
  const PAUL_WRITE = K.arm({ cls: "write", shoulder: [-50, 132], elbow: [60, 236], wrist: [200, 236], handAngle: 6, pose: "grip", robe: "#3a4a5a", fold: "#141a22",
    skin: "#c08a5c", shade: "#7e4c2c", lit: "#e4a874", sleeveEnd: .45, sw0: 84, sw1: 76, sw2: 70,
    over: `<path d="M248,246 L188,142" stroke="#3a2a1a" stroke-width="3" stroke-linecap="round"/><path d="M218,192 C208,168 194,146 180,128 C200,140 216,162 226,186 Z" fill="#ece4d4" opacity=".95"/>` });
  // Silas: younger than Paul, bareheaded with black hair, a shorter beard, warmer skin and a deep red robe
  // (Paul keeps his hood, long beard and blue-grey robe), so the two are easy to tell apart
  const SILAS = { ...PRISON, skin: "#7a5e58", skinLit: "#b89a90", skinShadow: "#2e2024",
    hair: true, hood: "#1a1416", hoodLit: "#4a4048", hoodShadow: "#060406",
    beard: "#141012", beardLit: "#3e3438", beardShadow: "#060406", beardLen: 2, brow: "#0e0a0c",
    robe: "#4a2224", robeLit: "#7a3e3c", robeShadow: "#1a0a0c", mantle: "#5a4a32", mantleLit: "#8a7652", mantleShadow: "#1e180e" };
  const shackledArm = robe => K.arm({ shoulder: [46, 140], elbow: [56, 318], wrist: [204, 330], handAngle: 10, pose: "open", robe, fold: "#000", sleeveEnd: .45,
    skin: "#8a7470", shade: "#4a3a3a", lit: "#aa9494", over: `<g class="shackle fade"><rect x="184" y="314" width="26" height="32" rx="6" fill="#4a4a58"/><rect x="184" y="320" width="26" height="5" fill="#6a6a7a"/></g>` });
  PRISON.arm = shackledArm("#2e3442"); SILAS.arm = shackledArm("#4a2224");

  S.midnight = function (root, api) {
    const defs = `<defs>
      <linearGradient id="gCell" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#0c0e1a"/><stop offset=".5" stop-color="#1a1e30"/><stop offset="1" stop-color="#0a0c16"/></linearGradient>
      <linearGradient id="gBeam" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#cfe0ff" stop-opacity=".22"/><stop offset="1" stop-color="#cfe0ff" stop-opacity="0"/></linearGradient>
      <linearGradient id="gWall" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#140c08"/><stop offset=".6" stop-color="#2e1d12"/><stop offset="1" stop-color="#1c120b"/></linearGradient>
      <linearGradient id="gTable" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#5a3518"/><stop offset=".15" stop-color="#3a220f"/><stop offset="1" stop-color="#120a05"/></linearGradient>
      <clipPath id="clipPaulArm"><path d="M78,30 L420,30 L420,600 L-100,600 L-100,208 L20,208 L68,140 L78,40 Z"/></clipPath>
      <radialGradient id="gTorch"><stop offset="0" stop-color="#ffc870" stop-opacity=".9"/><stop offset=".5" stop-color="#ff8a30" stop-opacity=".3"/><stop offset="1" stop-color="#ff6a10" stop-opacity="0"/></radialGradient>
    ${HOLIDAY_DEFS}</defs><style>.sing{animation:singj .36s ease-in-out infinite alternate;transform-origin:-6px -2px}@keyframes singj{to{transform:rotate(8deg)}}
      .chain{transition:transform 1.4s cubic-bezier(.5,0,.8,.6),opacity 1s .8s}.dust{animation:dust 2.4s linear forwards}@keyframes dust{to{transform:translateY(500px);opacity:0}}</style>`;
    const blocks = (() => { let l = ""; for (let y = -60; y < 900; y += 80) { l += `<path d="M-400,${y} L2000,${y}"/>`; const off = (y / 80) % 2 ? 0 : 60; for (let x = -400 + off; x < 2000; x += 120) l += `<path d="M${x},${y} L${x},${y + 80}"/>`; } return l; })();
    const chain = (id, x1, y1, x2, y2) => {
      const n = Math.ceil(Math.hypot(x2 - x1, y2 - y1) / 11); let links = "";
      for (let i = 0; i <= n; i++) { const t = i / n, x = x1 + (x2 - x1) * t + Math.sin(t * Math.PI) * 26, y = y1 + (y2 - y1) * t + Math.sin(t * Math.PI) * 20; links += `<ellipse cx="${f1(x)}" cy="${f1(y)}" rx="${i % 2 ? 4 : 7}" ry="${i % 2 ? 7 : 4}" fill="none" stroke="#7a7a88" stroke-width="3"/>`; }
      return `<g id="${id}" class="chain">${links}<rect x="${x2 - 12}" y="${y2 - 6}" width="24" height="14" rx="4" fill="#4a4a58"/></g>`;
    };
    // a seated man's leg stretched into the stocks (robe to mid-shin, bare ankle through the board, foot beyond it)
    const legStraight = (hip, y, robe, skin, k) => `
      ${K.limb([hip, [hip[0] + 130, y + 6], [1062, y + 2]], [66 * k, 50 * k, 38 * k], robe)}
      ${K.limb([[1050, y + 2], [1150, y]], [26 * k, 22 * k], skin)}
      <path d="M1146,${y - 14 * k} C1164,${y - 22 * k} 1186,${y - 18 * k} 1194,${y - 4 * k} C1198,${y + 6 * k} 1188,${y + 12 * k} 1150,${y + 12 * k} Z" fill="${skin}"/>
      <path d="M1150,${y + 12 * k} L1192,${y + 8 * k}" stroke="#4a3020" stroke-width="${4 * k}"/>`;
    // ...and the same leg drawn up, knee raised, foot flat on the floor
    const legBent = (hip, knee, ankle, robe, skin, k) => `
      ${K.limb([hip, knee], [68 * k, 54 * k], robe)}<circle cx="${knee[0]}" cy="${knee[1]}" r="${27 * k}" fill="${robe}"/>
      ${K.limb([knee, [ankle[0] - 6, ankle[1] - 20]], [52 * k, 40 * k], robe)}
      ${K.limb([[ankle[0] - 8, ankle[1] - 24], ankle], [24 * k, 22 * k], skin)}
      <path d="M${ankle[0] - 14},${ankle[1] + 6} C${ankle[0] - 8},${ankle[1] - 12} ${ankle[0] + 30},${ankle[1] - 8} ${ankle[0] + 42},${ankle[1] + 8} Z" fill="${skin}"/>
      <path d="M${ankle[0] - 14},${ankle[1] + 7} L${ankle[0] + 42},${ankle[1] + 8}" stroke="#4a3020" stroke-width="${4 * k}"/>`;
    const cell = `
      ${BG("url(#gCell)")}
      <g stroke="#04050c" stroke-width="4" opacity=".55">${blocks}</g>
      <rect x="-400" y="-200" width="2400" height="1300" fill="#000" filter="url(#fStone)" opacity=".3"/>
      <rect x="320" y="120" width="130" height="110" fill="#1a2650"/><g stroke="#05060c" stroke-width="10">${[345, 385, 425].map(x => `<path d="M${x},120 V230"/>`).join("")}</g>
      <rect x="320" y="120" width="130" height="110" fill="none" stroke="#05060c" stroke-width="16"/>
      <path d="M330,150 L450,150 L1130,880 L720,880 Z" fill="url(#gBeam)" filter="url(#fBlur6)"/>
      <!-- other prisoners behind bars -->
      <g id="others">
        <rect x="-400" y="300" width="560" height="560" fill="#05060c"/>
        <g id="othersLit" class="slowfade hide"><ellipse cx="60" cy="560" rx="180" ry="160" fill="url(#gTorch)" opacity=".35"/></g>
        ${[[20, 520], [100, 560], [-50, 580]].map(([x, y]) => `<g transform="translate(${x},${y})"><ellipse rx="22" ry="27" fill="#2a2a34"/><path d="M-26,8 C-30,-30 30,-36 30,0 L28,40 L-26,40 Z" fill="#14141c"/><ellipse class="face slowfade hide" cx="8" cy="0" rx="14" ry="18" fill="#8a6a5a" opacity=".7"/></g>`).join("")}
        <g stroke="#3a3a48" stroke-width="12">${[-380, -320, -260, -200, -140, -80, -20, 40, 100, 160].map(x => `<path d="M${x},300 V860"/>`).join("")}<path d="M-400,330 H160 M-400,780 H160"/></g>
      </g>
      <!-- the iron door -->
      <g transform="translate(1300,260)">
        <rect x="0" y="0" width="240" height="600" fill="#05060a"/>
        <g id="doorLight" class="slowfade hide"><rect x="0" y="0" width="240" height="600" fill="#ffb860"/><ellipse cx="120" cy="300" rx="300" ry="420" fill="url(#gTorch)"/></g>
        <g id="ironDoor" style="transform-box:fill-box;transform-origin:100% 50%;transition:transform 1.6s cubic-bezier(.4,.1,.3,1)">
          <rect x="0" y="0" width="240" height="600" fill="#1a1c26"/>
          <g stroke="#3e4252" stroke-width="12">${[30, 75, 120, 165, 210].map(x => `<path d="M${x},0 V600"/>`).join("")}<path d="M0,40 H240 M0,300 H240 M0,560 H240"/></g>
          <rect x="20" y="280" width="30" height="44" rx="4" fill="#4a4e60"/>
        </g>
      </g>
      <g id="doorFlood" class="slowfade hide"><path d="M1300,260 L1540,260 L1100,880 L400,900 Z" fill="#ffb860" opacity=".12" filter="url(#fBlur6)"/></g>
      <!-- Silas and Paul sitting with their feet in the stocks -->
      <path d="M-400,860 L2000,860 L2000,1100 L-400,1100 Z" fill="#0a0b12"/>
      <g transform="translate(560,548) scale(.6)">${figure("silas", SILAS)}</g>
      <circle cx="420" cy="452" r="11" fill="none" stroke="#5a5a68" stroke-width="5"/>${chain("chainS", 420, 462, 680, 746)}
      <path d="M436,790 C500,800 620,800 700,792 L720,862 L430,862 Z" fill="#2e1416"/>
      <g id="silasIn" class="fade">${legStraight([700, 838], 836, "#3e1c1e", "#7a6662", .92)}</g>
      <g id="silasUp" class="fade hide">${legBent([700, 842], [800, 762], [852, 852], "#3e1c1e", "#7a6662", .92)}</g>
      <g transform="translate(790,532) scale(.64)">${figure("paulc", PRISON)}</g>
      <circle cx="1040" cy="440" r="11" fill="none" stroke="#5a5a68" stroke-width="5"/>${chain("chainP", 1040, 450, 922, 742)}
      <path d="M660,796 C720,806 860,806 940,796 L960,862 L650,862 Z" fill="#20242e"/>
      <g id="paulIn" class="fade">${legStraight([880, 820], 806, "#2a3040", "#8a7470", 1)}</g>
      <g id="paulUp" class="fade hide">${legBent([880, 828], [990, 740], [1044, 848], "#2a3040", "#8a7470", 1)}</g>
      <g id="stocks">
        <rect x="1104" y="740" width="48" height="128" fill="#4a3018"/>
        <g id="stocksTop" style="transition:transform 1.2s cubic-bezier(.3,1.4,.5,1)"><rect x="1100" y="700" width="56" height="70" fill="#5a3a1e"/><rect x="1100" y="700" width="56" height="8" fill="#7a5230"/></g>
      </g>
      <g id="singers" data-hit="singers"><rect x="460" y="380" width="700" height="480" fill="transparent"/>${ring(110, 800, 600)}</g>
      <g id="floor" data-hit="floor"><rect x="-400" y="-200" width="2400" height="1300" fill="transparent"/>${ring(90, 800, 700)}</g>
      <g id="dustG"></g>`;
    const paulShot = `
      ${BG("url(#gWall)")}
      <rect x="-400" y="-200" width="2400" height="1300" fill="#000" filter="url(#fStone)" opacity=".38"/>
      <g opacity=".08" stroke="#0b0604" stroke-width="3">${(() => { let l = ""; for (let y = -40; y < 900; y += 92) { l += `<path d="M-400,${y} L2000,${y}"/>`; const off = (y / 92) % 2 ? 0 : 70; for (let x = -400 + off; x < 2000; x += 140) l += `<path d="M${x},${y} L${x},${y + 92}"/>`; } return l; })()}</g>
      <ellipse class="lampglow" cx="1110" cy="680" rx="820" ry="600" fill="url(#gLamp)" opacity=".95"/>
      <g transform="translate(590,420) scale(1.62)">${figure("paul", { ...PAUL, arm: PAUL_WRITE })}</g>
      <path d="M-400,760 L2000,760 L2000,1100 L-400,1100 Z" fill="url(#gTable)"/>
      <path d="M-400,760 L2000,760" stroke="#7a4a20" stroke-width="3" opacity=".6"/>
      <g transform="translate(700,772)">
        <path d="M0,0 L380,-6 L392,40 L6,46 Z" fill="url(#gParch)"/>
        <g stroke="#4a3220" stroke-width="2" opacity=".55">${(() => { let w = ""; const r = rng(5); for (let row = 0; row < 4; row++) { let x = 30; while (x < 360) { const len = 12 + r() * 26; w += `<path d="M${f1(x)},${8 + row * 9} l${f1(len)},${f1((r() - .5) * 2)}"/>`; x += len + 8; } } return w; })()}</g>
      </g>
      <g transform="translate(1120,760)">
        <path d="M-46,0 C-46,-22 30,-26 52,-12 L74,-14 C80,-10 76,-4 66,-2 C40,6 -40,8 -46,0 Z" fill="#7a4a2a"/>
        <path class="flickF" d="M70,-14 C82,-34 78,-52 70,-66 C62,-52 58,-34 70,-14 Z" fill="#ffcf5a"/>
        <path d="M70,-18 C75,-28 74,-38 70,-46 C66,-38 65,-28 70,-18 Z" fill="#fff4d0"/>
      </g>
      <g transform="translate(1340,740)"><rect x="-30" y="-60" width="60" height="60" rx="8" fill="#5a3a20"/><rect x="-26" y="-74" width="52" height="16" rx="6" fill="#7a5230"/></g>
      <!-- the same arm again, on top of the table: only the part below his beard, so it joins seamlessly -->
      <g transform="translate(590,420) scale(1.62)"><g clip-path="url(#clipPaulArm)">${PAUL_WRITE}</g></g>`;

    let singTimer = null;
    const stopSing = F => { clearInterval(singTimer); singTimer = null; F.$$("#silas-jaw, #paulc-jaw").forEach(j => j.classList.remove("sing")); };
    return K.film(root, api, {
      defs,
      shots: [{ name: "cell", svg: cell }, { name: "paul", svg: paulShot }, { name: "winter", svg: plymouth("winter") }, { name: "lincoln", svg: proclamation() }],
      chars: ["paul"],
      closeups: {},
      enter(i, step, F) {
        if (i <= 0 || i >= 3) stopSing(F);
        if (i <= 0) {
          F.$("#ironDoor").style.transform = ""; F.$("#stocksTop").style.transform = "";
          ["#doorLight", "#doorFlood", "#othersLit"].forEach(s => F.show(s, false)); F.$$("#others .face").forEach(e => F.show(e, false));
          F.$$(".chain").forEach(c => { c.style.transform = ""; c.style.opacity = ""; });
          ["#paulIn", "#silasIn"].forEach(id => F.show(id)); ["#paulUp", "#silasUp"].forEach(id => F.show(id, false)); F.$$(".shackle").forEach(e => F.show(e));
          F.$("#shot-cell").classList.remove("shake");
          F.setBase("cell", "scale(1.08) translate(0px,10px)", "scale(1.0)");
          return;
        }
        if (i === 1) F.setBase("cell", null, "scale(1.18) translate(-20px,-60px)");
        if (i === 2) F.setBase("cell", null, "scale(1.0)");
        if (i === 3) F.setBase("paul", "scale(1)", "scale(1.06) translate(-20px,6px)");
        if (i === 4) F.setBase("paul", null, "scale(1.1) translate(-30px,10px)");
        if (i === 5) F.setBase("winter", "scale(1.1) translate(0px,20px)", "scale(1.0)");
        if (i === 6) F.setBase("lincoln", "scale(1.0) translate(60px,0px)", "scale(1.14) translate(0px,-30px)");
      },
      tasks: {
        sing(F, done) {
          F.arm("singers", () => {
            sfx(api, "hymn");
            F.$$("#silas-jaw, #paulc-jaw").forEach(j => j.classList.add("sing"));
            const burst = () => { notes(F, 780, 420, 3); };
            burst(); singTimer = setInterval(() => { if (!F.svg.isConnected) return clearInterval(singTimer); burst(); }, 1400);
            F.later(1800, () => { F.show("#othersLit"); F.$$("#others .face").forEach(e => F.show(e)); });
            F.later(2600, done);
          });
        },
        quake(F, done) {
          F.arm("floor", () => {
            stopSing(F);
            sfx(api, "rumble");
            F.$("#shot-cell").classList.add("shake");
            for (let k = 0; k < 40; k++) F.$("#dustG").insertAdjacentHTML("beforeend", `<circle class="dust" cx="${f1(-200 + Math.random() * 2000)}" cy="${f1(-20 + Math.random() * 200)}" r="${f1(1 + Math.random() * 3)}" fill="#8a8070" style="animation-delay:${f1(Math.random() * 1.4)}s"/>`);
            F.later(900, () => {
              F.$("#chainP").style.transform = "translate(30px,140px) rotate(8deg)"; F.$("#chainP").style.opacity = "0";
              F.$("#chainS").style.transform = "translate(-20px,150px) rotate(-6deg)"; F.$("#chainS").style.opacity = "0";
              F.$("#stocksTop").style.transform = "translate(0px,-60px) rotate(-4deg)";
              F.$("#ironDoor").style.transform = "scaleX(.12)";
              sfx(api, "gate");
            });
            F.later(1500, () => { F.show("#doorLight"); F.show("#doorFlood"); F.$$(".shackle").forEach(e => F.show(e, false)); });
            // free at last: they pull their feet out of the stocks and sit up
            F.later(1900, () => { ["#paulIn", "#silasIn"].forEach(id => F.show(id, false)); ["#paulUp", "#silasUp"].forEach(id => F.show(id)); });
            F.later(2600, () => { F.$("#shot-cell").classList.remove("shake"); sfx(api, "success"); });
            F.later(3300, done);
          });
        }
      }
    });
  };

  /* ================================================================== 6. COUNT YOUR BLESSINGS (the Thankful Tree) */
  S.tree = function (root, api) {
    const defs = `<defs>
      <linearGradient id="gDusk" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#22184a"/><stop offset=".45" stop-color="#7a3456"/><stop offset=".75" stop-color="#e2723a"/><stop offset="1" stop-color="#ffc066"/></linearGradient>
      <linearGradient id="gBark" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#1a0e0a"/><stop offset=".6" stop-color="#3a2216"/><stop offset="1" stop-color="#6a3a22"/></linearGradient>
      ${HOLIDAY_DEFS}
      <radialGradient id="gLeafGlow"><stop offset="0" stop-color="#ffe9a0" stop-opacity=".9"/><stop offset="1" stop-color="#ffb030" stop-opacity="0"/></radialGradient>
    </defs><style>.tleaf{transition:transform 1.5s cubic-bezier(.3,.1,.3,1),opacity .4s}.glory{animation:glory 6s ease-in-out infinite;transform-origin:1290px 470px}@keyframes glory{50%{opacity:.7}}</style>`;
    // branching oak: deterministic recursion, collects twig tips for leaves
    const r = rng(2024), tips = []; let wood = "";
    function branch(x, y, ang, len, w, d) {
      const x2 = x + Math.cos(ang) * len, y2 = y + Math.sin(ang) * len;
      const mx = (x + x2) / 2 + (r() - .5) * len * .25, my = (y + y2) / 2 + (r() - .5) * len * .2;
      wood += `<path d="M${f1(x)},${f1(y)} Q${f1(mx)},${f1(my)} ${f1(x2)},${f1(y2)}" stroke="url(#gBark)" stroke-width="${f1(w)}" fill="none" stroke-linecap="round"/>`;
      if (d === 0 || len < 22) { tips.push([x2, y2]); return; }
      const n = d > 3 ? 2 : 2 + (r() < .5 ? 1 : 0);
      for (let i = 0; i < n; i++) branch(x2, y2, ang + (i - (n - 1) / 2) * (.55 + r() * .3) + (r() - .5) * .3, len * (.7 + r() * .12), w * .66, d - 1);
    }
    branch(640, 790, -Math.PI / 2 - .05, 170, 64, 6);
    // autumn leaves already on the tree
    let autumn = "";
    const leafCols = ["#c8521e", "#e2862a", "#a83a1a", "#d8a030", "#8a3416"];
    tips.forEach(([x, y], k) => { if (r() < .55) for (let j = 0; j < 5; j++) autumn += `<ellipse cx="${f1(x + (r() - .5) * 40)}" cy="${f1(y + (r() - .5) * 30)}" rx="${f1(6 + r() * 6)}" ry="${f1(4 + r() * 3)}" fill="${leafCols[Math.floor(r() * leafCols.length)]}" opacity=".9" transform="rotate(${f1(r() * 180)} ${f1(x)} ${f1(y)})"/>`; });
    // golden leaves of thanks: one slot per twig tip (plus extra around them)
    const slots = [];
    tips.forEach(([x, y]) => { slots.push([x, y]); slots.push([x + (r() - .5) * 46, y + (r() - .5) * 36]); });
    slots.sort(() => r() - .5);
    const leafPath = "M0,0 C5,-9 17,-10 24,0 C17,10 5,9 0,0 Z";
    const thanks = slots.map(([x, y], k) => `<g id="tl${k}" class="tleaf hide" style="transform:translate(0,0)"><g transform="translate(${f1(x)},${f1(y)}) rotate(${f1(r() * 360)}) scale(1.7)"><circle cx="12" r="22" fill="url(#gLeafGlow)"/><path d="${leafPath}" fill="url(#gGoldF)" stroke="#fff4c0" stroke-width=".8"/><path d="M2,0 L22,0" stroke="#a8701c" stroke-width="1"/></g></g>`).join("");
    let falling = "";
    for (let i = 0; i < 26; i++) falling += `<g transform="translate(${f1(-200 + r() * 1900)},${f1(-100 + r() * 300)})"><path class="fall" d="${leafPath}" fill="${leafCols[i % 5]}" style="animation-duration:${f1(10 + r() * 10)}s;animation-delay:${f1(-r() * 20)}s"/></g>`;
    const scene = `
      ${BG("url(#gDusk)")}
      <circle cx="260" cy="610" r="80" fill="#fff0c0"/><ellipse cx="260" cy="630" rx="760" ry="360" fill="url(#gSunF)"/>
      <g class="drift"><ellipse cx="900" cy="230" rx="600" ry="40" fill="#fff" filter="url(#fCloud)" opacity=".35"/></g>
      <path d="${ridge(600, 30, 91)}" fill="#6a3446"/>
      ${(() => { let s = ""; const q = rng(5); for (let i = 0; i < 70; i++) s += `<circle cx="${f1(-300 + q() * 2200)}" cy="${f1(596 + q() * 30)}" r="${f1(8 + q() * 14)}" fill="${["#9a3a24", "#b8642a", "#7a3020", "#c88a30"][i % 4]}" opacity=".75"/>`; return s; })()}
      <path d="${ridge(640, 22, 95)}" fill="#4a2a36"/>
      <!-- little white church on the far hill -->
      <g transform="translate(1290,612)">
        <g class="glory" id="glory" opacity=".3"><circle cx="0" cy="-120" r="260" fill="url(#gGlowF)"/>${[-50, -25, 0, 25, 50].map(a => `<path d="M0,-150 L${f1(Math.sin(a * Math.PI / 180) * 600 - 30)},${f1(-150 - Math.cos(a * Math.PI / 180) * 600)} L${f1(Math.sin(a * Math.PI / 180) * 600 + 30)},${f1(-150 - Math.cos(a * Math.PI / 180) * 600)} Z" fill="#fff4d0" opacity=".12"/>`).join("")}</g>
        <rect x="-60" y="-70" width="120" height="70" fill="#f0e6dc"/><path d="M-70,-66 L0,-112 L70,-66 Z" fill="#c8b8b0"/>
        <rect x="-18" y="-160" width="36" height="96" fill="#f0e6dc"/><path d="M-24,-158 L0,-206 L24,-158 Z" fill="#c8b8b0"/>
        <path d="M0,-206 V-236 M-11,-226 H11" stroke="#f6eee6" stroke-width="5"/>
        ${[-40, -14, 14, 40].map(x => `<rect x="${x - 6}" y="-52" width="12" height="22" rx="6" fill="#ffc860"/>`).join("")}
        <rect x="-8" y="-134" width="16" height="24" rx="8" fill="#ffc860"/><rect x="-10" y="-26" width="20" height="26" fill="#6a3a1a"/>
        <circle cy="-40" r="120" fill="url(#gWarmF)" opacity=".5"/>
      </g>
      <path d="M-400,740 C0,700 400,690 700,720 C1000,750 1400,780 2000,770 L2000,1100 L-400,1100 Z" fill="#2a1820"/>
      <path d="M-400,740 C0,700 400,690 700,720 C1000,750 1400,780 2000,770" stroke="#e0803a" stroke-width="3" opacity=".35" fill="none"/>
      <ellipse cx="640" cy="790" rx="220" ry="26" fill="#000" opacity=".3"/>
      ${wood}
      ${autumn}
      <g id="thanks">${thanks}</g>
      ${grass(760, 41, "#4a2a20", 200, 26)}
      <!-- harvest by the tree -->
      <g transform="translate(1010,830)"><ellipse rx="56" ry="40" fill="#d8742a"/><ellipse cx="-30" rx="26" ry="38" fill="#c8641e"/><ellipse cx="30" rx="26" ry="38" fill="#e2802e"/><path d="M0,-38 C2,-52 10,-58 18,-56" stroke="#4a3a1a" stroke-width="7" fill="none"/></g>
      <g transform="translate(1110,846)"><ellipse rx="34" ry="26" fill="#e8a032"/><ellipse cx="-16" rx="16" ry="25" fill="#d08a28"/><path d="M0,-25 v-12" stroke="#4a3a1a" stroke-width="5"/></g>
      ${basket("", 270, 870, .8, `<g><circle cx="-30" cy="-50" r="16" fill="#b8241e"/><circle cx="0" cy="-58" r="17" fill="#c8301e"/><circle cx="30" cy="-50" r="15" fill="#d8a020"/><ellipse cx="-10" cy="-70" rx="12" ry="22" fill="#6a3a8a" transform="rotate(-30 -10 -70)"/></g>`)}
      <g transform="translate(160,850)">${wheat(0, 61, 30, -40, 40, "#a8742e", "#e6b45a", 110)}<path d="M-30,-40 C0,-30 0,-30 30,-40" stroke="#7a4a1a" stroke-width="8"/></g>
      ${falling}
      <g id="treeHit" data-hit="treeHit"><ellipse cx="640" cy="440" rx="440" ry="360" fill="transparent"/>${ring(90, 640, 420)}</g>
      <g id="flyers"></g>`;

    let shown = 0;
    function setLeaves(F, n, animateLast) {
      n = Math.min(n, slots.length);
      for (let k = 0; k < n; k++) {
        const el = F.$("#tl" + k);
        if (k === n - 1 && animateLast && k >= shown) {
          el.style.transition = "none"; el.style.transform = `translate(${f1(800 - slots[k][0])}px,${f1(940 - slots[k][1])}px) scale(2)`; el.classList.remove("hide");
          el.getBoundingClientRect(); el.style.transition = ""; el.style.transform = "translate(0,0)";
        } else el.classList.remove("hide");
      }
      shown = Math.max(shown, n);
    }

    return K.film(root, api, {
      defs,
      shots: [{ name: "table", svg: thanksTable() }, { name: "tree", svg: scene }],
      chars: [],
      enter(i, step, F) {
        if (i <= 0) {
          F.setBase("table", "scale(1.12) translate(0px,40px)", "scale(1.0)");
          F.$("#glory").setAttribute("opacity", ".3");
          api.count("leaves", false).then(c => setLeaves(F, c || 0, false));
          return;
        }
        if (i === 1) F.setBase("tree", "scale(1.0)", "scale(1.12) translate(120px,40px)");
        if (i === 2) { F.setBase("tree", null, "scale(1.3) translate(-330px,-10px)"); F.$("#glory").setAttribute("opacity", "1"); }
        if (i === 3) { F.setBase("tree", null, "scale(1.0) translate(0px,0px)"); F.$$("#thanks .tleaf").forEach(l => l.classList.add("shimmer")); }
        if (i === 4) F.setBase("tree", null, "scale(1.02) translate(-170px,0px)");
      },
      tasks: {
        leaf(F, done) {
          F.arm("treeHit", async () => {
            sfx(api, "leaf");
            const c = await api.count("leaves", true);
            setLeaves(F, c, true);
            F.later(1550, () => {
              // a burst of light right where the new leaf landed
              sfx(api, "success");
              const leaf = F.$("#tl" + (Math.min(c, slots.length) - 1));
              if (!leaf) return;
              const b = leaf.getBoundingClientRect(), m = F.svg.getScreenCTM().inverse();
              const pt = F.svg.createSVGPoint(); pt.x = b.x + b.width / 2; pt.y = b.y + b.height / 2;
              const p = pt.matrixTransform(m);
              F.fx(`<circle cx="${f1(p.x)}" cy="${f1(p.y)}" r="10" fill="none" stroke="#ffe08a" stroke-width="4" class="leafburst"/>`);
              sparkle(F, p.x, p.y, 10, 50);
            });
            F.later(2800, done);
          });
        }
      }
    });
  };
})();
