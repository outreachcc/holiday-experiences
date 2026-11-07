// Virtual clock: the page only moves when the renderer calls __vt.advance(ms), so every frame is exact.
(() => {
  let now = 0;
  const T0 = Date.now();
  const timers = new Map(); let seq = 1;
  const rafs = new Map(); let rseq = 1;
  window.setTimeout = (fn, ms = 0, ...a) => { const id = seq++; timers.set(id, { at: now + Math.max(0, +ms || 0), fn, a, iv: 0 }); return id; };
  window.setInterval = (fn, ms = 0, ...a) => { const iv = Math.max(1, +ms || 0); const id = seq++; timers.set(id, { at: now + iv, fn, a, iv }); return id; };
  window.clearTimeout = window.clearInterval = id => { timers.delete(id); };
  window.requestAnimationFrame = fn => { const id = rseq++; rafs.set(id, fn); return id; };
  window.cancelAnimationFrame = id => { rafs.delete(id); };
  performance.now = () => now;
  Date.now = () => T0 + now;
  const run = (f, a) => { try { f(...(a || [])); } catch (e) { console.error("vt", e && e.stack || e); } };
  window.__vt = {
    get now() { return now; },
    advance(ms) {
      const end = now + ms;
      for (;;) {
        let best = null;
        for (const [id, t] of timers) if (t.at <= end && (!best || t.at < best[1].at || (t.at === best[1].at && id < best[0]))) best = [id, t];
        if (!best) break;
        const [id, t] = best;
        now = Math.max(now, t.at);
        if (t.iv) t.at += t.iv; else timers.delete(id);
        run(t.fn, t.a);
      }
      now = end;
      const cbs = [...rafs.values()]; rafs.clear();
      cbs.forEach(cb => run(cb, [now]));
      // CSS animations and transitions follow the virtual clock too
      for (const a of document.getAnimations()) {
        if (a.__t0 === undefined) a.__t0 = now;
        if (a.playState !== "paused") a.pause();
        a.currentTime = (now - a.__t0) * (a.playbackRate || 1);
      }
    }
  };
})();
