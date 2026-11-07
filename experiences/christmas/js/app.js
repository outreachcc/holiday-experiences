/* The Christmas Experience — engine
   URL options (all optional; on a Pi the station agent's config.json supplies them):
     ?station=3            run a single station as a kiosk (1-7, or "carols")
     &mode=interactive     interactive (default) | watch  (watch = plays itself on a loop)
     &kiosk=1              hide navigation + cursor (implied when a station is set)
     &next=right           direction arrow to the next station: left | right | ahead | none
     &idle=90              seconds of no input before returning to the attract screen
     &volume=0.9
*/
(function () {
  const STORY = window.STORY, A = window.XAudio, B = window.XBridge, SC = window.XScenes;
  const $ = s => document.querySelector(s);
  const qs = new URLSearchParams(location.search);

  const cfg = {
    station: null, mode: "interactive", kiosk: false, next: "right", idle: 90, volume: 0.9, ambient: true,
    inviteHold: 0, // seconds the QR invitation stays up if nobody presses GO (0 = default: 60 interactive / 30 watch)
    captions: "follow" // follow = words light up with the voice | plain = whole sentence at once | off = no captions
  };

  const state = {
    stationIdx: -1, step: -1, run: 0, scene: null, waiting: null, inTask: false,
    attract: false, lastInput: Date.now(), journey: false, carol: 0, carolPlaying: null
  };

  /* ---------------- boot ---------------- */
  async function boot() {
    await Promise.all([A.init(), B.init()]);
    Object.assign(cfg, B.config || {});
    for (const k of ["station", "mode", "next", "idle", "volume", "captions", "inviteHold"]) if (qs.has(k)) cfg[k] = qs.get(k);
    if (!qs.has("captions") && !qs.has("station")) { try { const c = localStorage.getItem("xmas-captions"); if (c) cfg.captions = c; } catch (e) {} }
    setCaptions(cfg.captions, false);
    if (qs.has("kiosk")) cfg.kiosk = qs.get("kiosk") !== "0";
    if (cfg.station) cfg.kiosk = qs.has("kiosk") ? cfg.kiosk : true;
    cfg.idle = +cfg.idle || 90; A.setVolume(+cfg.volume || 0.9);
    document.body.classList.toggle("kiosk", !!cfg.kiosk);

    buildHome(); bindInput();
    B.onButton = btn => input(btn);

    if (cfg.station) {
      // Kiosk: Chromium is launched with autoplay allowed, so audio can start without a tap.
      A.unlock();
      const idx = cfg.station === "carols" ? "carols" : STORY.stations.findIndex(s => String(s.num) === String(cfg.station) || s.id === cfg.station);
      if (idx === "carols") openCarols(); else openStation(idx < 0 ? 0 : idx, { attract: cfg.mode !== "watch" });
      if (cfg.mode === "watch" && idx !== "carols") startRun();
    } else {
      showScreen("home"); B.scene("idle");
    }
    setInterval(idleCheck, 1000);
  }

  /* ---------------- home (online) ---------------- */
  // Editions (film.html, media.html) can limit which stations appear
  const ED = window.EDITION || {};
  if (ED.stations) STORY.stations = STORY.stations.filter(s => ED.stations.includes(s.id));
  if (ED.title) STORY.event.title = ED.title;
  // Year-stamp: "The Christmas Experience 2026". Online the server sends window.SEASON (its clock, or a
  // preview test date); on the Pi stations js/season.js works it out from the Pi's clock.
  // Set "year" in content.js to force one, or "yearStamp": false to turn it off.
  if (STORY.event.yearStamp !== false && STORY.event.season) {
    const yr = STORY.event.year || (window.SEASON && window.SEASON.year)
      || (window.SeasonRules && window.SeasonRules.status(STORY.event.season).year);
    if (yr) STORY.event.title += " " + yr;
  }
  if (ED.tagline) STORY.event.tagline = ED.tagline;
  if (ED.id) document.documentElement.classList.add("ed-" + ED.id);

  function buildHome() {
    const ev = STORY.event;
    document.title = ev.title;
    $("#homeTitle").textContent = ev.title;
    $("#homeTag").textContent = ev.tagline;
    $("#homeEyebrow").textContent = ev.church;
    const grid = $("#grid");
    grid.innerHTML = STORY.stations.map((s, i) => `<button class="station-card" data-i="${i}"><div class="n">Station ${s.num}</div><div class="t">${s.title}</div><div class="s">${s.subtitle}</div></button>`).join("")
      + (ED.carols === false ? "" : `<button class="station-card carol" data-i="carols"><div class="n">Bonus</div><div class="t">Carol Corner</div><div class="s">Sing along to Christmas carols</div></button>`);
    grid.addEventListener("click", e => {
      const b = e.target.closest(".station-card"); if (!b) return;
      A.unlock(); state.journey = false;
      if (b.dataset.i === "carols") openCarols(); else { openStation(+b.dataset.i, {}); startRun(); }
    });
    $("#begin").addEventListener("click", () => { A.unlock(); state.journey = true; openStation(0, {}); startRun(); });
    $("#homeFoot").innerHTML = `${ev.church} · ${ev.city} · <a href="${ev.website}" target="_blank" rel="noopener">${ev.websiteLabel}</a>`;
    $("#homeSky").innerHTML = (() => { let s = ""; for (let i = 0; i < 90; i++) s += `<circle class="tw" cx="${Math.random() * 1600}" cy="${Math.random() * 900}" r="${Math.random() * 1.6 + .4}" fill="#fff8e6" style="animation-delay:-${Math.random() * 3}s"/>`; return `<svg viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice" width="100%" height="100%"><style>.tw{animation:tw 3s ease-in-out infinite}@keyframes tw{50%{opacity:.2}}</style>${s}</svg>`; })();
  }
  function showScreen(id) { document.querySelectorAll(".screen").forEach(s => s.classList.toggle("on", s.id === id)); }

  /* ---------------- station lifecycle ---------------- */
  function openStation(idx, opts) {
    stopAll();
    state.stationIdx = idx; state.step = -1; state.carolPlaying = null;
    const st = STORY.stations[idx];
    showScreen("stage");
    $("#badgeNum").textContent = st.num; $("#badgeTitle").textContent = st.title; $("#badgeSub").textContent = st.subtitle;
    $("#dots").innerHTML = st.steps.map(() => "<i></i>").join("");
    $("#carolUI").hidden = true; $("#dots").hidden = false;
    hideOverlays();
    const root = $("#scene"); root.innerHTML = "";
    state.scene = SC[st.id](root, sceneApi);
    fitScene();
    state.scene.enter(-1, null);
    B.scene(st.light || "idle");
    // Station 1 has nothing before it: show Previous greyed out rather than leave a gap in the controls
    const pb = $("#prevBtn"); pb.style.visibility = "visible"; pb.disabled = !(idx > 0); pb.style.opacity = idx > 0 ? "" : ".35"; pb.style.cursor = idx > 0 ? "" : "default";
    if (opts.attract) showAttract();
  }

  function startRun() {
    hideAttract(); A.ambient(false);
    state.run++; runStation(state.run);
  }

  async function runStation(run) {
    const st = STORY.stations[state.stationIdx];
    state.scene.enter(0, st.steps[0]);
    for (let i = 0; i < st.steps.length; i++) {
      if (run !== state.run) return;
      const ok = await runStep(run, i);
      if (!ok) return;
    }
    if (run !== state.run) return;
    await sleep(2500, run);
    if (run === state.run) showEnd(run);
  }

  const alive = run => run === state.run;
  function sleep(ms, run) { return new Promise(r => A.after(ms, () => r(alive(run)))); }   // (stops while paused)

  async function runStep(run, i) {
    const st = STORY.stations[state.stationIdx], step = st.steps[i], base = `${st.id}.${i}`;
    state.step = i;
    renderDots(i);
    hideVerse(); hidePrompt(); $("#invite").classList.remove("on");
    if (i > 0) state.scene.enter(i, step);
    B.scene(step.light || st.light || "idle");

    await say(run, base + ".say", step.say);
    if (!alive(run)) return false;

    if (step.task) {
      showPrompt(step.prompt || "Press GO");
      state.inTask = true;
      await new Promise(resolve => {
        state.scene.startTask(step.task, () => resolve());
        if (cfg.mode === "watch") autoPress(run);
      });
      state.inTask = false; hidePrompt();
      if (!alive(run)) return false;
    }

    if (step.verse) {
      showVerse(step.verse);
      // Editions can play the verse themselves (e.g. a video clip); otherwise the recording plays and the scene is told who is speaking
      const own = state.scene.speakVerse && state.scene.speakVerse(i, step, base, run);
      if (own) await own;
      else {
        const vid = base + ".verse", vtext = step.verse.text + " " + spokenRef(step.verse.ref);
        const talk = say(run, vid, vtext, true);
        // Tell the scene who is speaking only once the recording is actually playing. Lines are fetched (phones) or
        // buffered (PC, Pi) first, and until then the scene has no audio clock and would move the mouth on its own
        // guess, so the mouth started before the words. No recording (computer voice): start the mouth right away.
        if (state.scene.speaking) {
          let ended = false; talk.then(() => { ended = true; });
          if (A.hasRecording(vid, vtext)) {
            const t0 = performance.now();
            await new Promise(res => { const wait = () => (ended || !alive(run) || A.currentTime() != null || performance.now() - t0 > 5000) ? res() : requestAnimationFrame(wait); wait(); });
          }
          if (!ended && alive(run)) state.scene.speaking(vid, step.verse);
        }
        await talk;
        if (state.scene.speaking) state.scene.speaking(null);
      }
      if (!alive(run)) return false;
    }
    if (step.after) { await say(run, base + ".after", step.after); if (!alive(run)) return false; }

    if (step.music) {
      const carol = STORY.carols.find(c => c.id === step.music);
      if (carol) { await playCarolInCaption(run, carol); if (!alive(run)) return false; }
    }
    if (step.invite) {
      // Hold the invitation + QR code long enough to read and scan it
      showInvite();
      if (cfg.mode === "watch") { if (!(await sleep((+cfg.inviteHold || 30) * 1000, run))) return false; }
      else {
        showPrompt("Press GO when you're done");
        await Promise.race([waitGo(run), sleep((+cfg.inviteHold || 60) * 1000, run)]);
        state.waiting = null; hidePrompt();
      }
      return alive(run);
    }

    if (step.end) return true;
    // Short breath between frames, then carry on by itself (GO or a tap skips the pause)
    if (cfg.mode === "watch") return await sleep(2600, run);
    await Promise.race([waitGo(run), sleep(1800, run)]);
    state.waiting = null;
    return alive(run);
  }

  function autoPress(run) {
    const t = setInterval(() => {
      if (!alive(run) || !state.inTask) { clearInterval(t); return; }
      if (A.paused) return;
      state.scene.press();
    }, 1700);
  }
  function waitGo(run) { return new Promise(res => { state.waiting = () => { state.waiting = null; res(); }; const chk = setInterval(() => { if (!alive(run)) { clearInterval(chk); res(); } else if (!state.waiting) clearInterval(chk); }, 300); }); }

  function spokenRef(ref) {
    ref = ref.replace(/^([123]) /, (m, n) => ["First ", "Second ", "Third "][n - 1]); // "1 John" -> "First John"
    return ref.replace(/(\d+):(\d+)-(\d+)/, "$1, verses $2 to $3").replace(/(\d+):(\d+)/, "$1, verse $2") + ".";
  }

  /* ---------------- captions ---------------- */
  async function say(run, id, text, isVerse) {
    if (!text) return;
    const cap = $("#caption");
    const words = text.split(/\s+/);
    if (isVerse) { cap.innerHTML = ""; } // verse text is already on the verse card
    else cap.innerHTML = words.map(w => `<span class="w">${esc(w)}</span> `).join("");
    cap.classList.remove("plain");
    const spans = cap.querySelectorAll(".w");
    // Light each word as the narrator reaches it. The recording's loudness data (audio/narration/envelopes.js) shows
    // when the voice is actually speaking, so pauses between sentences don't let the words run ahead; longer words
    // take longer to say. Without that data (computer voice, or no recording) it falls back to an even spread.
    const env = ((window.NARRATION_ENVELOPES || {})[id] || {}).env || "";
    let voiced = null;
    if (env) { voiced = new Float32Array(env.length + 1); for (let i = 0; i < env.length; i++) voiced[i + 1] = voiced[i] + (+env[i] >= 2 ? 1 : 0); if (!voiced[env.length]) voiced = null; }
    const starts = []; let totalW = 0;
    spans.forEach((s, k) => { starts[k] = totalW; totalW += s.textContent.replace(/[^\w']/g, "").length + 1.5; });
    let lastF = 0, speaking = true;
    const paint = () => {
      if (!alive(run)) return;
      const t = A.currentTime();
      const frac = voiced && t != null ? voiced[Math.min(voiced.length - 1, Math.max(0, Math.floor(t * 30)))] / voiced[voiced.length - 1] : lastF;
      const pos = frac * totalW;
      spans.forEach((s, k) => s.classList.toggle("lit", starts[k] <= pos + 0.3));
    };
    const loop = () => { if (!speaking) return; paint(); requestAnimationFrame(loop); };
    requestAnimationFrame(loop);
    await A.speak(id, text, f => { lastF = f; });
    speaking = false;
    if (alive(run)) spans.forEach(s => s.classList.add("lit"));
  }
  // Captions are display-only: switching modes never changes narration, timing or interaction.
  const CAPTION_LABELS = { follow: "Captions: follow along", plain: "Captions: plain text", off: "Captions: off" };
  function setCaptions(mode, remember) {
    if (!CAPTION_LABELS[mode]) mode = "follow";
    cfg.captions = mode;
    document.body.classList.remove("cap-follow", "cap-plain", "cap-off");
    document.body.classList.add("cap-" + mode);
    const b = document.getElementById("ccBtn");
    if (b) { b.setAttribute("aria-label", CAPTION_LABELS[mode] + " (click to change)"); b.title = CAPTION_LABELS[mode]; b.dataset.mode = mode; }
    if (remember) {
      try { localStorage.setItem("xmas-captions", mode); } catch (e) {}
      if (b) { const t = document.createElement("div"); t.className = "cc-toast"; t.textContent = CAPTION_LABELS[mode]; document.getElementById("stage").appendChild(t); setTimeout(() => t.remove(), 1600); }
    }
  }
  const esc = s => s.replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

  // Songs inside a station: big sing-along words that always show, whatever the caption setting.
  // A phrase with "sing" (its syllables, e.g. "bless- ings"; "_" = the same syllable held over another note)
  // gets a "follow the bouncing ball": the ball lands on each syllable exactly as its note is played.
  function singTokens(ph) {
    if (!ph.sing) return null;
    const toks = ph.sing.trim().split(/\s+/), sung = ph.notes.trim().split(/\s+/).filter(x => x.split(":")[0] !== "R").length;
    return toks.length === sung ? toks : null;
  }
  async function playCarolInCaption(run, carol) {
    const el = $("#singalong"); $("#caption").innerHTML = "";
    const noteSpan = [];   // [phrase][note number] -> index of the syllable span it belongs to
    const lineHtml = carol.phrases.map((ph, p) => {
      const toks = singTokens(ph); noteSpan[p] = [];
      if (!toks) return esc(ph.line);
      let html = "", n = -1;
      toks.forEach(t => {
        if (t === "_") { noteSpan[p].push(n); return; }
        n++; noteSpan[p].push(n);
        const joined = t.endsWith("-");
        html += `<span class="sy" data-n="${n}">${esc(joined ? t.slice(0, -1) : t)}</span>${joined ? "" : " "}`;
      });
      return html.trim();
    });
    el.innerHTML = `<div class="sa-title">♪ ${esc(carol.title)}</div>` +
      lineHtml.map((h, k) => `<div class="sa-line${noteSpan[k].length ? " ball" : ""}">${h}</div>`).join("") + `<div class="sa-ball"></div>`;
    const lines = Array.from(el.querySelectorAll(".sa-line")), ball = el.querySelector(".sa-ball");
    const setLine = i => lines.forEach((l, k) => { l.classList.toggle("past", k < i); l.classList.toggle("now", k === i); });
    el.classList.add("on");
    const h = A.playCarol(carol, i => { if (alive(run) && !(h && h.notes && h.notes.length)) setLine(i); });
    state.carolPlaying = h;

    // where the ball sits on a syllable (centre-top), relative to the sing-along box
    const spot = (p, k) => {
      const sp = lines[p] && lines[p].querySelectorAll(".sy")[noteSpan[p][k]];
      if (!sp) return null;
      const a = sp.getBoundingClientRect(), b = el.getBoundingClientRect();
      return { x: a.left - b.left + a.width / 2, y: a.top - b.top + a.height * 0.14, sp };
    };
    let lit = null, raf = 0;
    const frame = () => {
      if (!alive(run) || !el.classList.contains("on")) return;
      raf = requestAnimationFrame(frame);
      const notes = (h.notes || []).filter(n => noteSpan[n.p] && noteSpan[n.p].length);
      if (!notes.length || !h.clock) { ball.style.opacity = 0; return; }
      const now = h.clock();
      let j = -1; while (j + 1 < notes.length && notes[j + 1].at <= now) j++;
      const cur = notes[Math.max(0, j)], nx = notes[j + 1];
      const a = spot(cur.p, cur.k); if (!a) return;
      let x = a.x, y = a.y, squash = 1;
      if (j < 0) {                                                  // waiting for the first note: drop in from above
        const pre = Math.min(1, Math.max(0, 1 - (cur.at - now) / 700));
        y = a.y - 60 * (1 - pre); ball.style.opacity = pre;
      } else {
        ball.style.opacity = now > cur.at + cur.dur + 600 && !nx ? 0 : 1;
        const b = nx && spot(nx.p, nx.k);
        const hop = nx ? Math.min(340, (nx.at - cur.at) * 0.8) : 0;
        if (b && b.sp !== a.sp && now > nx.at - hop) {             // in the air, on the way to the next syllable
          const t = (now - (nx.at - hop)) / hop, lift = 28 + Math.abs(b.x - a.x) * 0.12 + Math.abs(b.y - a.y) * 0.5;
          x = a.x + (b.x - a.x) * t; y = a.y + (b.y - a.y) * t - lift * Math.sin(Math.PI * t);
        } else if (now - cur.at < 90) squash = 0.72;                  // just landed
        if (lit !== a.sp) {
          if (lit) lit.classList.remove("on");
          a.sp.classList.add("on", "sung"); lit = a.sp;
          setLine(cur.p);
          lines.forEach((l, k) => { if (k < cur.p) l.querySelectorAll(".sy").forEach(s => s.classList.add("sung")); });
        }
      }
      ball.style.transform = `translate(${x.toFixed(1)}px,${y.toFixed(1)}px) translate(-50%,-100%) scale(${2 - squash},${squash})`;
    };
    raf = requestAnimationFrame(frame);
    await h.done; state.carolPlaying = null;
    cancelAnimationFrame(raf);
    el.classList.remove("on");
  }

  /* ---------------- overlays ---------------- */
  function renderDots(i) { document.querySelectorAll("#dots i").forEach((d, k) => { d.className = k < i ? "done" : k === i ? "now" : ""; }); }
  function showVerse(v) {
    const el = $("#verse"); el.innerHTML = `<q>${esc(v.text)}</q><cite>${esc(v.ref)} KJV</cite>`;
    // film edition: the verse sits along the bottom like a subtitle, so lift the narration captions above it
    $("#stage").style.setProperty("--verseH", el.offsetHeight + "px");
    requestAnimationFrame(() => el.classList.add("on"));
  }
  function hideVerse() { $("#verse").classList.remove("on"); }
  function showPrompt(t) { $("#promptText").textContent = t; $("#prompt").classList.add("on"); B.lamp("pulse"); }
  function hidePrompt() { $("#prompt").classList.remove("on"); B.lamp("off"); }
  function hideOverlays() { hideVerse(); hidePrompt(); $("#caption").innerHTML = ""; $("#singalong").classList.remove("on"); $("#endcard").classList.remove("on"); $("#invite").classList.remove("on"); $$(".bubble").forEach(b => b.remove()); }
  const $$ = s => Array.from(document.querySelectorAll(s));

  function showInvite() {
    const ev = STORY.event, el = $("#invite");
    el.innerHTML = `<div class="k">You're invited</div><h3>${esc(ev.church)}</h3>
      <p>${esc(ev.serviceTimes)}</p>${ev.christmasEve ? `<p>${esc(ev.christmasEve)}</p>` : ""}
      ${ev.address ? `<p>${esc(ev.address)}</p>` : `<p>${esc(ev.city)}</p>`}
      <div class="qr">${qrSvg(ev.website)}</div><div class="url">${esc(ev.websiteLabel)}</div>`;
    el.classList.add("on");
  }
  function qrSvg(text) {
    try { const q = qrcode(0, "M"); q.addData(text); q.make(); return q.createSvgTag({ cellSize: 4, margin: 0, scalable: true }); } catch (e) { return ""; }
  }

  function showEnd(run) {
    const st = STORY.stations[state.stationIdx], next = STORY.stations[state.stationIdx + 1];
    const el = $("#endcard"), arrows = { right: "→", left: "←", ahead: "↑", none: "" };
    const arrow = arrows[cfg.next] ?? "→";
    let html;
    if (next) {
      html = `<div class="next-lbl">Next stop</div><div class="next-title">Station ${next.num}<br>${esc(next.title)}</div>
        ${cfg.kiosk && arrow ? `<div class="arrow ${cfg.next === "left" ? "left" : ""}">${arrow}</div>` : ""}
        <div class="row"><button class="btn-begin" id="endNext">Continue to Station ${next.num}</button><button class="ghost" id="endAgain">Watch again</button><button class="ghost" id="endHome">All stations</button></div>`;
    } else {
      const ev = STORY.event;
      html = `<div class="next-lbl">Merry Christmas</div><div class="next-title">Thank you for coming!</div>
        <div class="sub">${esc(ev.church)} · ${esc(ev.serviceTimes)} · ${esc(ev.websiteLabel)}</div>
        <div class="end-qr">${qrSvg(ev.website)}<span>Scan to visit<br><b>${esc(ev.websiteLabel)}</b></span></div>
        <div class="row">${ED.carols === false ? "" : `<button class="btn-begin" id="endCarols">Visit the Carol Corner</button>`}<button class="ghost" id="endAgain">Watch again</button><button class="ghost" id="endHome">All stations</button></div>`;
    }
    el.innerHTML = `<div class="box">${html}</div>`;
    hideVerse(); hidePrompt(); $("#caption").innerHTML = ""; $("#invite").classList.remove("on");
    el.classList.add("on"); B.scene("celebrate");
    const on = (id, fn) => { const b = $("#" + id); if (b) b.onclick = fn; };
    on("endNext", () => { openStation(state.stationIdx + 1, {}); startRun(); });
    on("endAgain", () => { openStation(state.stationIdx, {}); startRun(); });
    on("endHome", goHome);
    on("endCarols", openCarols);
    // kiosk: after a while, reset for the next family; online journey: auto-continue
    // Pi kiosk resets itself for the next family; online always waits for GO / the Continue button
    const wait = cfg.kiosk ? (next ? (cfg.mode === "watch" ? 12000 : 20000) : 45000) : 0;
    if (wait) setTimeout(() => {
      if (!alive(run)) return;
      if (!cfg.kiosk) { openStation(state.stationIdx + 1, {}); startRun(); return; }
      openStation(state.stationIdx, { attract: cfg.mode !== "watch" });
      if (cfg.mode === "watch") startRun();
    }, wait);
  }

  function goHome() { stopAll(); state.stationIdx = -1; showScreen("home"); B.scene("idle"); }

  /* ---------------- attract ---------------- */
  function showAttract() {
    const st = STORY.stations[state.stationIdx];
    state.attract = true; state.run++;
    const el = $("#attract");
    el.innerHTML = `<div><div class="t1">Station ${st.num} · ${esc(STORY.event.title)}</div><div class="t2">${esc(st.title)}</div><div class="t3">${esc(st.subtitle)}</div>
      <div class="t4"><span class="go" style="width:calc(var(--u)*5);height:calc(var(--u)*5);border-radius:50%;display:inline-grid;place-items:center;background:radial-gradient(circle at 40% 35%,#8af5b9,#3ddc84 55%,#129a52);color:#053a1d;font-size:calc(var(--u)*1.5)">GO</span> Press GO or touch the screen to begin</div></div>`;
    el.classList.add("on");
    hideOverlays(); state.scene && state.scene.enter(-1, null);
    B.scene("idle"); B.lamp("pulse");
    if (cfg.ambient) A.ambient(true);
  }
  function hideAttract() { state.attract = false; $("#attract").classList.remove("on"); A.ambient(false); B.lamp("off"); }

  function idleCheck() {
    if (A.paused) { state.lastInput = Date.now(); return; }
    if (!cfg.kiosk || cfg.mode === "watch" || state.attract) return;
    if (Date.now() - state.lastInput > cfg.idle * 1000) {
      if (state.carolPlaying) return; // let a song finish
      if (state.stationIdx === "carols") { state.lastInput = Date.now(); return; }
      openStation(state.stationIdx, { attract: true });
    }
  }

  /* ---------------- carol corner ---------------- */
  function openCarols() {
    stopAll(); state.stationIdx = "carols"; state.run++;
    showScreen("stage"); hideOverlays(); hideAttract();
    $("#badgeNum").textContent = "♪"; $("#badgeTitle").textContent = "Carol Corner"; $("#badgeSub").textContent = "Sing along";
    $("#dots").hidden = true; $("#prevBtn").style.visibility = "hidden";
    state.scene = SC.carols($("#scene")); fitScene();
    const ui = $("#carolUI"); ui.hidden = false;
    renderCarol();
    B.scene("candle");

  }
  function renderCarol() {
    const c = STORY.carols[state.carol];
    $("#carolUI").innerHTML = `<div class="carol-title">${esc(c.title)}</div><div class="carol-credit">${esc(c.credit)}${cfg.kiosk ? " &nbsp;·&nbsp; GO plays · ◀ ▶ picks a song" : ""}</div>
      <div class="lyrics">${c.phrases.map(p => `<div>${esc(p.line)}</div>`).join("")}</div>
      <div class="carol-picker">${STORY.carols.map((x, i) => `<button data-c="${i}" class="${i === state.carol ? "sel" : ""}">${esc(x.title)}</button>`).join("")}
      <button data-play="1" style="border-color:rgba(61,220,132,.6)">${state.carolPlaying ? "■ Stop" : "▶ Play"}</button></div>`;
    $("#carolUI").querySelectorAll("[data-c]").forEach(b => b.onclick = () => { state.carol = +b.dataset.c; stopCarol(); renderCarol(); playCarol(); });
    $("#carolUI").querySelector("[data-play]").onclick = () => toggleCarol();
    fitLyrics();
  }
  // Shrink the lyric text until every line fits above the song buttons (any screen size, any carol length)
  function fitLyrics() {
    const l = document.querySelector("#carolUI .lyrics"); if (!l) return;
    let fs = 3.6; l.style.setProperty("--fs", fs);
    while (fs > 1.6 && l.scrollHeight > l.clientHeight + 1) { fs -= 0.1; l.style.setProperty("--fs", fs.toFixed(2)); }
  }
  window.addEventListener("resize", () => { if (state.stationIdx === "carols") fitLyrics(); });
  function toggleCarol() { if (state.carolPlaying) { stopCarol(); renderCarol(); } else playCarol(); }
  function stopCarol() { A.stopCarol(); state.carolPlaying = null; B.scene("candle"); }
  function playCarol() {
    const c = STORY.carols[state.carol];
    const h = A.playCarol(c, i => {
      $$("#carolUI .lyrics div").forEach((d, k) => d.className = k < i ? "past" : k === i ? "now" : "");
    });
    state.carolPlaying = h; renderCarolPlayBtn(); B.scene("celebrate");
    h.done.then(() => { if (state.carolPlaying === h) { state.carolPlaying = null; renderCarolPlayBtn(); $$("#carolUI .lyrics div").forEach(d => d.className = ""); B.scene("candle"); } });
  }
  function renderCarolPlayBtn() { const b = $("#carolUI [data-play]"); if (b) b.textContent = state.carolPlaying ? "■ Stop" : "▶ Play"; }

  /* ---------------- input ---------------- */
  function bindInput() {
    document.addEventListener("keydown", e => {
      const map = { " ": "go", Enter: "go", ArrowDown: "go", Backspace: "back", r: "back", ArrowUp: "back", ArrowLeft: "left", ArrowRight: "right", Escape: "home", p: "pause", P: "pause" };
      let b = map[e.key];
      // Online, the space bar pauses and resumes like a video player (Enter is GO). Kiosk stations keep Space as GO.
      if (e.key === " " && !cfg.kiosk) b = "pause";
      if (!b) return;
      if (e.target.closest && e.target.closest("button") && (e.key === " " || e.key === "Enter")) return; // let focused buttons click
      e.preventDefault(); input(b);
    });
    $("#stage").addEventListener("pointerdown", e => {
      state.lastInput = Date.now();
      A.unlock();
      if (state.attract) { e.preventDefault(); startRun(); return; }
      if (e.target.closest("button, .nav, #carolUI")) return;
      if (e.target.closest("#prompt")) { input("go"); return; }
      // tapping anywhere on the scene continues when we're just waiting
      if (state.waiting && !e.target.closest(".hot")) state.waiting();
    });
    $("#homeBtn").onclick = goHome;
    $("#prevBtn").onclick = () => { if (typeof state.stationIdx === "number" && state.stationIdx > 0) { openStation(state.stationIdx - 1, {}); startRun(); } };
    $("#nextBtn").onclick = () => {
      if (state.stationIdx === "carols") return goHome();
      if (state.stationIdx < STORY.stations.length - 1) { openStation(state.stationIdx + 1, {}); startRun(); } else openCarols();
    };
    $("#replayBtn").onclick = () => input("back");
    $("#ccBtn").onclick = () => {
      const order = ["follow", "plain", "off"];
      setCaptions(order[(order.indexOf(cfg.captions) + 1) % order.length], true);
    };
    $("#muteBtn").onclick = () => {
      A.setMuted(!A.muted);   // silences the voices without stopping the story (see audio.js)
      $("#muteBtn").setAttribute("aria-label", A.muted ? "Turn narration on" : "Turn narration off");
      $("#muteBtn").style.opacity = A.muted ? .5 : 1;
    };
    window.addEventListener("resize", fitScene);
    setupPause();
    pollGamepads();
  }

  // USB arcade encoders ("zero delay" kits) show up as gamepads: button 1 = GO, button 2 = BACK, stick/d-pad = left/right
  function pollGamepads() {
    const prev = {};
    const tick = () => {
      const pads = navigator.getGamepads ? navigator.getGamepads() : [];
      for (const gp of pads) {
        if (!gp) continue;
        const now = {
          go: !!(gp.buttons[0] && gp.buttons[0].pressed) || !!(gp.buttons[9] && gp.buttons[9].pressed),
          back: !!(gp.buttons[1] && gp.buttons[1].pressed) || !!(gp.buttons[8] && gp.buttons[8].pressed),
          left: (gp.axes[0] || 0) < -0.6 || !!(gp.buttons[14] && gp.buttons[14].pressed),
          right: (gp.axes[0] || 0) > 0.6 || !!(gp.buttons[15] && gp.buttons[15].pressed)
        };
        const p = prev[gp.index] || {};
        for (const k in now) if (now[k] && !p[k]) input(k);
        prev[gp.index] = now;
      }
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }

  function input(btn) {
    state.lastInput = Date.now();
    if (btn === "pause") {
      // Pause only means something while a station is playing; elsewhere (home, start and end screens) it's GO
      if (state.stationIdx === -1 || state.stationIdx === "carols" || state.attract || $("#endcard").classList.contains("on")) btn = "go";
      else { setPaused(!A.paused); return; }
    }
    if (A.paused) { setPaused(false); if (btn === "go") return; }   // first press while paused just resumes
    A.unlock();
    if (state.stationIdx === "carols") {
      if (btn === "go") toggleCarol();
      if (btn === "left" || btn === "right") { state.carol = (state.carol + (btn === "left" ? -1 : 1) + STORY.carols.length) % STORY.carols.length; stopCarol(); renderCarol(); }
      if (btn === "home" && !cfg.kiosk) goHome();
      return;
    }
    if (state.stationIdx === -1) { if (btn === "go") $("#begin").click(); return; }
    if (state.attract) { if (btn === "go" || btn === "back") startRun(); return; }
    if ($("#endcard").classList.contains("on")) {
      if (btn === "go") { if (!cfg.kiosk) { const n = $("#endNext") || $("#endCarols"); n && n.click(); } else { openStation(state.stationIdx, {}); startRun(); } }
      if (btn === "back") { openStation(state.stationIdx, {}); startRun(); }
      return;
    }
    if (btn === "go") {
      if (state.inTask) state.scene.press();
      else if (state.waiting) state.waiting();
    }
    if (btn === "back") replayStep();
    if (btn === "home" && !cfg.kiosk) goHome();
    if (!cfg.kiosk && btn === "right" && !state.inTask && state.waiting) state.waiting();
  }

  function replayStep() {
    if (state.inTask || state.step < 0) { A.stopSpeech(); return; }
    // re-run the current step's narration from the top, keeping the scene as it is
    const i = state.step; state.run++; const run = state.run;
    A.stopSpeech(); A.stopCarol(); hidePrompt();
    const st = STORY.stations[state.stationIdx];
    (async () => {
      const ok = await runStepNoTask(run, i);
      if (!ok) return;
      for (let k = i + 1; k < st.steps.length; k++) { if (!(await runStep(run, k))) return; }
      if (alive(run)) { await sleep(2500, run); if (alive(run)) showEnd(run); }
    })();
  }
  async function runStepNoTask(run, i) {
    const step = STORY.stations[state.stationIdx].steps[i];
    const copy = Object.assign({}, step); delete copy.task;
    const saved = STORY.stations[state.stationIdx].steps[i];
    STORY.stations[state.stationIdx].steps[i] = copy;
    try { return await runStep(run, i); } finally { STORY.stations[state.stationIdx].steps[i] = saved; }
  }

  function stopAll() { state.run++; A.stopSpeech(); A.stopCarol(); A.ambient(false); state.waiting = null; state.inTask = false; state.carolPlaying = null; setPaused(false); }

  /* ---------------- pause ---------------- */
  // ❚❚ button (or the P key) freezes the story: voices, music, sound effects, the film's movement and the timers
  // between steps. Tap anywhere (or ❚❚ again) to carry on. The film also pauses by itself if the phone is locked
  // or the viewer switches to another app.
  let pausedAnims = [];
  const onStage = () => $("#stage").classList.contains("on") || getComputedStyle($("#stage")).display !== "none";
  function setPaused(p) {
    p = !!p;
    if (p && (state.attract || state.stationIdx === -1 || !onStage())) return;
    if (p === A.paused) return;
    A.setPaused(p);
    if (p) { pausedAnims = document.getAnimations ? document.getAnimations().filter(a => a.playState === "running") : []; pausedAnims.forEach(a => a.pause()); }
    else { pausedAnims.forEach(a => { try { if (a.playState === "paused") a.play(); } catch (e) {} }); pausedAnims = []; }
    document.body.classList.toggle("is-paused", p);
    const b = document.getElementById("pauseBtn");
    if (b) {
      b.setAttribute("aria-label", p ? "Play" : "Pause");
      b.innerHTML = p ? '<svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>' : '<svg viewBox="0 0 24 24"><path d="M9 5v14M15 5v14"/></svg>';
    }
  }
  function setupPause() {
    const nav = $("#stage .nav");
    if (nav && !document.getElementById("pauseBtn")) {
      const b = document.createElement("button"); b.className = "navbtn"; b.id = "pauseBtn";
      nav.insertBefore(b, $("#replayBtn"));
      b.addEventListener("click", e => { e.stopPropagation(); state.lastInput = Date.now(); setPaused(!A.paused); });
    }
    const veil = document.createElement("div"); veil.className = "pause-veil"; veil.id = "pauseVeil";
    veil.innerHTML = '<div class="pause-card"><span class="pause-play"><svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg></span>Paused · tap to continue</div>';
    veil.addEventListener("pointerdown", e => { e.stopPropagation(); e.preventDefault(); setPaused(false); });
    $("#stage").appendChild(veil);
    document.addEventListener("visibilitychange", () => { if (document.hidden && !cfg.kiosk) setPaused(true); });
    setPaused(false); A.paused = false; document.body.classList.remove("is-paused");
    const b = document.getElementById("pauseBtn"); if (b) { b.setAttribute("aria-label", "Pause"); b.innerHTML = '<svg viewBox="0 0 24 24"><path d="M9 5v14M15 5v14"/></svg>'; }
  }

  /* ---------------- scene api ---------------- */
  const sceneApi = {
    sfx: n => A.sfx(n),
    voice: id => { const c = STORY.clips && STORY.clips[id]; return c ? A.clip(id, c.text) : Promise.resolve(); },
    count: (k, inc) => B.count(k, inc),
    shared: () => B.local,
    audioTime: () => A.currentTime(),
    alive: run => alive(run),
    clip: id => { const c = STORY.clips && STORY.clips[id]; return c ? A.clip(id, c.text) : Promise.resolve(); },
    hasClip: id => A.hasRecording(id, STORY.clips && STORY.clips[id] && STORY.clips[id].text),
    bubble(x, y, text, small) {
      const svg = $("#scene svg"); if (!svg) return;
      const pt = svg.createSVGPoint(); pt.x = x; pt.y = y;
      const p = pt.matrixTransform(svg.getScreenCTM());
      const b = document.createElement("div"); b.className = "bubble";
      b.innerHTML = esc(text) + (small ? `<small>${esc(small)}</small>` : "");
      b.style.left = p.x + "px"; b.style.top = p.y + "px";
      $("#stage").appendChild(b);
      setTimeout(() => b.remove(), 4200);
    }
  };

  function fitScene() {
    const svg = $("#scene svg"); if (!svg) return;
    // On tall/portrait screens show the whole picture instead of cropping the sides
    svg.setAttribute("preserveAspectRatio", innerWidth / innerHeight < 1.25 ? "xMidYMid meet" : "xMidYMid slice");
  }

  document.addEventListener("DOMContentLoaded", boot);
})();
