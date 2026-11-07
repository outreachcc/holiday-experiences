/* Christmas Experience — film edition, Stations 2 to 7.
   Each station is a little film: painted wide shots, close-ups of whoever is speaking (their mouths follow the
   recording), slow camera moves and something to tap. Built on js/film-core.js (the same engine as the
   Thanksgiving Experience). Station 1 (The Promise) is in js/scenes-film.js. Stage is 1600 x 900. */
(function () {
  const S = window.XScenes = window.XScenes || {};
  const K = window.FilmKit;
  const { rng, ridge, starfield, glint, ring, village, olive, palm, grass, folk, figure } = K;
  const f1 = n => (+n).toFixed(1);
  const BG = (fill, extra = "") => `<rect x="-400" y="-200" width="2400" height="1300" fill="${fill}" ${extra}/>`;
  const sfx = (api, n) => api.sfx(n);

  /* ================================================================== shared paint */
  const XDEFS = `
    <linearGradient id="gNightX" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#03051a"/><stop offset=".55" stop-color="#101848"/><stop offset=".85" stop-color="#2a2a64"/><stop offset="1" stop-color="#3e3470"/></linearGradient>
    <linearGradient id="gDuskX" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#141a4a"/><stop offset=".45" stop-color="#4a3a78"/><stop offset=".75" stop-color="#c8707a"/><stop offset="1" stop-color="#f6b080"/></linearGradient>
    <linearGradient id="gRoomX" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2a1a14"/><stop offset="1" stop-color="#4a3022"/></linearGradient>
    <linearGradient id="gWingX" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffffff"/><stop offset=".5" stop-color="#f4ecd8"/><stop offset="1" stop-color="#d8c8a0"/></linearGradient>
    <linearGradient id="gStrawX" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e8c060"/><stop offset="1" stop-color="#a87a2a"/></linearGradient>
    <linearGradient id="gWaxX" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#d8ccb0"/><stop offset=".5" stop-color="#fff8ea"/><stop offset="1" stop-color="#cfc2a4"/></linearGradient>
    <radialGradient id="gMoonX"><stop offset="0" stop-color="#eef2ff" stop-opacity=".55"/><stop offset="1" stop-color="#eef2ff" stop-opacity="0"/></radialGradient>
    <radialGradient id="gGloryX"><stop offset="0" stop-color="#ffffff"/><stop offset=".25" stop-color="#fff2c0" stop-opacity=".85"/><stop offset=".6" stop-color="#ffd27a" stop-opacity=".35"/><stop offset="1" stop-color="#ffb84a" stop-opacity="0"/></radialGradient>`;
  const XSTYLE = `<style>
    .walk{transition:transform 1.4s cubic-bezier(.4,.1,.4,1)}.walkSlow{transition:transform 3.2s cubic-bezier(.4,.1,.4,1)}
    .lean{transform-box:fill-box;transform-origin:50% 100%;transition:transform 1s ease}
    .float{animation:floatX 4s ease-in-out infinite}@keyframes floatX{50%{transform:translateY(-10px)}}
    .glowP{animation:glowP 3s ease-in-out infinite}@keyframes glowP{50%{opacity:.6}}
    .spin{transform-box:fill-box;transform-origin:center;animation:spinX 40s linear infinite}@keyframes spinX{to{transform:rotate(360deg)}}
    .smokeX{animation:smokeX 5s ease-in-out infinite}@keyframes smokeX{50%{transform:translate(10px,-14px);opacity:.3}}
    .leg{animation:legX .55s ease-in-out infinite alternate;transform-box:fill-box;transform-origin:50% 0}@keyframes legX{from{transform:rotate(-14deg)}to{transform:rotate(14deg)}}
  </style>`;
  const defs = extra => `<defs>${XDEFS}${extra || ""}</defs>${XSTYLE}`;

  const moon = (x, y, r = 34) => `<g transform="translate(${x},${y})"><circle r="${r * 4}" fill="url(#gMoonX)"/><path d="M${-r * .2},${-r} A${r},${r} 0 1 0 ${-r * .2},${r} A${r * .8},${r * .9} 0 1 1 ${-r * .2},${-r} Z" fill="#f4f0e0" transform="rotate(-20)"/></g>`;
  // The Star: eight long rays and a soft halo
  function bigStar(x, y, r, o = {}) {
    const ray = (a, l, w) => { const c = Math.cos(a), s = Math.sin(a); return `M${f1(-s * w)},${f1(c * w)} L${f1(c * l)},${f1(s * l)} L${f1(s * w)},${f1(-c * w)} Z`; };
    let d = ""; for (let k = 0; k < 8; k++) d += ray(k * Math.PI / 4 - Math.PI / 2, k % 2 ? r * 1.6 : r * 3.4, r * .22);
    return `<g ${o.id ? `id="${o.id}"` : ""} transform="translate(${x},${y})">
      <circle r="${r * 7}" fill="url(#gGlowF)" opacity=".55" class="glowP"/>
      <path d="${d}" fill="#fff6d8" filter="url(#fGlow)"/><circle r="${r * .5}" fill="#fff"/>
      ${o.beam ? `<path d="M${-r * .4},0 L${-o.beam * .18},${o.beam} L${o.beam * .18},${o.beam} L${r * .4},0 Z" fill="#fff4c8" opacity=".16"/>` : ""}
    </g>`;
  }
  // Feathered angel wings behind a figure; (x,y) = shoulders. Long flight feathers fan up and out, with
  // shorter rows of feathers over their roots; the far wing is a little smaller and paler.
  function wing(far) {
    const feather = (px, py, ang, L, w, fill) => `<path d="M0,${-w} C${f1(L * .35)},${f1(-w * 1.25)} ${f1(L * .8)},${f1(-w * .9)} ${L},0 C${f1(L * .8)},${f1(w * .7)} ${f1(L * .35)},${f1(w * 1.1)} 0,${w} Z" transform="translate(${px},${py}) rotate(${ang})" fill="${fill}" stroke="#cbb88c" stroke-width="1.6" stroke-opacity=".7"/>`;
    let g = "";
    const N = 10;
    for (let i = 0; i < N; i++) {                       // flight feathers, from the bottom of the wing up to the tip
      const t = i / (N - 1), ang = 168 + t * 70, L = 150 + t * 120 - Math.pow(t, 6) * 40;
      const px = -20 - t * 70, py = 6 - t * 70;
      g += feather(px, py, ang, L, 15, i % 2 ? "url(#gWingX)" : "#f6f0e2");
    }
    for (let i = 0; i < 8; i++) {                       // middle row
      const t = i / 7, ang = 172 + t * 60, L = 90 + t * 60;
      g += feather(-14 - t * 56, 4 - t * 58, ang, L, 14, i % 2 ? "#fbf8f0" : "url(#gWingX)");
    }
    for (let i = 0; i < 6; i++) {                       // small covert feathers along the top of the wing
      const t = i / 5, ang = 190 + t * 40, L = 46 + t * 24;
      g += feather(-6 - t * 50, -2 - t * 54, ang, L, 12, "#fffdf6");
    }
    g += `<path d="M0,0 C-30,-40 -70,-80 -100,-74" stroke="#fffaf0" stroke-width="10" fill="none" stroke-linecap="round" opacity=".8"/>`;
    return far ? `<g transform="scale(-.86,.92)" opacity=".85">${g}</g>` : g;
  }
  const wings = (x, y, s, o = {}) => `<g transform="translate(${x},${y}) scale(${s})" opacity="${o.op ?? 1}">${wing(true)}${wing(false)}</g>`;
  // A small angel for crowds: wings, white robe, glow
  const angelFolk = (x, y, s, o = {}) => `<g transform="translate(${x},${y})">
      <circle cy="${-70 * s}" r="${110 * s}" fill="url(#gGlowF)" opacity=".55"/>
      ${wings(0, -74 * s, s * .38)}
      ${folk(0, 0, s, { robe: "#fbf6ea", mantle: o.mantle || "#f0d890", head: o.hair || "#e8c070", hair: o.hair || "#d8a850", skin: o.skin || "#e0b088", arms: o.arms || "up", flip: o.flip, shadow: false })}
    </g>`;
  // Woolly sheep facing right (flip to face left)
  function sheep(x, y, s, o = {}) {
    const r = rng(o.seed || 3); let wool = "";
    for (let i = 0; i < 9; i++) wool += `<circle cx="${f1(-30 + i * 7.5)}" cy="${f1(-34 + Math.sin(i * 1.7) * 6 - (r() * 6))}" r="${f1(13 + r() * 5)}" fill="${o.wool || "#ece2cc"}"/>`;
    return `<g ${o.id ? `id="${o.id}"` : ""} transform="translate(${x},${y}) scale(${o.flip ? -s : s},${s})">
      <ellipse cy="2" rx="40" ry="6" fill="#000" opacity=".25"/>
      <g fill="#2a2420"><rect x="-26" y="-22" width="6" height="24" rx="3" class="${o.walk ? "leg" : ""}"/><rect x="-12" y="-22" width="6" height="24" rx="3"/><rect x="14" y="-22" width="6" height="24" rx="3" class="${o.walk ? "leg" : ""}"/><rect x="26" y="-22" width="6" height="24" rx="3"/></g>
      <ellipse cx="0" cy="-34" rx="40" ry="22" fill="${o.wool || "#ece2cc"}"/>${wool}
      <ellipse cx="0" cy="-26" rx="34" ry="10" fill="#000" opacity=".1"/>
      <g transform="translate(40,-40)"><ellipse rx="13" ry="10" fill="#2a2420" transform="rotate(20)"/><ellipse cx="-6" cy="-8" rx="7" ry="4" fill="#2a2420" transform="rotate(-30)"/><circle cx="4" cy="-3" r="1.8" fill="#fff"/><circle cx="-4" cy="-12" r="9" fill="${o.wool || "#ece2cc"}"/></g>
    </g>`;
  }
  function donkey(x, y, s, o = {}) {
    const c = o.fill || "#7a6a5a", d = o.dark || "#4a3e34";
    return `<g ${o.id ? `id="${o.id}"` : ""} transform="translate(${x},${y}) scale(${o.flip ? -s : s},${s})">
      <ellipse cy="2" rx="70" ry="8" fill="#000" opacity=".25"/>
      <g fill="${d}"><rect x="-48" y="-52" width="11" height="54" rx="5" class="${o.walk ? "leg" : ""}"/><rect x="-30" y="-52" width="11" height="54" rx="5"/><rect x="30" y="-52" width="11" height="54" rx="5" class="${o.walk ? "leg" : ""}"/><rect x="46" y="-52" width="11" height="54" rx="5"/></g>
      <path d="M-58,-80 C-60,-110 40,-114 56,-90 C62,-70 60,-52 40,-48 L-46,-48 C-60,-52 -60,-66 -58,-80 Z" fill="${c}"/>
      <path d="M-58,-82 C-72,-80 -78,-60 -74,-50" stroke="${d}" stroke-width="6" fill="none" stroke-linecap="round"/>
      <path d="M44,-94 C60,-120 70,-140 84,-150 C100,-150 112,-140 114,-126 C114,-114 100,-110 90,-112 C82,-100 74,-86 60,-78 Z" fill="${c}"/>
      <path d="M86,-148 L80,-188 L92,-150 Z M96,-146 L98,-186 L104,-146 Z" fill="${c}"/>
      <ellipse cx="108" cy="-122" rx="10" ry="8" fill="#cfc2b2"/><circle cx="94" cy="-136" r="2.6" fill="#1a1410"/>
      <path d="M50,-108 C66,-124 74,-140 86,-150" stroke="${d}" stroke-width="5" fill="none"/>
      ${o.saddle ? `<path d="M-30,-104 C-20,-116 20,-116 30,-104 L26,-74 L-26,-74 Z" fill="${o.saddle}"/>` : ""}
    </g>`;
  }
  function ox(x, y, s, o = {}) {
    const c = o.fill || "#6a4a32", d = o.dark || "#3a281a";
    return `<g ${o.id ? `id="${o.id}"` : ""} transform="translate(${x},${y}) scale(${o.flip ? -s : s},${s})">
      <ellipse cy="2" rx="90" ry="9" fill="#000" opacity=".25"/>
      <g fill="${d}"><rect x="-64" y="-56" width="15" height="58" rx="6"/><rect x="-42" y="-56" width="15" height="58" rx="6"/><rect x="36" y="-56" width="15" height="58" rx="6"/><rect x="58" y="-56" width="15" height="58" rx="6"/></g>
      <path d="M-76,-96 C-80,-130 60,-136 78,-104 C86,-80 80,-56 60,-52 L-62,-52 C-80,-58 -78,-80 -76,-96 Z" fill="${c}"/>
      <path d="M66,-110 C80,-124 112,-124 122,-104 C128,-88 120,-70 106,-70 C92,-70 80,-84 66,-90 Z" fill="${c}"/>
      <ellipse cx="118" cy="-80" rx="12" ry="9" fill="#b89a82"/><circle cx="104" cy="-102" r="3" fill="#120c08"/>
      <path d="M86,-118 C80,-136 92,-146 104,-140 M106,-120 C116,-136 132,-134 134,-122" stroke="#e8dcc0" stroke-width="7" fill="none" stroke-linecap="round"/>
    </g>`;
  }
  function camel(x, y, s, o = {}) {
    const c = o.fill || "#a8804e", d = o.dark || "#6e5032";
    return `<g ${o.id ? `id="${o.id}"` : ""} transform="translate(${x},${y}) scale(${o.flip ? -s : s},${s})">
      <ellipse cy="2" rx="80" ry="8" fill="#000" opacity=".25"/>
      <g fill="${d}"><path class="${o.walk ? "leg" : ""}" d="M-50,-90 L-56,0 L-46,0 L-38,-90 Z"/><path d="M-30,-90 L-30,0 L-20,0 L-18,-90 Z"/><path class="${o.walk ? "leg" : ""}" d="M30,-90 L38,0 L48,0 L44,-90 Z"/><path d="M46,-90 L58,0 L68,0 L60,-90 Z"/></g>
      <path d="M-66,-100 C-70,-130 -40,-170 -10,-150 C10,-180 50,-170 60,-130 C80,-120 84,-96 66,-86 L-56,-84 C-70,-86 -70,-94 -66,-100 Z" fill="${c}"/>
      <path d="M58,-122 C80,-130 92,-160 96,-190 C100,-206 124,-212 136,-198 C140,-190 136,-182 128,-180 C118,-176 114,-160 108,-130 C102,-108 84,-100 66,-100 Z" fill="${c}"/>
      <circle cx="122" cy="-196" r="2.6" fill="#1a1208"/>
      <path d="M-40,-140 C-20,-150 20,-150 40,-136" stroke="${o.blanket || "#8a2a3a"}" stroke-width="16" fill="none"/>
      ${o.rider ? `<g transform="translate(-6,-150)">
        <path d="M-26,0 C-30,-40 -20,-80 0,-90 C20,-80 30,-40 26,0 Z" fill="${o.robe || "#5a2a6a"}"/>
        <path d="M-8,-60 C10,-40 20,-20 24,0 L10,0 C6,-20 -2,-40 -10,-56 Z" fill="${o.mantle || "#c8a040"}" opacity=".9"/>
        <circle cx="4" cy="-100" r="14" fill="${o.skin || "#9a6844"}"/>
        <path d="M-14,-104 C-16,-126 22,-130 24,-106 C14,-112 -4,-112 -14,-104 Z" fill="${o.turban || "#f0e0b0"}"/>
        ${o.crown ? `<path d="M-12,-112 L-10,-128 L-2,-118 L4,-132 L10,-118 L18,-128 L20,-110 Z" fill="url(#gGoldF)"/>` : ""}
      </g>` : ""}
    </g>`;
  }
  function manger(x, y, s) {
    return `<g transform="translate(${x},${y}) scale(${s})">
      <ellipse cy="6" rx="110" ry="12" fill="#000" opacity=".35"/>
      <path d="M-90,0 L-70,-60 M90,0 L70,-60 M-80,0 L-96,-70 M80,0 L96,-70" stroke="#5a3a1e" stroke-width="12" stroke-linecap="round"/>
      <path d="M-100,-74 L100,-74 L80,-20 L-80,-20 Z" fill="url(#gWood)"/>
      <path d="M-96,-72 L96,-72" stroke="#9a6a3a" stroke-width="5"/>
      <g stroke="#e8c060" stroke-width="3" stroke-linecap="round">${[-80, -60, -40, -16, 6, 30, 52, 74].map((xx, k) => `<path d="M${xx},-72 l${(k % 2 ? 1 : -1) * 14},-14"/>`).join("")}</g>
    </g>`;
  }
  function baby(x, y, s) {
    return `<g transform="translate(${x},${y}) scale(${s})">
      <circle cy="-30" r="120" fill="url(#gGlowF)" opacity=".8" class="glowP"/>
      <path d="M-64,-74 C-66,-98 40,-104 56,-88 C66,-78 60,-62 40,-60 L-50,-60 C-64,-62 -66,-68 -64,-74 Z" fill="#f6f0e2"/>
      <path d="M-40,-92 C-20,-80 0,-80 20,-92 M-30,-66 C-10,-76 10,-76 30,-66" stroke="#d8ccb0" stroke-width="3" fill="none"/>
      <circle cx="58" cy="-82" r="20" fill="#e2b08a"/><path d="M42,-96 C50,-106 70,-104 76,-90 C66,-96 54,-96 42,-90 Z" fill="#5a3a22"/>
      <path d="M62,-80 C64,-78 68,-78 70,-80" stroke="#8a4a3a" stroke-width="1.6" fill="none"/><path d="M56,-86 C58,-88 62,-88 64,-86" stroke="#3a2416" stroke-width="1.6" fill="none"/>
    </g>`;
  }
  function candle(x, y, s, o = {}) {
    return `<g ${o.id ? `id="${o.id}"` : ""} transform="translate(${x},${y}) scale(${s})">
      <g class="flame fade ${o.lit ? "" : "hide"}"><circle cy="-150" r="110" fill="url(#gWarmF)" class="glowP"/>
        <path class="flickF" d="M0,-112 C14,-136 8,-156 0,-176 C-8,-156 -14,-136 0,-112 Z" fill="#ffcf5a"/><path d="M0,-118 C6,-130 4,-142 0,-150 C-4,-142 -6,-130 0,-118 Z" fill="#fff4d0"/></g>
      <ellipse cy="4" rx="34" ry="9" fill="#a8801e"/><ellipse cy="0" rx="30" ry="7" fill="url(#gGoldF)"/>
      <path d="M-18,0 L-18,-104 Q0,-110 18,-104 L18,0 Z" fill="url(#gWaxX)"/>
      <ellipse cy="-104" rx="18" ry="4" fill="#efe4cc"/><path d="M0,-104 L1,-114" stroke="#2a2016" stroke-width="3" stroke-linecap="round"/>
      ${o.hit ? `<g id="${o.hit}" data-hit="${o.hit}"><rect x="-70" y="-240" width="140" height="250" fill="transparent"/><circle class="hotglow" cy="-110" r="80" fill="url(#gGlowF)" opacity=".5"/>${ring(70, 0, -110)}</g>` : ""}
    </g>`;
  }
  const lamp = (x, y, s = 1) => `<g transform="translate(${x},${y}) scale(${s})"><circle cy="-30" r="150" fill="url(#gWarmF)" class="glowP"/><path d="M-30,0 C-30,-16 30,-16 34,-4 L48,-10 L40,4 C20,10 -20,10 -30,0 Z" fill="#a86a3a"/><path class="flickF" d="M40,-12 C46,-26 44,-36 40,-44 C36,-36 34,-26 40,-12 Z" fill="#ffcf5a"/></g>`;

  // Tap targets that come in several pieces: arm all of them (or only the next one, in order), call back on
  // each tap, finish when all are done. GO always takes the next one.
  function taps(F, ids, onTap, done, inOrder) {
    const left = ids.slice(); let n = 0;
    const next = () => {
      if (!left.length) { done(); return; }
      F.arm(inOrder ? [left[0]] : left.slice(), id => {
        left.splice(left.indexOf(id), 1); n++;
        onTap(id, n);
        next();
      });
    };
    next();
  }
  // Repeated presses on one target ("keep pressing GO")
  function presses(F, id, count, onPress, done) {
    let n = 0;
    const next = () => F.arm(id, () => { n++; onPress(n); if (n >= count) done(); else next(); });
    next();
  }

  /* ================================================================== characters */
  const MARY = {
    noBeard: true, lip: "#b0605a", beardLen: 0, beard: "#000", beardLit: "#fbe0c8", beardShadow: "#000",
    skin: "#c8946a", skinLit: "#f6c89a", skinShadow: "#6a3e26", rim: "#ffe2b8", brow: "#3a2214",
    hood: "#2f4f8f", hoodLit: "#6a8ac8", hoodShadow: "#101c3a", band: "#e8dcc0",
    robe: "#d8c8b0", robeLit: "#fff4e0", robeShadow: "#6a5a48",
    mantle: "#2f4f8f", mantleLit: "#6a8ac8", mantleShadow: "#101c3a"
  };
  const GABRIEL = {
    noBeard: true, lip: "#a8645a", beardLen: 0, beard: "#000", beardLit: "#fff0d0", beardShadow: "#000",
    skin: "#d8a47a", skinLit: "#fff0d8", skinShadow: "#7a4e30", rim: "#ffffff", brow: "#8a6030",
    hair: true, hood: "#e0b060", hoodLit: "#fff0b8", hoodShadow: "#8a5a1e", band: "#000",
    robe: "#f4eee0", robeLit: "#ffffff", robeShadow: "#a89a80",
    mantle: "#e8c868", mantleLit: "#fff0b0", mantleShadow: "#8a6a20"
  };
  const ANGEL = { ...GABRIEL, hood: "#c89048", hoodLit: "#f8d890", hoodShadow: "#6a4012", skin: "#c89068", skinLit: "#f8d8b8", skinShadow: "#6a4028" };
  const WISEMAN = {
    skin: "#8a5a3a", skinLit: "#d09a6a", skinShadow: "#3a2014", rim: "#ffd8a0",
    beard: "#c8c4bc", beardLit: "#fffaf0", beardShadow: "#6a665e", beardLen: 40, brow: "#d0c8c0",
    hood: "#5a2a6a", hoodLit: "#9a5aaa", hoodShadow: "#200a28", band: "#e0b040", crown: true,
    robe: "#2a3a6a", robeLit: "#5a6aa8", robeShadow: "#0e1430",
    mantle: "#8a2a3a", mantleLit: "#c85a6a", mantleShadow: "#2e0a10"
  };
  const JESUS = {
    skin: "#a8724a", skinLit: "#eab482", skinShadow: "#4a2818", rim: "#ffe0a8",
    beard: "#4a2e1a", beardLit: "#8e5e38", beardShadow: "#1e1208", beardLen: 16, brow: "#2e1c10",
    hair: true, hood: "#4a2e1a", hoodLit: "#946238", hoodShadow: "#1a0e06", band: "#000",
    robe: "#e6dac2", robeLit: "#fff8ea", robeShadow: "#8a7a64",
    mantle: "#8a2a24", mantleLit: "#cc5e46", mantleShadow: "#3a0e0c"
  };
  const JSKIN = { skin: "#c48e5e", shade: "#8a5634", lit: "#eab686" };
  const MSKIN = { skin: "#d49e72", shade: "#8a5a3a", lit: "#f6c89a" };
  const GSKIN = { skin: "#e0ae84", shade: "#9a6a44", lit: "#fff0d8" };

  /* ================================================================== 2. AN ANGEL VISITS MARY */
  S.mary = function (root, api) {
    // the outside of Mary's house in Nazareth at dusk
    const town = `
      ${BG("url(#gDuskX)")}
      ${starfield(80, 12, 260)}
      <ellipse cx="1180" cy="560" rx="560" ry="200" fill="url(#gSunF)" opacity=".5"/>
      <g class="drift"><ellipse cx="500" cy="230" rx="520" ry="34" fill="#fff" filter="url(#fCloud)" opacity=".25"/></g>
      <path d="${ridge(560, 30, 8)}" fill="#4a3a6a"/>
      ${village(-60, 600, 1.1, 21, { wall: "#8a6a7a", shade: "#5a4060", roof: "#a88a98", door: "#2a1a2a", lit: .3 })}
      ${village(980, 610, 1.1, 22, { wall: "#8a6a7a", shade: "#5a4060", roof: "#a88a98", door: "#2a1a2a", lit: .3 })}
      <path d="${ridge(660, 16, 9)}" fill="#3a2a4a"/>
      ${olive(240, 720, .9, "#2a2440", 5)}${olive(1420, 730, 1.1, "#2a2440", 6)}
      <!-- Mary's house -->
      <g transform="translate(620,420)">
        <rect x="0" y="0" width="360" height="300" fill="#b89a8a"/><rect x="250" y="0" width="110" height="300" fill="#8a6a6a"/>
        <rect x="-10" y="-14" width="380" height="16" fill="#d8bcaa"/>
        <rect x="140" y="160" width="70" height="140" rx="4" fill="#3a2418"/>
        <g id="houseWin"><rect x="40" y="70" width="70" height="70" fill="#ffcf7a"/><path d="M75,70 V140 M40,105 H110" stroke="#6a4a3a" stroke-width="6"/><circle cx="75" cy="105" r="90" fill="url(#gWarmF)" opacity=".7" class="glowP"/></g>
        <path d="M250,40 L360,40" stroke="#6a4a4a" stroke-width="3" opacity=".5"/>
      </g>
      <path d="M-400,720 L2000,720 L2000,1100 L-400,1100 Z" fill="#2a2036"/>
      ${grass(720, 4, "#4a3a4a", 120, 20)}`;
    // inside: Mary at her loom-side bench, window on the right
    const room = `
      ${BG("url(#gRoomX)")}
      <rect x="-400" y="-200" width="2400" height="1300" fill="#000" filter="url(#fStone)" opacity=".5"/>
      <g id="win"><path d="M1080,180 L1080,520 L1360,520 L1360,180 A140,140 0 0 0 1080,180 Z" fill="#1a2050"/>
        ${starfield(30, 31, 340, 1080, 1360).replace(/cy="(\d+(\.\d+)?)"/g, (m, y) => `cy="${f1(180 + +y * .9)}"`)}
        <path d="M1220,60 V520 M1080,340 H1360" stroke="#3a2418" stroke-width="12"/>
        <path d="M1066,180 L1066,534 L1374,534 L1374,180 A154,154 0 0 0 1066,180 Z" fill="none" stroke="#5a3a24" stroke-width="16"/>
        <rect x="1040" y="520" width="360" height="30" fill="#6a4a30"/>
        <g data-hit="win"><rect x="1040" y="20" width="360" height="540" fill="transparent"/>${ring(130, 1220, 330)}</g>
      </g>
      <g id="flood" class="slowfade hide" style="mix-blend-mode:screen">
        <path d="M1080,200 L1360,200 L1360,520 L1080,520 Z" fill="#fff6d8"/>
        ${[0, 1, 2, 3, 4].map(k => `<path d="M${1090 + k * 60},250 L${300 + k * 120},1000 L${420 + k * 120},1000 L${1130 + k * 60},250 Z" fill="#fff2c0" opacity=".1"/>`).join("")}
        <ellipse cx="1000" cy="520" rx="700" ry="420" fill="url(#gGloryX)" opacity=".55"/>
      </g>
      <path d="M-400,720 L2000,720 L2000,1100 L-400,1100 Z" fill="#2a1a10"/><path d="M-400,720 L2000,720" stroke="#5a3a24" stroke-width="4"/>
      ${lamp(240, 640, 1.1)}
      <rect x="160" y="640" width="200" height="80" fill="#4a2e1a"/>
      <!-- Mary kneels, facing the window -->
      <g id="maryWide">${folk(560, 760, 2.3, { robe: "#d8c8b0", mantle: "#2f4f8f", head: "#2f4f8f", skin: "#d49e72", arms: "pray" })}</g>
      <g id="gabWide" class="slowfade hide"><g class="float">
        <circle cx="1060" cy="460" r="300" fill="url(#gGloryX)" opacity=".7"/>
        ${wings(1060, 506, .95)}
        ${folk(1060, 760, 3.1, { robe: "#fbf6ea", mantle: "#e8c868", hair: "#d8a850", skin: "#e0ae84", arms: "out", flip: true, shadow: false })}
      </g></g>
      <g id="heart" class="fade hide" data-hit="heart" transform="translate(640,380)">
        <circle r="110" fill="transparent"/><circle r="120" fill="url(#gGlowF)" opacity=".6" class="glowP"/>
        <path d="M0,40 C-70,-10 -70,-70 -32,-76 C-12,-78 0,-62 0,-50 C0,-62 12,-78 32,-76 C70,-70 70,-10 0,40 Z" fill="#ff7a8a" stroke="#ffd0d6" stroke-width="4"/>
        ${ring(90)}
      </g>
      <g id="hearts"></g>`;
    const gabShot = `
      ${BG("#1a1430")}
      <circle cx="700" cy="380" r="700" fill="url(#gGloryX)" opacity=".9"/>
      ${[0, 1, 2, 3, 4, 5, 6, 7].map(k => `<path d="M700,380 L${f1(700 + Math.cos(k * .8) * 1400)},${f1(380 + Math.sin(k * .8) * 1400)} L${f1(700 + Math.cos(k * .8 + .12) * 1400)},${f1(380 + Math.sin(k * .8 + .12) * 1400)} Z" fill="#fff8e0" opacity=".08"/>`).join("")}
      ${wings(560, 560, 1.9)}
      <g transform="translate(560,440) scale(1.55)">${figure("gabriel", { ...GABRIEL, arm: K.arm({ shoulder: [46, 140], elbow: [120, 290], wrist: [250, 200], handAngle: -26, pose: "open", robe: "#f4eee0", cuff: "#e8c868", fold: "#a89a80", sleeveEnd: .45, ...GSKIN }) })}</g>`;
    const maryShot = `
      ${BG("url(#gRoomX)")}
      <rect x="-400" y="-200" width="2400" height="1300" fill="#000" filter="url(#fStone)" opacity=".5"/>
      <ellipse cx="1300" cy="360" rx="700" ry="520" fill="url(#gGloryX)" opacity=".55"/>
      ${lamp(260, 820, 1.4)}
      <g transform="translate(700,430) scale(1.6)">${figure("mary", { ...MARY, arm: K.arm({ shoulder: [40, 140], elbow: [80, 300], wrist: [150, 230], handAngle: -60, pose: "open", robe: "#d8c8b0", cuff: "#2f4f8f", fold: "#6a5a48", sleeveEnd: .5, ...MSKIN }) })}</g>`;

    return K.film(root, api, {
      defs: defs(),
      shots: [{ name: "town", svg: town }, { name: "room", svg: room }, { name: "gabriel", svg: gabShot }, { name: "mary", svg: maryShot }],
      chars: ["gabriel", "mary"],
      closeups: { gabriel: { shot: "gabriel", from: "scale(1)", to: "scale(1.07) translate(-20px,8px)" }, mary: { shot: "mary", from: "scale(1)", to: "scale(1.06) translate(-24px,6px)" } },
      enter(i, step, F) {
        if (i <= 0) {
          F.show("#flood", false); F.show("#gabWide", false); F.show("#heart", false); F.$("#hearts").innerHTML = "";
          F.setBase("town", "scale(1.0)", "scale(1.25) translate(0px,40px)");
          return;
        }
        if (i === 1) F.setBase("room", "scale(1.1) translate(80px,0px)", "scale(1.0)", 1800);
        if (i === 2) F.setBase("room", null, "scale(1.08) translate(-60px,10px)");
        if (i === 3) { F.setBase("room", null, "scale(1.14) translate(140px,30px)"); F.show("#heart"); }
      },
      tasks: {
        angel(F, done) {
          F.arm("win", () => {
            F.show("#flood"); sfx(api, "whoosh"); sfx(api, "choir");
            F.later(500, () => { F.show("#gabWide"); sfx(api, "sparkle"); });
            F.later(2600, done);
          });
        },
        heart(F, done) {
          F.arm("heart", () => {
            sfx(api, "success");
            let s = ""; for (let k = 0; k < 9; k++) s += `<path class="rise" style="--dx:${(k - 4) * 22}px;animation-delay:${k * .18}s" transform="translate(${560 + k * 22},${380 - (k % 3) * 30}) scale(.32)" d="M0,26 C-40,-6 -40,-40 -18,-44 C-6,-46 0,-36 0,-30 C0,-36 6,-46 18,-44 C40,-40 40,-6 0,26 Z" fill="#ff8f9c" opacity=".85"/>`;
            F.$("#hearts").innerHTML = s;
            F.later(1800, done);
          });
        }
      }
    });
  };

  /* ================================================================== 3. THE ROAD TO BETHLEHEM */
  const WALK_N = 6;
  S.journey = function (root, api) {
    const travellers = `<g id="trav"><g class="travBob">
        ${donkey(0, 0, 1.15, { saddle: "#7a2a2a", walk: true, id: "tDonkey" })}
        <g transform="translate(-6,-104)">${folk(0, 0, 1.25, { sit: true, robe: "#d8c8b0", mantle: "#2f4f8f", head: "#2f4f8f", skin: "#d49e72", arms: "pray", shadow: false })}</g>
        ${folk(170, 4, 1.6, { robe: "#7a5a3a", mantle: "#4a3a2a", head: "#c8b088", skin: "#a8704a", arms: "out" })}
        <path d="M200,-90 L214,10" stroke="#5a3a1e" stroke-width="6" stroke-linecap="round"/>
        <path d="M140,-120 C120,-130 110,-140 104,-150" stroke="#3a2a1a" stroke-width="3" fill="none"/>
      </g>
      <g id="walk" data-hit="walk"><rect x="-120" y="-260" width="380" height="290" fill="transparent"/>${ring(130, 60, -120)}</g></g>`;
    const road = `
      ${BG("url(#gDuskX)")}
      ${starfield(90, 41, 300)}
      <g id="far" class="walkSlow"><path d="${ridge(520, 40, 41, -400, 3400)}" fill="#5a4a7a"/>
        <g id="bethLights" class="slowfade hide">${village(1420, 520, .55, 44, { wall: "#4a3a5a", shade: "#3a2a4a", roof: "#6a5a7a", door: "#1a1020", lit: .8 })}<circle cx="1520" cy="490" r="180" fill="url(#gWarmF)" opacity=".6"/></g></g>
      <g id="mid" class="walkSlow"><path d="${ridge(600, 34, 42, -400, 3400)}" fill="#4a3a5a"/>
        ${[200, 900, 1500, 2300, 2900].map((x, k) => olive(x, 640, .7, "#2e2440", 50 + k)).join("")}</g>
      <path d="M-400,700 C200,680 800,690 2000,700 L2000,1100 L-400,1100 Z" fill="#6a4a4a"/>
      <path d="M-400,780 C300,756 1000,770 2000,764 L2000,800 C1000,808 300,794 -400,820 Z" fill="#a88066" opacity=".8"/>
      <g id="near" class="walkSlow">
        ${[[-100, 900], [500, 920], [1150, 910], [1800, 900], [2500, 920], [3100, 910]].map(([x, y], k) => `<ellipse cx="${x}" cy="${y}" rx="${90 + k * 7}" ry="34" fill="#3a2a2a"/><ellipse cx="${x - 20}" cy="${y - 10}" rx="${50 + k * 5}" ry="18" fill="#5a4040"/>`).join("")}
        ${grass(880, 8, "#4a3a2a", 260, 30, -400, 3400)}</g>
      <g transform="translate(520,790)">${travellers}</g>
      <g transform="translate(1280,690)"><rect x="-6" y="0" width="12" height="90" fill="#5a3a1e"/><rect x="-150" y="-20" width="300" height="60" rx="6" fill="#d8c09a"/><text id="milesT" x="0" y="20" text-anchor="middle" font-family="Georgia,serif" font-weight="700" font-size="24" fill="#3a2414">90 miles to Bethlehem</text></g>`;
    const doorArt = (id, x, col, n) => `<g id="${id}" transform="translate(${x},620)">
        <rect x="-70" y="-190" width="140" height="190" fill="#000" opacity=".4"/>
        <g class="doorIn"><rect x="-60" y="-180" width="120" height="180" fill="#ffd27a"/><circle cx="0" cy="-90" r="130" fill="url(#gWarmF)" opacity=".7"/>
          <g class="keeper fade hide">${folk(0, 0, 1.6, { robe: ["#6a3a2a", "#4a5a3a", "#5a4a6a"][n], mantle: "#2a1a10", head: "#c8b088", skin: "#a8704a", arms: n === 2 ? "out" : null, flip: n === 2 })}${n === 2 ? `<g transform="translate(-40,-80)">${lamp(0, 0, .5)}</g>` : ""}</g></g>
        <rect class="leaf" x="-60" y="-180" width="120" height="180" fill="${col}" style="transform-box:fill-box;transform-origin:0 50%;transition:transform 1s cubic-bezier(.4,.1,.3,1)"/>
        <path d="M-60,-180 L60,-180 M-60,-120 L60,-120 M-60,-60 L60,-60" stroke="#000" stroke-width="3" opacity=".25" class="leafLines"/>
        <circle cx="40" cy="-90" r="5" fill="#c8a040"/>
        <g data-hit="${id}"><rect x="-80" y="-200" width="160" height="210" fill="transparent"/>${ring(80, 0, -90)}</g>
      </g>`;
    const street = `
      ${BG("url(#gNightX)")}
      ${starfield(160, 51, 380)}${moon(220, 140)}
      <path d="${ridge(470, 20, 52)}" fill="#1e1a3a"/>
      ${village(-200, 480, .8, 53, { wall: "#3a3a60", shade: "#2a2a48", roof: "#4a4a72", door: "#12122a", lit: .45 })}${village(900, 480, .8, 54, { wall: "#3a3a60", shade: "#2a2a48", roof: "#4a4a72", door: "#12122a", lit: .45 })}
      <!-- the street of houses, each with a door to knock on -->
      <rect x="-400" y="300" width="1640" height="330" fill="#4a4268"/><rect x="-400" y="300" width="1640" height="330" fill="#000" filter="url(#fStone)" opacity=".3"/>
      ${[[-400, 260], [100, 300], [560, 240]].map(([x, w]) => `<rect x="${x}" y="292" width="${w + 120}" height="14" fill="#5e5684"/>`).join("")}
      <rect x="150" y="380" width="44" height="40" fill="#ffc46a" opacity=".85"/><rect x="760" y="370" width="44" height="40" fill="#ffc46a" opacity=".85"/>
      ${doorArt("door1", 320, "#5a3a24", 0)}${doorArt("door2", 640, "#4a3020", 1)}${doorArt("door3", 1000, "#6a4428", 2)}
      <!-- the stable at the end of the street -->
      <g id="stable" transform="translate(1380,620)">
        <path d="M-200,0 L-200,-170 L0,-250 L200,-170 L200,0 Z" fill="#2a2018"/><path d="M-220,-160 L0,-260 L220,-160" stroke="#4a3624" stroke-width="16" fill="none"/>
        <path d="M-120,0 L-120,-130 L120,-130 L120,0 Z" fill="#120c08"/>
        <g id="stableGlow" class="slowfade hide"><path d="M-120,0 L-120,-130 L120,-130 L120,0 Z" fill="#ffb84a" opacity=".55"/><circle cy="-60" r="220" fill="url(#gWarmF)" opacity=".8"/></g>
      </g>
      <path d="M-400,620 L2000,620 L2000,1100 L-400,1100 Z" fill="#2a2438"/>
      <g opacity=".35" stroke="#4a4466" stroke-width="2">${(() => { let l = ""; for (let x = -380; x < 2000; x += 90) l += `<path d="M${x},640 L${x - 60},900"/>`; return l; })()}</g>
      <g id="pair" class="walkSlow" style="transform:translate(-220px,0px)">
        ${donkey(140, 820, .9, { saddle: "#7a2a2a" })}<g transform="translate(134,738)">${folk(0, 0, 1, { sit: true, robe: "#d8c8b0", mantle: "#2f4f8f", head: "#2f4f8f", skin: "#d49e72", arms: "pray", shadow: false })}</g>
        ${folk(290, 822, 1.25, { robe: "#7a5a3a", mantle: "#4a3a2a", head: "#c8b088", skin: "#a8704a" })}
      </g>`;

    let steps = 0;
    return K.film(root, api, {
      defs: defs(),
      shots: [{ name: "road", svg: road }, { name: "street", svg: street }],
      enter(i, step, F) {
        if (i <= 0) {
          steps = 0; ["#far", "#mid", "#near"].forEach(s => F.$(s).style.transform = ""); F.$("#milesT").textContent = "90 miles to Bethlehem";
          F.show("#bethLights", false); F.$$("#trav .leg").forEach(l => l.style.animationPlayState = "paused");
          ["door1", "door2", "door3"].forEach(d => { F.$(`#${d} .leaf`).style.transform = ""; F.show(F.$(`#${d} .keeper`), false); });
          F.show("#stableGlow", false); F.$("#pair").style.transform = "translate(-220px,0px)";
          F.setBase("road", "scale(1.12) translate(-60px,20px)", "scale(1.0)");
          return;
        }
        if (i === 1) F.setBase("road", null, "scale(1.05) translate(0px,10px)");
        if (i === 2) F.setBase("street", "scale(1.15) translate(200px,20px)", "scale(1.02) translate(60px,0px)", 2400);
      },
      tasks: {
        walk(F, done) {
          F.$$("#trav .leg").forEach(l => l.style.animationPlayState = "paused");
          presses(F, "walk", WALK_N, n => {
            steps = n; sfx(api, "step");
            F.$$("#trav .leg").forEach(l => l.style.animationPlayState = "running");
            clearTimeout(F.state.legT); F.state.legT = setTimeout(() => F.$$("#trav .leg").forEach(l => l.style.animationPlayState = "paused"), 1300);
            F.$("#far").style.transform = `translate(${-n * 60}px,0)`;
            F.$("#mid").style.transform = `translate(${-n * 160}px,0)`;
            F.$("#near").style.transform = `translate(${-n * 360}px,0)`;
            const miles = Math.max(0, Math.round(90 - 90 * n / WALK_N));
            F.$("#milesT").textContent = miles ? `${miles} miles to Bethlehem` : "Bethlehem!";
            if (n >= WALK_N - 2) F.show("#bethLights");
          }, () => { sfx(api, "success"); F.later(1400, done); });
        },
        doors(F, done) {
          const replies = [["Sorry, no room!", "Every bed is taken."], ["We're full up!", "Try down the street."], ["No room in the inn…", "but you may stay in my stable."]];
          const xs = { door1: 320, door2: 640, door3: 1000 };
          let lastReply = Promise.resolve();
          F.$("#pair").style.transform = "translate(0px,0px)";
          taps(F, ["door1", "door2", "door3"], (id, n) => {
            sfx(api, "knock");
            let replied; lastReply = new Promise(r => (replied = r));
            F.later(520, () => {
              F.$(`#${id} .leaf`).style.transform = "scaleX(.15)"; F.show(F.$(`#${id} .keeper`));
              const [a, b] = replies[n - 1];
              api.bubble(xs[id], 400, a, b); api.voice("journey.door" + n).then(replied);
              if (n === 3) F.later(1200, () => { F.show("#stableGlow"); F.$("#pair").style.transform = "translate(900px,-40px) scale(.8)"; });
            });
          }, () => {
            Promise.all([lastReply, new Promise(r => setTimeout(r, 1800))]).then(() => F.later(600, done));
          });
        }
      }
    });
  };

  /* ================================================================== 4. BORN IN BETHLEHEM */
  const PARTS = [
    { id: "pStar", x: 800, y: 120, r: 70 },
    { id: "pManger", x: 800, y: 700, r: 90 },
    { id: "pMary", x: 610, y: 640, r: 100 },
    { id: "pJoseph", x: 1000, y: 600, r: 110 },
    { id: "pDonkey", x: 330, y: 680, r: 110 },
    { id: "pOx", x: 1270, y: 680, r: 110 },
    { id: "pSheep", x: 1060, y: 790, r: 70 },
    { id: "pBaby", x: 800, y: 660, r: 80 }
  ];
  S.manger = function (root, api) {
    const art = {
      pStar: bigStar(800, 120, 30, { beam: 420 }),
      pManger: manger(800, 780, 1.15),
      pMary: `<g>${folk(610, 790, 2.1, { robe: "#d8c8b0", mantle: "#2f4f8f", head: "#2f4f8f", skin: "#d49e72", arms: "pray", sit: true })}</g>`,
      pJoseph: `<g>${folk(1010, 800, 2.4, { robe: "#7a5a3a", mantle: "#4a3a2a", head: "#c8b088", skin: "#a8704a", flip: true })}<path d="M940,560 L960,800" stroke="#5a3a1e" stroke-width="9" stroke-linecap="round"/></g>`,
      pDonkey: donkey(340, 800, 1.2, { fill: "#6a5c50" }),
      pOx: ox(1270, 800, 1.15, { flip: true }),
      pSheep: sheep(1080, 840, 1.1, { flip: true, seed: 9 }),
      pBaby: baby(796, 778, 1.0)
    };
    const stable = `
      ${BG("url(#gNightX)")}
      ${starfield(200, 61, 360)}
      <path d="${ridge(470, 24, 62)}" fill="#1c1a3a"/>${village(-300, 480, .7, 63, { wall: "#2a2a4a", shade: "#1e1e3a", roof: "#3a3a5a", door: "#0e0e20", lit: .5 })}${village(1250, 480, .7, 64, { wall: "#2a2a4a", shade: "#1e1e3a", roof: "#3a3a5a", door: "#0e0e20", lit: .5 })}
      <!-- the stable: a rough shelter of posts and a thatched roof against a rocky hillside -->
      <path d="M-400,520 C0,430 300,400 800,390 C1300,400 1600,440 2000,520 L2000,1100 L-400,1100 Z" fill="#2a2030"/>
      <path d="M140,860 L140,330 M1460,860 L1460,330" stroke="#3a2818" stroke-width="30"/>
      <path d="M60,350 L800,190 L1540,350 L1500,380 L800,230 L100,380 Z" fill="#6a5030"/>
      <g stroke="#a88a50" stroke-width="3" opacity=".6">${(() => { let l = ""; for (let x = 120; x < 1500; x += 34) { const y = 350 - (800 - Math.abs(x - 800)) * .21; l += `<path d="M${x},${f1(y + 10)} l${x < 800 ? -10 : 10},26"/>`; } return l; })()}</g>
      <rect x="140" y="380" width="1320" height="480" fill="#1a1210"/>
      <g id="warm" class="slowfade hide"><ellipse cx="800" cy="700" rx="760" ry="380" fill="url(#gWarmF)" opacity=".75"/></g>
      <path d="M140,860 L1460,860 L1700,1100 L-100,1100 Z" fill="#4a3420"/>
      <g fill="url(#gStrawX)" opacity=".8">${(() => { const r = rng(65); let p = ""; for (let i = 0; i < 60; i++) p += `<ellipse cx="${f1(160 + r() * 1280)}" cy="${f1(850 + r() * 60)}" rx="${f1(20 + r() * 40)}" ry="5" transform="rotate(${f1((r() - .5) * 30)} ${f1(160 + r() * 1280)} 860)"/>`; return p; })()}</g>
      ${lamp(1440, 470, .7)}
      ${PARTS.map(p => `<g id="${p.id}Art" class="pop hide">${art[p.id]}</g>`).join("")}
      ${PARTS.map(p => `<g id="${p.id}" data-hit="${p.id}"><circle cx="${p.x}" cy="${p.y}" r="${p.r}" fill="transparent"/><circle class="hotglow" cx="${p.x}" cy="${p.y}" r="${p.r * 1.1}" fill="url(#gGlowF)"/>${ring(p.r * .7, p.x, p.y)}</g>`).join("")}`;
    return K.film(root, api, {
      defs: defs(),
      shots: [{ name: "stable", svg: stable }],
      enter(i, step, F) {
        if (i <= 0) {
          PARTS.forEach(p => F.show("#" + p.id + "Art", false)); F.show("#warm", false);
          F.setBase("stable", "scale(1.2) translate(0px,60px)", "scale(1.0)");
          return;
        }
        if (i === 1) F.setBase("stable", null, "scale(1.02)");
        if (i === 2) { PARTS.forEach(p => F.show("#" + p.id + "Art")); F.show("#warm"); F.setBase("stable", null, "scale(1.35) translate(0px,-110px)"); }
      },
      tasks: {
        build(F, done) {
          taps(F, PARTS.map(p => p.id), (id, n) => {
            F.show("#" + id + "Art"); if (n === 2) F.show("#warm");
            sfx(api, id === "pBaby" ? "success" : id === "pSheep" ? "baa" : "chime");
            if (id === "pBaby") F.camSet("stable", "scale(1.2) translate(0px,-60px)");
          }, () => F.later(900, done), true);
        }
      }
    });
  };

  /* ================================================================== 5. SHEPHERDS AND ANGELS */
  const FLOCK = [[760, 780], [860, 800], [940, 770], [700, 820], [820, 840], [1000, 820]];
  const WANDER = [[150, 690, 640, 790], [1500, 700, 1080, 790], [380, 860, 600, 860], [1300, 880, 940, 860], [1180, 620, 900, 740]];
  S.shepherds = function (root, api) {
    const showAngel = F => { F.show("#glow"); if (F.state.angel) return; F.state.angel = true; F.show("#bigAngel"); sfx(api, "whoosh"); sfx(api, "choir"); };
    const field = `
      ${BG("url(#gNightX)")}
      ${starfield(260, 71, 460)}${moon(1380, 130, 28)}
      <g id="glow" class="slowfade hide"><rect x="-400" y="-200" width="2400" height="900" fill="#ffe8b0" opacity=".25"/><ellipse cx="800" cy="200" rx="1000" ry="520" fill="url(#gGloryX)"/></g>
      <path d="${ridge(520, 30, 72)}" fill="#1e2244"/>
      ${village(1060, 520, .55, 73, { wall: "#2a2a4a", shade: "#1e1e3a", roof: "#3a3a5a", door: "#0e0e20", lit: .6 })}
      <path d="${ridge(600, 40, 74)}" fill="#1a2a2a"/>
      <path d="M-400,660 C200,620 900,640 2000,660 L2000,1100 L-400,1100 Z" fill="#203226"/>
      ${grass(700, 75, "#2e4430", 240, 26)}
      <g id="bigAngel" class="slowfade hide"><g class="float">
        <circle cx="800" cy="260" r="360" fill="url(#gGloryX)"/>${wings(800, 226, 1.1)}
        ${folk(800, 420, 2.4, { robe: "#fbf6ea", mantle: "#f0d890", hair: "#d8a850", skin: "#e0b088", arms: "up", shadow: false })}
      </g></g>
      <g id="choir">${[[200, 230], [420, 170], [640, 130], [960, 130], [1180, 170], [1400, 230], [300, 360], [1300, 360]].map(([x, y], k) => `<g id="ch${k}" class="pop hide"><g class="float" style="animation-delay:${-k * .5}s">${angelFolk(x, y, .9, { flip: x > 800 })}</g></g>`).join("")}</g>
      <g id="sky" data-hit="sky"><rect x="-400" y="-200" width="2400" height="640" fill="transparent"/>${ring(90, 800, 260)}</g>
      <!-- the campfire and the shepherds -->
        <g transform="translate(460,780)"><ellipse rx="70" ry="14" fill="#000" opacity=".35"/><path d="M-36,0 L30,-12 M-30,-12 L36,0" stroke="#4a2a14" stroke-width="10" stroke-linecap="round"/>
          <path class="flickF" d="M0,-10 C20,-40 10,-70 0,-96 C-10,-70 -20,-40 0,-10 Z" fill="#ffa040"/><path class="flickF" d="M0,-12 C10,-30 6,-46 0,-60 C-6,-46 -10,-30 0,-12 Z" fill="#ffe08a"/><circle cy="-40" r="160" fill="url(#gWarmF)" opacity=".7" class="glowP"/></g>
      <g id="shepherds" class="walkSlow">
        ${[[330, 790, 1.5, "#6a5a3a", false], [590, 800, 1.45, "#5a4a5a", true], [470, 840, 1.6, "#4a5a4a", false]].map(([x, y, s, c, fl], k) => `<g class="lean" id="shep${k}">${folk(x, y, s, { robe: c, mantle: "#2a2018", head: "#c8b48a", skin: "#a8704a", sit: k === 2, flip: fl })}${k < 2 ? `<path d="M${x + (fl ? -30 : 30)},${y - 150} L${x + (fl ? -36 : 36)},${y}" stroke="#5a3a1e" stroke-width="6" stroke-linecap="round"/>` : ""}</g>`).join("")}
      </g>
      ${FLOCK.map(([x, y], k) => sheep(x, y, .9, { seed: k + 1, flip: k % 2 === 1 })).join("")}
      ${WANDER.map(([x, y], k) => `<g id="ws${k}" class="walk" data-hit="ws${k}"><circle cx="${x}" cy="${y - 34}" r="70" fill="transparent"/>${sheep(x, y, .95, { seed: 20 + k, flip: x > 800 })}${ring(56, x, y - 34)}</g>`).join("")}`;
    const angelShot = `
      ${BG("#141838")}
      <circle cx="700" cy="380" r="760" fill="url(#gGloryX)"/>
      ${[0, 1, 2, 3, 4, 5, 6, 7, 8].map(k => `<path d="M700,380 L${f1(700 + Math.cos(k * .7) * 1400)},${f1(380 + Math.sin(k * .7) * 1400)} L${f1(700 + Math.cos(k * .7 + .1) * 1400)},${f1(380 + Math.sin(k * .7 + .1) * 1400)} Z" fill="#fff8e0" opacity=".08"/>`).join("")}
      ${wings(560, 560, 2)}
      <g transform="translate(560,440) scale(1.55)">${figure("angel", { ...ANGEL, arm: K.arm({ shoulder: [46, 140], elbow: [118, 280], wrist: [240, 160], handAngle: -40, pose: "open", robe: "#f4eee0", cuff: "#e8c868", fold: "#a89a80", sleeveEnd: .45, ...GSKIN }) })}</g>`;
    return K.film(root, api, {
      defs: defs(),
      shots: [{ name: "field", svg: field }, { name: "angel", svg: angelShot }],
      chars: ["angel"],
      closeups: { angel: { shot: "angel", from: "scale(1)", to: "scale(1.07) translate(-20px,10px)" } },
      enter(i, step, F) {
        if (i <= 0) {
          WANDER.forEach((w, k) => { const g = F.$("#ws" + k); g.style.transition = "none"; g.style.transform = ""; g.getBoundingClientRect(); g.style.transition = ""; });
          F.show("#glow", false); F.show("#bigAngel", false); F.$$("#choir > g").forEach(g => F.show(g, false));
          F.state.angel = false; F.state.run = (F.state.run || 0) + 1;
          F.$("#shepherds").style.transform = ""; F.$$(".lean").forEach(l => l.style.transform = "");
          F.setBase("field", "scale(1.15) translate(0px,40px)", "scale(1.0)");
          return;
        }
        if (i === 1) F.setBase("field", null, "scale(1.02) translate(0px,-10px)");
        if (i === 2) { showAngel(F); F.$$(".lean").forEach((l, k) => l.style.transform = `rotate(${k === 1 ? 8 : -8}deg) scale(.96)`); F.setBase("field", null, "scale(1.08) translate(0px,40px)"); }
        if (i === 3) { F.$$(".lean").forEach(l => l.style.transform = ""); F.setBase("field", null, "scale(1.0) translate(0px,60px)"); }
        if (i === 4) {
          F.show("#bigAngel", false); F.show("#glow", false); F.$$("#choir > g").forEach(g => F.show(g, false));
          F.$("#shepherds").style.transform = "translate(560px,-110px) scale(.8)";
          F.setBase("field", null, "scale(1.15) translate(-180px,30px)");
        }
      },
      tasks: {
        sheep(F, done) {
          taps(F, WANDER.map((_, k) => "ws" + k), id => {
            const k = +id.slice(2), [x, y, tx, ty] = WANDER[k];
            F.$("#" + id).style.transform = `translate(${tx - x}px,${ty - y}px)`; sfx(api, "baa");
          }, () => F.later(1400, () => {
            done();
            // the narrator now says "...Just then, the sky began to glow." (about 3.6 s in): the sky glows on
            // those words and the angel appears as the line ends, instead of waiting for the next step
            const run = F.state.run;
            F.later(3900, () => { if (F.state.run === run) F.show("#glow"); });
            F.later(6400, () => { if (F.state.run === run) showAngel(F); });
          }));
        },
        choir(F, done) {
          presses(F, "sky", 8, n => { F.show("#ch" + (n - 1)); sfx(api, n % 2 ? "sparkle" : "choir"); }, () => F.later(800, done));
        }
      }
    });
  };

  /* ================================================================== 6. THE WISE MEN */
  const STAR_PATH = [[260, 190], [430, 140], [620, 110], [820, 105], [1010, 125], [1180, 170], [1260, 230]];
  S.magi = function (root, api) {
    const east = `
      ${BG("url(#gNightX)")}
      ${starfield(260, 81, 520)}
      ${bigStar(1160, 170, 22)}
      <path d="${ridge(560, 20, 82)}" fill="#2a1e3a"/>
      ${palm(160, 640, .9, "#1a1228")}${palm(1450, 650, 1, "#1a1228")}
      <!-- the wise men's camp in the eastern desert: tents, resting camels, a fire, and the three of them up on a rise watching the new star -->
      <path d="${ridge(600, 24, 86)}" fill="#241a34"/>
      ${village(1180, 600, .5, 87, { wall: "#2e2440", shade: "#221a32", roof: "#3a2e4e", door: "#120c1a", lit: .5 })}
      <path d="M-400,700 C0,640 400,560 640,560 C900,560 1200,650 2000,700 L2000,1100 L-400,1100 Z" fill="#2e2238"/>
      <path d="M-400,700 C0,640 400,560 640,560 C760,560 860,580 940,600" stroke="#4a3a52" stroke-width="4" fill="none" opacity=".6"/>
      ${[[180, 720, 1.1, "#6b2d5c", "#c8a040"], [1300, 740, 1.2, "#2d4d6b", "#d8c8a0"]].map(([x, y, sc, c1, c2]) => `<g transform="translate(${x},${y}) scale(${sc})"><path d="M-110,0 L-80,-90 L0,-120 L80,-90 L110,0 Z" fill="${c1}"/><path d="M-80,-90 L0,-120 L80,-90 L60,-80 L0,-104 L-60,-80 Z" fill="${c2}" opacity=".8"/><path d="M-20,0 L0,-70 L20,0 Z" fill="#120a14"/><path d="M0,-120 L0,-150" stroke="#3a2a1a" stroke-width="5"/></g>`).join("")}
      ${camel(1000, 790, .75, { fill: "#8a6a44", dark: "#5a4430", blanket: "#2a6a5a" })}${camel(1110, 810, .8, { fill: "#8a6a44", dark: "#5a4430", flip: true })}
      <g transform="translate(400,790)"><ellipse rx="50" ry="10" fill="#000" opacity=".35"/><path class="flickF" d="M0,-6 C16,-30 8,-56 0,-76 C-8,-56 -16,-30 0,-6 Z" fill="#ffa040"/><path class="flickF" d="M0,-8 C8,-22 5,-36 0,-46 C-5,-36 -8,-22 0,-8 Z" fill="#ffe08a"/><circle cy="-30" r="130" fill="url(#gWarmF)" opacity=".6" class="glowP"/></g>
      ${[[560, 566, "#5a2a6a"], [640, 560, "#2a5a4a"], [720, 566, "#7a3a1f"]].map(([x, y, c], k) => `${folk(x, y, 1.35, { robe: c, mantle: "#c8a040", head: "#f0e0b0", skin: "#8a5a3a", arms: k === 1 ? "out" : null, flip: false })}<path d="M${x - 12},${y - 140} l2,-14 l6,8 l4,-12 l4,12 l6,-8 l2,14 Z" fill="url(#gGoldF)"/>`).join("")}
      <path d="M-400,880 C400,860 1100,880 2000,870 L2000,1100 L-400,1100 Z" fill="#1e1530"/>`;
    const wiseShot = `
      ${BG("url(#gNightX)")}
      ${starfield(160, 83, 700)}
      ${bigStar(1260, 200, 30)}
      <g transform="translate(560,450) scale(1.55)">${figure("wiseman", { ...WISEMAN, lookUp: true, arm: K.arm({ shoulder: [46, 140], elbow: [130, 260], wrist: [250, 120], handAngle: -50, pose: "open", robe: "#2a3a6a", cuff: "#e0b040", fold: "#0e1430", sleeveEnd: .45, skin: "#9a6a44", shade: "#5a3420", lit: "#d09a6a" }) })}</g>`;
    const desert = `
      ${BG("url(#gNightX)")}
      ${starfield(260, 84, 560)}
      <g id="mStar" class="walkSlow">${bigStar(STAR_PATH[0][0], STAR_PATH[0][1], 24)}<g id="follow" data-hit="follow"><circle cx="${STAR_PATH[0][0]}" cy="${STAR_PATH[0][1]}" r="90" fill="transparent"/>${ring(70, STAR_PATH[0][0], STAR_PATH[0][1])}</g></g>
      <polygon id="beam" class="slowfade hide" points="1260,240 1180,640 1340,640" fill="#fff3c4" opacity=".22"/>
      <path d="M-400,620 C200,560 600,640 1000,590 C1300,560 1500,600 2000,580 L2000,1100 L-400,1100 Z" fill="#3a2a40"/>
      <g id="town" class="slowfade hide">${village(1080, 640, .7, 85, { wall: "#3a2e4a", shade: "#2a2038", roof: "#4a3e5a", door: "#140e1e", lit: .6 })}
        <g transform="translate(1260,640)"><rect x="-60" y="-110" width="120" height="110" fill="#4a3e5a"/><rect x="-66" y="-118" width="132" height="10" fill="#5e5270"/><rect x="-16" y="-60" width="32" height="60" fill="#ffc46a"/><circle cy="-40" r="90" fill="url(#gWarmF)" opacity=".6"/></g></g>
      <path d="M-400,720 C300,680 800,740 1200,700 C1500,676 1700,700 2000,690 L2000,1100 L-400,1100 Z" fill="#2c2034"/>
      ${palm(120, 720, .9, "#160e22")}
      <g id="caravan" class="walkSlow">
        ${camel(140, 840, .95, { rider: true, robe: "#6b2d5c", crown: true, walk: true })}${camel(380, 836, 1.0, { rider: true, robe: "#2d4d6b", crown: true, walk: true, blanket: "#2a6a5a" })}${camel(620, 842, .95, { rider: true, robe: "#7a3b1f", crown: true, walk: true, blanket: "#c8902a" })}
      </g>
      <path d="M-400,870 C400,850 1000,880 2000,860 L2000,1100 L-400,1100 Z" fill="#1c1426"/>`;
    const GIFTS = [
      { id: "gGold", x: 840, label: "Gold", note: "A gift fit for a King", art: `<rect x="-60" y="-70" width="120" height="70" rx="8" fill="#7a4a12"/><path d="M-62,-70 C-62,-112 62,-112 62,-70 Z" fill="#9a5e18"/><rect x="-64" y="-74" width="128" height="10" fill="#f0c26a"/><rect x="-12" y="-62" width="24" height="26" rx="4" fill="#f0c26a"/>` },
      { id: "gFrank", x: 970, label: "Frankincense", note: "Incense for worshipping God", art: `<path d="M-40,0 C-60,-40 -50,-90 -28,-100 L28,-100 C50,-90 60,-40 40,0 Z" fill="#d9cfb8"/><rect x="-32" y="-112" width="64" height="16" rx="6" fill="#b9ab8c"/><path class="smokeX" d="M0,-120 C-20,-150 20,-170 0,-200 C-20,-230 16,-250 4,-280" stroke="#e8e3f6" stroke-width="8" fill="none" opacity=".55" stroke-linecap="round"/>` },
      { id: "gMyrrh", x: 1100, label: "Myrrh", note: "A spice that pointed to Jesus giving his life for us", art: `<path d="M-30,0 L-36,-80 C-36,-100 -16,-110 -12,-130 L12,-130 C16,-110 36,-100 36,-80 L30,0 Z" fill="#5c2a4a"/><rect x="-16" y="-150" width="32" height="22" rx="5" fill="#c9a050"/><path d="M-30,-60 L30,-60" stroke="#c9a050" stroke-width="5"/>` }
    ];
    const house = `
      ${BG("url(#gRoomX)")}
      <rect x="-400" y="-200" width="2400" height="1300" fill="#000" filter="url(#fStone)" opacity=".45"/>
      <g><path d="M1240,120 L1240,420 L1440,420 L1440,120 Z" fill="#141a44"/>${bigStar(1340, 200, 14)}<rect x="1230" y="110" width="220" height="320" fill="none" stroke="#5a3a24" stroke-width="16"/></g>
      ${lamp(200, 560, 1)}
      <path d="M-400,700 L2000,700 L2000,1100 L-400,1100 Z" fill="#3a2414"/>
      <!-- Mary with the young child Jesus -->
      <g transform="translate(1290,0)"><circle cx="0" cy="560" r="220" fill="url(#gGlowF)" opacity=".5" class="glowP"/>
        ${folk(0, 760, 2.5, { sit: true, robe: "#d8c8b0", mantle: "#2f4f8f", head: "#2f4f8f", skin: "#d49e72", flip: true })}
        <!-- the young child sits on Mary's lap, her arm around him -->
        ${folk(-78, 716, 1.05, { sit: true, robe: "#f4eee0", mantle: "#e8d8b8", hair: "#5a3a22", skin: "#e2b08a", flip: true, shadow: false })}
        ${K.limb([[-16, 646], [-34, 694], [-64, 712], [-100, 708]], [30, 26, 22, 18], "#2f4f8f")}<ellipse cx="-104" cy="707" rx="9" ry="7" fill="#d49e72"/></g>
      ${folk(1500, 760, 2.6, { robe: "#7a5a3a", mantle: "#4a3a2a", head: "#c8b088", skin: "#a8704a", flip: true })}
      <!-- the wise men, bowed down -->
      ${[[300, "#6b2d5c"], [500, "#2d4d6b"], [700, "#7a3b1f"]].map(([x, c]) => `<g>${folk(x - 120, 800, 1.9, { bow: true, robe: c, mantle: "#c8a040", hair: "#f0e0b0", skin: "#8a5a3a" })}<path d="M${x - 120},${800 - 70} l-10,-20 l8,6 l6,-16 l6,16 l8,-6 l-8,20 Z" fill="url(#gGoldF)"/></g>`).join("")}
      <g id="gifts">${GIFTS.map(g => `<g id="${g.id}" data-hit="${g.id}" transform="translate(${g.x},850) scale(.8)"><circle cx="0" cy="-70" r="110" fill="transparent"/><circle class="hotglow" cx="0" cy="-60" r="90" fill="url(#gGlowF)"/>${ring(90, 0, -60)}${g.art}<g class="lbl fade hide"><text y="44" text-anchor="middle" fill="#f4ead2" font-family="Georgia,serif" font-weight="700" font-size="30">${g.label}</text></g></g>`).join("")}</g>`;
    return K.film(root, api, {
      defs: defs(),
      shots: [{ name: "east", svg: east }, { name: "wiseman", svg: wiseShot }, { name: "desert", svg: desert }, { name: "house", svg: house }],
      chars: ["wiseman"],
      closeups: { wiseman: { shot: "wiseman", from: "scale(1)", to: "scale(1.07) translate(-20px,10px)" } },
      enter(i, step, F) {
        if (i <= 0) {
          F.$("#mStar").style.transform = ""; F.$("#caravan").style.transform = ""; F.show("#town", false); F.show("#beam", false);
          F.$$("#gifts .lbl").forEach(l => F.show(l, false)); F.$$("#caravan .leg").forEach(l => l.style.animationPlayState = "paused");
          F.setBase("east", "scale(1.15) translate(-80px,30px)", "scale(1.0)");
          return;
        }
        if (i === 1) F.setBase("desert", "scale(1.1) translate(80px,20px)", "scale(1.0)", 2200);
        if (i === 2) F.setBase("house", "scale(1.32) translate(0px,-150px)", "scale(1.2) translate(0px,-115px)", 2200);
      },
      tasks: {
        follow(F, done) {
          const legs = on => F.$$("#caravan .leg").forEach(l => l.style.animationPlayState = on ? "running" : "paused");
          legs(false);
          presses(F, "follow", STAR_PATH.length - 1, n => {
            const [x, y] = STAR_PATH[n];
            F.$("#mStar").style.transform = `translate(${x - STAR_PATH[0][0]}px,${y - STAR_PATH[0][1]}px)`;
            F.$("#caravan").style.transform = `translate(${n * 95}px,0)`; legs(true);
            clearTimeout(F.state.legT); F.state.legT = setTimeout(() => legs(false), 2800);
            sfx(api, "step"); sfx(api, "pop");
            if (n >= 4) F.show("#town");
          }, () => F.later(2000, () => { F.show("#beam"); sfx(api, "success"); done(); }));
        },
        gifts(F, done) {
          taps(F, GIFTS.map(g => g.id), id => {
            const g = GIFTS.find(x => x.id === id); sfx(api, "chime");
            F.show(F.$(`#${id} .lbl`)); api.bubble(g.x, 640, g.label, g.note);
          }, () => F.later(2200, done));
        }
      }
    });
  };

  /* ================================================================== 7. THE GREATEST GIFT */
  S.gift = function (root, api) {
    const COLS = 13, ROWS = 3;
    let wall = "";
    for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
      const x = 120 + c * 113 + (r % 2) * 56, y = 360 + r * 115, s = .42 + r * .07;
      wall += `<g id="w${r * COLS + c}">${candle(x, y, s)}</g>`;
    }
    const night = `
      ${BG("url(#gNightX)")}
      ${starfield(280, 91, 600)}
      ${bigStar(800, 150, 26, { beam: 520 })}
      <path d="${ridge(600, 30, 92)}" fill="#1e1a3a"/>
      ${village(380, 640, 1.1, 93, { wall: "#2e2e50", shade: "#22223e", roof: "#3c3c60", door: "#101024", lit: .55 })}
      <path d="M-400,700 C300,670 1200,690 2000,700 L2000,1100 L-400,1100 Z" fill="#141228"/>
      ${olive(160, 760, 1, "#0e0c1e", 94)}${olive(1450, 770, 1.1, "#0e0c1e", 95)}`;
    const candles = `
      ${BG("#120c0a")}
      <rect x="-400" y="-200" width="2400" height="1300" fill="#000" filter="url(#fStone)" opacity=".6"/>
      <!-- an arched window and three long shelves for the candles -->
      <path d="M680,250 L680,60 A120,120 0 0 1 920,60 L920,250 Z" fill="#141a44" opacity=".8"/>${bigStar(800, 80, 10)}
      <path d="M680,250 L680,60 A120,120 0 0 1 920,60 L920,250" fill="none" stroke="#3a2618" stroke-width="14"/>
      ${[0, 1, 2].map(r => `<rect x="-400" y="${360 + r * 115}" width="2400" height="14" fill="#4a2e1a"/><rect x="-400" y="${374 + r * 115}" width="2400" height="8" fill="#000" opacity=".4"/>`).join("")}
      <g id="wallLit" class="slowfade hide"><ellipse cx="800" cy="560" rx="1000" ry="420" fill="url(#gWarmF)" opacity=".35"/></g>
      <g id="wall">${wall}</g>
      <path d="M-400,820 L2000,820 L2000,1100 L-400,1100 Z" fill="#1a120c"/>
      <g id="mainC" class="walkSlow">${candle(800, 860, 1.5, { id: "big", hit: "candle" })}</g>
      <text id="wallLabel" x="800" y="80" text-anchor="middle" fill="#f0d8a0" font-family="Georgia,serif" font-size="30" opacity=".85"></text>`;
    const jesusShot = `
      ${BG("#0c0a18")}
      <circle cx="700" cy="420" r="680" fill="url(#gWarmF)" opacity=".55"/>
      <g transform="translate(600,440) scale(1.6)">${figure("jesus", { ...JESUS, arm: K.arm({ shoulder: [46, 140], elbow: [118, 292], wrist: [258, 206], handAngle: -28, pose: "palmup", robe: "#e6dac2", cuff: "#8a2a24", fold: "#8a7a64", sleeveEnd: .45, ...JSKIN,
        over: `<g transform="translate(300,170)">${candle(0, 0, .55, { lit: true }).replace('class="flame fade "', 'class="flame"')}</g>` }) })}</g>`;

    let count = 0;
    const paintWall = (F, n) => {
      const total = ROWS * COLS, lit = Math.min(total, n);
      const order = Array.from({ length: total }, (_, i) => i).sort((a, b) => ((a * 37) % total) - ((b * 37) % total));
      order.forEach((idx, j) => F.show(F.$(`#w${idx} .flame`), j < lit));
      F.$("#wallLabel").textContent = api.shared && api.shared() && n > 0 ? `${n.toLocaleString()} candle${n === 1 ? "" : "s"} lit at this station` : "";
    };
    let film;
    film = K.film(root, api, {
      defs: defs(),
      shots: [{ name: "night", svg: night }, { name: "candles", svg: candles }, { name: "jesus", svg: jesusShot }],
      chars: ["jesus"],
      closeups: { jesus: { shot: "jesus", from: "scale(1)", to: "scale(1.06) translate(-20px,8px)" } },
      enter(i, step, F) {
        if (i <= 0) {
          F.show(F.$("#big .flame"), false); F.show("#wallLit", false); F.$("#mainC").style.transform = "";
          api.count("candles", false).then(n => { count = n; paintWall(F, n); });
          F.setBase("night", "scale(1.0) translate(0px,60px)", "scale(1.12) translate(0px,-10px)");
          return;
        }
        if (i === 1) F.setBase("candles", "scale(1.2) translate(0px,-60px)", "scale(1.05) translate(0px,-20px)", 2000);
        if (i === 2) {
          F.setBase("candles", null, "scale(1.0)"); F.show("#wallLit");
          // the light spreads from this visitor's candle to the whole wall
          const total = ROWS * COLS;
          for (let k = 0; k < total; k++) F.later(300 + k * 70, () => F.show(F.$(`#w${k} .flame`)));
          F.later(300 + total * 70, () => sfx(api, "success"));
        }
      },
      tasks: {
        candle(F, done) {
          F.arm("candle", async () => {
            F.show(F.$("#big .flame")); sfx(api, "success");
            count = await api.count("candles", true); paintWall(F, count - 1);
            F.later(1500, done);
          });
        }
      }
    });
    return film;
  };
})();
