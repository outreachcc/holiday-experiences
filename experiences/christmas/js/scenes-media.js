/* Media edition — Station 1 built from your own AI-generated video clips or images (see media/PROMPTS.html).
   For each shot it looks in media/ for  <name>.mp4 / .webm / .jpg / .png / .webp  and uses the first it finds;
   if none is there yet, a labelled placeholder shows instead. Loaded after scenes.js; replaces XScenes.promise. */
(function () {
  const S = window.XScenes;
  const DIR = "media/";

  // The shots this station needs (file names are what the prompt sheet tells you to save as)
  const SHOTS = {
    night:  { file: "s1-01-night",  label: "Shot 1 · Night over the hills of Judea" },
    isaiah: { file: "s1-02-isaiah", label: "Shot 2 · Isaiah writing by lamplight" },
    micah:  { file: "s1-03-micah",  label: "Shot 3 · Micah on the hill above Bethlehem" },
    dawn:   { file: "s1-04-dawn",   label: "Shot 4 · Dawn breaks over the hills" }
  };
  // Optional lip-synced clips (made with Video Express "talking photo" + the voice files in media/voices/)
  const TALK = { 1: "s1-talk-isaiah-7-14", 2: "s1-talk-micah-5-2", 3: "s1-talk-isaiah-9-6", 4: "s1-talk-isaiah-9-2" };
  const SPEAKER = { 1: "isaiah", 2: "micah", 3: "isaiah", 4: "isaiah" };

  function probe(name) {   // resolves to {type, src} or null — works from a web server and when opened from disk
    const tryVideo = ext => new Promise(res => {
      const v = document.createElement("video"); v.preload = "metadata"; v.muted = true;
      v.onloadedmetadata = () => res({ type: "video", src: DIR + name + ext }); v.onerror = () => res(null);
      v.src = DIR + name + ext;
    });
    const tryImg = ext => new Promise(res => {
      const i = new Image(); i.onload = () => res({ type: "image", src: DIR + name + ext }); i.onerror = () => res(null); i.src = DIR + name + ext;
    });
    return [".mp4", ".webm", ".mov"].reduce((p, e) => p.then(r => r || tryVideo(e)), Promise.resolve(null))
      .then(r => r || [".jpg", ".jpeg", ".png", ".webp"].reduce((p, e) => p.then(r2 => r2 || tryImg(e)), Promise.resolve(null)));
  }

  const CSS = `<style>
    .m-shot{position:absolute;inset:0;opacity:0;transition:opacity 1.2s ease;overflow:hidden;background:#05060f}
    .m-shot.on{opacity:1}
    .m-shot video,.m-shot img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}
    .m-shot img,.m-shot video.amb{animation:kb 30s ease-in-out infinite alternate;transform-origin:50% 45%}
    @keyframes kb{from{transform:scale(1.0)}to{transform:scale(1.08) translate(-1%,1%)}}
    .m-ph{position:absolute;inset:0;display:grid;place-items:center;text-align:center;color:#e9dcc0;font-family:Nunito,system-ui,sans-serif;
      background:radial-gradient(ellipse at 50% 60%,rgba(80,60,40,.35),transparent 60%),linear-gradient(180deg,#0b0f2a,#1a1838 60%,#2a2036)}
    .m-ph .box{border:2px dashed rgba(240,194,106,.45);border-radius:18px;padding:22px 30px;background:rgba(0,0,0,.25);max-width:70%}
    .m-ph b{display:block;font-family:Cormorant,Georgia,serif;font-size:clamp(20px,3vw,40px);color:#f6e7c6;margin-bottom:6px}
    .m-ph code{color:#f0c26a;font-size:clamp(12px,1.4vw,18px)}
    .m-ph small{display:block;opacity:.7;margin-top:6px;font-size:clamp(11px,1.2vw,15px)}
    .m-shot.ph-night .m-ph{background:radial-gradient(ellipse at 70% 80%,rgba(255,190,110,.12),transparent 40%),linear-gradient(180deg,#02030f,#0a1033 45%,#1e2452 75%,#2b2c58)}
    .m-shot.ph-dawn .m-ph{background:linear-gradient(180deg,#1b2a5c,#6a5a8c 50%,#e09a74 80%,#ffd48a)}
    .m-shot.ph-isaiah .m-ph{background:radial-gradient(ellipse at 70% 75%,rgba(255,170,80,.45),transparent 55%),linear-gradient(90deg,#140c08,#2e1d12)}
    .m-shot.ph-micah .m-ph{background:radial-gradient(ellipse at 25% 25%,rgba(255,240,200,.18),transparent 30%),linear-gradient(180deg,#05071a,#141a3e 60%,#20224a)}
    .m-stars{position:absolute;inset:0;width:100%;height:100%}
    .m-stars .ring{display:none;fill:none;stroke:#ffd889;stroke-width:4;transform-box:fill-box;transform-origin:center;animation:ringM 1.6s ease-out infinite}
    .m-stars .hot{cursor:pointer}.m-stars .hot .ring{display:inline}@keyframes ringM{0%{opacity:.95;transform:scale(.6)}100%{opacity:0;transform:scale(1.5)}}
    .m-stars .fade{transition:opacity 1.2s ease}.m-stars .hide{opacity:0;pointer-events:none}
    .m-stars.off{opacity:0;transition:opacity .8s}
  </style>`;

  function glint(r) {
    return `<g filter="url(#mGlow)"><path d="M0,${-r * 3} L${r * .18},${-r * .18} L${r * 3},0 L${r * .18},${r * .18} L0,${r * 3} L${-r * .18},${r * .18} L${-r * 3},0 L${-r * .18},${-r * .18} Z" fill="#fff8e4"/><circle r="${r * .55}" fill="#fff"/></g>`;
  }

  S.promise = function (root, api) {
    const stars = [["star1", 420, 250, 15], ["star2", 1180, 210, 15], ["star3", 800, 130, 20]];
    root.innerHTML = CSS + Object.entries(SHOTS).map(([k, v]) =>
      `<div class="m-shot ph-${k}" id="m-${k}"><div class="m-ph"><div class="box"><b>${v.label}</b><code>media/${v.file}.mp4</code> <small>or .jpg / .png — see media/PROMPTS.html</small></div></div></div>`).join("")
      + `<div class="m-shot" id="m-talk"></div>`
      + `<svg class="m-stars" viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
          <defs><radialGradient id="mGl"><stop offset="0" stop-color="#fff6d6"/><stop offset=".22" stop-color="#ffd780" stop-opacity=".6"/><stop offset="1" stop-color="#ffb347" stop-opacity="0"/></radialGradient>
          <filter id="mGlow" x="-80%" y="-80%" width="260%" height="260%"><feGaussianBlur stdDeviation="5" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>
          ${stars.map(([id, x, y, r]) => `<g id="${id}" data-hit="${id}" transform="translate(${x},${y})"><circle r="70" fill="transparent"/><circle class="ring" r="58"/>
            <g class="dim"><circle r="2.6" fill="#fff8e6"/><circle r="12" fill="url(#mGl)" opacity=".5"/></g>
            <g class="lit fade hide"><circle r="${r * 9}" fill="url(#mGl)" opacity=".85"/>${glint(r)}</g></g>`).join("")}
        </svg>`;

    const $ = s => root.querySelector(s);
    const show = (el, on = true) => el && el.classList.toggle("hide", !on);
    const found = {};       // shot key -> {type, src}
    const talk = {};        // step -> {type, src}

    function fill(key, media) {
      const box = $("#m-" + key); found[key] = media;
      box.innerHTML = media.type === "video"
        ? `<video class="amb" src="${media.src}" muted loop playsinline autoplay preload="auto"></video>`
        : `<img src="${media.src}" alt="">`;
    }
    Object.entries(SHOTS).forEach(([k, v]) => probe(v.file).then(m => m && fill(k, m)));
    Object.entries(TALK).forEach(([i, name]) => probe(name).then(m => { if (m && m.type === "video") talk[i] = m; }));

    let current = null, step = 0, task = null;
    function shot(key) {
      current = key;
      root.querySelectorAll(".m-shot").forEach(el => el.classList.toggle("on", el.id === "m-" + key));
      $(".m-stars").classList.toggle("off", !(key === "night" || key === "dawn"));
      const v = $("#m-" + key + " video"); if (v) { v.currentTime = 0; v.play().catch(() => {}); }
    }
    root.addEventListener("pointerdown", e => { const t = e.target.closest("[data-hit]"); if (t && task) { e.stopPropagation(); task(t.dataset.hit); } });

    return {
      enter(i) {
        step = i;
        if (i <= 0) { stars.forEach(([id]) => { const g = $("#" + id); show(g.querySelector(".lit"), false); show(g.querySelector(".dim")); }); }
        if (i < 4 || current !== "dawn") shot("night");
      },
      startTask(name, done) {
        const g = $("#" + name); g.classList.add("hot");
        task = hit => { if (hit !== name) return; task = null; g.classList.remove("hot"); show(g.querySelector(".lit")); show(g.querySelector(".dim"), false); api.sfx("sparkle"); setTimeout(done, 900); };
      },
      press() { if (task) { const g = root.querySelector(".m-stars .hot"); if (g) task(g.id); } },

      // A lip-synced clip, if you made one, speaks the verse itself; then the narrator reads the reference
      speakVerse(i, stepData, base, run) {
        const t = talk[i]; if (!t) return null;
        return new Promise(resolve => {
          const box = $("#m-talk");
          box.innerHTML = `<video src="${t.src}" playsinline preload="auto"></video>`;
          const v = box.querySelector("video");
          shot("talk");
          const end = () => { v.onended = v.onerror = null; api.clip(`promise.${i}.ref`).then(() => { after(); resolve(); }); };
          v.onended = end; v.onerror = end;
          v.play().catch(() => { v.muted = true; v.play().catch(end); });
        });
      },
      // Otherwise the recorded voice plays over the prophet's clip or picture
      speaking(id) {
        if (id) { const who = SPEAKER[step]; if (who) shot(who); }
        else after();
      },
      finish() {}
    };

    function after() {
      if (step === 4) { shot("dawn"); api.sfx("success"); }
      else setTimeout(() => shot("night"), 300);
    }
  };
})();
