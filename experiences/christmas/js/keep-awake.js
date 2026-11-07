/* Christmas Experience: KEEP AWAKE on phones and tablets.
   While the experience is open and on screen, the phone or tablet shouldn't dim or lock mid-story.

   1. Screen Wake Lock, where the browser has it (Chrome/Samsung Internet/Firefox on Android, Safari on iOS 16.4+).
      It only exists on https pages, and browsers drop it whenever the page is hidden, so it's asked for again on
      every tap and whenever the page comes back.
   2. Fallback for everything else: a tiny, silent, invisible video playing on a loop. Phones stay awake while a
      video plays. This is what covers the Facebook/Instagram/Messenger in-app browsers (where most visitors from
      social posts open the link), iPhones older than iOS 16.4, home-screen web apps on older iOS, and plain-http
      testing (http://occ.local/...). Phones only let a video start after a tap, so it starts on the first tap.
      Used on phones and tablets only.

   Not used on kiosk stations (body.kiosk): the Pi's screen blanking is turned off by pi/install.sh.
   js/film-core.js (shared with Thanksgiving) also asks for the wake lock; holding two is harmless.
   Add ?awake=0 to the address to turn this off (for testing). */
(function () {
  if (/[?&]awake=0/.test(location.search)) return;
  const UA = navigator.userAgent || "";
  const MOBILE = /Android|iPhone|iPad|iPod|Mobile/i.test(UA) || (navigator.maxTouchPoints > 1 && /Macintosh/.test(UA));
  const kiosk = () => document.body && document.body.classList.contains("kiosk");
  const visible = () => document.visibilityState === "visible";

  // iPhone/iPad home-screen web apps before iOS 18.4 grant the lock but don't honour it: use the video there
  const iosApp = navigator.standalone === true && !/OS (18_([4-9]|\d\d)|19_|[2-9]\d_)/.test(UA);
  let lock = null, asking = false, lockFailed = !("wakeLock" in navigator) || iosApp;
  let video = null;

  function askLock() {
    if (lockFailed || lock || asking || !visible()) return;
    asking = true;
    navigator.wakeLock.request("screen").then(l => {
      asking = false; lock = l;
      l.addEventListener("release", () => { lock = null; });
      stopVideo();                                   // the real lock is enough
    }).catch(() => {
      asking = false;
      if (MOBILE) { lockFailed = true; startVideo(); }   // refused on a phone: use the video from now on
    });                                                 // (on a PC, just try again on the next tap)
  }

  function makeVideo() {
    const v = document.createElement("video");
    v.setAttribute("playsinline", ""); v.setAttribute("webkit-playsinline", "");
    v.setAttribute("muted", ""); v.muted = true; v.loop = true;
    v.setAttribute("aria-hidden", "true"); v.setAttribute("tabindex", "-1"); v.setAttribute("title", "");
    v.disablePictureInPicture = true; v.setAttribute("disableremoteplayback", "");
    v.style.cssText = "position:fixed;left:0;top:0;width:1px;height:1px;opacity:0.01;pointer-events:none;z-index:-1;";
    v.src = "data:video/mp4;base64,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";
    // Some iPhones ignore loop on very short clips: rewind by hand near the end
    v.addEventListener("timeupdate", () => { if (v.currentTime > 1.5) v.currentTime = 0.1; });
    document.body.appendChild(v);
    return v;
  }

  function startVideo() {
    if (!MOBILE || kiosk() || !visible() || lock || !document.body) return;
    if (!video) video = makeVideo();
    if (!video.paused) return;
    const p = video.play();
    if (p && p.catch) p.catch(() => {});             // no tap yet: the next tap starts it
  }
  function stopVideo() { if (video && !video.paused) video.pause(); }

  function keepAwake() {
    if (kiosk()) { stopVideo(); return; }
    if (!lockFailed) askLock();
    if (lockFailed) startVideo();
  }

  // Every tap, click or key (capture phase, so nothing in the page can swallow it)
  ["pointerdown", "touchend", "click", "keydown"].forEach(t => document.addEventListener(t, keepAwake, true));
  document.addEventListener("visibilitychange", () => { if (visible()) keepAwake(); else stopVideo(); });
  // Some browsers quietly drop the lock (or pause the video) without hiding the page: check now and then
  setInterval(() => { if (visible() && !lock && (!video || video.paused)) keepAwake(); }, 15000);
  // On load, only the wake lock is asked for (Android allows it without a tap). The video waits for a tap or the
  // first check, by which time the page knows whether it's a kiosk (app.js decides that after the Pi's config loads).
  askLock();
})();
