#!/usr/bin/env python3
"""
Mouth-movement data for the film edition: loudness of each narration recording, 30 times a second,
plus who is speaking when, so the film can cut to that person's close-up and move the right mouth.
Writes audio/narration/envelopes.js. Re-run after re-recording narration.

    python3 tools/make_mouth_data.py

Who-speaks-when comes from the manifest when the recording tool stored it ("segs"). For older recordings
it is worked out from the pauses: the recording tool leaves ~0.55 s between speakers and ~0.75 s before the
narrator reads the reference, which is longer than the pauses inside a sentence.
"""
import json, os, re, subprocess, sys
import numpy as np

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "audio", "narration")
FPS, SR = 30, 16000


def load(path):
    raw = subprocess.run(["ffmpeg", "-v", "error", "-i", path, "-f", "f32le", "-ac", "1", "-ar", str(SR), "-"],
                         capture_output=True, check=True).stdout
    return np.frombuffer(raw, dtype=np.float32)


def load_story():
    s = open(os.path.join(ROOT, "js", "content.js"), encoding="utf-8").read()
    return json.loads(s[s.index("{"):s.rindex("}") + 1])


def verse_parts(story):
    """verse id -> list of speakers in order, ending with the narrator reading the reference"""
    parts = {}
    for st in story["stations"]:
        for i, step in enumerate(st["steps"]):
            v = step.get("verse")
            if not v:
                continue
            who = [p[0] for p in v["speak"]] if v.get("speak") else [v.get("voice", "narrator")]
            parts[f"{st['id']}.{i}.verse"] = who + ["narrator"]
    return parts


def pauses(quiet, min_len):
    """[(start_frame, end_frame)] of quiet runs at least min_len frames long, not counting the very start/end"""
    out, run = [], 0
    for i, q in enumerate(quiet):
        if q:
            run += 1
        else:
            if run >= min_len and i - run > 0:
                out.append((i - run, i))
            run = 0
    return out


def guess_segs(lvl, who):
    """Split a verse recording into [speaker, start, end] parts using its pauses."""
    quiet = lvl < 0.04
    n = len(lvl)
    voiced = np.where(~quiet)[0]
    if not len(voiced):
        return None
    first, last = voiced[0], voiced[-1] + 1
    gaps = [g for g in pauses(quiet, int(0.45 * FPS)) if first < g[0] and g[1] < last]
    long_gaps = [g for g in gaps if g[1] - g[0] >= int(0.65 * FPS)]
    if not long_gaps:
        return None
    ref = long_gaps[-1]                            # the pause before "Luke 1, verse 38"
    cuts = []
    need = len(who) - 2                            # pauses between the speakers before the reference
    for g in gaps:
        if len(cuts) == need:
            break
        if g[1] <= ref[0]:
            cuts.append(g)
    if len(cuts) < need:
        return None
    bounds = [first] + [x for g in cuts for x in g] + [ref[0], ref[1], last]
    segs = []
    for k, w in enumerate(who):
        a, b = bounds[2 * k], bounds[2 * k + 1]
        segs.append([w, round(a / FPS, 2), round(b / FPS, 2)])
    return segs


def stamp_versions(manifest):
    """Give each recording a short fingerprint ("v") that the page adds to its address, so browsers never
    replay an old cached take after a line is re-recorded."""
    import hashlib
    sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
    from make_narration import write_manifest
    changed = 0
    for e in manifest.values():
        path = os.path.join(OUT, e["file"])
        if os.path.exists(path):
            v = hashlib.md5(open(path, "rb").read()).hexdigest()[:8]
            if e.get("v") != v:
                e["v"] = v; changed += 1
    if changed:
        write_manifest(manifest)
        print(f"recording versions updated for {changed} lines")


def main():
    manifest = json.load(open(os.path.join(OUT, "manifest.json")))
    stamp_versions(manifest)
    parts = verse_parts(load_story())
    data, guessed = {}, []
    for id_, e in manifest.items():
        path = os.path.join(OUT, e["file"])
        if not os.path.exists(path):
            continue
        a = load(path)
        hop = SR // FPS
        frames = len(a) // hop
        rms = np.array([np.sqrt(np.mean(a[i * hop:(i + 1) * hop] ** 2)) for i in range(frames)])
        top = np.percentile(rms[rms > 1e-4], 95) if np.any(rms > 1e-4) else 1
        lvl = np.clip(rms / top, 0, 1)
        item = {"env": "".join(str(int(round(v * 9))) for v in lvl)}
        segs = e.get("segs")
        if not segs and id_ in parts and any(w != "narrator" for w in parts[id_]):
            segs = guess_segs(lvl, parts[id_])
            if segs:
                guessed.append((id_, segs))
        if segs:
            item["segs"] = segs
            ch = [s for s in segs if s[0] != "narrator"]
            if ch:
                item["speakerEnd"] = ch[-1][2]
        elif id_.endswith(".verse") and e.get("voice", "narrator").split("+")[0] != "narrator":
            # fallback: the last pause of >= 0.6 s separates the character's words from the reference
            quiet, run, end = lvl < 0.04, 0, None
            for i in range(frames):
                run = run + 1 if quiet[i] else 0
                if run == int(0.6 * FPS):
                    end = (i - run + 1) / FPS
            item["speakerEnd"] = round(end if end else frames / FPS, 2)
        data[id_] = item
    with open(os.path.join(OUT, "envelopes.js"), "w") as f:
        f.write("window.NARRATION_ENVELOPES = " + json.dumps(data, separators=(",", ":")) + ";\n")
    print(f"mouth data for {len(data)} recordings -> audio/narration/envelopes.js")
    for k, s in guessed:
        print(f"  {k}: " + ", ".join(f"{w} {a}-{b}s" for w, a, b in s))


if __name__ == "__main__":
    main()
