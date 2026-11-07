#!/usr/bin/env python3
"""
Record the narration and character voices with Kokoro (free, open-source, runs offline).

Who speaks what is set in js/content.js:
  "cast"   : character -> Kokoro voice   (e.g. "mary": "af_bella"; blends: "am_michael+am_fenrir"; a list = choir)
  verse "voice": which character reads that verse (default: narrator)
  verse "speak": split a verse between speakers, e.g. [["narrator","And the angel said unto her,"],["gabriel","Fear not, Mary..."]]
  "clips"  : short extra lines (the innkeepers)
Verse references ("Luke 2, verse 7") are always read by the narrator.

Setup (Python 3.10-3.12):
    pip install "misaki[en]" kokoro-onnx soundfile
    python -m spacy download en_core_web_sm
    python3 tools/make_narration_kokoro.py --download     # once: ~350 MB model from GitHub into voices/
    python3 tools/make_narration_kokoro.py                # records only new/changed lines (or changed voices)
    python3 tools/make_narration_kokoro.py --force        # re-record everything

misaki is Kokoro's own pronunciation dictionary; without it the tool falls back to espeak with a converter,
which works but is less accurate.
Voices: af_heart af_bella af_sarah af_nicole bf_emma (female) · am_michael am_fenrir am_puck bm_george bm_fable (male)
"""
import argparse, hashlib, json, os, re, shutil, subprocess, sys, tempfile, urllib.request

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from make_narration import djb2, spoken_ref, load_story, write_manifest, OUT, ROOT  # same ids + hashes as the app
from kokoro_phonemes import to_misaki

MODEL_URL = "https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0/"
MODEL_DIR = os.path.join(ROOT, "voices")
SR = 24000

# Pronunciation fixes. Each: (pattern, exact phonemes for misaki, respelling for the espeak fallback).
# Captions keep the real spelling. Phonemes use Kokoro's alphabet (A=ay, I=eye, O=oh, W=ow, Y=oy, ʤ=j).
SAY_AS = [
    (r"\bImmanuel\b", "ɪmˈænjuˌɛl", "Im-manual"),   # "ih-MAN-you-el" (dictionary says "im-AN-ool")
    (r"\bGO\b", "ɡˈO", "go"),                        # the GO button, not "G. O."
    (r"\bbowed\b", "bˈWd", "boughed"),              # bowed down (not a bow and arrow)
    (r"\b([A-Z]{2,})\b", None, None),                # other ALL-CAPS words (e.g. JESUS) read as words
]


def speakable(text, misaki=True):
    for pat, phon, spell in SAY_AS:
        if phon is None:
            text = re.sub(pat, lambda m: m.group(1).capitalize(), text)
        elif misaki:
            text = re.sub(pat, lambda m: f"[{m.group(0)}](/{phon}/)", text)
        else:
            text = re.sub(pat, spell, text)
    return text


# ---------------------------------------------------------------- what to record
def jobs(story):
    """Yield (id, display_text_for_hash, [segments]) where segment = (speaker, text, kind)."""
    for st in story["stations"]:
        for i, step in enumerate(st["steps"]):
            base = f"{st['id']}.{i}"
            if step.get("say"):
                yield base + ".say", step["say"], [("narrator", step["say"], "story")]
            v = step.get("verse")
            if v:
                parts = v.get("speak") or [[v.get("voice", "narrator"), v["text"]]]
                segs = [(who, txt, "scripture") for who, txt in parts]
                segs.append(("narrator", spoken_ref(v["ref"]), "ref"))
                yield base + ".verse", v["text"] + " " + spoken_ref(v["ref"]), segs
            if step.get("after"):
                yield base + ".after", step["after"], [("narrator", step["after"], "story")]
    for cid, clip in (story.get("clips") or {}).items():
        yield cid, clip["text"], [(clip.get("voice", "narrator"), clip["text"], "dialog")]


def take_key(segs, cast, speeds):
    """Changes whenever the voices or pacing for a line change, so it gets re-recorded."""
    spec = [(cast.get(who, who), kind) for who, _, kind in segs]
    return hashlib.sha1(json.dumps([spec, speeds]).encode()).hexdigest()[:10]


# ---------------------------------------------------------------- phonemes
class Phonemizer:
    def __init__(self):
        self.g2p = {}
        try:
            from misaki import en, espeak
            for brit in (False, True):
                self.g2p[brit] = en.G2P(trf=False, british=brit, fallback=espeak.EspeakFallback(british=brit))
            self.kind = "misaki"
        except Exception as e:
            self.kind = "espeak (install misaki for better pronunciation: %s)" % e.__class__.__name__

    def __call__(self, k, text, british):
        text = speakable(text, misaki=bool(self.g2p))
        if self.g2p:
            ps, _ = self.g2p[british](text)
            return ps
        # espeak fallback, word by word so short words aren't merged ("I am" -> "Iam")
        lang = "en-gb" if british else "en-us"
        out = ""
        for tok in re.findall(r"[A-Za-z0-9'\-]+|[.,!?;:]", text):
            if re.match(r"[.,!?;:]", tok):
                out = out.rstrip() + tok + " "
            else:
                out += to_misaki(k.tokenizer.phonemize(tok, lang).strip(), british) + " "
        return out.strip()


# ---------------------------------------------------------------- audio helpers
def trim(a, thresh=0.01):
    import numpy as np
    idx = np.where(np.abs(a) > thresh)[0]
    if not len(idx):
        return a
    pad = int(SR * 0.04)
    return a[max(0, idx[0] - pad): min(len(a), idx[-1] + pad)]


def silence(sec):
    import numpy as np
    return np.zeros(int(SR * sec), dtype="float32")


def stretch(a, target_len):
    """Time-stretch (keeping pitch) so choir voices line up with the lead."""
    import numpy as np, soundfile as sf
    if abs(len(a) - target_len) < SR * 0.05:
        return np.pad(a, (0, max(0, target_len - len(a))))[:target_len]
    ratio = len(a) / target_len
    with tempfile.TemporaryDirectory() as td:
        i, o = os.path.join(td, "i.wav"), os.path.join(td, "o.wav")
        sf.write(i, a, SR)
        chain = []
        r = ratio
        while r > 2: chain.append("atempo=2"); r /= 2
        while r < 0.5: chain.append("atempo=0.5"); r /= 0.5
        chain.append(f"atempo={r:.5f}")
        subprocess.run(["ffmpeg", "-y", "-v", "error", "-i", i, "-af", ",".join(chain), o], check=True)
        b, _ = sf.read(o, dtype="float32")
    return np.pad(b, (0, max(0, target_len - len(b))))[:target_len]


def reverb(a, wet=0.35):
    import numpy as np
    out = np.concatenate([a, silence(1.2)])
    for delay, g in ((0.043, .5), (0.071, .4), (0.113, .32), (0.167, .25), (0.239, .18), (0.331, .12), (0.45, .08)):
        d = int(SR * delay)
        out[d:d + len(a)] += a * g * wet
    return trim(out / max(1e-6, np.max(np.abs(out))) * 0.95, 0.002)


class Voices:
    def __init__(self, k, cast):
        self.k, self.cast, self.cache = k, cast, {}

    def style(self, name):
        if name not in self.cache:
            if "+" in name:   # blend, e.g. am_michael+am_fenrir
                parts = name.split("+")
                self.cache[name] = sum(self.k.get_voice_style(p) for p in parts) / len(parts)
            else:
                self.cache[name] = self.k.get_voice_style(name)
        return self.cache[name]


def speak(k, voices, ph, voice_name, text, speed):
    """One voice, sentence by sentence with natural pauses."""
    import numpy as np
    british = voice_name.split("+")[0].startswith("b")
    sents = [x for x in re.split(r"(?<=[.!?])\s+", text.strip()) if x]
    out = []
    for n, sent in enumerate(sents):
        a, _ = k.create(ph(k, sent, british), voice=voices.style(voice_name), speed=speed, is_phonemes=True)
        out.append(trim(a))
        if n < len(sents) - 1:
            out.append(silence(0.5))
    return np.concatenate(out)


def render(k, voices, ph, cast, segs, speeds):
    import numpy as np
    out = []
    for n, (who, text, kind) in enumerate(segs):
        spec = cast.get(who, cast.get("narrator", "af_heart"))
        speed = speeds["verse"] if kind == "scripture" else speeds["dialog"] if kind == "dialog" else speeds["story"]
        if isinstance(spec, list):   # choir: lead + others stretched to match, then a little echo
            lead = speak(k, voices, ph, spec[0], text, speed)
            mix = lead.copy()
            for j, other in enumerate(spec[1:]):
                b = stretch(speak(k, voices, ph, other, text, speed), len(lead))
                d = int(SR * 0.012 * (j + 1))
                mix[d:] += 0.45 * b[:len(mix) - d]
            audio = reverb(mix / max(1e-6, np.max(np.abs(mix))), wet=0.3)
        else:
            audio = speak(k, voices, ph, spec, text, speed)
        if n:
            out.append(silence(0.75 if kind == "ref" else 0.55))
        out.append(audio.astype("float32"))
    return np.concatenate(out)


def download(dest_dir):
    os.makedirs(dest_dir, exist_ok=True)
    for f in ("kokoro-v1.0.onnx", "voices-v1.0.bin"):
        dest = os.path.join(dest_dir, f)
        if not os.path.exists(dest):
            print("downloading", f); urllib.request.urlretrieve(MODEL_URL + f, dest)
    print("model files in", dest_dir)


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--speed", type=float, default=0.8, help="story pace (0.8 ≈ 150 words/min)")
    ap.add_argument("--verse-speed", type=float, default=0.75, help="Scripture pace, a touch slower")
    ap.add_argument("--dialog-speed", type=float, default=0.9, help="short character lines (innkeepers)")
    ap.add_argument("--models", default=MODEL_DIR, help="folder holding kokoro-v1.0.onnx and voices-v1.0.bin")
    ap.add_argument("--download", action="store_true")
    ap.add_argument("--force", action="store_true", help="re-record everything")
    ap.add_argument("--only", help="comma list of ids to (re)record, e.g. promise.2.verse")
    a = ap.parse_args()
    if a.download:
        download(a.models)
    import soundfile as sf
    from kokoro_onnx import Kokoro
    k = Kokoro(os.path.join(a.models, "kokoro-v1.0.onnx"), os.path.join(a.models, "voices-v1.0.bin"))
    story = load_story()
    cast = story.get("cast") or {"narrator": "af_heart"}
    speeds = {"story": a.speed, "verse": a.verse_speed, "dialog": a.dialog_speed}
    ph = Phonemizer()
    print("pronunciation:", ph.kind)
    voices = Voices(k, cast)
    ffmpeg = shutil.which("ffmpeg")
    os.makedirs(OUT, exist_ok=True)
    mpath = os.path.join(OUT, "manifest.json")
    manifest = {} if a.force else (json.load(open(mpath)) if os.path.exists(mpath) else {})
    only = set(a.only.split(",")) if a.only else None
    items = list(jobs(story)); made = 0
    for id_, display, segs in items:
        h, key = djb2(display), take_key(segs, cast, speeds) + ph.kind[:6]
        if only is not None and id_ not in only:
            continue
        e = manifest.get(id_, {})
        if only is None and e.get("hash") == h and e.get("take") == key and os.path.exists(os.path.join(OUT, e.get("file", ""))):
            continue
        audio = render(k, voices, ph, cast, segs, speeds)
        with tempfile.TemporaryDirectory() as td:
            wav = os.path.join(td, "x.wav"); sf.write(wav, audio, SR)
            if ffmpeg:
                fname = f"{id_}.mp3"
                subprocess.run([ffmpeg, "-y", "-loglevel", "error", "-i", wav, "-af", "adelay=150,apad=pad_dur=0.35",
                                "-codec:a", "libmp3lame", "-q:a", "3", os.path.join(OUT, fname)], check=True)
            else:
                fname = f"{id_}.wav"; shutil.copy(wav, os.path.join(OUT, fname))
        speakers = "+".join(dict.fromkeys(who for who, _, _ in segs))
        manifest[id_] = {"file": fname, "hash": h, "take": key, "voice": speakers}
        made += 1
        print(f"  ✓ {id_:22} {speakers:18} ({len(audio) / SR:.1f}s)", flush=True)
        write_manifest(manifest)
    write_manifest(manifest)
    print(f"Done: {made} recorded, {len(items) - made} unchanged.")


if __name__ == "__main__":
    main()
