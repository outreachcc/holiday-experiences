/* Scenes: hand-drawn SVG artwork + the interactive task for each station.
   Each factory renders into `root` and returns { enter(i, step), startTask(name, done), press() }.
   Coordinates use a 1600 x 900 stage. Keep important action between x 200-1400, y 120-720. */
(function () {
  const S = {};

  /* ---------- helpers ---------- */
  function rng(seed) { return function () { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  const $ = (root, sel) => root.querySelector(sel);
  const $$ = (root, sel) => Array.from(root.querySelectorAll(sel));
  const show = (el, on = true) => el && el.classList.toggle("hide", !on);
  const move = (el, x, y, s) => { if (el) el.style.transform = `translate(${x}px, ${y}px)` + (s ? ` scale(${s})` : ""); };
  function hot(el, on) { if (el) el.classList.toggle("hot", on); }

  const DEFS = `<defs>
    <linearGradient id="gNight" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#02041a"/><stop offset=".55" stop-color="#101a48"/><stop offset="1" stop-color="#352a5a"/></linearGradient>
    <linearGradient id="gDusk" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#070b2c"/><stop offset=".45" stop-color="#2a2560"/><stop offset=".78" stop-color="#7d4a73"/><stop offset="1" stop-color="#d9866a"/></linearGradient>
    <linearGradient id="gDesert" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#05061d"/><stop offset=".6" stop-color="#1d1650"/><stop offset="1" stop-color="#4a2a5e"/></linearGradient>
    <linearGradient id="gRoom" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2a170c"/><stop offset="1" stop-color="#5c3517"/></linearGradient>
    <linearGradient id="gSand" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2c1d3a"/><stop offset="1" stop-color="#140c22"/></linearGradient>
    <linearGradient id="gWax" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#cdb98f"/><stop offset=".3" stop-color="#fff5df"/><stop offset=".55" stop-color="#f4e6c6"/><stop offset="1" stop-color="#bfa67a"/></linearGradient>
    <linearGradient id="gBrass" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#8a5e1a"/><stop offset=".35" stop-color="#f0c56a"/><stop offset=".6" stop-color="#c9922e"/><stop offset="1" stop-color="#7a5418"/></linearGradient>
    <radialGradient id="gGlow"><stop offset="0" stop-color="#fff6d6"/><stop offset=".2" stop-color="#ffd780" stop-opacity=".7"/><stop offset="1" stop-color="#ffb347" stop-opacity="0"/></radialGradient>
    <radialGradient id="gWhite"><stop offset="0" stop-color="#ffffff" stop-opacity=".95"/><stop offset=".35" stop-color="#e9f0ff" stop-opacity=".45"/><stop offset="1" stop-color="#c9d6ff" stop-opacity="0"/></radialGradient>
    <radialGradient id="gWarm"><stop offset="0" stop-color="#ffcf7a" stop-opacity=".75"/><stop offset=".5" stop-color="#ff9a3c" stop-opacity=".25"/><stop offset="1" stop-color="#ff7a1a" stop-opacity="0"/></radialGradient>
    <radialGradient id="gDawn" cx=".5" cy="1" r=".8"><stop offset="0" stop-color="#ffe8a8" stop-opacity=".95"/><stop offset=".35" stop-color="#ffb35c" stop-opacity=".45"/><stop offset="1" stop-color="#ff8a3c" stop-opacity="0"/></radialGradient>
    <filter id="fGlow" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="7" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
    <filter id="fSoft"><feGaussianBlur stdDeviation="3"/></filter>
  </defs>
  <style>
    .tw{animation:tw 3.2s ease-in-out infinite}@keyframes tw{50%{opacity:.25}}
    .ring{display:none;fill:none;stroke:#ffd889;stroke-width:5;transform-box:fill-box;transform-origin:center;animation:ring 1.5s ease-out infinite}
    .hot{cursor:pointer}.hot .ring{display:inline}.spot:not(.hot){pointer-events:none}
    @keyframes ring{0%{opacity:.95;transform:scale(.6)}100%{opacity:0;transform:scale(1.5)}}
    .fade{transition:opacity 1.2s ease}.hide{opacity:0;pointer-events:none}
    .pop{transform-box:fill-box;transform-origin:50% 100%;transition:transform .8s cubic-bezier(.3,1.5,.5,1),opacity .6s}.pop.hide{transform:scale(.15)}
    .flick{transform-box:fill-box;transform-origin:50% 100%;animation:flick .16s infinite alternate}@keyframes flick{to{transform:scaleY(1.13) scaleX(.92)}}
    .float{animation:float 4s ease-in-out infinite}@keyframes float{50%{transform:translateY(-14px)}}
    .dleaf{transform-box:fill-box;transform-origin:0 50%;transition:transform .6s ease}
    .slow{transition:transform 1.2s cubic-bezier(.45,.05,.3,1)}
    .slower{transition:transform 2.2s cubic-bezier(.45,.05,.3,1)}
    .walk{animation:walk .55s ease-in-out}@keyframes walk{50%{transform:translateY(-7px)}}
    .snow{animation:snow linear infinite}@keyframes snow{from{transform:translate(0,-40px)}to{transform:translate(60px,960px)}}
    .glowpulse{animation:gp 2.6s ease-in-out infinite}@keyframes gp{50%{opacity:.6}}
    text{font-family:Nunito,system-ui,sans-serif}
  </style>`;

  function svgWrap(inner, bg) {
    return `<svg viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">${DEFS}<rect x="-800" y="-100" width="3200" height="1100" fill="${bg}"/>${inner}</svg>`;
  }

  function starfield(n, seed, yMax = 560, x0 = -200, x1 = 1800) {
    const r = rng(seed); let s = "";
    for (let i = 0; i < n; i++) {
      const x = x0 + r() * (x1 - x0), y = r() * yMax, rad = r() < 0.12 ? 2.4 : 0.8 + r() * 1.2;
      s += `<circle class="tw" cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${rad.toFixed(1)}" fill="#fff8e6" opacity="${(0.4 + r() * 0.6).toFixed(2)}" style="animation-delay:${(-r() * 3.2).toFixed(2)}s"/>`;
    }
    return s;
  }

  function star8(r) {
    let p = "";
    for (let i = 0; i < 16; i++) { const a = Math.PI / 8 * i - Math.PI / 2, rr = i % 2 ? r * 0.3 : (i % 4 ? r * 0.62 : r); p += `${(Math.cos(a) * rr).toFixed(1)},${(Math.sin(a) * rr).toFixed(1)} `; }
    return `<polygon points="${p}" fill="#fff6d6"/>`;
  }
  function bigStar(x, y, r, id, extra = "") {
    return `<g id="${id}" transform="translate(${x},${y})" ${extra}>
      <circle r="${r * 3.2}" fill="url(#gGlow)" class="glowpulse"/>
      <path d="M0,${-r * 2.6} L0,${r * 2.6} M${-r * 1.6},0 L${r * 1.6},0" stroke="#fff6d6" stroke-width="2" opacity=".7"/>
      <g filter="url(#fGlow)">${star8(r)}</g></g>`;
  }

  /* ---------- figures (feet at 0,0; ~200 units tall) ---------- */
  const SIL = "#0a0c20";
  const headcloth = f => `<path d="M-19,-176 C-21,-204 21,-204 19,-176 L27,-150 L-27,-150 Z" fill="${f}"/>`;
  function person(x, y, s, o = {}) {
    const f = o.fill || SIL; let g = "";
    if (o.staff) g += `<path d="M40,4 L40,-196" stroke="${f}" stroke-width="7" stroke-linecap="round"/>`;
    if (o.crook) g += `<path d="M40,4 L40,-206 C40,-238 74,-238 74,-210" stroke="${f}" stroke-width="7" stroke-linecap="round" fill="none"/>`;
    g += `<circle cx="0" cy="-178" r="17" fill="${f}"/>`;
    g += `<path d="M-16,-160 C-34,-150 -40,-110 -44,-60 L-50,0 L50,0 L44,-60 C40,-110 34,-150 16,-160 Z" fill="${f}"/>`;
    g += o.crown ? `<path d="M-17,-190 L-19,-214 L-9,-203 L0,-220 L9,-203 L19,-214 L17,-190 Z" fill="${o.crown}"/>` : headcloth(o.hood || f);
    if (o.hood) g += `<path d="M-27,-150 C-34,-120 -40,-90 -44,-60 L-30,-60 C-26,-100 -22,-130 -16,-152 Z M27,-150 C34,-120 40,-90 44,-60 L30,-60 C26,-100 22,-130 16,-152 Z" fill="${o.hood}"/>`;
    if (o.cape) g += `<path d="M-20,-158 C-50,-120 -60,-60 -62,0 L-40,0 C-38,-60 -30,-120 -10,-156 Z" fill="${o.cape}"/>`;
    if (o.lantern) g += `<path d="M20,-120 L52,-96" stroke="${f}" stroke-width="10" stroke-linecap="round"/><circle cx="58" cy="-82" r="40" fill="url(#gWarm)"/><rect x="50" y="-96" width="16" height="22" rx="3" fill="#ffd27a"/>`;
    if (o.gift) g += `<path d="M18,-120 L46,-104" stroke="${f}" stroke-width="10" stroke-linecap="round"/><rect x="40" y="-120" width="26" height="22" rx="3" fill="${o.gift}"/>`;
    return `<g transform="translate(${x},${y}) scale(${o.flip ? -s : s},${s})">${g}</g>`;
  }
  function kneeling(x, y, s, o = {}) {
    const f = o.fill || SIL;
    let g = `<circle cx="0" cy="-122" r="16" fill="${f}"/>`;
    g += `<path d="M-18,-106 C-38,-94 -46,-52 -44,-22 L-50,0 L58,0 C60,-14 48,-22 26,-28 C30,-62 24,-94 16,-106 Z" fill="${f}"/>`;
    g += `<path d="M-18,-120 C-20,-146 20,-146 18,-120 L24,-98 L-24,-98 Z" fill="${o.hood || f}"/>`;
    if (o.hood) g += `<path d="M-24,-98 C-32,-70 -40,-40 -44,-20 L-32,-20 C-28,-50 -22,-76 -14,-100 Z" fill="${o.hood}"/>`;
    if (o.hands) g += `<path d="M10,-80 L34,-92" stroke="${f}" stroke-width="9" stroke-linecap="round"/>`;
    return `<g transform="translate(${x},${y}) scale(${o.flip ? -s : s},${s})">${g}</g>`;
  }
  function angel(x, y, s, o = {}) {
    const wing = `<path d="M-6,-150 C-62,-222 -158,-208 -160,-118 C-132,-142 -100,-132 -74,-112 C-102,-118 -128,-98 -132,-70 C-100,-96 -58,-104 -18,-106 Z" fill="#eef1ff" opacity=".92"/>`;
    return `<g transform="translate(${x},${y}) scale(${s})" ${o.attrs || ""}>
      <circle cx="0" cy="-120" r="${o.glow || 210}" fill="url(#gWhite)"/>
      ${wing}<g transform="scale(-1,1)">${wing}</g>
      <path d="M-16,-158 C-32,-138 -38,-96 -50,-14 C-18,-2 18,-2 50,-14 C38,-96 32,-138 16,-158 Z" fill="#ffffff"/>
      <path d="M-14,-150 L-46,-${o.armsUp ? 214 : 120}" stroke="#ffffff" stroke-width="10" stroke-linecap="round"/>
      <path d="M14,-150 L46,-${o.armsUp ? 214 : 120}" stroke="#ffffff" stroke-width="10" stroke-linecap="round"/>
      <circle cx="0" cy="-176" r="16" fill="#fffaf0"/>
      <ellipse cx="0" cy="-202" rx="20" ry="6" fill="none" stroke="#ffd56b" stroke-width="4"/>
    </g>`;
  }
  function donkey(x, y, s, o = {}) {
    const f = o.fill || SIL;
    return `<g transform="translate(${x},${y}) scale(${o.flip ? -s : s},${s})" fill="${f}">
      <rect x="-56" y="-72" width="11" height="72" rx="4"/><rect x="-36" y="-72" width="11" height="72" rx="4"/>
      <rect x="30" y="-72" width="11" height="72" rx="4"/><rect x="48" y="-72" width="11" height="72" rx="4"/>
      <ellipse cx="0" cy="-86" rx="72" ry="34"/>
      <path d="M40,-104 C60,-122 70,-142 78,-152 L100,-140 C92,-120 82,-98 62,-76 Z"/>
      <path d="M74,-156 C88,-168 112,-150 124,-128 C130,-118 122,-108 110,-112 C100,-116 88,-128 78,-138 Z"/>
      <path d="M78,-152 L68,-192 L88,-158 Z"/><path d="M88,-156 L92,-194 L97,-154 Z"/>
      <path d="M-70,-94 C-86,-82 -88,-60 -86,-42" stroke="${f}" stroke-width="5" fill="none" stroke-linecap="round"/>
      ${o.rider ? kneeling(-6, -100, 0.78, { hood: o.rider }) : ""}
    </g>`;
  }
  function ox(x, y, s, o = {}) {
    const f = o.fill || SIL;
    return `<g transform="translate(${x},${y}) scale(${o.flip ? -s : s},${s})" fill="${f}">
      <rect x="-70" y="-62" width="14" height="62" rx="5"/><rect x="-46" y="-62" width="14" height="62" rx="5"/>
      <rect x="34" y="-62" width="14" height="62" rx="5"/><rect x="56" y="-62" width="14" height="62" rx="5"/>
      <rect x="-82" y="-128" width="164" height="74" rx="34"/>
      <path d="M70,-116 C96,-128 116,-120 124,-100 C130,-84 122,-72 108,-74 C92,-76 80,-86 68,-90 Z"/>
      <path d="M96,-122 C90,-146 104,-154 112,-150 C104,-144 104,-132 106,-122 Z"/>
      <path d="M-82,-110 C-96,-96 -96,-76 -92,-58" stroke="${f}" stroke-width="5" fill="none"/>
    </g>`;
  }
  // Fleece outline: an oval with scalloped "curly wool" edge
  function fleecePath(cx, cy, rx, ry, bumps, depth) {
    let d = "";
    for (let k = 0; k <= bumps; k++) {
      const a0 = (k / bumps) * Math.PI * 2, a1 = ((k + 0.5) / bumps) * Math.PI * 2, a2 = ((k + 1) / bumps) * Math.PI * 2;
      const p = a => [cx + Math.cos(a) * rx, cy + Math.sin(a) * ry];
      const [x0, y0] = p(a0), [x2, y2] = p(a2);
      const [xm, ym] = [cx + Math.cos(a1) * (rx + depth), cy + Math.sin(a1) * (ry + depth)];
      if (k === 0) d += `M${x0.toFixed(1)},${y0.toFixed(1)} `;
      if (k < bumps) d += `Q${xm.toFixed(1)},${ym.toFixed(1)} ${x2.toFixed(1)},${y2.toFixed(1)} `;
    }
    return d + "Z";
  }
  const FLEECE = fleecePath(0, -46, 40, 22, 14, 9), FLEECE_IN = fleecePath(-2, -50, 26, 12, 9, 6);
  function sheep(x, y, s, o = {}) {
    const wool = o.wool || "#efe7d4", shade = o.shade || "#cbbfa6", d = o.fill || "#2b2233";
    return `<g transform="translate(${x},${y}) scale(${o.flip ? -s : s},${s})">
      <ellipse cx="2" cy="1" rx="40" ry="5" fill="#000" opacity=".25"/>
      <g stroke="${d}" stroke-width="5.5" stroke-linecap="round">
        <path d="M-24,-30 L-26,-2"/><path d="M-10,-28 L-9,-2"/><path d="M16,-28 L18,-2"/><path d="M28,-30 L31,-2"/></g>
      <g fill="${d}"><rect x="-30" y="-4" width="8" height="5" rx="2"/><rect x="-13" y="-4" width="8" height="5" rx="2"/><rect x="14" y="-4" width="8" height="5" rx="2"/><rect x="27" y="-4" width="8" height="5" rx="2"/></g>
      <circle cx="-46" cy="-52" r="7" fill="${wool}"/>
      <path d="${FLEECE}" fill="${wool}" stroke="${shade}" stroke-width="2"/>
      <path d="M-38,-36 Q0,-20 38,-36 Q30,-26 0,-24 Q-30,-26 -38,-36 Z" fill="${shade}" opacity=".55"/>
      <path d="${FLEECE_IN}" fill="#fffaf0" opacity=".55"/>
      <g transform="translate(40,-56) rotate(18)">
        <path d="M-6,-6 C-22,-12 -26,-2 -14,2 Z" fill="${d}"/>
        <path d="M-8,-12 C2,-20 22,-16 28,0 C32,10 24,18 14,18 C4,18 -6,10 -10,0 Z" fill="${d}"/>
        <path d="M-2,-14 C2,-24 14,-24 16,-14 C10,-10 2,-10 -2,-14 Z" fill="${wool}"/>
        <circle cx="12" cy="-2" r="3.2" fill="#fff"/><circle cx="12.8" cy="-1.6" r="1.6" fill="#111"/>
        <path d="M22,10 q3,3 6,0" stroke="#5a4a5c" stroke-width="1.6" fill="none" stroke-linecap="round"/>
        <path d="M4,-8 C-4,-14 -18,-10 -20,-2 C-14,0 -4,-2 4,-6 Z" fill="${d}"/>
      </g>
    </g>`;
  }
  function camel(x, y, s, o = {}) {
    const f = o.fill || SIL;
    return `<g transform="translate(${x},${y}) scale(${o.flip ? -s : s},${s})" fill="${f}">
      <rect x="-62" y="-118" width="12" height="118" rx="5"/><rect x="-42" y="-118" width="12" height="118" rx="5"/>
      <rect x="34" y="-118" width="12" height="118" rx="5"/><rect x="52" y="-118" width="12" height="118" rx="5"/>
      <path d="M-74,-124 C-70,-176 -20,-186 -6,-150 C6,-182 54,-178 64,-128 C76,-118 74,-102 62,-98 L-74,-98 C-86,-104 -86,-118 -74,-124 Z"/>
      <path d="M56,-126 C84,-134 88,-166 98,-190 C104,-202 126,-202 134,-190 L140,-180 C128,-180 118,-180 112,-172 C102,-150 96,-118 70,-98 Z"/>
      <path d="M-78,-114 C-92,-100 -94,-84 -90,-70" stroke="${f}" stroke-width="5" fill="none"/>
      ${o.rider ? `<g transform="translate(-6,-160)"><circle cx="0" cy="-58" r="14" fill="${f}"/><path d="M-16,-46 C-26,-30 -30,-10 -32,8 L32,8 C30,-10 26,-30 16,-46 Z" fill="${o.robe || f}"/><path d="M-14,-68 L-16,-88 L-7,-79 L0,-93 L7,-79 L16,-88 L14,-68 Z" fill="${o.rider}"/></g>` : ""}
      ${o.robe ? `<path d="M-40,-150 C-20,-160 10,-160 30,-150 L36,-104 L-46,-104 Z" fill="${o.robe}" opacity=".85"/>` : ""}
    </g>`;
  }
  function manger(x, y, s, o = {}) {
    return `<g transform="translate(${x},${y}) scale(${s})">
      <path d="M-64,0 L-30,-70 M64,0 L30,-70 M-30,0 L-64,-70 M30,0 L64,-70" stroke="#3a2412" stroke-width="9" stroke-linecap="round"/>
      <path d="M-78,-82 L78,-82 L60,-36 L-60,-36 Z" fill="#5b3a1d"/>
      <path d="M-74,-82 L74,-82" stroke="#7a5128" stroke-width="5"/>
      <g stroke="#e3b95e" stroke-width="3" stroke-linecap="round" opacity=".95">
        <path d="M-70,-84 L-58,-100 M-50,-84 L-46,-104 M-30,-84 L-36,-102 M-12,-84 L-4,-106 M8,-84 L2,-100 M26,-84 L34,-104 M44,-84 L40,-100 M60,-84 L70,-98"/></g>
    </g>`;
  }
  function baby(x, y, s) {
    return `<g transform="translate(${x},${y}) scale(${s})">
      <circle cx="0" cy="-96" r="120" fill="url(#gGlow)" class="glowpulse"/>
      <ellipse cx="4" cy="-96" rx="40" ry="17" fill="#f7efe0"/>
      <path d="M-24,-104 C-6,-96 14,-108 34,-98" stroke="#e1d3b8" stroke-width="3" fill="none"/>
      <circle cx="-36" cy="-100" r="12" fill="#e8c9a2"/>
    </g>`;
  }
  function stable(x, y, s) {
    let planks = ""; for (let i = -300; i <= 300; i += 40) planks += `<path d="M${i},-340 L${i},0" stroke="#1d110a" stroke-width="3"/>`;
    return `<g transform="translate(${x},${y}) scale(${s})">
      <rect x="-320" y="-350" width="640" height="350" fill="#2b1a0f"/>${planks}
      <ellipse cx="0" cy="-120" rx="380" ry="260" fill="url(#gWarm)"/>
      <rect x="-340" y="-350" width="26" height="350" fill="#1a0f08"/><rect x="314" y="-350" width="26" height="350" fill="#1a0f08"/>
      <path d="M-400,-330 L0,-450 L400,-330 L392,-306 L0,-422 L-392,-306 Z" fill="#130b06"/>
      <path d="M-380,-326 L0,-436 L380,-326" stroke="#3d2614" stroke-width="6" fill="none"/>
      <ellipse cx="0" cy="-4" rx="300" ry="26" fill="#c99a45" opacity=".45"/>
    </g>`;
  }
  function house(x, y, w, h, o = {}) {
    const f = o.fill || "#141030", lit = o.lit !== false;
    let g = `<rect x="${x}" y="${y - h}" width="${w}" height="${h}" fill="${f}"/>`;
    g += `<rect x="${x - 4}" y="${y - h - 8}" width="${w + 8}" height="10" fill="${f}"/>`;
    if (o.dome) g += `<path d="M${x + w / 2 - w * 0.28},${y - h - 6} A${w * 0.28},${w * 0.28} 0 0 1 ${x + w / 2 + w * 0.28},${y - h - 6} Z" fill="${f}"/>`;
    if (o.door !== false) g += `<path d="M${x + w * 0.4},${y} L${x + w * 0.4},${y - h * 0.32} A${w * 0.1},${w * 0.1} 0 0 1 ${x + w * 0.6},${y - h * 0.32} L${x + w * 0.6},${y} Z" fill="#05040f"/>`;
    if (lit && w > 50) { g += `<rect x="${x + w * 0.16}" y="${y - h * 0.72}" width="${w * 0.14}" height="${h * 0.16}" fill="#ffcf6e" opacity=".9"/>`; if (o.two) g += `<rect x="${x + w * 0.7}" y="${y - h * 0.72}" width="${w * 0.14}" height="${h * 0.16}" fill="#ffcf6e" opacity=".75"/>`; }
    return g;
  }
  function town(x, y, s, seed, fill) {
    const r = rng(seed); let g = "", cx = 0;
    for (let i = 0; i < 9; i++) {
      const w = 60 + r() * 70, h = 50 + r() * 90;
      g += house(cx, 0, w, h, { fill, dome: r() < 0.25, two: r() < 0.5, lit: r() < 0.8 });
      cx += w - 6 + r() * 6;
    }
    return `<g transform="translate(${x},${y}) scale(${s})">${g}</g>`;
  }
  function palm(x, y, s, f = SIL) {
    const leaf = a => `<path d="M0,0 C40,-30 90,-20 120,20 C80,-6 40,-8 0,6 Z" fill="${f}" transform="rotate(${a})"/>`;
    return `<g transform="translate(${x},${y}) scale(${s})"><path d="M0,0 C10,-80 0,-160 20,-240" stroke="${f}" stroke-width="16" fill="none" stroke-linecap="round"/>
      <g transform="translate(20,-240)">${[-160, -120, -60, -20, 20, 200].map(leaf).join("")}</g></g>`;
  }
  function campfire(x, y, s) {
    return `<g transform="translate(${x},${y}) scale(${s})">
      <circle cx="0" cy="-40" r="170" fill="url(#gWarm)" class="glowpulse"/>
      <path d="M-40,0 L40,-14 M-40,-14 L40,0" stroke="#3a2210" stroke-width="12" stroke-linecap="round"/>
      <path class="flick" d="M-22,-8 C-30,-40 -6,-50 0,-86 C8,-50 30,-40 22,-8 Z" fill="#ff8a2a"/>
      <path class="flick" style="animation-delay:-.08s" d="M-12,-8 C-16,-30 -2,-38 2,-62 C8,-38 18,-28 12,-8 Z" fill="#ffd65a"/>
    </g>`;
  }
  // Wax candle: rounded melted top, a drip, a curved wick and a small brass holder
  function candle(x, y, s, id, lit) {
    return `<g id="${id}" transform="translate(${x},${y}) scale(${s})">
      <g class="cglow fade ${lit ? "" : "hide"}"><circle cx="0" cy="-118" r="70" fill="url(#gGlow)"/></g>
      <ellipse cx="0" cy="2" rx="27" ry="7" fill="#7a5418"/>
      <ellipse cx="0" cy="-1" rx="25" ry="6" fill="url(#gBrass)"/>
      <ellipse cx="0" cy="-2" rx="17" ry="3.5" fill="#6b4813" opacity=".55"/>
      <path d="M-14,-1 L-14,-88 Q-14,-95 -7,-95.5 Q0,-92.5 7,-95.5 Q14,-95 14,-88 L14,-1 Q0,2 -14,-1 Z" fill="url(#gWax)"/>
      <path d="M6,-94 Q10,-86 9.5,-74 Q9,-66 6.5,-67 Q4.5,-68 5,-76 Q5.5,-86 3,-93 Z" fill="#fffaf0" opacity=".85"/>
      <path d="M-11,-90 Q-12,-84 -11,-80 Q-9.5,-78 -9,-82 Q-9,-87 -8,-91 Z" fill="#fffaf0" opacity=".6"/>
      <ellipse cx="0" cy="-93" rx="10" ry="2.6" fill="#e9d6ad"/>
      <path d="M0,-93 Q-1.5,-99 0.8,-106" stroke="#2b2116" stroke-width="2.6" fill="none" stroke-linecap="round"/>
      <g class="cflame fade ${lit ? "" : "hide"}">
        <ellipse cx="0" cy="-93" rx="10" ry="2.6" fill="#fff3d0"/>
        <path class="flick" d="M0,-140 C10,-120 10,-108 0,-102 C-10,-108 -10,-120 0,-140 Z" fill="#ffd65a"/>
        <path d="M0,-126 C4,-116 4,-110 0,-106 C-4,-110 -4,-116 0,-126 Z" fill="#fff6d6"/>
        <path d="M0,-108 C3,-104 3,-101 0,-100 C-3,-101 -3,-104 0,-108 Z" fill="#5a8cff" opacity=".55"/>
        <circle cx="0.8" cy="-106" r="1.6" fill="#ff7a2a"/>
      </g>
    </g>`;
  }
  const ring = (cx, cy, r) => `<circle class="ring" cx="${cx}" cy="${cy}" r="${r}"/>`;

  /* ---------- generic task runner: a list of units, completed by tap (hit) or press (next) ---------- */
  function unitTask(units, onUnit, done) {
    let i = 0; const left = new Set(units);
    return {
      hit(name) { if (left.has(name)) { left.delete(name); onUnit(name, units.length - left.size); if (!left.size) done(); return true; } return false; },
      press() { const n = units.find(u => left.has(u)); if (n) this.hit(n); },
      left
    };
  }
  function bindHits(svg, handler) {
    svg.addEventListener("pointerdown", e => {
      const t = e.target.closest("[data-hit]");
      if (t) { e.stopPropagation(); handler(t.dataset.hit, e); }
    });
  }

  /* ======================= 1. THE PROMISE ======================= */
  S.promise = function (root, api) {
    root.innerHTML = svgWrap(`
      <g id="sky">${starfield(110, 7)}</g>
      <rect id="dawn" class="fade hide" x="-200" y="200" width="2000" height="700" fill="url(#gDawn)"/>
      ${["star1|420|250|26", "star2|1180|210|26", "star3|800|130|36"].map(s => { const [id, x, y, r] = s.split("|"); return `
        <g id="${id}" data-hit="${id}" transform="translate(${x},${y})">
          <circle r="70" fill="transparent"/>${ring(0, 0, 60)}
          <g class="dim"><circle r="${r * 0.25}" fill="#fff8e6" opacity=".7"/></g>
          <g class="lit fade hide"><circle r="${r * 3.6}" fill="url(#gGlow)" class="glowpulse"/><g filter="url(#fGlow)">${star8(+r)}</g></g>
        </g>`; }).join("")}
      <path d="M-200,640 C120,560 360,600 620,560 C880,520 1120,600 1800,540 L1800,1000 L-200,1000 Z" fill="#161634"/>
      ${town(1040, 600, 0.55, 3, "#14122e")}
      <path d="M-200,720 C200,660 520,700 800,690 C1100,680 1400,640 1800,700 L1800,1000 L-200,1000 Z" fill="#0d0d24"/>
      ${person(300, 700, 0.9, { crook: false, staff: true })}
      <path d="M-200,820 C300,770 900,800 1800,780 L1800,1000 L-200,1000 Z" fill="#06061a"/>
    `, "url(#gNight)");
    const svg = $(root, "svg"); let task = null;
    bindHits(svg, n => task && task.hit(n));
    function light(id) { const g = $(svg, "#" + id); show($(g, ".lit")); show($(g, ".dim"), false); hot(g, false); api.sfx("sparkle"); }
    return {
      enter(i) {
        if (i <= 0) ["star1", "star2", "star3"].forEach(id => { show($(svg, `#${id} .lit`), false); show($(svg, `#${id} .dim`)); });
        show($(svg, "#dawn"), i === 4);
        if (i === 4) api.sfx("success");
      },
      startTask(name, done) { const g = $(svg, "#" + name); hot(g, true); task = unitTask([name], n => light(n), () => { task = null; done(); }); },
      press() { task && task.press(); }
    };
  };

  /* ======================= 2. ANGEL VISITS MARY ======================= */
  S.mary = function (root, api) {
    root.innerHTML = svgWrap(`
      <rect x="-800" y="660" width="3200" height="400" fill="#2a170b"/>
      <path d="M-800,660 L2400,660" stroke="#1a0d05" stroke-width="6"/>
      <g id="win" data-hit="angel">
        <path d="M300,560 L300,260 A130,130 0 0 1 560,260 L560,560 Z" fill="#0b1240"/>
        <g clip-path="url(#winclip)">${starfield(26, 11, 560, 300, 560)}</g>
        <clipPath id="winclip"><path d="M300,560 L300,260 A130,130 0 0 1 560,260 L560,560 Z"/></clipPath>
        <path d="M300,560 L300,260 A130,130 0 0 1 560,260 L560,560 Z" fill="none" stroke="#1b0e06" stroke-width="22"/>
        <path d="M430,140 L430,560 M300,380 L560,380" stroke="#1b0e06" stroke-width="12"/>
        ${ring(430, 360, 150)}
      </g>
      <g id="flood" class="fade hide" pointer-events="none"><path d="M300,560 L560,560 L1100,900 L-100,900 Z" fill="#fff6dc" opacity=".25"/><circle cx="430" cy="360" r="420" fill="url(#gWhite)"/></g>
      <g transform="translate(1100,520)"><rect x="-70" y="-10" width="140" height="14" fill="#1a0d05"/><rect x="-60" y="4" width="12" height="136" fill="#1a0d05"/><rect x="48" y="4" width="12" height="136" fill="#1a0d05"/>
        <circle cx="20" cy="-62" r="95" fill="url(#gWarm)" class="glowpulse"/>
        <ellipse cx="20" cy="-12" rx="26" ry="6" fill="#5a3a1c"/><path d="M-6,-12 Q20,-2 46,-12" fill="#3a2410"/>
        <rect x="10" y="-62" width="20" height="50" rx="3" fill="#efe2c4"/><rect x="10" y="-62" width="6" height="50" rx="3" fill="#fff8e6" opacity=".7"/>
        <path d="M20,-62 L20,-70" stroke="#2b2116" stroke-width="2.5"/>
        <path class="flick" d="M20,-96 C28,-84 28,-74 20,-69 C12,-74 12,-84 20,-96 Z" fill="#ffd65a"/>
        <path d="M20,-86 C23,-80 23,-75 20,-72 C17,-75 17,-80 20,-86 Z" fill="#fff6d6"/></g>
      <g id="angelG" class="pop hide">${angel(640, 640, 1.25, { armsUp: false })}</g>
      ${kneeling(920, 668, 1.45, { hood: "#2c3f86", fill: "#120a1a", hands: true })}
      <g id="heart" data-hit="heart" class="pop hide" transform="translate(0,0)">
        <g transform="translate(960,420)"><circle r="80" fill="url(#gGlow)"/><path d="M0,26 C-40,-6 -40,-40 -18,-44 C-6,-46 0,-36 0,-30 C0,-36 6,-46 18,-44 C40,-40 40,-6 0,26 Z" fill="#ff6b7a" filter="url(#fGlow)"/>${ring(0, -8, 70)}</g>
      </g>
      <g id="hearts"></g>
    `, "url(#gRoom)");
    const svg = $(root, "svg"); let task = null;
    bindHits(svg, n => task && task.hit(n));
    return {
      enter(i) {
        if (i <= 0) { show($(svg, "#angelG"), false); show($(svg, "#flood"), false); show($(svg, "#heart"), false); }
        if (i === 3) show($(svg, "#heart"));
      },
      startTask(name, done) {
        if (name === "angel") { hot($(svg, "#win"), true); task = unitTask(["angel"], () => { hot($(svg, "#win"), false); show($(svg, "#flood")); show($(svg, "#angelG")); api.sfx("choir"); api.sfx("sparkle"); }, () => { task = null; done(); }); }
        if (name === "heart") {
          const h = $(svg, "#heart"); show(h); hot(h, true);
          task = unitTask(["heart"], () => {
            hot(h, false); api.sfx("success");
            let s = ""; for (let k = 0; k < 7; k++) s += `<path class="float" style="animation-delay:${-k * .5}s" transform="translate(${880 + k * 26},${380 - (k % 3) * 60}) scale(.4)" d="M0,26 C-40,-6 -40,-40 -18,-44 C-6,-46 0,-36 0,-30 C0,-36 6,-46 18,-44 C40,-40 40,-6 0,26 Z" fill="#ff8f9c" opacity=".8"/>`;
            $(svg, "#hearts").innerHTML = s;
          }, () => { task = null; done(); });
        }
      },
      press() { task && task.press(); }
    };
  };

  /* ======================= 3. ROAD TO BETHLEHEM ======================= */
  S.journey = function (root, api) {
    const r = rng(5); let stones = "";
    for (let i = 0; i < 70; i++) stones += `<ellipse cx="${(r() * 4600).toFixed(0)}" cy="${(800 + r() * 90).toFixed(0)}" rx="${(6 + r() * 22).toFixed(0)}" ry="${(4 + r() * 8).toFixed(0)}" fill="#1b1430"/>`;
    let bushes = ""; for (let i = 0; i < 16; i++) bushes += `<ellipse cx="${(r() * 4600).toFixed(0)}" cy="${(735 + r() * 20).toFixed(0)}" rx="${(30 + r() * 40).toFixed(0)}" ry="${(16 + r() * 16).toFixed(0)}" fill="#120d24"/>`;
    root.innerHTML = svgWrap(`
      <g id="land">
        ${starfield(70, 21, 380)}
        <g id="far" class="slow">
          <path d="M-200,560 C200,480 500,560 900,500 C1300,440 1700,540 2100,480 C2500,430 2900,520 3400,470 L3400,900 L-200,900 Z" fill="#3a2a55"/>
          <g transform="translate(1450,0)">${town(1200, 540, 0.9, 9, "#241a3e")}<circle cx="1360" cy="480" r="260" fill="url(#gWarm)" opacity=".5"/></g>
        </g>
        <g id="mid" class="slow"><path d="M-200,640 C300,590 700,660 1100,610 C1500,560 1900,650 2400,600 C2900,560 3400,640 4800,600 L4800,900 L-200,900 Z" fill="#231a3a"/>
          ${palm(380, 650, .8, "#191230")}${palm(1500, 630, .9, "#191230")}${palm(2700, 640, .75, "#191230")}</g>
        <g id="near" class="slow"><path d="M-200,740 C500,720 1200,760 2000,730 C2800,710 3600,760 4800,730 L4800,1000 L-200,1000 Z" fill="#160f28"/>${bushes}
          <path d="M-200,800 C600,780 1400,820 2400,790 C3400,770 4200,800 4800,790" stroke="#2c2244" stroke-width="60" fill="none" opacity=".7"/>${stones}</g>
        <g id="trav" data-hit="walk"><rect x="250" y="520" width="520" height="330" fill="transparent"/>${ring(560, 700, 190)}
          <g id="travIn">${person(650, 800, 1.05, { staff: true })}${donkey(450, 806, 1.1, { rider: "#2c3f86" })}</g></g>
        <g id="miles"><rect x="620" y="40" width="360" height="64" rx="32" fill="rgba(9,13,38,.7)" stroke="rgba(240,194,106,.4)"/><text id="milesT" x="800" y="83" text-anchor="middle" fill="#f4ead2" font-weight="800" font-size="30">90 miles to Bethlehem</text></g>
      </g>
      <g id="street" class="fade hide">
        <rect x="-800" y="-100" width="3200" height="1100" fill="url(#gNight)"/>${starfield(60, 33, 260)}
        <rect x="-800" y="720" width="3200" height="300" fill="#140f26"/>
        ${[0, 1, 2].map(k => { const x = 260 + k * 420; return `
          <g>${house(x - 40, 730, 420, 440, { fill: ["#1e1838", "#231b40", "#1b1636"][k], door: false, two: true })}
            <g id="door${k + 1}" data-hit="door${k + 1}">
              <rect x="${x + 110}" y="490" width="140" height="240" fill="#ffd27a" opacity=".85"/>
              <rect class="dleaf slow" x="${x + 110}" y="490" width="140" height="240" fill="#3a2414" stroke="#24150b" stroke-width="6"/>
              <circle cx="${x + 230}" cy="620" r="7" fill="#c9a050"/>${ring(x + 180, 610, 120)}
            </g></g>`; }).join("")}
        ${person(130, 820, .8, { staff: true })}${donkey(-30, 826, .85, { rider: "#2c3f86" })}
        <g id="keeper" class="pop hide"><g id="keeperPos">${person(0, 735, 1.05, { fill: "#1a1426", lantern: true, flip: true })}</g></g>
      </g>
    `, "url(#gDusk)");
    const svg = $(root, "svg"); let task = null, steps = 0; const N = 8;
    bindHits(svg, n => task && task.hit(n));
    function walk() {
      steps++; api.sfx("step");
      move($(svg, "#far"), -steps * 181, 0); move($(svg, "#mid"), -steps * 290, 0); move($(svg, "#near"), -steps * 470, 0);
      const t = $(svg, "#travIn"); t.classList.remove("walk"); void t.getBBox(); t.classList.add("walk");
      $(svg, "#milesT").textContent = steps >= N ? "Bethlehem!" : `${Math.round(90 - 90 * steps / N)} miles to Bethlehem`;
    }
    const replies = {
      door1: ["Sorry, no room!", "Every bed is taken."],
      door2: ["We're full up!", "Try down the street."],
      door3: ["No room in the inn…", "but you may stay in my stable."]
    };
    return {
      enter(i) {
        if (i <= 0) { steps = 0; ["#far", "#mid", "#near"].forEach(s => move($(svg, s), 0, 0)); $(svg, "#milesT").textContent = "90 miles to Bethlehem"; show($(svg, "#street"), false); show($(svg, "#keeper"), false); $$(svg, ".dleaf").forEach(d => d.style.transform = ""); }
        if (i === 2) show($(svg, "#street"));
      },
      startTask(name, done) {
        if (name === "walk") {
          const units = Array.from({ length: N }, (_, k) => "w" + k);
          hot($(svg, "#trav"), true);
          const t = unitTask(units, () => walk(), () => { hot($(svg, "#trav"), false); task = null; api.sfx("success"); done(); });
          task = { hit: n => n === "walk" && t.press(), press: () => t.press() };
        }
        if (name === "doors") {
          show($(svg, "#street"));
          ["door1", "door2", "door3"].forEach(d => hot($(svg, "#" + d), true));
          let lastReply = Promise.resolve();
          task = unitTask(["door1", "door2", "door3"], (d, count) => {
            const g = $(svg, "#" + d); hot(g, false); api.sfx("knock");
            let replied; lastReply = new Promise(r => (replied = r));
            setTimeout(() => {
              $(g, ".dleaf").style.transform = "scaleX(.3)";
              const x = +$(g, "rect").getAttribute("x") + 70;
              const [a, b] = [replies.door1, replies.door2, replies.door3][count - 1];
              api.bubble(x, 470, a, b); api.voice("journey.door" + count).then(replied);
              if (count === 3) { $(svg, "#keeperPos").setAttribute("transform", `translate(${x + 40},0)`); show($(svg, "#keeper")); }
            }, 520);
          }, () => {
            // let the last innkeeper finish speaking before the narrator carries on
            task = null;
            Promise.all([lastReply, new Promise(r => setTimeout(r, 1800))]).then(() => setTimeout(done, 600));
          });
        }
      },
      press() { task && task.press(); }
    };
  };

  /* ======================= 4. BORN IN BETHLEHEM ======================= */
  S.manger = function (root, api) {
    const parts = [
      { id: "pStar", x: 800, y: 110, r: 70, art: bigStar(800, 110, 34, "bs") },
      { id: "pManger", x: 800, y: 700, r: 90, art: manger(800, 760, 1.1) },
      { id: "pMary", x: 640, y: 660, r: 90, art: kneeling(650, 768, 1.25, { hood: "#2c3f86", fill: "#120a1a", hands: true }) },
      { id: "pJoseph", x: 990, y: 600, r: 100, art: person(990, 770, 1.3, { staff: true, fill: "#140b10", flip: true }) },
      { id: "pDonkey", x: 360, y: 690, r: 100, art: donkey(370, 772, 1.0, { fill: "#1d120c" }) },
      { id: "pOx", x: 1240, y: 690, r: 100, art: ox(1240, 772, 1.0, { fill: "#1d120c", flip: true }) },
      { id: "pSheep", x: 1100, y: 780, r: 70, art: sheep(1110, 820, 1.1, { wool: "#e6d7b8" }) },
      { id: "pBaby", x: 800, y: 670, r: 80, art: baby(800, 778, 1.1) }
    ];
    root.innerHTML = svgWrap(`
      ${starfield(80, 41, 300)}
      <path d="M-200,520 C300,480 700,520 1000,500 C1300,480 1600,520 1800,500 L1800,1000 L-200,1000 Z" fill="#141030"/>
      ${stable(800, 830, 1.15)}
      <rect x="-800" y="820" width="3200" height="200" fill="#0e0a18"/>
      ${parts.map(p => `<g id="${p.id}" class="pop hide">${p.art}</g><g id="${p.id}Spot" data-hit="${p.id}" class="spot"><circle cx="${p.x}" cy="${p.y}" r="${p.r}" fill="transparent"/>${ring(p.x, p.y, p.r * 0.7)}</g>`).join("")}
    `, "url(#gNight)");
    const svg = $(root, "svg"); let task = null;
    bindHits(svg, n => task && task.hit(n));
    const ids = parts.map(p => p.id);
    function reset() { ids.forEach(id => { show($(svg, "#" + id), false); hot($(svg, "#" + id + "Spot"), false); }); }
    return {
      enter(i) { if (i <= 0) reset(); },
      startTask(name, done) {
        // only the next spot glows, so the scene builds in story order
        let k = 0; hot($(svg, "#" + ids[0] + "Spot"), true);
        const t = unitTask(ids, id => {
          hot($(svg, "#" + id + "Spot"), false); show($(svg, "#" + id)); k++;
          api.sfx(id === "pBaby" ? "success" : id === "pSheep" ? "baa" : "chime");
          if (k < ids.length) hot($(svg, "#" + ids[k] + "Spot"), true);
        }, () => { task = null; setTimeout(done, 900); });
        task = { hit: id => id === ids[k] && t.hit(id), press: () => t.press() };
      },
      press() { task && task.press(); },
      finish() { ids.forEach(id => show($(svg, "#" + id))); }
    };
  };

  /* ======================= 5. SHEPHERDS & ANGELS ======================= */
  S.shepherds = function (root, api) {
    const wander = [
      { id: "sh1", x: 190, y: 700, tx: 520, ty: 735, flip: false },
      { id: "sh2", x: 1420, y: 640, tx: 600, ty: 760, flip: true },
      { id: "sh3", x: 1180, y: 830, tx: 470, ty: 790, flip: true },
      { id: "sh4", x: 930, y: 610, tx: 640, ty: 800, flip: true },
      { id: "sh5", x: 1520, y: 800, tx: 560, ty: 820, flip: true }
    ];
    const slots = [[260, 300, .55], [470, 190, .6], [1130, 190, .6], [1340, 300, .55], [150, 400, .42], [1450, 400, .42], [620, 110, .45], [980, 110, .45]];
    root.innerHTML = svgWrap(`
      <g id="sky" data-hit="sky"><rect x="-800" y="-100" width="3200" height="660" fill="transparent"/>${starfield(110, 55, 520)}</g>
      <g id="glory" class="fade hide" pointer-events="none"><circle cx="800" cy="240" r="900" fill="url(#gGlow)"/><circle cx="800" cy="260" r="520" fill="url(#gWhite)"/></g>
      <g id="choir" pointer-events="none">${slots.map((s, k) => `<g id="ch${k}" class="pop hide"><g class="float" style="animation-delay:${-k * .6}s">${angel(s[0], s[1] + 120, s[2], { armsUp: true, glow: 150 })}</g></g>`).join("")}</g>
      <g id="bigAngel" class="pop hide" pointer-events="none"><g class="float">${angel(800, 470, 1.15, { armsUp: true, glow: 260 })}</g></g>
      ${town(1250, 560, .45, 77, "#17142f")}
      <path d="M-200,580 C300,520 700,600 1100,560 C1400,530 1600,580 1800,560 L1800,1000 L-200,1000 Z" fill="#1a1636"/>
      <path d="M-200,700 C300,660 800,700 1200,680 C1500,666 1700,690 1800,684 L1800,1000 L-200,1000 Z" fill="#121029"/>
      <path d="M400,830 C400,700 720,700 720,830" stroke="#2b2546" stroke-width="26" fill="none" stroke-dasharray="40 8"/>
      ${sheep(510, 800, .8)}${sheep(600, 812, .75, { flip: true })}${sheep(460, 836, .85)}
      ${campfire(950, 800, .8)}
      ${person(860, 806, 1.0, { crook: true })}${kneeling(1060, 810, 1.0, { flip: true })}
      ${wander.map(w => `<g id="${w.id}" data-hit="${w.id}" class="slow"><g transform="translate(${w.x},${w.y})"><circle cx="0" cy="-34" r="70" fill="transparent"/>${ring(0, -34, 60)}${sheep(0, 0, .9, { flip: w.flip })}</g></g>`).join("")}
      <g id="count"><rect x="620" y="40" width="360" height="64" rx="32" fill="rgba(9,13,38,.7)" stroke="rgba(240,194,106,.4)"/><text id="countT" x="800" y="83" text-anchor="middle" fill="#f4ead2" font-weight="800" font-size="30">0 of 5 sheep found</text></g>
    `, "url(#gNight)");
    const svg = $(root, "svg"); let task = null;
    bindHits(svg, n => task && task.hit(n));
    function reset() {
      wander.forEach(w => { move($(svg, "#" + w.id), 0, 0); hot($(svg, "#" + w.id), false); });
      show($(svg, "#glory"), false); show($(svg, "#bigAngel"), false); $$(svg, "#choir > g").forEach(g => show(g, false));
      show($(svg, "#count")); $(svg, "#countT").textContent = "0 of 5 sheep found";
    }
    return {
      enter(i) {
        if (i <= 0) reset();
        if (i >= 2) show($(svg, "#count"), false);
        if (i === 2) { show($(svg, "#glory")); show($(svg, "#bigAngel")); api.sfx("whoosh"); api.sfx("choir"); }
        if (i === 4) { show($(svg, "#bigAngel"), false); $$(svg, "#choir > g").forEach(g => show(g, false)); show($(svg, "#glory"), false); }
      },
      startTask(name, done) {
        if (name === "sheep") {
          wander.forEach(w => hot($(svg, "#" + w.id), true));
          task = unitTask(wander.map(w => w.id), (id, n) => {
            const w = wander.find(x => x.id === id), g = $(svg, "#" + id);
            hot(g, false); move(g, w.tx - w.x, w.ty - w.y); api.sfx("baa");
            $(svg, "#countT").textContent = `${n} of 5 sheep found`;
          }, () => { task = null; setTimeout(done, 1200); });
        }
        if (name === "choir") {
          hot($(svg, "#sky"), true);
          let k = 0;
          const t = unitTask(slots.map((_, j) => "c" + j), () => { show($(svg, "#ch" + k)); k++; api.sfx(k % 2 ? "sparkle" : "choir"); }, () => { hot($(svg, "#sky"), false); task = null; setTimeout(done, 600); });
          task = { hit: n => n === "sky" && t.press(), press: () => t.press() };
        }
      },
      press() { task && task.press(); }
    };
  };

  /* ======================= 6. THE WISE MEN ======================= */
  S.magi = function (root, api) {
    const path = [[260, 190], [430, 140], [620, 110], [820, 105], [1010, 125], [1180, 170], [1300, 250]];
    const gifts = [
      { id: "gGold", x: 560, label: "Gold", note: "A gift fit for a King", art: `<rect x="-60" y="-70" width="120" height="70" rx="8" fill="#7a4a12"/><path d="M-62,-70 C-62,-112 62,-112 62,-70 Z" fill="#9a5e18"/><rect x="-64" y="-74" width="128" height="10" fill="#f0c26a"/><rect x="-12" y="-62" width="24" height="26" rx="4" fill="#f0c26a"/><circle cx="0" cy="-92" r="60" fill="url(#gGlow)" opacity=".7"/>` },
      { id: "gFrank", x: 800, label: "Frankincense", note: "Incense for worshipping God", art: `<path d="M-40,0 C-60,-40 -50,-90 -28,-100 L28,-100 C50,-90 60,-40 40,0 Z" fill="#d9cfb8"/><rect x="-32" y="-112" width="64" height="16" rx="6" fill="#b9ab8c"/><path class="float" d="M0,-120 C-20,-150 20,-170 0,-200 C-20,-230 16,-250 4,-280" stroke="#e8e3f6" stroke-width="8" fill="none" opacity=".55" stroke-linecap="round"/>` },
      { id: "gMyrrh", x: 1040, label: "Myrrh", note: "A spice that pointed to Jesus giving his life for us", art: `<path d="M-30,0 L-36,-80 C-36,-100 -16,-110 -12,-130 L12,-130 C16,-110 36,-100 36,-80 L30,0 Z" fill="#5c2a4a"/><rect x="-16" y="-150" width="32" height="22" rx="5" fill="#c9a050"/><path d="M-30,-60 L30,-60" stroke="#c9a050" stroke-width="5"/>` }
    ];
    root.innerHTML = svgWrap(`
      ${starfield(120, 61, 520)}
      <polygon id="beam" class="fade hide" points="1300,250 1215,640 1385,640" fill="#fff3c4" opacity=".22"/>
      <g id="star" class="slower" data-hit="follow">${bigStar(path[0][0], path[0][1], 30, "mstar")}<g transform="translate(${path[0][0]},${path[0][1]})"><circle r="90" fill="transparent"/>${ring(0, 0, 70)}</g></g>
      <path d="M-200,620 C200,560 600,640 1000,590 C1300,560 1500,600 1800,580 L1800,1000 L-200,1000 Z" fill="#2c1f45"/>
      <g id="town" class="fade hide">${house(1230, 650, 140, 120, { fill: "#1f1838", two: true })}${town(1380, 650, .7, 13, "#1a1532")}${town(980, 650, .6, 14, "#1a1532")}</g>
      <path d="M-200,720 C300,680 800,740 1200,700 C1500,676 1700,700 1800,690 L1800,1000 L-200,1000 Z" fill="#1d1532"/>
      ${palm(120, 720, .9, "#130e26")}
      <g id="caravan" class="slower fade">
        ${camel(140, 820, .95, { rider: "#f0c26a", robe: "#6b2d5c" })}${camel(360, 815, 1.0, { rider: "#f0c26a", robe: "#2d4d6b" })}${camel(580, 822, .95, { rider: "#f0c26a", robe: "#7a3b1f" })}
      </g>
      <path d="M-200,850 C400,830 1000,860 1800,840 L1800,1000 L-200,1000 Z" fill="#100b1e"/>
      <g id="gifts" class="fade hide">
        <rect x="400" y="560" width="800" height="300" rx="30" fill="rgba(9,13,38,.55)"/>
        ${gifts.map(g => `<g id="${g.id}" data-hit="${g.id}" transform="translate(${g.x},760)"><circle cx="0" cy="-70" r="110" fill="transparent"/>${ring(0, -60, 90)}${g.art}<text y="56" text-anchor="middle" fill="#f4ead2" font-weight="800" font-size="30">${g.label}</text></g>`).join("")}
      </g>
    `, "url(#gDesert)");
    const svg = $(root, "svg"); let task = null, k = 0;
    bindHits(svg, n => task && task.hit(n));
    function reset() { k = 0; move($(svg, "#star"), 0, 0); move($(svg, "#caravan"), 0, 0); show($(svg, "#caravan")); show($(svg, "#town"), false); show($(svg, "#beam"), false); show($(svg, "#gifts"), false); }
    return {
      enter(i) { if (i <= 0) reset(); if (i === 2) { show($(svg, "#caravan"), false); show($(svg, "#gifts")); } },
      startTask(name, done) {
        if (name === "follow") {
          hot($(svg, "#star"), true);
          const units = path.slice(1).map((_, j) => "p" + j);
          const t = unitTask(units, (_, n) => {
            k = n; const [x, y] = path[k];
            move($(svg, "#star"), x - path[0][0], y - path[0][1]);
            move($(svg, "#caravan"), k * 95, 0); api.sfx("step"); api.sfx("pop");
            if (k >= 4) show($(svg, "#town"));
          }, () => { hot($(svg, "#star"), false); task = null; setTimeout(() => { show($(svg, "#beam")); api.sfx("success"); done(); }, 2000); });
          task = { hit: n => n === "follow" && t.press(), press: () => t.press() };
        }
        if (name === "gifts") {
          gifts.forEach(g => hot($(svg, "#" + g.id), true));
          task = unitTask(gifts.map(g => g.id), id => {
            const g = gifts.find(x => x.id === id); hot($(svg, "#" + id), false); api.sfx("chime");
            api.bubble(g.x, 560, g.label, g.note);
          }, () => { task = null; setTimeout(done, 2200); });
        }
      },
      press() { task && task.press(); }
    };
  };

  /* ======================= 7. THE GREATEST GIFT ======================= */
  S.gift = function (root, api) {
    let wall = ""; const cols = 14, rows = 3;
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
      const x = 200 + c * 92 + (r % 2) * 46, y = 200 + r * 78;
      wall += candle(x, y, .42, `w${r * cols + c}`, false);
    }
    root.innerHTML = svgWrap(`
      <rect x="-800" y="-100" width="3200" height="1100" fill="#0b0716"/>
      <circle cx="800" cy="380" r="700" fill="url(#gWarm)" opacity=".18"/>
      <g id="wall">${wall}</g>
      <rect x="-800" y="560" width="3200" height="500" fill="#120b1a"/>
      <text id="wallLabel" x="800" y="140" text-anchor="middle" fill="#e9d9b4" font-weight="700" font-size="26" opacity=".85"></text>
      <g id="mainC" class="slow"><g data-hit="candle"><circle cx="800" cy="470" r="140" fill="transparent"/>${candle(800, 575, 1.25, "big", false)}${ring(800, 430, 100)}</g></g>
    `, "#0b0716");
    const svg = $(root, "svg"); let task = null;
    bindHits(svg, n => task && task.hit(n));
    const total = 14 * 3;
    // The lit candle's light spreads to the wall: candles nearest the flame catch first, following it as it slides left
    const wallPos = Array.from({ length: total }, (_, idx) => {
      const r = Math.floor(idx / 14), c = idx % 14;
      return { idx, x: 200 + c * 92 + (r % 2) * 46, y: 200 + r * 78 - 59 };
    });
    let spreadRun = 0;
    function spreadLight() {
      const run = ++spreadRun, t0 = performance.now(), slide = 1200;
      const lit = new Set(wallPos.filter(p => !$(svg, "#w" + p.idx + " .cflame").classList.contains("hide")).map(p => p.idx));
      let chimes = 0;
      const step = now => {
        if (run !== spreadRun) return;
        const t = now - t0, k = Math.min(1, t / slide), ease = k < .5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
        const fx = 800 - 360 * ease, fy = 400, reach = 50 + t * 0.42;   // flame position and how far the light has spread
        for (const p of wallPos) {
          if (lit.has(p.idx) || Math.hypot(p.x - fx, p.y - fy) > reach) continue;
          lit.add(p.idx);
          const g = $(svg, "#w" + p.idx); show($(g, ".cflame")); show($(g, ".cglow"));
          if (chimes++ % 6 === 0) api.sfx("pop");
        }
        if (lit.size < total) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    }
    async function paintWall(n) {
      spreadRun++;
      $(svg, "#wallLabel").textContent = api.shared && api.shared() && n > 0 ? `${n.toLocaleString()} candle${n === 1 ? "" : "s"} lit at this station` : "";
      const lit = Math.min(total, n);
      const order = Array.from({ length: total }, (_, i) => i).sort((a, b) => ((a * 37) % total) - ((b * 37) % total));
      order.forEach((idx, j) => { const g = $(svg, "#w" + idx); const on = j < lit; show($(g, ".cflame"), on); show($(g, ".cglow"), on); });
    }
    let count = 0;
    api.count("candles", false).then(n => { count = n; paintWall(n); });
    return {
      enter(i) {
        if (i <= 0) { const b = $(svg, "#big"); show($(b, ".cflame"), false); show($(b, ".cglow"), false); move($(svg, "#mainC"), 0, 0); api.count("candles", false).then(n => { count = n; paintWall(n); }); }
        if (i === 2) { move($(svg, "#mainC"), -360, 0); spreadLight(); }
      },
      startTask(name, done) {
        hot($(svg, "#mainC > g"), true);
        task = unitTask(["candle"], async () => {
          hot($(svg, "#mainC > g"), false);
          const b = $(svg, "#big"); show($(b, ".cflame")); show($(b, ".cglow")); api.sfx("success");
          count = await api.count("candles", true); paintWall(count - 1); // the big candle is this visitor's; the wall shows earlier ones
          api.bubble(1010, 520, `Candle #${count.toLocaleString()}`, "lit at this station");
        }, () => { task = null; setTimeout(done, 1500); });
      },
      press() { task && task.press(); }
    };
  };

  /* ======================= CAROL CORNER backdrop ======================= */
  S.carols = function (root) {
    const r = rng(91); let flakes = "";
    for (let i = 0; i < 70; i++) flakes += `<circle class="snow" cx="${(r() * 1700 - 80).toFixed(0)}" cy="0" r="${(1.5 + r() * 3.5).toFixed(1)}" fill="#fff" opacity="${(.35 + r() * .5).toFixed(2)}" style="animation-duration:${(9 + r() * 10).toFixed(1)}s;animation-delay:${(-r() * 18).toFixed(1)}s"/>`;
    root.innerHTML = svgWrap(`
      ${starfield(90, 99, 500)}
      <path d="M-200,700 C300,660 900,700 1800,670 L1800,1000 L-200,1000 Z" fill="#dfe6f5" opacity=".14"/>
      <g transform="translate(1300,700)" fill="#0c0f26">
        <rect x="-110" y="-180" width="220" height="180"/><path d="M-130,-176 L0,-270 L130,-176 Z"/><rect x="-30" y="-380" width="60" height="140"/><path d="M-40,-376 L0,-450 L40,-376 Z"/>
        <path d="M-4,-500 L-4,-450 M-18,-484 L10,-484" stroke="#0c0f26" stroke-width="7"/>
        <path d="M-22,0 L-22,-60 A22,22 0 0 1 22,-60 L22,0 Z" fill="#ffcf6e" opacity=".9"/>
        <rect x="-80" y="-140" width="30" height="50" rx="14" fill="#ffcf6e" opacity=".8"/><rect x="50" y="-140" width="30" height="50" rx="14" fill="#ffcf6e" opacity=".8"/>
        <circle cx="0" cy="-60" r="180" fill="url(#gWarm)" opacity=".5"/>
      </g>
      ${palm(-60, 760, .7, "#0a0c22")}
      <rect x="-800" y="760" width="3200" height="300" fill="#0a0c22"/>
      <g>${flakes}</g>
    `, "url(#gNight)");
    return { enter() {}, startTask(n, d) { d(); }, press() {} };
  };

  window.XScenes = S;
})();
