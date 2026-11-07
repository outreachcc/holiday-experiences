/* Holiday Experiences — shared film engine (Christmas and Thanksgiving use the same file; keep both copies identical).
   Painted SVG "shots" with slow camera moves, characters whose mouths follow their recorded voices,
   and the tap targets for each station. Station artwork lives in js/film-scenes.js.
   Mouth data: audio/narration/envelopes.js (made by tools/make_mouth_data.py). */
(function () {
  const FAST = /[?&]fast=1/.test(location.search);
  const K = window.FilmKit = {};

  /* ------------------------------------------------------------------ phones and tablets
     LITE: phone/tablet browsers (Samsung Internet, DuckDuckGo, Chrome on Android, Safari on iOS) flicker when a
     moving SVG uses screen-wide blend modes, noise textures (feTurbulence) and backdrop blur, so on those devices
     the film swaps them for cheap look-alikes. ?lite=1 forces it on (to preview on a PC), ?lite=0 forces it off.
     FULL SCREEN: on a phone held sideways, the first tap goes full screen (browsers only allow it after a tap).
     If the viewer leaves full screen, it isn't forced again until they turn the phone again. The ⛶ button
     in the station controls toggles it on any device. Not used on kiosk stations (the Pi is already full screen). */
  const UA = navigator.userAgent || "";
  const MOBILE = /Android|iPhone|iPad|iPod|Mobile/i.test(UA) || (navigator.maxTouchPoints > 1 && /Macintosh/.test(UA));
  const liteQ = location.search.match(/[?&]lite=([01])/);
  const LITE = K.LITE = liteQ ? liteQ[1] === "1" : MOBILE;
  if (LITE) {
    document.documentElement.classList.add("lite");
    const st = document.createElement("style");
    st.textContent = `html.lite *, html.lite *::before, html.lite *::after { -webkit-backdrop-filter: none !important; backdrop-filter: none !important; }
      html.lite svg [style*="mix-blend-mode"] { mix-blend-mode: normal !important; }
      html.lite svg .grain { display: none; }
      /* Keep the film and the words over it on separate, permanent layers. Phone browsers otherwise create and drop a
         layer every time a caption word or panel fades, and the picture under it flashes while they do. */
      html.lite .scene { will-change: transform; transform: translateZ(0); }
      html.lite .caption, html.lite .verse, html.lite .prompt, html.lite .badge, html.lite .nav, html.lite .dots,
      html.lite .singalong, html.lite .endcard, html.lite .invite, html.lite .attract { will-change: transform, opacity; }
      html.lite .caption .w, html.lite .lyrics div { transition: none !important; }
      /* The GO button's glow pulse (an animated shadow) repaints every frame; on phones it's an expanding ring the
         graphics chip can move by itself, and it stops altogether while the button is hidden. */
      html.lite .prompt .go { animation: none !important; position: relative; }
      html.lite .prompt .go::after { content: ""; position: absolute; inset: 0; border-radius: 50%; box-shadow: 0 0 0 calc(var(--u) * 1.1) rgba(61,220,132,.55);
        pointer-events: none; animation: liteGo 1.6s ease-out infinite; will-change: transform, opacity; }
      html.lite .prompt:not(.on) .go::after { animation: none; opacity: 0; }
      /* "Tap here" glow and ring inside the picture: these redraw the whole picture, so on phones they move in
         small steps (a few redraws a second) instead of 60 smooth frames a second. */
      html.lite svg .ring { animation-timing-function: steps(8) !important; }
      html.lite svg .hot .hotglow { animation-timing-function: steps(6) !important; }
      @keyframes liteGo { 0% { transform: scale(.85); opacity: 1; } 70%, 100% { transform: scale(1.45); opacity: 0; } }
      /* Background-only motion (twinkling stars, drifting clouds, swaying wheat, flickering flames, breathing) is
         held still, so the picture only redraws when something in the story moves. */
      html.lite svg .tw, html.lite svg .drift, html.lite svg .breathe, html.lite svg .sway, html.lite svg .flickF,
      html.lite svg .lampglow, html.lite svg .shimmer, html.lite svg .smoke { animation: none !important; }`;
    document.head.appendChild(st);
  }

  /* KEEP AWAKE: while the experience is open and on screen, ask the phone or tablet not to dim or lock
     (Screen Wake Lock: Chrome/Samsung on Android, Safari on iOS 16.4+). Browsers drop the lock whenever the page is
     hidden, so it's asked for again on the next tap or when the page comes back. */
  let wake = null;
  const keepAwake = () => {
    if (!("wakeLock" in navigator) || wake || document.visibilityState !== "visible") return;
    navigator.wakeLock.request("screen").then(l => { wake = l; l.addEventListener("release", () => { wake = null; }); }).catch(() => {});
  };
  document.addEventListener("click", keepAwake, true);
  document.addEventListener("visibilitychange", () => { if (document.visibilityState === "visible") keepAwake(); });

  const de = document.documentElement;
  const fsEl = () => document.fullscreenElement || document.webkitFullscreenElement || null;
  const CAN_FS = !!(de.requestFullscreen || de.webkitRequestFullscreen);
  const landscape = () => window.matchMedia("(orientation: landscape)").matches;
  const kiosk = () => document.body && document.body.classList.contains("kiosk");
  let fsAsked = false, fsDeclined = false;
  K.fullscreen = function (on) {
    try {
      if (on === false || (on == null && fsEl())) return (document.exitFullscreen || document.webkitExitFullscreen || (() => {})).call(document);
      const p = de.requestFullscreen ? de.requestFullscreen({ navigationUI: "hide" }) : de.webkitRequestFullscreen();
      if (p && p.catch) p.catch(() => {});
    } catch (e) { /* browser doesn't allow it: carry on in the window */ }
  };
  if (CAN_FS) {
    // A phone turned sideways: the next tap anywhere goes full screen
    const autoFS = () => {
      if (!MOBILE || kiosk() || fsEl() || fsDeclined || !landscape()) return;
      fsAsked = true; K.fullscreen(true);
    };
    document.addEventListener("click", autoFS, true);
    document.addEventListener("touchend", autoFS, true);
    const onFS = () => {
      if (fsEl()) fsAsked = false;
      else if (!fsAsked) fsDeclined = true;   // they left full screen themselves: stop forcing it
      fsAsked = false;
      const b = document.getElementById("fsBtn");
      if (b) { b.setAttribute("aria-label", fsEl() ? "Exit full screen" : "Full screen"); b.classList.toggle("on", !!fsEl()); }
    };
    document.addEventListener("fullscreenchange", onFS);
    document.addEventListener("webkitfullscreenchange", onFS);
    window.addEventListener("orientationchange", () => { if (!fsEl()) fsDeclined = false; });
    // ⛶ button next to the other station controls
    const addBtn = () => {
      const nav = document.querySelector("#stage .nav");
      if (!nav || document.getElementById("fsBtn")) return;
      const b = document.createElement("button");
      b.className = "navbtn"; b.id = "fsBtn"; b.setAttribute("aria-label", "Full screen");
      b.innerHTML = '<svg viewBox="0 0 24 24"><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/></svg>';
      b.addEventListener("click", e => { e.stopPropagation(); fsAsked = !fsEl(); fsDeclined = !!fsEl(); K.fullscreen(); });
      nav.appendChild(b);
    };
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", addBtn); else addBtn();
  }

  /* ------------------------------------------------------------------ helpers */
  const rng = K.rng = function (seed) { return function () { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; };
  const f1 = n => n.toFixed(1);

  // Organic ridge line for hills
  K.ridge = function (y0, amp, seed, x0 = -400, x1 = 2000, step = 40) {
    const r = rng(seed); const pts = [];
    let a = 0, b = 0;
    for (let x = x0; x <= x1; x += step) {
      a += (r() - 0.5) * 0.9; b = b * 0.82 + (r() - 0.5) * 0.6; a *= 0.9;
      pts.push([x, y0 + Math.sin(x / 260 + seed) * amp * 0.6 + a * amp * 0.5 + b * amp * 0.3]);
    }
    let d = `M${x0},1100 L${pts[0][0]},${f1(pts[0][1])} `;
    for (let i = 1; i < pts.length - 1; i++) {
      const [x, y] = pts[i], [nx, ny] = pts[i + 1];
      d += `Q${x},${f1(y)} ${f1((x + nx) / 2)},${f1((y + ny) / 2)} `;
    }
    return d + `L${x1},1100 Z`;
  };

  K.starfield = function (n, seed, yMax, x0 = -300, x1 = 1900) {
    const r = rng(seed); let s = "";
    for (let i = 0; i < n; i++) {
      const x = x0 + r() * (x1 - x0), y = Math.pow(r(), 1.3) * yMax, big = r() < 0.06;
      const rad = big ? 1.8 + r() : 0.5 + r(), op = (0.35 + r() * 0.65).toFixed(2);
      const col = r() < 0.15 ? "#ffe7c4" : r() < 0.3 ? "#cfe0ff" : "#fff9ee";
      s += `<circle class="${r() < 0.35 ? "tw" : ""}" cx="${f1(x)}" cy="${f1(y)}" r="${rad.toFixed(2)}" fill="${col}" opacity="${op}" style="animation-delay:${(-r() * 4).toFixed(2)}s"/>`;
    }
    return s;
  };

  K.glint = r => `<g filter="url(#fGlow)"><path d="M0,${-r * 3} L${r * .18},${-r * .18} L${r * 3},0 L${r * .18},${r * .18} L0,${r * 3} L${-r * .18},${r * .18} L${-r * 3},0 L${-r * .18},${-r * .18} Z" fill="#fff8e4"/><circle r="${r * .55}" fill="#fff"/></g>`;

  // Pulsing ring that marks a tap target (only visible while the target is "hot")
  K.ring = (r, x = 0, y = 0) => `<circle class="ring" cx="${x}" cy="${y}" r="${r}"/>`;

  // Small flat-roofed stone houses stepping up a hillside
  K.village = function (x, y, s, seed, o = {}) {
    const r = rng(seed); let g = "";
    const wall = o.wall || "#c9a77a", shade = o.shade || "#8a6a4a", roof = o.roof || "#e2c497", door = o.door || "#3a2616", win = o.win || "#ffc46a", lit = o.lit ?? 0.15;
    const rows = o.rows || [[0, 12, 0], [-30, 10, 40], [-58, 7, 90], [-82, 4, 140]];
    for (const [dy, n, x0] of rows) {
      let cx = x0;
      for (let i = 0; i < n; i++) {
        const w = 26 + r() * 22, h = 18 + r() * 14, yy = dy - Math.sin((cx / 560) * Math.PI) * 10;
        g += `<rect x="${f1(cx)}" y="${f1(yy - h)}" width="${f1(w)}" height="${f1(h + 40)}" fill="${wall}"/>`;
        g += `<rect x="${f1(cx + w * .62)}" y="${f1(yy - h)}" width="${f1(w * .38)}" height="${f1(h + 40)}" fill="${shade}" opacity=".8"/>`;
        g += `<rect x="${f1(cx - 1)}" y="${f1(yy - h - 3)}" width="${f1(w + 2)}" height="3" fill="${roof}"/>`;
        if (r() < .12) g += `<path d="M${f1(cx + w * .2)},${f1(yy - h - 2)} a${f1(w * .3)},${f1(w * .3)} 0 0 1 ${f1(w * .6)},0 Z" fill="${roof}"/>`;
        g += `<path d="M${f1(cx + w * .3)},${f1(yy + 2)} v-7 a3.5,3.5 0 0 1 7,0 v7 Z" fill="${door}"/>`;
        if (r() < lit) g += `<rect x="${f1(cx + w * .1)}" y="${f1(yy - h * .62)}" width="4" height="5" fill="${win}"/>`;
        cx += w + 2 + r() * 8;
      }
    }
    return `<g transform="translate(${x},${y}) scale(${s})">${g}</g>`;
  };

  K.olive = function (x, y, s, fill, seed, lit) {
    const r = rng(seed); let leaves = "";
    for (let i = 0; i < 14; i++) leaves += `<ellipse cx="${f1((r() - .5) * 120)}" cy="${f1(-120 - r() * 70)}" rx="${f1(30 + r() * 30)}" ry="${f1(18 + r() * 16)}" fill="${fill}"/>`;
    let hl = "";
    if (lit) { const r2 = rng(seed + 1); for (let i = 0; i < 7; i++) hl += `<ellipse cx="${f1(10 + r2() * 50)}" cy="${f1(-150 - r2() * 50)}" rx="${f1(14 + r2() * 14)}" ry="${f1(8 + r2() * 8)}" fill="${lit}" opacity=".55"/>`; }
    return `<g transform="translate(${x},${y}) scale(${s})"><path d="M-8,0 C-14,-40 6,-70 -6,-120 M4,0 C10,-50 28,-80 30,-120" stroke="${fill}" stroke-width="14" fill="none" stroke-linecap="round"/>${leaves}${hl}</g>`;
  };

  K.palm = function (x, y, s, fill) {
    let fr = "";
    for (const [a, l] of [[-150, 120], [-120, 140], [-80, 130], [-40, 140], [-10, 120], [-170, 100], [10, 100]]) {
      const rad = a * Math.PI / 180, ex = Math.cos(rad) * l, ey = Math.sin(rad) * l;
      fr += `<path d="M0,0 Q${f1(ex * .5)},${f1(ey * .5 - 30)} ${f1(ex)},${f1(ey + 30)} Q${f1(ex * .5)},${f1(ey * .5 - 14)} 0,0 Z" fill="${fill}"/>`;
    }
    return `<g transform="translate(${x},${y}) scale(${s})"><path d="M-6,0 C-2,-80 12,-160 20,-230 L32,-230 C24,-160 10,-80 8,0 Z" fill="${fill}"/><g transform="translate(26,-232)">${fr}</g></g>`;
  };

  // Grass/wheat tufts along a line
  K.grass = function (y, seed, col, n = 160, h = 26, x0 = -300, x1 = 1900, sway = true) {
    const r = rng(seed); let p = "";
    for (let i = 0; i < n; i++) {
      const x = x0 + r() * (x1 - x0), hh = h * (.5 + r()), lean = (r() - .5) * 14, yy = y + r() * 30;
      p += `M${f1(x)},${f1(yy)} q${f1(lean * .3)},${f1(-hh * .6)} ${f1(lean)},${f1(-hh)} `;
    }
    return `<path class="${sway ? "sway" : ""}" d="${p}" stroke="${col}" stroke-width="2.4" fill="none" stroke-linecap="round"/>`;
  };

  K.wheat = function (y, seed, n, x0, x1, col, head, h = 70) {
    const r = rng(seed); let s = "", hd = "";
    for (let i = 0; i < n; i++) {
      const x = x0 + r() * (x1 - x0), hh = h * (.7 + r() * .5), lean = (r() - .5) * 18, yy = y + r() * 40;
      const tx = x + lean, ty = yy - hh;
      s += `M${f1(x)},${f1(yy)} Q${f1(x + lean * .2)},${f1(yy - hh * .6)} ${f1(tx)},${f1(ty)} `;
      hd += `<ellipse cx="${f1(tx + lean * .05)}" cy="${f1(ty - 9)}" rx="3.6" ry="11" fill="${head}" transform="rotate(${f1(lean * .9)} ${f1(tx)} ${f1(ty)})"/>`;
    }
    return `<g class="sway"><path d="${s}" stroke="${col}" stroke-width="2" fill="none"/>${hd}</g>`;
  };

  /* A small painted person for crowds and wide shots. Stands (or sits) at (x,y), facing right; flip with o.flip.
     o: robe, mantle, head (cloth colour), skin, sit, arms ("up" | "pray" | "out"), id, cls, hair */
  K.folk = function (x, y, s, o = {}) {
    const robe = o.robe || "#7a5a3a", mantle = o.mantle || "#5a3a2a", head = o.head || "#cbb48a", skin = o.skin || "#b07a50";
    const sit = !!o.sit;
    if (o.bow) {   // bowed low with face to the ground, arms stretched out in front (facing right)
      return `<g ${o.id ? `id="${o.id}"` : ""} class="${o.cls || ""}" transform="translate(${x},${y}) scale(${o.flip ? -s : s},${s})">
        <ellipse cx="6" cy="2" rx="46" ry="6" fill="#000" opacity=".25"/>
        <path d="M-36,0 C-38,-26 -24,-44 -4,-46 C16,-46 30,-32 38,-16 L44,0 Z" fill="${robe}"/>
        <path d="M-12,-44 C6,-38 22,-26 34,-10 L28,0 C18,-14 4,-28 -16,-38 Z" fill="${mantle}"/>
        ${K.limb([[26, -16], [48, -6], [66, -2]], [10, 8.5, 7], robe)}<ellipse cx="70" cy="-2" rx="5.5" ry="3.6" fill="${skin}"/>
        <ellipse cx="46" cy="-7" rx="10" ry="8.5" fill="${skin}"/>
        <path d="M34,-12 C40,-20 54,-20 58,-10 C52,-12 46,-12 42,-6 L38,-2 Z" fill="${o.hair || head}"/>
      </g>`;
    }
    const H = sit ? 58 : 92;
    const body = sit
      ? `<path d="M-24,0 C-28,-18 -20,-42 -9,-${H - 6} L9,-${H - 6} C20,-42 30,-18 30,0 Z" fill="${robe}"/><path d="M-6,-${H - 8} C6,-40 22,-18 30,0 L12,0 C8,-20 0,-36 -6,-${H - 8} Z" fill="${mantle}"/>`
      : `<path d="M-20,0 C-22,-40 -17,-70 -9,-${H - 8} L9,-${H - 8} C17,-70 22,-40 20,0 Z" fill="${robe}"/><path d="M-8,-${H - 10} C4,-60 14,-30 18,0 L6,0 C4,-30 -2,-60 -8,-${H - 10} Z" fill="${mantle}"/>`;
    let arms = "";
    const lim = (pts, ws, c) => K.limb(pts, ws, c);
    if (o.arms === "up") arms = `<g class="${o.armCls || ""}">${lim([[-7, -H + 14], [-15, -H - 2], [-20, -H - 16]], [10, 8, 6.5], robe)}${lim([[7, -H + 14], [15, -H - 2], [20, -H - 16]], [10, 8, 6.5], robe)}<ellipse cx="-21" cy="-${H + 20}" rx="3.4" ry="4.6" fill="${skin}"/><ellipse cx="21" cy="-${H + 20}" rx="3.4" ry="4.6" fill="${skin}"/></g>`;
    if (o.arms === "out") arms = `${lim([[4, -H + 14], [12, -H + 36], [27, -H + 26]], [10, 8.5, 6.5], robe)}<ellipse cx="31" cy="${-H + 24}" rx="4.6" ry="3.4" fill="${skin}"/>`;
    if (o.arms === "pray") arms = `${lim([[2, -H + 14], [8, -H + 34], [18, -H + 18]], [10, 8.5, 7], mantle)}<ellipse cx="20" cy="${-H + 16}" rx="3.2" ry="4.4" fill="${skin}"/>`;
    const hy = -H - 9;
    const headG = o.hair
      ? `<circle cy="${hy}" r="10" fill="${skin}"/><path d="M-10,${hy + 2} C-12,${hy - 12} 8,${hy - 16} 10,${hy - 4} C4,${hy - 8} -2,${hy - 6} -4,${hy + 4} L-6,${hy + 12} Z" fill="${o.hair}"/>`
      : `<circle cx="2" cy="${hy}" r="10" fill="${skin}"/><path d="M-12,${hy + 14} C-14,${hy - 8} -6,${hy - 14} 4,${hy - 13} C10,${hy - 12} 12,${hy - 6} 11,${hy - 3} C6,${hy - 6} 0,${hy - 4} -2,${hy + 4} L-4,${hy + 16} Z" fill="${head}"/>`;
    // Pilgrim-style tall black hat and white collar
    const hat = o.hat ? `<path d="M-15,${hy - 5} L15,${hy - 5} L12,${hy - 9} L9,${hy - 27} L-7,${hy - 27} L-11,${hy - 9} Z" fill="${o.hat}"/><rect x="-10" y="${hy - 12}" width="21" height="3.5" fill="#6a5a3a"/>` : "";
    const collar = o.collar ? `<path d="M-11,${-H + 6} L11,${-H + 6} L8,${-H + 14} L-8,${-H + 14} Z" fill="${o.collar}"/>` : "";
    return `<g ${o.id ? `id="${o.id}"` : ""} class="${o.cls || ""}" transform="translate(${x},${y}) scale(${o.flip ? -s : s},${s})">${o.shadow === false ? "" : `<ellipse cy="2" rx="${sit ? 30 : 22}" ry="5" fill="#000" opacity=".25"/>`}${body}${collar}${arms}${headG}${hat}</g>`;
  };

  /* ------------------------------------------------------------------ arms and hands
     K.limb(points, widths, fill): smooth tapered tube through points (shoulder, elbow, wrist...)
     K.hand(x, y, angle, pose, o): a hand whose wrist is at (x,y), pointing along angle (degrees).
       pose: "open" (relaxed, fingers together) | "grip" (closed around a staff or pen) | "palmup" (cupped, holding something)
     K.arm(o): sleeve + forearm + hand in one call (see the figures in film-scenes.js) */
  K.limb = function (pts, ws, fill, extra = "") {
    const L = [], R = [];
    for (let i = 0; i < pts.length; i++) {
      const a = pts[Math.max(0, i - 1)], b = pts[Math.min(pts.length - 1, i + 1)];
      let dx = b[0] - a[0], dy = b[1] - a[1]; const d = Math.hypot(dx, dy) || 1; dx /= d; dy /= d;
      const w = ws[i] / 2;
      L.push([pts[i][0] - dy * w, pts[i][1] + dx * w]); R.push([pts[i][0] + dy * w, pts[i][1] - dx * w]);
    }
    const smooth = q => { let d = ""; for (let i = 1; i < q.length - 1; i++) d += `Q${f1(q[i][0])},${f1(q[i][1])} ${f1((q[i][0] + q[i + 1][0]) / 2)},${f1((q[i][1] + q[i + 1][1]) / 2)} `; return d + `L${f1(q[q.length - 1][0])},${f1(q[q.length - 1][1])} `; };
    const Rr = R.slice().reverse();
    return `<path d="M${f1(L[0][0])},${f1(L[0][1])} ${smooth(L)} L${f1(Rr[0][0])},${f1(Rr[0][1])} ${smooth(Rr)} Z" fill="${fill}" ${extra}/>`;
  };

  K.hand = function (x, y, ang, pose, o = {}) {
    const skin = o.skin || "#c08a5e", sh = o.shade || "#8a5636", hi = o.lit || "#e0aa7a", s = o.size || 1;
    // one solid silhouette (no seams), shaded with soft creases
    const digit = (x1, y1, x2, y2, w1, w2, fill = skin) =>
      K.limb([[x1, y1], [(x1 + x2) / 2, (y1 + y2) / 2], [x2, y2]], [w1, (w1 + w2) / 2, w2], fill) + `<circle cx="${f1(x2)}" cy="${f1(y2)}" r="${f1(w2 / 2)}" fill="${fill}"/>`;
    const crease = (x1, y1, x2, y2) => `<path d="M${x1},${y1} L${x2},${y2}" stroke="${sh}" stroke-width="1.4" stroke-linecap="round" opacity=".55"/>`;
    const dark = `color-mix(in srgb, ${skin} 82%, ${sh})`;
    let g = "";
    if (pose === "grip") {   // closed hand from the back: knuckles rounded at the front, thumb wrapped across
      g = `<path d="M-2,-13 C14,-17 30,-17 40,-13 C49,-8 50,10 43,15 C30,19 12,18 -2,13 Z" fill="${skin}"/>
        ${crease(38, -6, 45, -6)}${crease(38, 1, 46, 1)}${crease(37, 8, 44, 8)}
        ${digit(4, -6, 36, -10, 11, 9)}
        <path d="M14,-13 C22,-15 30,-15 36,-13" stroke="${sh}" stroke-width="1.2" fill="none" opacity=".45"/>`;
    } else if (pose === "palmup") {   // flat, palm up, fingertips curling slightly
      g = `${digit(26, 6, 60, 3, 9, 7.5)}
        ${digit(4, -2, 30, -16, 11, 8.5)}
        <path d="M-2,-10 C14,-12 28,-12 38,-9 L64,-11 C70,-11 71,-3 65,-2 L40,4 C26,12 10,12 -2,10 Z" fill="${skin}"/>
        ${crease(40, -5, 60, -6)}${crease(38, 1, 56, 1)}`;
    } else {   // open and relaxed from the back: fingers together, slightly fanned; short thumb rising from the base
      g = `${digit(4, -4, 28, -22, 11, 8.5)}
        ${digit(30, 11, 52, 15, 8, 7)}
        <path d="M-2,-12 C12,-15 26,-15 36,-12 L62,-12 C68,-12 69,-6 64,-5 L66,-4 C71,-3 71,4 66,4 L60,8 C64,10 63,15 58,14 L36,14 C24,17 10,16 -2,12 Z" fill="${skin}"/>
        ${crease(40, -6, 60, -6)}${crease(40, 1, 62, 1)}${crease(38, 8, 56, 9)}
        <path d="M10,7 C20,10 28,10 34,9" stroke="${sh}" stroke-width="1.2" fill="none" opacity=".4"/>`;
    }
    return `<g transform="translate(${f1(x)},${f1(y)}) rotate(${f1(ang)}) scale(${s})">${g}</g>`;
  };

  // A robed arm: wide sleeve over the upper arm and part of the forearm, bare forearm, then the hand.
  // o: shoulder, elbow, wrist [x,y]; robe, cuff, skin, shade, lit colours; pose; sleeveEnd (0-1 along the forearm)
  K.arm = function (o) {
    const [sx, sy] = o.shoulder, [ex, ey] = o.elbow, [wx, wy] = o.wrist;
    const t = o.sleeveEnd ?? 0.5, cx = ex + (wx - ex) * t, cy = ey + (wy - ey) * t;
    const ang = o.handAngle ?? Math.atan2(wy - ey, wx - ex) * 180 / Math.PI;
    const fore = K.limb([[ex, ey], [wx, wy]], [o.fw0 || 44, o.fw1 || 30], o.skin) + `<path d="M${f1(ex)},${f1(ey + 10)} L${f1(wx)},${f1(wy + 8)}" stroke="${o.shade || "#000"}" stroke-width="6" opacity=".25" stroke-linecap="round"/>`;
    const sleeve = K.limb([[sx, sy], [ex, ey], [cx, cy]], [o.sw0 || 82, o.sw1 || 70, o.sw2 || 84], o.robe);
    const fold = `<path d="M${f1(sx + 6)},${f1(sy + 14)} Q${f1(ex - 4)},${f1(ey - 6)} ${f1(cx - (cx - ex) * .25)},${f1(cy - (cy - ey) * .25 + 10)}" stroke="${o.fold || "#000"}" stroke-width="5" fill="none" opacity=".22" stroke-linecap="round"/>`;
    const cuffAng = Math.atan2(cy - ey, cx - ex), nx = -Math.sin(cuffAng), ny = Math.cos(cuffAng), cw = (o.sw2 || 84) / 2;
    const cuff = o.cuff ? `<path d="M${f1(cx + nx * cw)},${f1(cy + ny * cw)} L${f1(cx - nx * cw)},${f1(cy - ny * cw)}" stroke="${o.cuff}" stroke-width="9" stroke-linecap="round"/>` : "";
    const opening = `<ellipse cx="${f1(cx)}" cy="${f1(cy)}" rx="9" ry="${f1(cw * .8)}" transform="rotate(${f1(cuffAng * 180 / Math.PI)} ${f1(cx)} ${f1(cy)})" fill="#000" opacity=".35"/>`;
    return `<g ${o.id ? `id="${o.id}"` : ""} ${o.cls ? `class="${o.cls}"` : ""}>${fore}${o.under || ""}<circle cx="${f1(wx)}" cy="${f1(wy)}" r="${f1((o.fw1 || 30) / 2 + 1)}" fill="${o.skin}"/>${K.hand(wx, wy, ang, o.pose || "open", { skin: o.skin, shade: o.shade, lit: o.lit, size: o.handSize || 1.15 })}${sleeve}${fold}${opening}${cuff}${o.over || ""}</g>`;
  };

  /* ------------------------------------------------------------------ talking character
     Painted profile figure with a moving jaw, blinking eye and breathing body. Faces right
     (mirror it with a negative x-scale). Head centre (0,0); ~130 units crown to chin; body to y 420.
     o.hair -> uncovered hair instead of a hood; o.crown -> gold crown; o.arm -> extra SVG in the body group
     o.noBeard -> a smooth face (women, angels, young men); o.lip -> lip colour */
  K.figure = function (id, o) {
    // smooth faces use one skin gradient laid across the whole head, so the moving jaw blends into the cheek
    const sk = o.noBeard ? `url(#${id}SkinU)` : `url(#${id}Skin)`;
    const hairBack = o.hair
      ? `<path d="M-70,-40 C-98,10 -108,80 -102,122 L-62,126 C-54,90 -42,60 -30,40 Z" fill="url(#${id}Hood)"/>`
      : `<path d="M-70,-40 C-96,10 -112,90 -136,210 L-60,210 C-50,150 -40,90 -30,40 Z" fill="url(#${id}Hood)"/>`;
    const hairFront = o.hair
      ? `<path d="M52,-56 C44,-100 -40,-114 -78,-74 C-104,-44 -110,24 -106,96 C-104,124 -86,134 -70,128 C-62,100 -50,70 -40,42 C-30,12 -18,-18 4,-40 C22,-54 40,-56 52,-56 Z" fill="url(#${id}Hood)"/>
         <g stroke="${o.hoodShadow}" fill="none" opacity=".45" stroke-linecap="round"><path d="M30,-80 C0,-92 -40,-84 -64,-50 C-80,-24 -86,20 -88,80" stroke-width="3"/><path d="M10,-60 C-14,-56 -34,-40 -46,-10 C-54,10 -58,50 -66,100" stroke-width="2.5"/><path d="M-20,-96 C-60,-90 -84,-50 -96,0" stroke-width="2"/></g>
         <path d="M44,-80 C20,-100 -30,-100 -60,-74" stroke="${o.hoodLit}" stroke-width="4" fill="none" opacity=".55"/>`
      : `<path d="M46,-64 C30,-104 -46,-114 -80,-70 C-104,-38 -112,40 -128,210 L-56,210 C-48,130 -38,60 -30,24 C-24,-6 -6,-32 18,-50 C30,-58 38,-61 46,-64 Z" fill="url(#${id}Hood)"/>
         <path d="M46,-64 C32,-57 10,-44 -4,-30 C-16,-16 -24,4 -30,24" stroke="${o.band}" stroke-width="7" fill="none" stroke-linecap="round"/>
         <path d="M40,-70 C14,-96 -40,-98 -66,-66" stroke="${o.hoodLit}" stroke-width="4" fill="none" opacity=".6"/>
         <g stroke="${o.hoodShadow}" fill="none" opacity=".38" stroke-linecap="round"><path d="M-40,-60 C-70,0 -80,80 -96,200" stroke-width="5"/><path d="M-20,-40 C-44,20 -50,100 -64,200" stroke-width="3"/><path d="M-70,-50 C-92,10 -100,100 -116,200" stroke-width="2.5"/></g>`;
    const crown = o.crown ? `<g>
        <path d="M-56,-74 L-54,-110 L-38,-90 L-22,-118 L-6,-92 L10,-118 L24,-90 L38,-106 L44,-70 C14,-80 -24,-82 -56,-74 Z" fill="url(#gGoldF)"/>
        <path d="M-56,-74 C-24,-82 14,-80 44,-70 L43,-62 C12,-72 -24,-74 -55,-66 Z" fill="#a8741c"/>
        <circle cx="-22" cy="-74" r="4" fill="#c0262c"/><circle cx="8" cy="-73" r="4" fill="#2a5ac0"/><circle cx="-40" cy="-72" r="3" fill="#2a8a4a"/>
        <circle cx="-22" cy="-118" r="3.4" fill="#ffe9a8"/><circle cx="10" cy="-118" r="3.4" fill="#ffe9a8"/></g>` : "";
    return `
    <defs>
      <linearGradient id="${id}SkinU" gradientUnits="userSpaceOnUse" x1="-64" y1="-92" x2="84" y2="-52"><stop offset="0" stop-color="${o.skinShadow}"/><stop offset=".55" stop-color="${o.skin}"/><stop offset="1" stop-color="${o.skinLit}"/></linearGradient>
      <linearGradient id="${id}Skin" x1="0" y1="0" x2="1" y2="0.3"><stop offset="0" stop-color="${o.skinShadow}"/><stop offset=".55" stop-color="${o.skin}"/><stop offset="1" stop-color="${o.skinLit}"/></linearGradient>
      <linearGradient id="${id}Robe" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="${o.robeShadow}"/><stop offset=".7" stop-color="${o.robe}"/><stop offset="1" stop-color="${o.robeLit}"/></linearGradient>
      <linearGradient id="${id}Hood" x1="0" y1="0" x2="1" y2="0.2"><stop offset="0" stop-color="${o.hoodShadow}"/><stop offset=".6" stop-color="${o.hood}"/><stop offset="1" stop-color="${o.hoodLit}"/></linearGradient>
      <linearGradient id="${id}Beard" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${o.beardShadow}"/><stop offset=".6" stop-color="${o.beard}"/><stop offset="1" stop-color="${o.beardLit}"/></linearGradient>
    </defs>
    <g id="${id}-body" class="breathe">
      <path d="M-210,420 C-220,250 -170,120 -70,80 C-20,62 40,66 90,100 C150,140 190,250 200,420 Z" fill="url(#${id}Robe)"/>
      ${o.robeFolds || ""}
      <path d="M-70,82 C-30,140 10,170 80,180 C120,186 160,200 196,240 L200,420 L140,420 C120,320 60,240 -40,210 C-100,190 -150,160 -170,140 C-150,110 -110,90 -70,82 Z" fill="${o.mantle}" opacity=".95"/>
      <path d="M-40,210 C40,236 100,290 130,420" stroke="${o.mantleShadow}" stroke-width="10" fill="none" opacity=".6"/>
      <path d="M-120,170 C-60,190 0,230 30,300" stroke="${o.mantleLit}" stroke-width="5" fill="none" opacity=".35"/>
      ${o.noBeard ? `<path d="M-30,20 C-10,40 20,56 34,58 L38,100 L-38,100 Z" fill="url(#${id}SkinU)"/><path d="M-20,46 C0,62 20,70 34,70" stroke="${o.skinShadow}" stroke-width="10" fill="none" opacity=".35" filter="url(#fBlur3)"/>` : `<path d="M-28,24 L30,60 L34,96 L-36,96 Z" fill="${o.skinShadow}"/>`}
      ${o.arm || ""}
    </g>
    <g id="${id}-head">
      ${hairBack}
      ${o.noBeard ? `<path d="M50,37 L36,38 L36,49 L46,49 Z" fill="#4a1c18"/>` : `<path d="M65,35 L36,37 L36,50 L57,50 Z" fill="#2a120c"/>`}
      <path d="M-40,-70 C-10,-92 40,-88 56,-56 C64,-42 66,-30 64,-22 C63,-16 60,-12 61,-8 C66,0 76,10 82,18 C84,22 78,25 72,24 C70,27 70,30 72,33 L67,36 C40,40 20,42 0,42 L-44,32 C-64,10 -64,-40 -40,-70 Z" fill="${sk}"/>
      <g opacity="${o.noBeard ? .4 : .85}" filter="url(#fBlur3)">
        <ellipse cx="50" cy="-12" rx="13" ry="8" fill="${o.skinShadow}" opacity=".55"/>
        <path d="M18,0 C30,18 46,22 60,20 C52,30 30,30 14,18 Z" fill="${o.skinShadow}" opacity=".55"/>
        <path d="M66,22 C70,26 74,26 78,24" stroke="${o.skinShadow}" stroke-width="5" opacity=".6" fill="none"/>
        <path d="M40,-48 C52,-44 60,-34 62,-24" stroke="${o.skinLit}" stroke-width="7" opacity=".55" fill="none"/>
        <path d="M66,-2 C72,6 78,12 80,17" stroke="${o.skinLit}" stroke-width="4" opacity=".6" fill="none"/>
        <ellipse cx="38" cy="4" rx="10" ry="7" fill="${o.skinLit}" opacity=".35"/>
        <path d="M20,-30 C24,-20 22,-10 16,-4" stroke="${o.skinShadow}" stroke-width="8" opacity=".35" fill="none"/>
      </g>
      <path d="M56,-56 C64,-42 66,-30 64,-22 C63,-16 60,-12 61,-8 C66,0 76,10 82,18 C84,22 78,25 72,24" stroke="${o.rim}" stroke-width="2.2" fill="none" opacity=".8"/>
      <path d="M36,-26 Q48,-33 63,-24" stroke="${o.brow}" stroke-width="5.5" stroke-linecap="round" fill="none"/>
      <path d="M36,-25 Q48,-31 62,-23" stroke="${o.beardLit}" stroke-width="1.6" stroke-linecap="round" fill="none" opacity=".5"/>
      <g><path d="M44,-13 Q52,-19 58,-12 Q52,-9 44,-13 Z" fill="#f0e2cc"/><circle cx="${o.lookUp ? 54 : 53}" cy="${o.lookUp ? -15 : -13.4}" r="2.6" fill="#2a1a10"/><circle cx="53.8" cy="-14.2" r=".9" fill="#fff"/>
        <path d="M43,-14 Q51,-21 59,-13" stroke="#2a1a10" stroke-width="1.6" fill="none"/>
        <path id="${id}-lid" d="M43,-14 Q51,-21 59,-13 L59,-13 Q51,-21 43,-14 Z" fill="${o.skin}"/></g>
      <path d="M44,-8 C48,-6 54,-6 58,-8" stroke="${o.skinShadow}" stroke-width="1.4" fill="none" opacity=".6"/>
      ${o.noBeard ? "" : `<path d="M-16,-2 C0,22 26,30 56,31 C52,41 28,47 -16,45 Z" fill="url(#${id}Beard)"/>
      <g stroke="${o.beardShadow}" stroke-width="1.6" opacity=".55" fill="none"><path d="M0,10 C10,24 24,30 40,32"/><path d="M-8,22 C6,34 22,38 44,38"/></g>`}
      ${o.noBeard ? `<ellipse cx="-8" cy="42" rx="42" ry="26" fill="${sk}"/>` : ""}
      <g id="${id}-jaw">
        <path d="M67,36 C71,40 71,44 67,47 C71,57 67,66 53,70 C31,74 7,66 -10,48 L-6,32 L20,40 Z" fill="${sk}"/>
        <path d="M68,46 C64,50 58,50 54,47" stroke="${o.lip || "#6a3226"}" stroke-width="2.4" fill="none" opacity="${o.noBeard ? .35 : .7}"/>
        ${o.noBeard ? "" : `<path d="M72,42 C80,${60 + o.beardLen * .2} 76,${80 + o.beardLen * .5} 64,${104 + o.beardLen * .8} C54,${124 + o.beardLen} 34,${140 + o.beardLen * 1.1} 12,${156 + o.beardLen * 1.15} C2,${126 + o.beardLen * .9} -14,${92 + o.beardLen * .5} -18,70 C-20,56 -16,48 -12,44 C12,58 46,58 72,42 Z" fill="url(#${id}Beard)"/>
        <g fill="none" stroke-linecap="round">
          ${[[-6, .95], [6, 1], [18, 1.05], [30, 1], [42, .92], [54, .8], [64, .62]].map(([x, k], n) =>
            `<path d="M${x + 4},${56 + n} C${x + 10},${90 + o.beardLen * .4 * k} ${x + 2},${110 + o.beardLen * .8 * k} ${x - 6 + n * 2},${130 + o.beardLen * 1.05 * k}" stroke="${n % 2 ? o.beardShadow : o.beardLit}" stroke-width="${n % 2 ? 2.2 : 1.6}" opacity="${n % 2 ? .6 : .7}"/>`).join("")}
        </g>`}
      </g>
      ${o.noBeard ? `<path d="M50,36 C58,33 66,34 70,36" stroke="${o.lip || "#a0524a"}" stroke-width="2.6" fill="none" stroke-linecap="round" opacity=".8"/>` : `<path d="M48,28 C58,22 76,26 79,36 C74,40 66,38 60,41 C54,44 46,44 42,40 C40,34 44,30 48,28 Z" fill="url(#${id}Beard)"/>
      <path d="M52,30 C60,28 70,30 76,35" stroke="${o.beardLit}" stroke-width="1.4" opacity=".6" fill="none"/>`}
      ${hairFront}
      ${crown}
    </g>`;
  };

  /* ------------------------------------------------------------------ shared defs + styles */
  K.DEFS = `<defs>
    <radialGradient id="gGlowF"><stop offset="0" stop-color="#fff6d6"/><stop offset=".22" stop-color="#ffd780" stop-opacity=".6"/><stop offset="1" stop-color="#ffb347" stop-opacity="0"/></radialGradient>
    <radialGradient id="gWarmF"><stop offset="0" stop-color="#ffc56a" stop-opacity=".9"/><stop offset=".45" stop-color="#ff9a3c" stop-opacity=".3"/><stop offset="1" stop-color="#ff7a1a" stop-opacity="0"/></radialGradient>
    <radialGradient id="gWhiteF"><stop offset="0" stop-color="#ffffff" stop-opacity=".95"/><stop offset=".35" stop-color="#fff4dc" stop-opacity=".45"/><stop offset="1" stop-color="#ffe6b0" stop-opacity="0"/></radialGradient>
    <radialGradient id="gLamp" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#ffcf7e" stop-opacity=".95"/><stop offset=".3" stop-color="#ff9d45" stop-opacity=".45"/><stop offset=".7" stop-color="#a04a18" stop-opacity=".12"/><stop offset="1" stop-color="#000" stop-opacity="0"/></radialGradient>
    <radialGradient id="gVig" cx=".5" cy=".5" r=".75"><stop offset=".55" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".62"/></radialGradient>
    <radialGradient id="gSunF" cx=".5" cy="1" r=".75"><stop offset="0" stop-color="#fff2c8"/><stop offset=".25" stop-color="#ffc870" stop-opacity=".85"/><stop offset=".6" stop-color="#ff9a5a" stop-opacity=".3"/><stop offset="1" stop-color="#ff7a3c" stop-opacity="0"/></radialGradient>
    <linearGradient id="gGoldF" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff0b0"/><stop offset=".4" stop-color="#f0c040"/><stop offset="1" stop-color="#a8701c"/></linearGradient>
    <linearGradient id="gWood" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#4a2a14"/><stop offset=".5" stop-color="#7a4a24"/><stop offset="1" stop-color="#3a200e"/></linearGradient>
    <linearGradient id="gParch" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#b89466"/><stop offset=".6" stop-color="#e6cc9a"/><stop offset="1" stop-color="#f6e2b6"/></linearGradient>
    <linearGradient id="gBasket" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#c8955a"/><stop offset="1" stop-color="#6e4520"/></linearGradient>
    <filter id="fGlow" x="-80%" y="-80%" width="260%" height="260%"><feGaussianBlur stdDeviation="5" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
    <filter id="fBlur6" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="6"/></filter>
    <filter id="fBlur3" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="3"/></filter>
    <filter id="fBlur12" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="12"/></filter>
    <filter id="fCloud" x="-20%" y="-50%" width="140%" height="200%"><feTurbulence type="fractalNoise" baseFrequency="0.006 0.02" numOctaves="4" seed="7"/><feColorMatrix values="0 0 0 0 1  0 0 0 0 .9  0 0 0 0 .85  0 0 0 1.4 -.55"/><feComposite in2="SourceGraphic" operator="in"/></filter>
    <filter id="fStone"><feTurbulence type="fractalNoise" baseFrequency="0.012" numOctaves="3" seed="3"/><feColorMatrix values="0 0 0 0 .55  0 0 0 0 .38  0 0 0 0 .24  0 0 0 .55 -.1"/><feComposite in2="SourceGraphic" operator="in"/></filter>
    <filter id="fGrain"><feTurbulence type="fractalNoise" baseFrequency=".85" numOctaves="2" stitchTiles="stitch"/><feColorMatrix type="saturate" values="0"/></filter>
  </defs>`;

  // Phone/tablet versions of the noise textures: same color and strength, no per-frame noise
  K.DEFS_LITE = K.DEFS
    .replace(/<filter id="fCloud"[\s\S]*?<\/filter>/, `<filter id="fCloud" x="-20%" y="-50%" width="140%" height="200%"><feGaussianBlur stdDeviation="14 7"/><feColorMatrix values="0 0 0 0 1  0 0 0 0 .9  0 0 0 0 .85  0 0 0 .32 0"/></filter>`)
    .replace(/<filter id="fStone"[\s\S]*?<\/filter>/, `<filter id="fStone"><feFlood flood-color="#8c613d" flood-opacity=".17"/><feComposite in2="SourceGraphic" operator="in"/></filter>`)
    .replace(/<filter id="fGrain"[\s\S]*?<\/filter>/, `<filter id="fGrain"><feFlood flood-opacity="0"/></filter>`)
    .replace("</defs>", `<radialGradient id="gCloudL"><stop offset="0" stop-color="#fff" stop-opacity=".5"/><stop offset=".55" stop-color="#fff" stop-opacity=".28"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient></defs>`);

  /* Phones and tablets: Safari (iPad/iPhone) draws SVG filters on the processor, every frame, at full zoom, so a
     slow camera move over a blurred sky or a stone texture gets slower and slower as it zooms in. These swaps
     keep the look with no filter: clouds become soft gradients, stone texture becomes a light tint, and the extra
     blur on glows that are already soft gradients is dropped. */
  K.liteArt = svg => svg
    .replace(/fill="#fff" filter="url\(#fCloud\)"/g, 'fill="url(#gCloudL)"')
    .replace(/<(rect|path|ellipse)\b([^>]*?)filter="url\(#fStone\)"([^>]*)>/g, (m, tag, a, b) => {
      let attrs = (a + b).replace(/fill="[^"]*"/, 'fill="#8c613d"');
      const op = /opacity="([\d.]+)"/.exec(attrs);
      attrs = op ? attrs.replace(op[0], `opacity="${(+op[1] * .17).toFixed(3)}"`) : attrs + ' opacity=".17"';
      return `<${tag}${attrs.replace(/\s+/g, " ")}>`;
    })
    .replace(/<(ellipse|path|rect|circle)\b([^>]*fill="url\(#g[^"]*\)"[^>]*?) filter="url\(#fBlur(?:6|12)\)"/g, "<$1$2")
    .replace(/<(ellipse|path|rect|circle)\b([^>]*?) filter="url\(#fBlur(?:6|12)\)"([^>]*fill="url\(#g[^"]*\)")/g, "<$1$2$3")
    .replace(/<g filter="url\(#fBlur(?:6|12)\)"([^>]*)>(\s*<ellipse[^>]*fill="url\(#g)/g, "<g$1>$2");

  K.STYLE = `<style>
    .tw{animation:twF 4s ease-in-out infinite}@keyframes twF{50%{opacity:.2}}
    .ring{display:none;fill:none;stroke:#ffd889;stroke-width:4;transform-box:fill-box;transform-origin:center;animation:ringF 1.6s ease-out infinite;pointer-events:none}
    .hot{cursor:pointer}.hot .ring{display:inline}@keyframes ringF{0%{opacity:.95;transform:scale(.6)}100%{opacity:0;transform:scale(1.5)}}
    .hotglow{display:none}.hot .hotglow{display:inline;animation:hg 1.6s ease-in-out infinite}@keyframes hg{50%{opacity:.35}}
    .fade{transition:opacity 1.4s ease}.slowfade{transition:opacity 3s ease}.hide{opacity:0!important;pointer-events:none}
    .shot{transition:opacity 1.1s ease}
    .cam{transform-origin:800px 450px;transition:transform 9s cubic-bezier(.35,.05,.3,1)}
    .breathe{animation:breathe 4.2s ease-in-out infinite;transform-box:fill-box;transform-origin:50% 100%}@keyframes breathe{50%{transform:scaleY(1.008) translateY(-1.5px)}}
    .flickF{transform-box:fill-box;transform-origin:50% 100%;animation:flickF .14s infinite alternate}@keyframes flickF{to{transform:scaleY(1.12) scaleX(.9)}}
    .lampglow{animation:lampg 2.8s ease-in-out infinite}@keyframes lampg{50%{opacity:.82}}
    .sway{animation:sway 5s ease-in-out infinite;transform-box:fill-box;transform-origin:50% 100%}@keyframes sway{50%{transform:skewX(-2.5deg)}}
    .write{animation:write 2.4s ease-in-out infinite}@keyframes write{30%{transform:translate(4px,2px)}60%{transform:translate(-2px,1px)}}
    .drift{animation:drift 70s linear infinite}@keyframes drift{to{transform:translateX(-160px)}}
    .move{transition:transform 4s cubic-bezier(.45,.05,.4,1)}
    .move2{transition:transform 2.2s cubic-bezier(.45,.05,.4,1)}
    .pop{transform-box:fill-box;transform-origin:50% 100%;transition:transform .7s cubic-bezier(.3,1.6,.5,1),opacity .5s}.pop.hide{transform:scale(.1)}
    .bob{animation:bob .5s ease-in-out infinite}@keyframes bob{50%{transform:translateY(-5px)}}
    .hop{animation:hop .7s ease-in-out infinite}@keyframes hop{50%{transform:translateY(-16px)}}
    .rise{animation:rise 3.6s ease-out forwards}@keyframes rise{0%{opacity:0;transform:translate(0,0)}15%{opacity:1}100%{opacity:0;transform:translate(var(--dx,40px),-260px)}}
    .shake{animation:shake .12s linear infinite}@keyframes shake{25%{transform:translate(9px,-5px)}50%{transform:translate(-7px,6px)}75%{transform:translate(6px,4px)}}
    .fall{animation:fall 14s linear infinite}@keyframes fall{0%{transform:translate(0,-60px) rotate(0)}100%{transform:translate(120px,1000px) rotate(540deg)}}
    .shimmer{animation:shim 1.8s ease-in-out infinite}@keyframes shim{50%{opacity:.55}}
    .vib{animation:vib .07s linear 18}@keyframes vib{50%{transform:translateX(2px)}}
    .leafburst{transform-box:fill-box;transform-origin:center;animation:leafburst 1.4s ease-out forwards}@keyframes leafburst{from{transform:scale(.5);opacity:1}to{transform:scale(6);opacity:0}}
    .snowF{animation:snowF linear infinite}@keyframes snowF{from{transform:translate(0,-40px)}to{transform:translate(90px,960px)}}
    .smoke{animation:smoke 6s ease-in-out infinite}@keyframes smoke{50%{transform:translate(8px,-10px);opacity:.7}}
  </style>`;

  /* ------------------------------------------------------------------ the film engine
     o.shots: [{name, svg}]          painted shots (each gets its own camera group)
     o.chars: ["david", ...]         characters whose jaw/eyes animate (ids used with K.figure)
     o.closeups: {who: {shot, from, to}}   cut to this shot when that character starts speaking
     o.enter(i, step, F)             set up the picture for step i (i <= 0: reset)
     o.tasks: {name: (F, done) => {}}   arm the tap target(s); call done() when the action has played
     o.onSpeaker(who, prev, F)       optional: speaker changed mid-line (e.g. a crowd calls out)
     o.afterVerse(i, F)              optional: what to show once a verse has been read (default: back to the step's shot) */
  K.film = function (root, api, o) {
    root.innerHTML = `<svg viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">${LITE ? K.DEFS_LITE : K.DEFS}${K.STYLE}${o.defs || ""}
      <rect x="-400" y="-200" width="2400" height="1300" fill="#05040a"/>
      ${o.shots.map(s => `<g id="shot-${s.name}" class="shot hide"><g id="cam-${s.name}" class="cam">${LITE ? K.liteArt(s.svg) : s.svg}</g></g>`).join("")}
      <g id="fx" pointer-events="none"></g>
      <rect x="-400" y="-200" width="2400" height="1300" fill="url(#gVig)" pointer-events="none"/>
      <rect class="grain" x="-400" y="-200" width="2400" height="1300" filter="url(#fGrain)" opacity=".05" style="mix-blend-mode:overlay" pointer-events="none"/>
    </svg>`;
    const svg = root.querySelector("svg");
    const F = { svg, api, step: -1, cur: null, base: null, state: {} };
    window.__film = F; // handy for testing in the browser console
    F.$ = s => svg.querySelector(s);
    F.$$ = s => Array.from(svg.querySelectorAll(s));
    F.show = (el, on = true) => { if (typeof el === "string") el = F.$(el); if (el) el.classList.toggle("hide", !on); };
    // Scene timers stop while the film is paused (see A.after in audio.js)
    F.later = (ms, fn) => { ms = FAST ? Math.min(ms, 120) : ms; const run = () => { if (svg.isConnected) fn(); }; return window.XAudio && XAudio.after ? XAudio.after(ms, run) : setTimeout(run, ms); };
    F.camSet = (name, t, instant) => {
      const g = F.$("#cam-" + name); if (!g || t == null) return;
      if (instant) { g.style.transition = "none"; g.style.transform = t; g.getBoundingClientRect(); g.style.transition = ""; }
      else g.style.transform = t;
    };
    // Change shots with a dissolve that never dips toward black: the new picture fades in on top of the old one
    // (or, if the new one sits underneath, the old one fades away off it). ms = length of the dissolve.
    const order = name => o.shots.findIndex(s => s.name === name);
    const shotEl = name => F.$("#shot-" + name);
    const fadeTimers = {};
    F.shot = (name, from, to, ms = 1100) => {
      const prev = F.cur, inEl = shotEl(name);
      if (from != null) F.camSet(name, from, true);
      for (const s of o.shots) if (s.name !== name && s.name !== prev) F.show("#shot-" + s.name, false);
      clearTimeout(fadeTimers[name]);
      if (!prev || prev === name || !inEl) { if (inEl) { inEl.style.transitionDuration = ms + "ms"; F.show(inEl); } }
      else {
        const outEl = shotEl(prev);
        if (order(name) > order(prev)) {        // new shot is on top: fade it in, then drop the old one
          inEl.style.transitionDuration = ms + "ms"; F.show(inEl);
          clearTimeout(fadeTimers[prev]);
          fadeTimers[prev] = setTimeout(() => { if (F.cur !== prev) { outEl.style.transitionDuration = "0s"; F.show(outEl, false); } }, ms + 60);
        } else {                                 // new shot is underneath: show it at once, fade the old one off it
          inEl.style.transitionDuration = "0s"; F.show(inEl);
          outEl.style.transitionDuration = ms + "ms"; F.show(outEl, false);
        }
      }
      F.cur = name;
      if (to != null) requestAnimationFrame(() => requestAnimationFrame(() => F.camSet(name, to)));
    };
    // The step's own shot, which the film returns to after a character's close-up
    F.setBase = (name, from, to, ms) => { F.base = name; F.shot(name, from, to, ms); };
    F.toBase = () => { if (F.base && F.cur !== F.base) F.shot(F.base); };
    F.fx = html => { const g = F.$("#fx"); g.insertAdjacentHTML("beforeend", html); const el = g.lastElementChild; F.later(6000, () => el && el.remove()); return el; };

    // ---- tap targets ----
    let task = null;
    F.arm = (ids, fn) => {
      ids = [].concat(ids);
      ids.forEach(id => { const el = F.$("#" + id); if (el) el.classList.add("hot"); });
      task = { ids, fn };
    };
    F.disarm = () => { if (task) task.ids.forEach(id => { const el = F.$("#" + id); if (el) el.classList.remove("hot"); }); task = null; };
    svg.addEventListener("pointerdown", e => {
      if (!task) return;
      // look through everything under the finger, so a big target never hides a small one
      const under = document.elementsFromPoint ? document.elementsFromPoint(e.clientX, e.clientY) : [e.target];
      let id = null;
      for (const el of under) { const t = el.closest && el.closest("[data-hit]"); if (t && task.ids.includes(t.dataset.hit)) { id = t.dataset.hit; break; } }
      if (!id) return;
      e.stopPropagation();
      const fn = task.fn; F.disarm(); fn(id);
    });

    // ---- who is speaking, and how open their mouth is ----
    let line = null, verse = null, t0 = 0, who = null;
    const blink = {};
    function firstChar(v) {
      if (!v) return null;
      if (v.speak) { const p = v.speak.find(([w]) => w !== "narrator"); return p ? p[0] : null; }
      return v.voice && v.voice !== "narrator" ? v.voice : null;
    }
    function setWho(w) {
      if (w === who) return;
      const prev = who; who = w;
      const c = w && o.closeups && o.closeups[w];
      if (c && F.cur !== c.shot) F.shot(c.shot, c.from || "scale(1)", c.to || "scale(1.06) translate(-20px,6px)");
      if (o.onSpeaker) o.onSpeaker(w, prev, F);
    }
    function level(now) {
      // -> [speaker, 0..1]
      const t = api.audioTime();
      if (line && t != null) {
        let w = null;
        if (line.segs) { for (const s of line.segs) if (t >= s[1] - 0.02 && t <= s[2] + 0.05) { w = s[0]; break; } }
        else w = t < (line.speakerEnd || 1e9) ? firstChar(verse) : null;
        const f = Math.floor(t * 30), e = line.env || "";
        const v = (+(e[f] || 0) + +(e[f + 1] || 0)) / 18;
        return [w, Math.min(1, v * 1.25)];
      }
      if (verse && t == null) {
        // no recording (or testing): the character speaks for an estimated time with a natural-looking wobble
        const el = (now - t0) / 1000, est = (FAST ? 0.6 : 1) * Math.max(2, verse.text.split(/\s+/).length * 0.36);
        if (el > est) return [null, 0];
        return [firstChar(verse), Math.max(0, Math.sin(el * 11) * 0.5 + Math.sin(el * 4.3) * 0.4)];
      }
      return [null, 0];
    }
    let raf = 0, lastFrame = 0;
    // Only touch an attribute when its value really changes, so a still picture never redraws
    const setA = (el, a, v) => { if (el.__v === undefined) el.__v = {}; if (el.__v[a] !== v) { el.__v[a] = v; el.setAttribute(a, v); } };
    function animate(now) {
      if (!svg.isConnected) return;
      raf = requestAnimationFrame(animate);
      if (window.XAudio && XAudio.paused) return;   // paused: mouths and blinks hold still
      if (LITE) { if (now - lastFrame < 40) return; lastFrame = now; }   // phones: mouths at 25 frames a second is plenty
      const [w, lv] = verse ? level(now) : [null, 0];
      if (verse) setWho(w);
      for (const id of o.chars || []) {
        const jaw = F.$(`#${id}-jaw`), head = F.$(`#${id}-head`), lid = F.$(`#${id}-lid`);
        if (!jaw) continue;
        const open = w === id ? lv : 0;
        const cur = jaw.__o || 0, next = cur + (open - cur) * 0.45;
        jaw.__o = next;   // kept on the element itself, not as an attribute, so it doesn't trigger a redraw
        const settled = next < 0.004 && open === 0;
        if (settled) jaw.__o = 0;
        setA(jaw, "transform", `rotate(${settled ? "0.00" : (next * 9).toFixed(2)} -6 -2)`);
        // (on phones the idle head sway is dropped: it would redraw the whole picture every frame)
        setA(head, "transform", `rotate(${(-next * 1.6 + (LITE ? 0 : Math.sin(now / 1900 + id.length) * 0.6)).toFixed(LITE ? 1 : 2)} 0 60)`);
        const b = blink[id] || (blink[id] = now + 1500 + Math.random() * 3000);
        setA(lid, "d", now > b && now < b + 140 ? "M43,-15 Q51,-21 59,-14 Q51,-9 43,-15 Z" : "M43,-15 Q51,-21 59,-14 L59,-14 Q51,-21 43,-15 Z");
        if (now > b + 140) blink[id] = now + 2500 + Math.random() * 3500;
      }
    }
    raf = requestAnimationFrame(animate);

    return {
      enter(i, step) {
        F.step = i; F.disarm(); line = null; verse = null; who = null;
        o.enter(i, step, F);
      },
      startTask(name, done) {
        const fn = o.tasks && o.tasks[name];
        if (!fn) { done(); return; }
        fn(F, () => F.later(400, done));
      },
      press() {
        if (!task) return;
        const fn = task.fn, id = task.ids[0]; F.disarm(); fn(id);
      },
      speaking(id, v) {
        if (id) { line = (window.NARRATION_ENVELOPES || {})[id] || null; verse = v || null; t0 = performance.now(); who = null; }
        else {
          line = null; verse = null; setWho(null);
          if (o.afterVerse) o.afterVerse(F.step, F); else F.later(300, F.toBase);
        }
      },
      finish() { cancelAnimationFrame(raf); }
    };
  };
})();
