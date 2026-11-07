/* Audio: narration (pre-rendered files -> speech synthesis -> timed captions), carols, ambient, sound effects */
(function () {
  const A = {};
  let ctx = null, master = null, musicBus = null, sfxBus = null;
  let manifest = {};
  let volume = 0.9;
  A.narrationEnabled = true;

  A.hash = function (s) { // djb2, unsigned 32-bit, hex — must match tools/make_narration.py
    let h = 5381;
    for (let i = 0; i < s.length; i++) h = (((h << 5) + h) + s.charCodeAt(i)) >>> 0;
    return h.toString(16);
  };

  A.init = async function () {
    if (window.NARRATION_MANIFEST) { manifest = window.NARRATION_MANIFEST; return; } // from audio/narration/manifest.js (works even when opened from disk)
    try {
      const r = await fetch("audio/narration/manifest.json", { cache: "no-cache" });
      if (r.ok) manifest = await r.json();
    } catch (e) { /* no pre-rendered narration; fall back */ }
  };

  A.unlock = function () {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      // iPhone/iPad: play through the silent switch, like a video would
      try { if (navigator.audioSession) navigator.audioSession.type = "playback"; } catch (e) {}
      ctx = new AC();
      master = ctx.createGain(); master.gain.value = volume; master.connect(ctx.destination);
      const verb = makeReverb();
      musicBus = ctx.createGain(); musicBus.gain.value = 0.55;
      sfxBus = ctx.createGain(); sfxBus.gain.value = 0.6;
      musicBus.connect(master); sfxBus.connect(master);
      if (verb) { const send = ctx.createGain(); send.gain.value = 0.35; musicBus.connect(send); sfxBus.connect(send); send.connect(verb); verb.connect(master); }
    }
    if (ctx.state === "suspended" && !A.paused) ctx.resume();
    primePlayers();
    // warm up speech synthesis voices (Chrome loads them lazily)
    if ("speechSynthesis" in window) speechSynthesis.getVoices();
  };
  A.ready = () => !!ctx && ctx.state === "running";

  A.setVolume = function (v) { volume = v; if (master) master.gain.value = v; if (currentAudio) currentAudio.volume = v; };

  function makeReverb() {
    try {
      const len = ctx.sampleRate * 2.6, buf = ctx.createBuffer(2, len, ctx.sampleRate);
      for (let c = 0; c < 2; c++) { const d = buf.getChannelData(c); for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3.2); }
      const cv = ctx.createConvolver(); cv.buffer = buf; return cv;
    } catch (e) { return null; }
  }

  // Safari only lets sound start from a finished tap (touchend/click), not from a finger touching down, so unlock
  // on those too. Harmless elsewhere: after the first time it only re-wakes the sound engine if it went to sleep.
  ["touchend", "click", "keydown"].forEach(ev => document.addEventListener(ev, () => { if (!A.paused) A.unlock(); }, true));

  /* ---------------- pause ---------------- */
  // The pause button freezes the voices, music, sound effects and every timer made with A.after (the film's
  // choreography and the pauses between steps). Resuming carries on exactly where it stopped.
  A.paused = false;
  const timers = new Set();
  A.after = function (ms, fn) {
    const t = { left: Math.max(0, +ms || 0), id: 0, due: 0 };
    t.go = () => { t.due = performance.now() + t.left; t.id = setTimeout(() => { timers.delete(t); fn(); }, t.left); };
    timers.add(t); if (!A.paused) t.go();
    return t;
  };
  A.cancel = t => { if (t) { clearTimeout(t.id); timers.delete(t); } };
  A.setPaused = function (p) {
    p = !!p; if (p === A.paused) return; A.paused = p;
    const now = performance.now();
    const media = [currentAudio, carolHandle && carolHandle.el, ...liveClips].filter(Boolean);
    if (p) {
      timers.forEach(t => { clearTimeout(t.id); t.left = Math.max(0, t.due - now); });
      media.forEach(au => { au.__wasPlaying = !au.paused; au.pause(); });
      if ("speechSynthesis" in window && speechSynthesis.speaking) speechSynthesis.pause();
      if (ctx && ctx.state === "running") ctx.suspend();
    } else {
      timers.forEach(t => t.go());
      media.forEach(au => { if (au.__wasPlaying) au.play().catch(() => {}); });
      if ("speechSynthesis" in window) speechSynthesis.resume();
      if (ctx && ctx.state === "suspended") ctx.resume();
    }
  };

  /* ---------------- narration ---------------- */
  let currentAudio = null, speakToken = 0, timedTimer = null;

  // One reusable player for the narration and two for characters' short lines. Phones and tablets only allow a
  // limited number of audio players on a page: making a new one for every line used them all up partway through
  // (around station 3 or 4), and from then on every line was silent. The players are also "unlocked" on the first
  // tap (A.unlock), which iPhone/iPad need before audio can start without a tap of its own.
  let narrEl = null, clipEls = null, clipNext = 0, primed = false;
  const narrPlayer = () => narrEl || (narrEl = new Audio());
  const clipPlayer = () => { if (!clipEls) clipEls = [new Audio(), new Audio()]; return clipEls[clipNext++ % clipEls.length]; };
  const detach = au => { au.onended = au.onerror = au.ontimeupdate = null; };
  let silentUrl = null;
  function silence() {   // 0.05 s of silence as a WAV, made here so no extra file is needed
    if (silentUrl) return silentUrl;
    const n = 800, b = new ArrayBuffer(44 + n * 2), v = new DataView(b), w = (o, t) => { for (let i = 0; i < t.length; i++) v.setUint8(o + i, t.charCodeAt(i)); };
    w(0, "RIFF"); v.setUint32(4, 36 + n * 2, true); w(8, "WAVE"); w(12, "fmt "); v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 1, true);
    v.setUint32(24, 16000, true); v.setUint32(28, 32000, true); v.setUint16(32, 2, true); v.setUint16(34, 16, true); w(36, "data"); v.setUint32(40, n * 2, true);
    return (silentUrl = URL.createObjectURL(new Blob([b], { type: "audio/wav" })));
  }
  function primePlayers() {
    if (primed) return; primed = true;
    try {
      [narrPlayer(), clipPlayer(), clipPlayer()].forEach(el => {
        if (el.getAttribute("src")) return;   // already in use
        const url = silence(); el.muted = true; el.src = url;
        el.play().then(() => { if (el.src === url) el.pause(); el.muted = A.muted; }).catch(() => { el.muted = A.muted; });
      });
    } catch (e) { /* older browser: lines still play, just without the warm-up */ }
  }
  /* Phones and tablets play the narration through the sound engine (Web Audio) instead of an audio player.
     iPad/iPhone Safari blocks an audio player that starts by itself between taps (the voice dropped out when the
     scene changed and came back after the next GO), but once a tap has started the sound engine it can play every
     line on its own. Each line is fetched and decoded just before it plays; the last few are kept in memory.
     PCs and the Pi keep using the audio player. ?audio=player forces the player on a phone, for testing. */
  const UA = navigator.userAgent || "";
  const MOBILE_AUDIO = /Android|iPhone|iPad|iPod/i.test(UA) || (navigator.maxTouchPoints > 1 && /Macintosh/.test(UA));
  const FORCE_PLAYER = /[?&]audio=player/.test(location.search);
  const useEngine = () => MOBILE_AUDIO && !FORCE_PLAYER && !!ctx && ctx.state === "running";
  const bufCache = new Map();
  function loadBuf(url) {
    if (!bufCache.has(url)) {
      bufCache.set(url, fetch(url).then(r => { if (!r.ok) throw new Error("http " + r.status); return r.arrayBuffer(); })
        .then(b => new Promise((res, rej) => ctx.decodeAudioData(b, res, rej))));
      while (bufCache.size > 6) bufCache.delete(bufCache.keys().next().value);
    }
    const p = bufCache.get(url); p.catch(() => bufCache.delete(url)); return p;
  }
  let voiceBus = null, voice = null;   // voice: the line playing through the engine {src, t0, dur, tick}
  const vBus = () => { if (!voiceBus) { voiceBus = ctx.createGain(); voiceBus.connect(master); } voiceBus.gain.value = A.muted ? 0 : 1; return voiceBus; };
  function stopVoice() { if (voice) { const v = voice; voice = null; clearInterval(v.tick); try { v.src.onended = null; v.src.stop(); } catch (e) {} } }
  // Play a line through the engine; calls fallback() if it can't (then the audio player is used instead)
  function engineLine(url, token, onProgress, finish, fallback) {
    loadBuf(url).then(buf => {
      if (token !== speakToken) return;
      if (!ctx || ctx.state !== "running") return fallback();
      stopVoice();
      const src = ctx.createBufferSource(); src.buffer = buf; src.connect(vBus());
      const v = voice = { src, t0: ctx.currentTime + 0.03, dur: buf.duration };
      src.onended = () => { if (voice === v) stopVoice(); finish(); };
      src.start(v.t0);
      v.tick = setInterval(() => { if (voice === v) onProgress(Math.min(1, Math.max(0, ctx.currentTime - v.t0) / v.dur)); }, 200);
    }).catch(() => { if (token === speakToken) fallback(); });
  }
  function engineClip(url, done) {
    loadBuf(url).then(buf => {
      if (!ctx || ctx.state !== "running") return done();
      const src = ctx.createBufferSource(); src.buffer = buf; src.connect(vBus());
      src.onended = done; src.start(ctx.currentTime + 0.03);
    }).catch(done);
  }

  // Mute (the speaker button) only silences the voices: lines keep playing silently, so captions, mouths and
  // timing carry on, and the voices come straight back mid-line when it's turned on again.
  A.muted = false;
  const liveClips = new Set();
  A.setMuted = function (m) {
    A.muted = !!m;
    if (currentAudio) currentAudio.muted = A.muted;
    if (voiceBus) voiceBus.gain.value = A.muted ? 0 : 1;
    liveClips.forEach(au => { au.muted = A.muted; });
    if (A.muted && "speechSynthesis" in window && speechSynthesis.speaking) speechSynthesis.cancel(); // (computer voice can't be muted; its line finishes on the timer)
  };

  function pickVoice() {
    if (!("speechSynthesis" in window)) return null;
    const vs = speechSynthesis.getVoices().filter(v => /^en(-|_)/i.test(v.lang));
    const prefer = [/Natural/i, /Neural/i, /Google UK English Male/i, /Daniel/i, /Google US English/i, /Samantha/i, /Arthur/i];
    for (const p of prefer) { const v = vs.find(x => p.test(x.name)); if (v) return v; }
    return vs[0] || null;
  }

  // The recording's address carries its version ("v", stamped by tools/make_mouth_data.py), so a browser
  // that cached an older take of a line fetches the new one instead of replaying the old file
  const narrationUrl = e => "audio/narration/" + e.file + (e.v ? "?v=" + e.v : "");

  // speak(id, text, onProgress(fraction 0..1)) -> Promise
  A.speak = function (id, text, onProgress) {
    A.stopSpeech();
    const token = ++speakToken;
    onProgress = onProgress || (() => {});
    const done = new Promise(resolve => {
      const finish = () => { if (token === speakToken) { onProgress(1); resolve(); } };
      const entry = manifest[id];
      if (A.narrationEnabled && !FAST && entry && entry.hash === A.hash(text)) {
        const viaPlayer = () => playLine(entry, text, token, onProgress, finish);
        if (useEngine()) { engineLine(narrationUrl(entry), token, onProgress, finish, viaPlayer); return; }
        viaPlayer();
        return;
      }
      speechOrTimed(text, onProgress, finish);
    });
    return done;
  };

  function playLine(entry, text, token, onProgress, finish) {
        const au = narrPlayer(); detach(au);
        au.src = narrationUrl(entry);
        au.volume = volume; au.muted = A.muted; currentAudio = au;
        au.ontimeupdate = () => { if (au.duration) onProgress(au.currentTime / au.duration); };
        au.onended = finish;
        au.onerror = () => { if (token === speakToken) timed(text, onProgress, finish); };
        au.play().catch(e => { if (token === speakToken && !(e && e.name === "AbortError")) speechOrTimed(text, onProgress, finish); });
  }

  function speechOrTimed(text, onProgress, finish) {
    const v = pickVoice();
    if (A.narrationEnabled && !A.muted && v && !FAST && "speechSynthesis" in window) {
      const u = new SpeechSynthesisUtterance(text);
      u.voice = v; u.rate = 0.92; u.pitch = 1.0; u.volume = volume;
      let gotEnd = false;
      u.onboundary = e => { if (e.charIndex != null) onProgress(e.charIndex / text.length); };
      u.onend = () => { gotEnd = true; finish(); };
      u.onerror = () => { if (!gotEnd) { gotEnd = true; timed(text, onProgress, finish); } };
      speechSynthesis.speak(u);
      // Safety net: some engines never fire onend
      const est = estimate(text) + 4000;
      A.after(est, () => { if (!gotEnd) { gotEnd = true; finish(); } });
      return;
    }
    timed(text, onProgress, finish);
  }

  const FAST = /[?&]fast=1/.test(location.search); // testing aid: skip voices, run captions 10x faster
  function estimate(text) { return Math.max(2200, text.split(/\s+/).length * 330) * (FAST ? 0.1 : 1); }
  function timed(text, onProgress, finish) {
    const total = estimate(text);
    let ran = 0, last = performance.now();
    clearInterval(timedTimer);
    timedTimer = setInterval(() => {
      const n = performance.now(); if (!A.paused) ran += n - last; last = n;
      const f = ran / total;
      onProgress(Math.min(1, f));
      if (f >= 1) { clearInterval(timedTimer); finish(); }
    }, 100);
  }

  // Short character line (e.g. an innkeeper) that plays over the scene without touching narration or captions
  // Returns a promise that resolves when the line has finished (or right away if there is no recording)
  A.clip = function (id, text) {
    const entry = manifest[id];
    if (!A.narrationEnabled || FAST || !entry || entry.hash !== A.hash(text)) return Promise.resolve();
    return new Promise(resolve => {
      let done = false; let finish = () => { if (!done) { done = true; resolve(); } };
      if (useEngine()) { engineClip(narrationUrl(entry), finish); A.after(15000, finish); return; }
      try {
        const au = clipPlayer(); detach(au);
        au.src = narrationUrl(entry); au.volume = volume; au.muted = A.muted;
        liveClips.add(au);
        const end = finish; finish = () => { liveClips.delete(au); detach(au); end(); };
        au.onended = finish; au.onerror = finish;
        au.play().catch(finish);
        A.after(15000, finish); // safety net
      } catch (e) { finish(); }
    });
  };

  // Where the listener is in the line right now. Through the sound engine, the speaker (and especially Bluetooth)
  // plays a little behind the engine's clock, so that delay is taken off; otherwise mouths and caption words run ahead.
  const outLag = () => { const l = ctx && (ctx.outputLatency || 0); return l > 0 && l < 0.6 ? l : 0; };
  A.currentTime = () => voice ? Math.max(0, ctx.currentTime - voice.t0 - outLag()) : (currentAudio && !currentAudio.paused ? currentAudio.currentTime : null);
  A.hasRecording = (id, text) => { const e = manifest[id]; return !!(text && e && e.hash === A.hash(text) && A.narrationEnabled && !FAST); };

  A.stopSpeech = function () {
    speakToken++;
    stopVoice();
    if (currentAudio) { detach(currentAudio); currentAudio.pause(); currentAudio = null; }
    if ("speechSynthesis" in window) speechSynthesis.cancel();
    clearInterval(timedTimer);
  };

  /* ---------------- synth voices ---------------- */
  const NOTE = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
  function freq(n) {
    const m = /^([A-G])(#|b)?(\d)$/.exec(n); if (!m) return 0;
    let s = NOTE[m[1]] + (m[2] === "#" ? 1 : m[2] === "b" ? -1 : 0) + (parseInt(m[3], 10) + 1) * 12;
    return 440 * Math.pow(2, (s - 69) / 12);
  }
  A.freq = freq;

  function bell(f, t, dur, gain, bus) {
    if (!ctx || !f) return;
    const out = ctx.createGain(); out.gain.setValueAtTime(0, t);
    out.gain.linearRampToValueAtTime(gain, t + 0.008);
    out.gain.exponentialRampToValueAtTime(0.0008, t + Math.max(0.5, dur * 1.8));
    out.connect(bus || musicBus);
    [[1, 1], [2, 0.32], [3.01, 0.12], [4.2, 0.06]].forEach(([mult, g]) => {
      const o = ctx.createOscillator(), og = ctx.createGain();
      o.type = "sine"; o.frequency.value = f * mult; og.gain.value = g;
      o.connect(og); og.connect(out); o.start(t); o.stop(t + Math.max(0.6, dur * 1.9));
    });
  }
  function pad(f, t, dur, gain, bus) {
    if (!ctx || !f) return;
    const out = ctx.createGain(), lp = ctx.createBiquadFilter();
    lp.type = "lowpass"; lp.frequency.value = 1400; lp.Q.value = 0.5;
    out.gain.setValueAtTime(0, t); out.gain.linearRampToValueAtTime(gain, t + 0.25);
    out.gain.setValueAtTime(gain, t + Math.max(0.3, dur - 0.3)); out.gain.linearRampToValueAtTime(0, t + dur + 0.4);
    lp.connect(out); out.connect(bus || musicBus);
    [-6, 0, 7].forEach(cents => {
      const o = ctx.createOscillator(); o.type = "sawtooth"; o.frequency.value = f; o.detune.value = cents;
      const lfo = ctx.createOscillator(), lg = ctx.createGain(); lfo.frequency.value = 5; lg.gain.value = 4;
      lfo.connect(lg); lg.connect(o.detune); lfo.start(t); lfo.stop(t + dur + 0.6);
      o.connect(lp); o.start(t); o.stop(t + dur + 0.6);
    });
  }

  /* ---------------- carols ---------------- */
  let carolHandle = null;
  const ROOTS = { C: "C3", D: "D3", E: "E3", F: "F3", G: "G2", A: "A2", B: "B2" };

  // playCarol(carol, onPhrase(i)) -> {done: Promise, stop(), notes, clock()}
  //   notes: every sung note as {p: phrase, k: syllable number in that phrase, at: start in ms, dur: ms}
  //   clock(): ms since the song started, on the same clock as the music (for the bouncing ball)
  A.playCarol = function (carol, onPhrase) {
    A.stopCarol();
    onPhrase = onPhrase || (() => {});
    let stopped = false; const timers = [];
    // Each song gets its own volume node, so Stop silences notes that were already scheduled
    const songBus = ctx ? ctx.createGain() : null;
    if (songBus) songBus.connect(musicBus);
    const handle = { stop() {
      stopped = true; timers.forEach(A.cancel); if (handle.el) handle.el.pause();
      if (songBus) { const t = ctx.currentTime; songBus.gain.cancelScheduledValues(t); songBus.gain.setValueAtTime(songBus.gain.value, t); songBus.gain.linearRampToValueAtTime(0, t + 0.08); setTimeout(() => { try { songBus.disconnect(); } catch (e) {} }, 200); }
    } };
    handle.done = new Promise(resolve => {
      handle.resolve = resolve;
      if (carol.file) { // a real recording dropped into audio/music/
        const el = new Audio("audio/music/" + carol.file); el.volume = volume; handle.el = el;
        const per = () => el.duration / carol.phrases.length;
        el.ontimeupdate = () => { if (el.duration) onPhrase(Math.min(carol.phrases.length - 1, Math.floor(el.currentTime / per()))); };
        // with a recording we don't know where each note falls, so spread the syllables evenly over each phrase
        el.onloadedmetadata = () => {
          const per = el.duration * 1000 / carol.phrases.length; handle.notes = [];
          carol.phrases.forEach((ph, p) => { const n = sungCount(ph); for (let k = 0; k < n; k++) handle.notes.push({ p, k, at: p * per + k * per / n, dur: per / n }); });
        };
        handle.clock = () => el.currentTime * 1000;
        el.onended = () => resolve(); el.onerror = () => { carol.file = ""; synthCarol(); };
        el.play().catch(synthCarol);
        return;
      }
      synthCarol();
      function synthCarol() {
        if (!ctx) { resolve(); return; }
        const unit = carol.tempo || 0.25;
        let t = ctx.currentTime + 0.4, wall = 400;
        const t0 = ctx.currentTime; handle.notes = []; handle.clock = () => (ctx.currentTime - t0) * 1000;
        carol.phrases.forEach((ph, i) => {
          timers.push(A.after(wall, () => { if (!stopped) onPhrase(i); }));
          const notes = ph.notes.trim().split(/\s+/).map(x => { const [n, d] = x.split(":"); return { n, d: parseFloat(d) }; });
          let beat = 0; const phraseDur = notes.reduce((a, b) => a + b.d, 0) * unit;
          let sung = 0;
          notes.forEach(({ n, d }) => {
            const dur = d * unit;
            if (n !== "R") handle.notes.push({ p: i, k: sung++, at: (t - t0) * 1000, dur: dur * 1000 });
            if (n !== "R") {
              bell(freq(n), t, dur, 0.22, songBus);
              bell(freq(n) * 2, t, dur * 0.6, 0.03, songBus);
            }
            // soft harmony pad under the first note of each "bar-ish" chunk
            if (beat % 6 === 0 && n !== "R") {
              const f = freq(n); pad(f / 2, t, Math.min(dur * 3, 2.4), 0.025, songBus); pad(f * 0.75 / 2 * 1.0, t, Math.min(dur * 3, 2.4), 0.012, songBus);
            }
            beat += d; t += dur;
          });
          wall += phraseDur * 1000;
        });
        timers.push(A.after(wall + 1200, () => { if (!stopped) resolve(); }));
      }
    });
    carolHandle = handle;
    return handle;
  };
  const sungCount = ph => ph.notes.trim().split(/\s+/).filter(x => x.split(":")[0] !== "R").length;
  A.stopCarol = function () { if (carolHandle) { carolHandle.stop(); if (carolHandle.resolve) carolHandle.resolve(); carolHandle = null; } };

  /* ---------------- ambient ---------------- */
  let ambTimer = null;
  A.ambient = function (on) {
    clearInterval(ambTimer); ambTimer = null;
    if (!on || !ctx) return;
    const scale = ["D4", "E4", "F#4", "A4", "B4", "D5", "E5", "F#5", "A5"];
    const tick = () => {
      if (!ctx || A.paused) return;   // (paused: don't queue up notes to all play at once on resume)
      const t = ctx.currentTime + 0.05;
      const n = scale[Math.floor(Math.random() * scale.length)];
      bell(freq(n), t, 1.4, 0.06);
      if (Math.random() < 0.3) bell(freq(n) * 1.5, t + 0.35, 1.2, 0.035);
      if (Math.random() < 0.12) pad(freq("D3"), t, 4, 0.012);
    };
    tick(); ambTimer = setInterval(tick, 1300);
  };

  /* ---------------- sound effects ---------------- */
  A.sfx = function (name) {
    if (!ctx) return;
    const t = ctx.currentTime + 0.02;
    switch (name) {
      case "chime": ["A5", "C#6", "E6"].forEach((n, i) => bell(freq(n), t + i * 0.09, 0.8, 0.14, sfxBus)); break;
      case "sparkle": for (let i = 0; i < 7; i++) bell(freq(["E6", "B5", "G#6", "E7", "B6", "C#7", "F#6"][i]), t + i * 0.055, 0.5, 0.07, sfxBus); break;
      case "success": ["D5", "F#5", "A5", "D6"].forEach((n, i) => bell(freq(n), t + i * 0.12, 1.2, 0.13, sfxBus)); break;
      case "knock": for (let i = 0; i < 3; i++) thump(t + i * 0.17); break;
      case "step": thump(t, 0.4, 380); thump(t + 0.12, 0.3, 320); break;
      case "baa": baa(t); break;
      case "choir": ["D4", "F#4", "A4", "D5"].forEach(n => pad(freq(n), t, 3.2, 0.04)); break;
      case "whoosh": noise(t, 1.0); break;
      case "pop": bell(freq("G5"), t, 0.3, 0.12, sfxBus); break;
    }
  };
  function thump(t, g = 0.6, f = 140) {
    const o = ctx.createOscillator(), gg = ctx.createGain();
    o.type = "sine"; o.frequency.setValueAtTime(f, t); o.frequency.exponentialRampToValueAtTime(f * 0.4, t + 0.12);
    gg.gain.setValueAtTime(g, t); gg.gain.exponentialRampToValueAtTime(0.001, t + 0.16);
    o.connect(gg); gg.connect(sfxBus); o.start(t); o.stop(t + 0.2);
  }
  // Sheep bleat: buzzy voice through "aah" vowel formants, with the fast quaver that makes it a "baaa-a-a"
  function baa(t, c, out) {
    c = c || ctx; out = out || sfxBus;
    const v = 0.9 + Math.random() * 0.25;          // each sheep a little different
    const f0 = 255 * v, dur = 0.95 + Math.random() * 0.25;
    const src = c.createOscillator(); src.type = "sawtooth";
    src.frequency.setValueAtTime(f0 * 1.12, t);
    src.frequency.linearRampToValueAtTime(f0, t + 0.12);
    src.frequency.linearRampToValueAtTime(f0 * 0.93, t + dur);
    const vib = c.createOscillator(), vibG = c.createGain();            // pitch quaver
    vib.frequency.value = 11 + Math.random() * 3; vibG.gain.value = f0 * 0.035;
    vib.connect(vibG); vibG.connect(src.frequency);
    const trem = c.createOscillator(), tremG = c.createGain(), amp = c.createGain(); // loudness quaver
    trem.frequency.value = vib.frequency.value; tremG.gain.value = 0.32; amp.gain.value = 0.68;
    trem.connect(tremG); tremG.connect(amp.gain);
    const lip = c.createBiquadFilter(); lip.type = "lowpass";               // the "b": lips opening
    lip.frequency.setValueAtTime(350, t); lip.frequency.exponentialRampToValueAtTime(6000, t + 0.07);
    src.connect(lip); lip.connect(amp);
    const env = c.createGain();
    env.gain.setValueAtTime(0.0001, t);
    env.gain.exponentialRampToValueAtTime(1, t + 0.04);
    env.gain.setValueAtTime(1, t + dur * 0.55);
    env.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    // "aah" vowel formants (F1, F2, F3)
    [[820 * v, 7, 1.0], [1350 * v, 9, 0.55], [2650 * v, 12, 0.22]].forEach(([f, q, g]) => {
      const bp = c.createBiquadFilter(); bp.type = "bandpass"; bp.frequency.value = f; bp.Q.value = q;
      const gg = c.createGain(); gg.gain.value = g * 1.6;
      amp.connect(bp); bp.connect(gg); gg.connect(env);
    });
    // a little breath
    const len = Math.floor(c.sampleRate * dur), nb = c.createBuffer(1, len, c.sampleRate), nd = nb.getChannelData(0);
    for (let k = 0; k < len; k++) nd[k] = (Math.random() * 2 - 1) * 0.05;
    const ns = c.createBufferSource(); ns.buffer = nb;
    const nf = c.createBiquadFilter(); nf.type = "bandpass"; nf.frequency.value = 1800; nf.Q.value = 1;
    ns.connect(nf); nf.connect(env);
    const master = c.createGain(); master.gain.value = 0.55;
    env.connect(master); master.connect(out);
    [src, vib, trem].forEach(o => { o.start(t); o.stop(t + dur + 0.05); }); ns.start(t);
  }
  A._baa = baa; // used by the sound preview tool
  function noise(t, dur) {
    const len = ctx.sampleRate * dur, b = ctx.createBuffer(1, len, ctx.sampleRate), d = b.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    const s = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain();
    s.buffer = b; f.type = "bandpass"; f.frequency.setValueAtTime(400, t); f.frequency.exponentialRampToValueAtTime(3000, t + dur);
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.18, t + dur * 0.4); g.gain.linearRampToValueAtTime(0, t + dur);
    s.connect(f); f.connect(g); g.connect(sfxBus); s.start(t);
  }

  window.XAudio = A;
})();
