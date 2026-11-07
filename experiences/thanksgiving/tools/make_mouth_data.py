#!/usr/bin/env python3
"""
Mouth-movement data for the film edition: loudness of each narration recording, 30 times a second,
plus (for verses read by a character) the moment the character stops and the narrator's reference begins.
Writes audio/narration/envelopes.js. Re-run after re-recording narration.

    python3 tools/make_mouth_data.py
"""
import json, os, subprocess, sys
import numpy as np

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "audio", "narration")
FPS, SR = 30, 16000


def load(path):
    raw = subprocess.run(["ffmpeg", "-v", "error", "-i", path, "-f", "f32le", "-ac", "1", "-ar", str(SR), "-"],
                         capture_output=True, check=True).stdout
    return np.frombuffer(raw, dtype=np.float32)


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
    data = {}
    for id_, e in manifest.items():
        a = load(os.path.join(OUT, e["file"]))
        hop = SR // FPS
        frames = len(a) // hop
        rms = np.array([np.sqrt(np.mean(a[i * hop:(i + 1) * hop] ** 2)) for i in range(frames)])
        top = np.percentile(rms[rms > 1e-4], 95) if np.any(rms > 1e-4) else 1
        lvl = np.clip(rms / top, 0, 1)
        env = "".join(str(int(round(v * 9))) for v in lvl)
        item = {"env": env}
        speakers = e.get("voice", "narrator").split("+")
        if id_.endswith(".verse") and speakers[0] != "narrator":
            # the last pause of >= 0.6 s separates the character's words from the narrator's reference
            quiet = lvl < 0.04
            run, end = 0, None
            for i in range(frames):
                run = run + 1 if quiet[i] else 0
                if run == int(0.6 * FPS):
                    end = (i - run + 1) / FPS
            item["speakerEnd"] = round(end if end else frames / FPS, 2)
        if e.get("segs"):
            item["segs"] = e["segs"]   # [speaker, start, end] for each part of the line
        data[id_] = item
    with open(os.path.join(OUT, "envelopes.js"), "w") as f:
        f.write("window.NARRATION_ENVELOPES = " + json.dumps(data, separators=(",", ":")) + ";\n")
    print(f"mouth data for {len(data)} recordings -> audio/narration/envelopes.js")
    for k, v in data.items():
        if "speakerEnd" in v and True:
            print(f"  {k}: character speaks until {v['speakerEnd']}s of {len(v['env']) / FPS:.1f}s")


if __name__ == "__main__":
    main()
