#!/usr/bin/env python3
"""
Pre-render the narration with Piper (a free, offline, natural-sounding text-to-speech engine).

Without this, the app falls back to the browser's built-in voice (or captions only). With it,
every station sounds the same everywhere — on the Pis and online.

    pip install piper-tts
    python3 tools/make_narration.py --download en_US-ryan-high      # first time: fetch a voice
    python3 tools/make_narration.py --voice voices/en_US-ryan-high.onnx

Good storyteller voices to try: en_US-ryan-high, en_GB-alan-medium, en_US-lessac-high, en_GB-northern_english_male-medium
Re-run any time you edit js/content.js; only changed lines are re-recorded.
Output: audio/narration/*.mp3 (or .wav if ffmpeg is missing) + manifest.json
"""
import argparse, hashlib, json, os, re, shutil, subprocess, sys, tempfile, urllib.request

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "audio", "narration")


def djb2(s):  # must match XAudio.hash in js/audio.js (UTF-16 code units)
    h = 5381
    for ch in s.encode("utf-16-le").decode("utf-16-le"):
        for unit in ([ord(ch)] if ord(ch) < 0x10000 else [0xD800 + ((ord(ch) - 0x10000) >> 10), 0xDC00 + ((ord(ch) - 0x10000) & 0x3FF)]):
            h = (((h << 5) + h) + unit) & 0xFFFFFFFF
    return format(h, "x")


def spoken_ref(ref):  # must match spokenRef() in js/app.js
    ref = re.sub(r"(\d+):(\d+)-(\d+)", r"\1, verses \2 to \3", ref, count=1)
    ref = re.sub(r"(\d+):(\d+)", r"\1, verse \2", ref, count=1)
    return ref + "."


def write_manifest(manifest, out=None):
    """manifest.json for web servers + manifest.js so the page also works when opened straight from disk."""
    out = out or OUT
    with open(os.path.join(out, "manifest.json"), "w") as f:
        json.dump(manifest, f, indent=1)
    with open(os.path.join(out, "manifest.js"), "w") as f:
        f.write("window.NARRATION_MANIFEST = " + json.dumps(manifest, indent=1) + ";\n")


def load_story():
    src = open(os.path.join(ROOT, "js", "content.js"), encoding="utf-8").read()
    return json.loads(src[src.index("{"): src.rindex("}") + 1])


def lines():
    src = open(os.path.join(ROOT, "js", "content.js"), encoding="utf-8").read()
    story = json.loads(src[src.index("{"): src.rindex("}") + 1])
    for st in story["stations"]:
        for i, step in enumerate(st["steps"]):
            base = f"{st['id']}.{i}"
            if step.get("say"): yield base + ".say", step["say"]
            if step.get("verse"): yield base + ".verse", step["verse"]["text"] + " " + spoken_ref(step["verse"]["ref"])
            if step.get("after"): yield base + ".after", step["after"]
    for cid, clip in (story.get("clips") or {}).items():
        yield cid, clip["text"]


def download(name):
    lang = name.split("-")[0]; family = lang.split("_")[0]; speaker, quality = name.split("-")[1], name.split("-")[2]
    base = f"https://huggingface.co/rhasspy/piper-voices/resolve/main/{family}/{lang}/{speaker}/{quality}/{name}"
    os.makedirs(os.path.join(ROOT, "voices"), exist_ok=True)
    for ext in (".onnx", ".onnx.json"):
        dest = os.path.join(ROOT, "voices", name + ext)
        print("downloading", base + ext)
        urllib.request.urlretrieve(base + ext, dest)
    print("saved to voices/" + name + ".onnx")


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--voice", help="path to a Piper .onnx voice")
    ap.add_argument("--download", metavar="VOICE", help="download a Piper voice by name, e.g. en_US-ryan-high")
    ap.add_argument("--rate", type=float, default=1.08, help="length scale: >1 slower (default 1.08, good for kids)")
    ap.add_argument("--force", action="store_true", help="re-record everything")
    a = ap.parse_args()
    if a.download:
        download(a.download)
        if not a.voice: return
    if not a.voice: ap.error("--voice is required")
    piper = shutil.which("piper") or [sys.executable, "-m", "piper"]
    ffmpeg = shutil.which("ffmpeg")
    os.makedirs(OUT, exist_ok=True)
    mpath = os.path.join(OUT, "manifest.json")
    manifest = json.load(open(mpath)) if os.path.exists(mpath) and not a.force else {}
    items = list(lines()); made = 0
    for id_, text in items:
        h = djb2(text)
        if manifest.get(id_, {}).get("hash") == h and os.path.exists(os.path.join(OUT, manifest[id_]["file"])):
            continue
        with tempfile.TemporaryDirectory() as td:
            wav = os.path.join(td, "x.wav")
            exe = [piper] if isinstance(piper, str) else piper
            ok = False
            for flags in (["--length_scale", str(a.rate), "--sentence_silence", "0.35", "--output_file", wav],   # piper-tts 1.2
                          ["--length-scale", str(a.rate), "--sentence-silence", "0.35", "--output-file", wav]):  # piper 1.3+
                r = subprocess.run(exe + ["--model", a.voice] + flags, input=text.encode(), stdout=subprocess.DEVNULL, stderr=subprocess.PIPE)
                if r.returncode == 0 and os.path.exists(wav): ok = True; break
            if not ok: sys.exit("piper failed: " + r.stderr.decode(errors="ignore")[-400:])
            if ffmpeg:
                fname = f"{id_}.mp3"
                subprocess.run([ffmpeg, "-y", "-loglevel", "error", "-i", wav, "-af", "apad=pad_dur=0.3", "-codec:a", "libmp3lame", "-q:a", "4", os.path.join(OUT, fname)], check=True)
            else:
                fname = f"{id_}.wav"; shutil.copy(wav, os.path.join(OUT, fname))
        manifest[id_] = {"file": fname, "hash": h}; made += 1
        print(f"  ✓ {id_}")
    write_manifest(manifest)
    print(f"Done: {made} recorded, {len(items) - made} unchanged. Manifest: audio/narration/manifest.json")


if __name__ == "__main__":
    main()
