/* Film edition — painted scenes where the characters appear and speak (Station 1 test).
   Loaded after scenes.js; replaces XScenes.promise. Uses audio/narration/envelopes.js for mouth movement. */
(function () {
  const S = window.XScenes;
  const $ = (r, s) => r.querySelector(s);
  const FAST = /[?&]fast=1/.test(location.search);

  function rng(seed) { return function () { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

  // Organic ridge line for hills: smooth curve with layered noise
  function ridge(y0, amp, seed, x0 = -400, x1 = 2000, step = 40) {
    const r = rng(seed); const pts = [];
    let a = 0, b = 0;
    for (let x = x0; x <= x1; x += step) {
      a += (r() - 0.5) * 0.9; b = b * 0.82 + (r() - 0.5) * 0.6; a *= 0.9;
      pts.push([x, y0 + Math.sin(x / 260 + seed) * amp * 0.6 + a * amp * 0.5 + b * amp * 0.3]);
    }
    let d = `M${x0},1000 L${pts[0][0]},${pts[0][1].toFixed(1)} `;
    for (let i = 1; i < pts.length - 1; i++) {
      const [x, y] = pts[i], [nx, ny] = pts[i + 1];
      d += `Q${x},${y.toFixed(1)} ${((x + nx) / 2).toFixed(1)},${((y + ny) / 2).toFixed(1)} `;
    }
    return d + `L${x1},1000 Z`;
  }

  function starfield(n, seed, yMax, x0 = -300, x1 = 1900) {
    const r = rng(seed); let s = "";
    for (let i = 0; i < n; i++) {
      const x = x0 + r() * (x1 - x0), y = Math.pow(r(), 1.3) * yMax, big = r() < 0.06;
      const rad = big ? 1.8 + r() : 0.5 + r() * 1.0, op = (0.35 + r() * 0.65).toFixed(2);
      const col = r() < 0.15 ? "#ffe7c4" : r() < 0.3 ? "#cfe0ff" : "#fff9ee";
      s += `<circle class="${r() < 0.35 ? "tw" : ""}" cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${rad.toFixed(2)}" fill="${col}" opacity="${op}" style="animation-delay:${(-r() * 4).toFixed(2)}s"/>`;
    }
    return s;
  }

  function glint(r) {
    return `<g filter="url(#fGlowF)"><path d="M0,${-r * 3} L${r * 0.18},${-r * 0.18} L${r * 3},0 L${r * 0.18},${r * 0.18} L0,${r * 3} L${-r * 0.18},${r * 0.18} L${-r * 3},0 L${-r * 0.18},${-r * 0.18} Z" fill="#fff8e4"/><circle r="${r * 0.55}" fill="#ffffff"/></g>`;
  }

  // Small flat-roofed stone houses stepping up a hillside, lit by moonlight from the upper left
  function village(x, y, s, seed, warm = 0.6) {
    const r = rng(seed); let g = "";
    const rows = [[0, 14, 0], [-34, 11, 40], [-64, 8, 90], [-90, 5, 140]];
    for (const [dy, n, x0] of rows) {
      let cx = x0;
      for (let i = 0; i < n; i++) {
        const w = 26 + r() * 22, h = 18 + r() * 14, yy = dy - Math.sin((cx / 560) * Math.PI) * 10;
        const lit = r() < 0.55;
        g += `<rect x="${cx.toFixed(1)}" y="${(yy - h).toFixed(1)}" width="${w.toFixed(1)}" height="${(h + 40).toFixed(1)}" fill="${lit ? "#3b3f6c" : "#2a2d55"}"/>`;
        g += `<rect x="${(cx + w * 0.62).toFixed(1)}" y="${(yy - h).toFixed(1)}" width="${(w * 0.38).toFixed(1)}" height="${(h + 40).toFixed(1)}" fill="#1f2246" opacity=".85"/>`;
        g += `<rect x="${(cx - 1).toFixed(1)}" y="${(yy - h - 3).toFixed(1)}" width="${(w + 2).toFixed(1)}" height="3" fill="#4a4f80"/>`;
        if (r() < 0.12) g += `<path d="M${(cx + w * 0.2).toFixed(1)},${(yy - h - 2).toFixed(1)} a${(w * 0.3).toFixed(1)},${(w * 0.3).toFixed(1)} 0 0 1 ${(w * 0.6).toFixed(1)},0 Z" fill="#30345e"/>`;
        g += `<path d="M${(cx + w * 0.3).toFixed(1)},${(yy + 2).toFixed(1)} v-7 a3.5,3.5 0 0 1 7,0 v7 Z" fill="#14152e"/>`;
        if (r() < warm) g += `<rect x="${(cx + w * 0.62).toFixed(1)}" y="${(yy - h * 0.62).toFixed(1)}" width="4" height="5" fill="#ffc46a"/><circle cx="${(cx + w * 0.64).toFixed(1)}" cy="${(yy - h * 0.58).toFixed(1)}" r="11" fill="url(#gWarmF)" opacity=".45"/>`;
        cx += w + 2 + r() * 8;
      }
    }
    return `<g transform="translate(${x},${y}) scale(${s})">${g}</g>`;
  }

  function olive(x, y, s, fill, seed) {
    const r = rng(seed); let leaves = "";
    for (let i = 0; i < 14; i++) leaves += `<ellipse cx="${(r() - 0.5) * 120}" cy="${-120 - r() * 70}" rx="${30 + r() * 30}" ry="${18 + r() * 16}" fill="${fill}"/>`;
    return `<g transform="translate(${x},${y}) scale(${s})"><path d="M-8,0 C-14,-40 6,-70 -6,-120 M4,0 C10,-50 28,-80 30,-120" stroke="${fill}" stroke-width="14" fill="none" stroke-linecap="round"/>${leaves}</g>`;
  }

  /* -------- Prophet: painted profile figure with a moving jaw, blinking eye and breathing body --------
     Faces right. Head centre at (0,0); about 130 units from crown to chin. */
  function prophet(id, o) {
    const sk = `url(#${id}Skin)`;
    const robeFolds = o.robeFolds || "";
    return `
    <defs>
      <linearGradient id="${id}Skin" x1="0" y1="0" x2="1" y2="0.3"><stop offset="0" stop-color="${o.skinShadow}"/><stop offset=".55" stop-color="${o.skin}"/><stop offset="1" stop-color="${o.skinLit}"/></linearGradient>
      <linearGradient id="${id}Robe" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="${o.robeShadow}"/><stop offset=".7" stop-color="${o.robe}"/><stop offset="1" stop-color="${o.robeLit}"/></linearGradient>
      <linearGradient id="${id}Hood" x1="0" y1="0" x2="1" y2="0.2"><stop offset="0" stop-color="${o.hoodShadow}"/><stop offset=".6" stop-color="${o.hood}"/><stop offset="1" stop-color="${o.hoodLit}"/></linearGradient>
      <linearGradient id="${id}Beard" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${o.beardShadow}"/><stop offset=".6" stop-color="${o.beard}"/><stop offset="1" stop-color="${o.beardLit}"/></linearGradient>
    </defs>
    <g id="${id}-body" class="breathe">
      <path d="M-210,420 C-220,250 -170,120 -70,80 C-20,62 40,66 90,100 C150,140 190,250 200,420 Z" fill="url(#${id}Robe)"/>
      ${robeFolds}
      <path d="M-70,82 C-30,140 10,170 80,180 C120,186 160,200 196,240 L200,420 L140,420 C120,320 60,240 -40,210 C-100,190 -150,160 -170,140 C-150,110 -110,90 -70,82 Z" fill="${o.mantle}" opacity=".95"/>
      <path d="M-40,210 C40,236 100,290 130,420" stroke="${o.mantleShadow}" stroke-width="10" fill="none" opacity=".6"/>
      <path d="M-120,170 C-60,190 0,230 30,300" stroke="${o.mantleLit}" stroke-width="5" fill="none" opacity=".35"/>
      <path d="M-28,24 L30,60 L34,96 L-36,96 Z" fill="${o.skinShadow}"/>
      ${o.arm || ""}
    </g>
    <g id="${id}-head" class="nod">
      <path d="M-70,-40 C-96,10 -112,90 -136,210 L-60,210 C-50,150 -40,90 -30,40 Z" fill="url(#${id}Hood)"/>
      <path class="mouth-in" d="M70,35 L36,37 L36,50 L68,49 Z" fill="#2a120c"/>
      <path d="M-40,-70 C-10,-92 40,-88 56,-56 C64,-42 66,-30 64,-22 C63,-16 60,-12 61,-8 C66,0 76,10 82,18 C84,22 78,25 72,24 C70,27 70,30 72,33 L67,36 C40,40 20,42 0,42 L-44,32 C-64,10 -64,-40 -40,-70 Z" fill="${sk}"/>
      <g opacity=".85" filter="url(#fBlur3)">
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
      <g id="${id}-eye"><path d="M44,-13 Q52,-19 58,-12 Q52,-9 44,-13 Z" fill="#f0e2cc"/><circle cx="53" cy="-13.4" r="2.6" fill="#2a1a10"/><circle cx="53.8" cy="-14.2" r=".9" fill="#fff"/>
        <path d="M43,-14 Q51,-21 59,-13" stroke="#2a1a10" stroke-width="1.6" fill="none"/>
        <path id="${id}-lid" d="M43,-14 Q51,-21 59,-13 L59,-13 Q51,-21 43,-14 Z" fill="${o.skin}"/></g>
      <path d="M44,-8 C48,-6 54,-6 58,-8" stroke="${o.skinShadow}" stroke-width="1.4" fill="none" opacity=".6"/>
      <path d="M-16,-2 C0,22 26,30 56,31 C52,41 28,47 -16,45 Z" fill="url(#${id}Beard)"/>
      <g stroke="${o.beardShadow}" stroke-width="1.6" opacity=".55" fill="none"><path d="M0,10 C10,24 24,30 40,32"/><path d="M-8,22 C6,34 22,38 44,38"/></g>
      <g id="${id}-jaw">
        <path d="M67,36 C71,40 71,44 67,47 C71,57 67,66 53,70 C31,74 7,66 -10,48 L-6,32 L20,40 Z" fill="${sk}"/>
        <path d="M68,46 C64,50 58,50 54,47" stroke="#6a3226" stroke-width="2.4" fill="none" opacity=".7"/>
        <path d="M72,42 C${80},${60 + o.beardLen * 0.2} ${76},${80 + o.beardLen * 0.5} ${64},${104 + o.beardLen * 0.8} C${54},${124 + o.beardLen} ${34},${140 + o.beardLen * 1.1} ${12},${156 + o.beardLen * 1.15} C${2},${126 + o.beardLen * 0.9} ${-14},${92 + o.beardLen * 0.5} -18,70 C-20,56 -16,48 -12,44 C12,58 46,58 72,42 Z" fill="url(#${id}Beard)"/>
        <g fill="none" stroke-linecap="round">
          ${[[-6, 0.95], [6, 1.0], [18, 1.05], [30, 1.0], [42, 0.92], [54, 0.8], [64, 0.62]].map(([x, k], n) =>
            `<path d="M${x + 4},${56 + n} C${x + 10},${90 + o.beardLen * 0.4 * k} ${x + 2},${110 + o.beardLen * 0.8 * k} ${x - 6 + n * 2},${130 + o.beardLen * 1.05 * k}" stroke="${n % 2 ? o.beardShadow : o.beardLit}" stroke-width="${n % 2 ? 2.2 : 1.6}" opacity="${n % 2 ? .6 : .7}"/>`).join("")}
        </g>
      </g>
      <path d="M48,28 C58,22 76,26 79,36 C74,40 66,38 60,41 C54,44 46,44 42,40 C40,34 44,30 48,28 Z" fill="url(#${id}Beard)"/>
      <path d="M52,30 C60,28 70,30 76,35" stroke="${o.beardLit}" stroke-width="1.4" opacity=".6" fill="none"/>
      <path d="M46,-64 C30,-104 -46,-114 -80,-70 C-104,-38 -112,40 -128,210 L-56,210 C-48,130 -38,60 -30,24 C-24,-6 -6,-32 18,-50 C30,-58 38,-61 46,-64 Z" fill="url(#${id}Hood)"/>
      <path d="M46,-64 C32,-57 10,-44 -4,-30 C-16,-16 -24,4 -30,24" stroke="${o.band}" stroke-width="7" fill="none" stroke-linecap="round"/>
      <path d="M40,-70 C14,-96 -40,-98 -66,-66" stroke="${o.hoodLit}" stroke-width="4" fill="none" opacity=".6"/>
      <g stroke="${o.hoodShadow}" fill="none" opacity=".38" stroke-linecap="round"><path d="M-40,-60 C-70,0 -80,80 -96,200" stroke-width="5"/><path d="M-20,-40 C-44,20 -50,100 -64,200" stroke-width="3"/><path d="M-70,-50 C-92,10 -100,100 -116,200" stroke-width="2.5"/></g>
    </g>`;
  }

  const ISAIAH = {
    skin: "#a8764e", skinLit: "#e2a979", skinShadow: "#4f3020", rim: "#ffd29a",
    beard: "#d4ccbd", beardLit: "#fff6e4", beardShadow: "#6e665b", beardLen: 62, brow: "#cfc6b6",
    hood: "#cdbb98", hoodLit: "#f2dfb6", hoodShadow: "#5e5240", band: "#7a2f22",
    robe: "#5a2a24", robeLit: "#9a4a36", robeShadow: "#22100e",
    mantle: "#3a2f4e", mantleLit: "#8e7aa8", mantleShadow: "#140f1e",
    arm: `<g id="isaiah-arm" class="write">
      <path d="M60,150 C110,170 150,200 190,230 L200,262 C150,250 100,228 50,210 Z" fill="#4a2420"/>
      <path d="M186,226 C200,220 214,226 218,240 C220,252 210,262 198,260 C190,258 184,246 186,226 Z" fill="#c48a5c"/>
      <path d="M214,232 L262,290" stroke="#3a2a1a" stroke-width="3.5" stroke-linecap="round"/></g>`
  };
  const MICAH = {
    skin: "#8f6240", skinLit: "#c0906a", skinShadow: "#3d2416", rim: "#b9cdf5",
    beard: "#3a2a1e", beardLit: "#806a58", beardShadow: "#160f0a", beardLen: 4, brow: "#22160e",
    hood: "#6b5a44", hoodLit: "#9d8a6c", hoodShadow: "#2c241a", band: "#2e4a5a",
    robe: "#3b4a3a", robeLit: "#5f7560", robeShadow: "#141a14",
    mantle: "#5a4632", mantleLit: "#a08a6c", mantleShadow: "#20180f",
    arm: `<path d="M70,140 C110,160 140,190 160,230 L150,260 C120,230 90,200 50,190 Z" fill="#2c3a2c"/>
      <path d="M150,226 C162,220 176,226 178,240 C178,252 168,258 158,256 C150,252 146,240 150,226 Z" fill="#8f6240"/>`
  };

  const STYLE = `<style>
    .tw{animation:twF 4s ease-in-out infinite}@keyframes twF{50%{opacity:.2}}
    .ring{display:none;fill:none;stroke:#ffd889;stroke-width:4;transform-box:fill-box;transform-origin:center;animation:ringF 1.6s ease-out infinite}
    .hot{cursor:pointer}.hot .ring{display:inline}@keyframes ringF{0%{opacity:.95;transform:scale(.6)}100%{opacity:0;transform:scale(1.5)}}
    .fade{transition:opacity 1.4s ease}.hide{opacity:0;pointer-events:none}
    .shot{transition:opacity 1.1s ease}
    #cam,#camI,#camM{transform-origin:800px 450px;transition:transform 9s cubic-bezier(.35,.05,.3,1)}
    .breathe{animation:breathe 4.2s ease-in-out infinite;transform-box:fill-box;transform-origin:50% 100%}@keyframes breathe{50%{transform:scaleY(1.008) translateY(-1.5px)}}
    .flickF{transform-box:fill-box;transform-origin:50% 100%;animation:flickF .14s infinite alternate}@keyframes flickF{to{transform:scaleY(1.12) scaleX(.9)}}
    .lampglow{animation:lampg 2.8s ease-in-out infinite}@keyframes lampg{50%{opacity:.82}}
    .sway{animation:sway 5s ease-in-out infinite;transform-box:fill-box;transform-origin:0% 0%}@keyframes sway{50%{transform:skewX(-2deg) translateX(-4px)}}
    .write{animation:write 2.4s ease-in-out infinite;transform-box:view-box}@keyframes write{30%{transform:translate(4px,2px)}60%{transform:translate(-2px,1px)}}
    .drift{animation:drift 60s linear infinite}@keyframes drift{to{transform:translateX(-120px)}}
  </style>`;

  const DEFS = `<defs>
    <linearGradient id="gSkyF" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#02030f"/><stop offset=".45" stop-color="#0a1033"/><stop offset=".75" stop-color="#1e2452"/><stop offset="1" stop-color="#433463"/></linearGradient>
    <linearGradient id="gDawnSky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1b2a5c"/><stop offset=".5" stop-color="#6a5a8c"/><stop offset=".78" stop-color="#e09a74"/><stop offset="1" stop-color="#ffd48a"/></linearGradient>
    <radialGradient id="gSun" cx=".5" cy="1" r=".75"><stop offset="0" stop-color="#fff2c8"/><stop offset=".25" stop-color="#ffc870" stop-opacity=".85"/><stop offset=".6" stop-color="#ff9a5a" stop-opacity=".3"/><stop offset="1" stop-color="#ff7a3c" stop-opacity="0"/></radialGradient>
    <radialGradient id="gGlowF"><stop offset="0" stop-color="#fff6d6"/><stop offset=".22" stop-color="#ffd780" stop-opacity=".6"/><stop offset="1" stop-color="#ffb347" stop-opacity="0"/></radialGradient>
    <radialGradient id="gWarmF"><stop offset="0" stop-color="#ffc56a" stop-opacity=".9"/><stop offset=".45" stop-color="#ff9a3c" stop-opacity=".3"/><stop offset="1" stop-color="#ff7a1a" stop-opacity="0"/></radialGradient>
    <radialGradient id="gLamp" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#ffcf7e" stop-opacity=".95"/><stop offset=".3" stop-color="#ff9d45" stop-opacity=".45"/><stop offset=".7" stop-color="#a04a18" stop-opacity=".12"/><stop offset="1" stop-color="#000" stop-opacity="0"/></radialGradient>
    <radialGradient id="gMilky" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#cfd8ff" stop-opacity=".22"/><stop offset=".5" stop-color="#8f9ad8" stop-opacity=".08"/><stop offset="1" stop-color="#000" stop-opacity="0"/></radialGradient>
    <radialGradient id="gVig" cx=".5" cy=".5" r=".75"><stop offset=".55" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".65"/></radialGradient>
    <radialGradient id="gMoonRim" cx=".2" cy=".15" r=".9"><stop offset="0" stop-color="#9fb4ec" stop-opacity=".35"/><stop offset="1" stop-color="#000" stop-opacity="0"/></radialGradient>
    <linearGradient id="gWall" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#140c08"/><stop offset=".6" stop-color="#2e1d12"/><stop offset="1" stop-color="#1c120b"/></linearGradient>
    <linearGradient id="gTable" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#5a3518"/><stop offset=".15" stop-color="#3a220f"/><stop offset="1" stop-color="#120a05"/></linearGradient>
    <linearGradient id="gParch" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#b89466"/><stop offset=".6" stop-color="#e6cc9a"/><stop offset="1" stop-color="#f6e2b6"/></linearGradient>
    <filter id="fGlowF" x="-80%" y="-80%" width="260%" height="260%"><feGaussianBlur stdDeviation="5" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
    <filter id="fBlur6"><feGaussianBlur stdDeviation="6"/></filter>
    <filter id="fBlur3" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="3"/></filter>
    <filter id="fBlur2"><feGaussianBlur stdDeviation="1.6"/></filter>
    <filter id="fCloud" x="-20%" y="-50%" width="140%" height="200%"><feTurbulence type="fractalNoise" baseFrequency="0.006 0.02" numOctaves="4" seed="7"/><feColorMatrix values="0 0 0 0 .78  0 0 0 0 .82  0 0 0 0 1  0 0 0 1.4 -.55"/><feComposite in2="SourceGraphic" operator="in"/></filter>
    <filter id="fStone"><feTurbulence type="fractalNoise" baseFrequency="0.012" numOctaves="3" seed="3"/><feColorMatrix values="0 0 0 0 .55  0 0 0 0 .38  0 0 0 0 .24  0 0 0 .55 -.1"/><feComposite in2="SourceGraphic" operator="in"/></filter>
    <filter id="fGrain"><feTurbulence type="fractalNoise" baseFrequency=".85" numOctaves="2" stitchTiles="stitch"/><feColorMatrix type="saturate" values="0"/></filter>
    <clipPath id="clipWin"><path d="M1110,560 L1110,260 A120,120 0 0 1 1350,260 L1350,560 Z"/></clipPath>
  </defs>`;

  S.promise = function (root, api) {
    const stars = [["star1", 420, 250, 15], ["star2", 1180, 210, 15], ["star3", 800, 130, 20]];
    root.innerHTML = `<svg viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">${DEFS}${STYLE}
      <rect x="-400" y="-200" width="2400" height="1300" fill="#02030f"/>

      <!-- ================= WIDE: the land waiting under the stars ================= -->
      <g id="wide" class="shot">
       <g id="cam">
        <rect x="-400" y="-200" width="2400" height="1300" fill="url(#gSkyF)"/>
        <g id="dawnSky" class="fade hide"><rect x="-400" y="-200" width="2400" height="1300" fill="url(#gDawnSky)"/></g>
        <g id="night">
          <ellipse cx="900" cy="300" rx="1100" ry="150" fill="url(#gMilky)" transform="rotate(-22 900 300)"/>
          <ellipse cx="900" cy="300" rx="820" ry="90" fill="#fff" filter="url(#fCloud)" opacity=".22" transform="rotate(-22 900 300)"/>
          ${starfield(320, 11, 620)}
        </g>
        ${stars.map(([id, x, y, r]) => `
          <g id="${id}" data-hit="${id}" transform="translate(${x},${y})">
            <circle r="70" fill="transparent"/><circle class="ring" r="58"/>
            <g class="dim"><circle r="2.6" fill="#fff8e6"/><circle r="12" fill="url(#gGlowF)" opacity=".5"/></g>
            <g class="lit fade hide"><circle r="${r * 9}" fill="url(#gGlowF)" opacity=".85"/>${glint(r)}</g>
          </g>`).join("")}
        <g id="sunrise" class="fade hide"><ellipse cx="800" cy="640" rx="1100" ry="520" fill="url(#gSun)"/></g>
        <path d="${ridge(560, 46, 3)}" fill="#2b2c58"/>
        <path d="${ridge(560, 46, 3)}" fill="url(#gMoonRim)"/>
        ${village(980, 590, 1.0, 21)}
        <path d="${ridge(640, 34, 8)}" fill="#1b1b40"/>
        ${olive(260, 650, 0.8, "#15163a", 4)}${olive(1450, 660, 0.7, "#15163a", 9)}
        <path d="${ridge(735, 26, 14)}" fill="#0f0f2a"/>
        <g transform="translate(330,742) scale(1.15)" fill="#07071a">
          <path d="M-16,0 C-20,-40 -18,-80 -8,-112 C-4,-126 10,-126 14,-112 C22,-82 22,-40 18,0 Z"/>
          <circle cx="3" cy="-130" r="11"/><path d="M-10,-134 C-8,-150 14,-150 16,-134 L18,-112 L-12,-112 Z"/>
          <path d="M28,0 L30,-150" stroke="#07071a" stroke-width="4"/>
        </g>
        <path d="${ridge(820, 18, 19)}" fill="#06061a"/>
       </g>
      </g>

      <!-- ================= ISAIAH: lamplit room, writing the prophecy ================= -->
      <g id="isaiahShot" class="shot hide">
       <g id="camI">
        <rect x="-400" y="-200" width="2400" height="1300" fill="url(#gWall)"/>
        <rect x="-400" y="-200" width="2400" height="1300" fill="#000" filter="url(#fStone)" opacity=".38"/>
        <g opacity=".08" stroke="#0b0604" stroke-width="3">${(() => { let l = ""; for (let y = -40; y < 900; y += 92) { l += `<path d="M-400,${y} L2000,${y}"/>`; const off = (y / 92) % 2 ? 0 : 70; for (let x = -400 + off; x < 2000; x += 140) l += `<path d="M${x},${y} L${x},${y + 92}"/>`; } return l; })()}</g>
        <g clip-path="url(#clipWin)"><rect x="1100" y="120" width="260" height="460" fill="url(#gSkyF)"/>${starfield(60, 31, 560, 1100, 1360)}<g transform="translate(1250,250)" class="winstar">${glint(10)}<circle r="60" fill="url(#gGlowF)" opacity=".7"/></g></g>
        <path d="M1110,560 L1110,260 A120,120 0 0 1 1350,260 L1350,560" fill="none" stroke="#120a06" stroke-width="26"/>
        <path d="M1094,572 L1366,572" stroke="#3a2618" stroke-width="16"/>
        <ellipse class="lampglow" cx="1110" cy="680" rx="820" ry="600" fill="url(#gLamp)" opacity=".95"/>
        <g transform="translate(590,420) scale(1.62)">${prophet("isaiah", ISAIAH)}</g>
        <path d="M-400,760 L2000,760 L2000,1100 L-400,1100 Z" fill="url(#gTable)"/>
        <path d="M-400,760 L2000,760" stroke="#7a4a20" stroke-width="3" opacity=".6"/>
        <g transform="translate(700,772)">
          <path d="M0,0 L380,-6 L392,40 L6,46 Z" fill="url(#gParch)"/>
          <g stroke="#4a3220" stroke-width="2" opacity=".55">${(() => { let w = ""; const r = rng(5); for (let row = 0; row < 4; row++) { let x = 360; while (x > 30) { const len = 12 + r() * 26; w += `<path d="M${x},${8 + row * 9} l${-len},${(r() - .5) * 2}"/>`; x -= len + 8; } } return w; })()}</g>
          <rect x="-14" y="-8" width="18" height="62" rx="8" fill="#6b4a2a"/><rect x="384" y="-12" width="18" height="62" rx="8" fill="#6b4a2a"/>
        </g>
        <g transform="translate(1120,760)">
          <path d="M-46,0 C-46,-22 30,-26 52,-12 L74,-14 C80,-10 76,-4 66,-2 C40,6 -40,8 -46,0 Z" fill="#7a4a2a"/>
          <path d="M-40,-8 C-20,-18 30,-18 50,-10" stroke="#a8693c" stroke-width="3" fill="none"/>
          <path class="flickF" d="M70,-14 C82,-34 78,-52 70,-66 C62,-52 58,-34 70,-14 Z" fill="#ffcf5a"/>
          <path d="M70,-18 C75,-28 74,-38 70,-46 C66,-38 65,-28 70,-18 Z" fill="#fff4d0"/>
        </g>
       </g>
      </g>

      <!-- ================= MICAH: moonlit hill above little Bethlehem ================= -->
      <g id="micahShot" class="shot hide">
       <g id="camM">
        <rect x="-400" y="-200" width="2400" height="1300" fill="url(#gSkyF)"/>
        <ellipse cx="600" cy="260" rx="900" ry="120" fill="url(#gMilky)" transform="rotate(18 600 260)"/>
        ${starfield(220, 41, 600)}
        <g transform="translate(420,190)">${glint(14)}<circle r="120" fill="url(#gGlowF)" opacity=".8"/></g>
        <path d="${ridge(610, 30, 33)}" fill="#26284f"/>
        ${village(170, 640, 0.75, 51, 0.9)}
        <path d="${ridge(690, 24, 37)}" fill="#171838"/>
        <g transform="translate(1120,470) scale(-1.55,1.55)">${prophet("micah", MICAH)}</g>
        <path d="${ridge(820, 30, 39)}" fill="#08081c"/>
        <rect x="-400" y="-200" width="2400" height="1300" fill="url(#gMoonRim)" opacity=".5"/>
       </g>
      </g>

      <rect x="-400" y="-200" width="2400" height="1300" fill="url(#gVig)" pointer-events="none"/>
      <rect x="-400" y="-200" width="2400" height="1300" filter="url(#fGrain)" opacity=".06" style="mix-blend-mode:overlay" pointer-events="none"/>
    </svg>`;

    const svg = $(root, "svg");
    const show = (el, on = true) => el && el.classList.toggle("hide", !on);
    const cam = (id, t) => { const g = $(svg, "#" + id); if (g) g.style.transform = t; };
    let task = null;
    svg.addEventListener("pointerdown", e => { const t = e.target.closest("[data-hit]"); if (t && task) { e.stopPropagation(); task(t.dataset.hit); } });

    // ---- who speaks which verse, and where the camera sits ----
    const SPEAKER = { 1: "isaiah", 2: "micah", 3: "isaiah", 4: "isaiah" };
    const WIDE_CAM = [
      "scale(1.0) translate(0px,0px)", "scale(1.08) translate(120px,20px)", "scale(1.08) translate(-120px,20px)",
      "scale(1.1) translate(0px,50px)", "scale(1.03) translate(0px,-10px)"];
    let step = 0, speaking = null, env = null, speakT0 = 0, raf = 0, blinkAt = performance.now() + 2500;

    function shot(name) {
      show($(svg, "#wide"), name === "wide");
      show($(svg, "#isaiahShot"), name === "isaiah");
      show($(svg, "#micahShot"), name === "micah");
      if (name === "isaiah") { cam("camI", "scale(1)"); requestAnimationFrame(() => cam("camI", "scale(1.06) translate(-20px,6px)")); }
      if (name === "micah") { cam("camM", "scale(1)"); requestAnimationFrame(() => cam("camM", "scale(1.06) translate(30px,6px)")); }
    }

    // ---- face animation: jaw follows the loudness of the recording ----
    function animate(now) {
      raf = requestAnimationFrame(animate);
      for (const who of ["isaiah", "micah"]) {
        const jaw = $(svg, `#${who}-jaw`), head = $(svg, `#${who}-head`), lid = $(svg, `#${who}-lid`);
        let open = 0;
        if (speaking === who) {
          const t = api.audioTime();
          if (t != null && env) {
            const end = env.speakerEnd || 1e9;
            if (t < end) { const f = Math.floor(t * 30), e = env.env; const v = (+(e[f] || 0) + +(e[f + 1] || 0)) / 18; open = Math.min(1, v * 1.25); }
          } else if (FAST || t == null) {
            const el = (now - speakT0) / 1000; open = el < 6 ? Math.max(0, Math.sin(el * 11) * 0.5 + Math.sin(el * 4.3) * 0.4) : 0;
          }
        }
        const cur = +(jaw.dataset.o || 0), next = cur + (open - cur) * 0.45;
        jaw.dataset.o = next;
        jaw.setAttribute("transform", `rotate(${(next * 9).toFixed(2)} -6 -2)`);
        head.setAttribute("transform", `rotate(${(-next * 1.6 + Math.sin(now / 1900) * 0.6).toFixed(2)} 0 60)`);
        const blinking = now > blinkAt && now < blinkAt + 140;
        lid.setAttribute("d", blinking ? "M43,-15 Q51,-21 59,-14 Q51,-9 43,-15 Z" : "M43,-15 Q51,-21 59,-14 L59,-14 Q51,-21 43,-15 Z");
      }
      if (now > blinkAt + 140) blinkAt = now + 2500 + Math.random() * 3500;
    }
    raf = requestAnimationFrame(animate);

    function light(id) {
      const g = $(svg, "#" + id);
      show($(g, ".lit")); show($(g, ".dim"), false); g.classList.remove("hot");
      api.sfx("sparkle");
    }

    return {
      enter(i) {
        step = i;
        if (i <= 0) {
          stars.forEach(([id]) => { const g = $(svg, "#" + id); show($(g, ".lit"), false); show($(g, ".dim")); });
          show($(svg, "#dawnSky"), false); show($(svg, "#sunrise"), false); show($(svg, "#night"));
          shot("wide"); cam("cam", "scale(1.0)"); requestAnimationFrame(() => cam("cam", WIDE_CAM[0]));
          return;
        }
        shot("wide"); cam("cam", WIDE_CAM[i] || WIDE_CAM[0]);
      },
      startTask(name, done) {
        const g = $(svg, "#" + name); g.classList.add("hot");
        task = hit => { if (hit !== name) return; task = null; light(name); setTimeout(done, 900); };
      },
      press() { if (task) { const id = stars.map(s => s[0]).find(id => $(svg, "#" + id).classList.contains("hot")); if (id) task(id); } },
      speaking(id) {
        if (id) {
          const who = SPEAKER[step]; if (!who) return;
          speaking = who; env = (window.NARRATION_ENVELOPES || {})[id] || null; speakT0 = performance.now();
          shot(who);
        } else {
          speaking = null;
          if (step === 4) {     // "...have seen a great light" — dawn breaks over the land
            shot("wide"); cam("cam", "scale(1.12) translate(0px,40px)");
            show($(svg, "#dawnSky")); show($(svg, "#sunrise")); $(svg, "#night").style.transition = "opacity 3s"; show($(svg, "#night"), false);
            api.sfx("success");
          } else setTimeout(() => shot("wide"), 300);
        }
      },
      finish() { cancelAnimationFrame(raf); }
    };
  };
})();
