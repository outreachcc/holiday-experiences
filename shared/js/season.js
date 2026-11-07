/* Season rules — mirrors gate/season.php so the year-stamp is right on the Pi stations too.
     Thanksgiving Experience  Nov 1 -> the Saturday before the First Sunday of Advent
     Christmas Experience     First Sunday of Advent (Sunday from Nov 27 to Dec 3) -> Jan 6 (Epiphany)
   Online, the server also sends window.SEASON (its own clock, and any test date), which wins. */
(function () {
  const NAMES = { thanksgiving: "The Thanksgiving Experience", christmas: "The Christmas Experience" };
  const day = (y, m, d) => new Date(y, m - 1, d);            // local midnight
  const addDays = (dt, n) => new Date(dt.getFullYear(), dt.getMonth(), dt.getDate() + n);

  function adventSunday(y) { const d = day(y, 11, 27); return addDays(d, (7 - d.getDay()) % 7); }

  function window_(id, y) {
    if (id === "thanksgiving") return [day(y, 11, 1), addDays(adventSunday(y), -1)];
    if (id === "christmas") return [adventSunday(y), day(y + 1, 1, 6)];
    throw new Error("Unknown season: " + id);
  }

  // The season running on `now`, or else the next one to open.
  function status(id, now) {
    now = now || new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    for (const y of [today.getFullYear() - 1, today.getFullYear(), today.getFullYear() + 1]) {
      const [start, end] = window_(id, y);
      if (today <= end) return { id, name: NAMES[id], year: y, label: NAMES[id] + " " + y, open: today >= start, start, end };
    }
  }

  window.SeasonRules = { status, window: window_, adventSunday };
})();
