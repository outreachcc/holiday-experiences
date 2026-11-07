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
    (r"\bshew\b", "ʃˈO", "show"),                   # KJV "shew" is said "show"
    (r"\bPhilippi\b", "fəlˈɪpI", "fil-LIP-eye"),
    (r"\bSilas\b", "sˈIləs", "Sy-lus"),             # "SY-lus", not "SEE-lus"
    (r"\bhurting\b", "hˈɜɹtɪŋ", "hurt-ing"),        # clear "t" (it came out like "herting")
    (r"\beaten\b", "ˈitən", "ee-tun"),              # a full second syllable (Kokoro swallowed the "n": "eat")
    (r"\b([A-Z]{2,})\b", None, None),                # other ALL-CAPS words (e.g. JESUS) read as words
]


def speakable(text, misaki=True):
    if not misaki:   # the espeak fallback can't do stress marks: [Great](+2) -> Great
        text = re.sub(r"\[([^\]]+)\]\([+-]?[\d.]+\)", r"\1", text)
    for pat, phon, spell in SAY_AS:
        if phon is None:
            text = re.sub(pat, lambda m: m.group(1).capitalize(), text)
        elif misaki:
            text = re.sub(pat, lambda m: f"[{m.group(0)}](/{phon}/)", text)
        else:
            text = re.sub(pat, spell, text)
    return text


# ---------------------------------------------------------------- how a line is performed
# A verse can carry a "mood"; each speaker part in "speak" can also have its own: [who, text, spoken, mood].
# "spoken" is what the voice actually says (the screen always shows the real KJV text): it can add
# exclamation marks for energy and misaki stress marks such as [Great](+2) for emphasis.
#   speed = pace multiplier, pitch = pitch multiplier (1.05 ~ a bit brighter / more lifted)
MOODS = {
    "joy":     {"speed": 1.12, "pitch": 1.05},
    "excited": {"speed": 1.2,  "pitch": 1.07},
    "plea":    {"speed": 0.95, "pitch": 1.05},
    "awe":     {"speed": 0.9,  "pitch": 1.0},
    "sorrow":  {"speed": 0.86, "pitch": 0.97},
    "tender":  {"speed": 0.9,  "pitch": 0.99},
    "earnest": {"speed": 1.02, "pitch": 1.02},
    "doubt":   {"speed": 0.95, "pitch": 1.0},
    "cry":     {"speed": 1.08, "pitch": 1.0},    # people calling out urgently (the lepers)
    "warm":    {"speed": 0.98, "pitch": 1.02},
    "bright":  {"speed": 1.06, "pitch": 1.03},   # story lines that end with "!"
}


# ---------------------------------------------------------------- what to record
def jobs(story):
    """Yield (id, display_text_for_hash, [segments]) where segment = (speaker, spoken_text, kind, mood)."""
    def story_line(text):
        return [("narrator", text, "story", "bright" if text.rstrip().endswith("!") else None)]
    for st in story["stations"]:
        for i, step in enumerate(st["steps"]):
            base = f"{st['id']}.{i}"
            if step.get("say"):
                yield base + ".say", step["say"], story_line(step["say"])
            v = step.get("verse")
            if v:
                if v.get("speak"):
                    has_char = any(p[0] != "narrator" for p in v["speak"])
                    segs = []
                    for p in v["speak"]:
                        who, txt = p[0], p[1]
                        spoken = p[2] if len(p) > 2 and p[2] else txt
                        mood = p[3] if len(p) > 3 else (None if (who == "narrator" and has_char) else v.get("mood"))
                        segs.append((who, spoken, "scripture", mood))
                else:
                    segs = [(v.get("voice", "narrator"), v.get("spoken") or v["text"], "scripture", v.get("mood"))]
                segs.append(("narrator", spoken_ref(v["ref"]), "ref", None))
                yield base + ".verse", v["text"] + " " + spoken_ref(v["ref"]), segs
            if step.get("after"):
                yield base + ".after", step["after"], story_line(step["after"])
    for cid, clip in (story.get("clips") or {}).items():
        yield cid, clip["text"], [(clip.get("voice", "narrator"), clip["text"], "dialog", clip.get("mood"))]


def take_key(segs, cast, speeds):
    """Changes whenever the voices, pacing, mood or spoken wording for a line change, so it gets re-recorded."""
    spec = [(cast.get(who, who), kind, mood, MOODS.get(mood), txt) for who, txt, kind, mood in segs]
    return hashlib.sha1(json.dumps([spec, speeds, "v4"]).encode()).hexdigest()[:10]


def pitch_shift(a, factor):
    """Raise or lower the voice without changing its pace (ffmpeg rubberband)."""
    import numpy as np, soundfile as sf
    if abs(factor - 1) < 0.005:
        return a
    with tempfile.TemporaryDirectory() as td:
        i, o = os.path.join(td, "i.wav"), os.path.join(td, "o.wav")
        sf.write(i, a, SR)
        r = subprocess.run(["ffmpeg", "-y", "-v", "error", "-i", i, "-af", f"rubberband=pitch={factor}:formant=preserved", o])
        if r.returncode:   # older ffmpeg without rubberband: resample + tempo trick
            subprocess.run(["ffmpeg", "-y", "-v", "error", "-i", i, "-af", f"asetrate={int(SR * factor)},aresample={SR},atempo={1 / factor:.5f}", o], check=True)
        b, _ = sf.read(o, dtype="float32")
    return b


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
STRAY_HISS = [0]   # how many detached "s" bursts were removed (reported at the end)


HISSY = set("szʃʒfθʧʤtkpdbgT")   # sentences ending in these sounds really end with a hiss or a puff of air


def last_sound(ps):
    """Last two phonemes of a phoneme string, ignoring punctuation and stress marks. Two, because a word like
    "eaten" ("itn") ends with a puff of air from the t followed by a very soft n, which must not be trimmed."""
    out = ""
    for ch in reversed(ps):
        if ch.isalpha() or ch in "ʃʒθʧʤðŋɹɾʊɪɛæɔəɜʌ":
            out = ch + out
            if len(out) == 2:
                break
        elif out and ch == " ":
            break
    return out


def drop_stray_hiss(a, final=""):
    """Kokoro sometimes adds a short burst of hiss after a sentence's last word, separated by a little silence,
    which makes "nine?" sound like "nines?". Remove it. A real final "s" (lands, thanks, us) runs straight
    on from the word with no gap, so it is left alone."""
    import numpy as np
    if any(c in HISSY for c in final):
        return a
    fr = int(0.02 * SR); n = len(a) // fr
    if n < 6:
        return a
    f = np.fft.rfftfreq(fr, 1 / SR)
    info = []
    for i in range(n):
        X = np.abs(np.fft.rfft(a[i * fr:(i + 1) * fr])) ** 2
        info.append((X[(f > 80) & (f < 1500)].sum(), X[f > 3500].sum()))
    peak_lo = max(lo for lo, _ in info) or 1
    i = n - 1
    quiet = lambda k: info[k][0] < peak_lo * 0.01 and info[k][1] < peak_lo * 0.005
    hiss = lambda k: info[k][1] > info[k][0] * 0.5 and info[k][1] > peak_lo * 0.005
    while i > 0 and quiet(i): i -= 1                    # trailing silence
    end_hiss = i
    while i > 0 and hiss(i): i -= 1                     # the burst
    if end_hiss - i < 2:
        return a
    gap_end = i
    while i > 0 and quiet(i): i -= 1                    # the little gap before it
    if gap_end - i < 2:
        return a                                       # no gap: a real "s" at the end of a word
    cut = (i + 2) * fr
    b = a[:cut].copy()
    fade = min(len(b), int(0.015 * SR)); b[-fade:] *= np.linspace(1, 0, fade)
    STRAY_HISS[0] += 1
    return b


def lift_soft_ending(a):
    """Kokoro voices a final syllable that comes after a stop (the "-ten" of "eaten") very softly, so it can
    sound like "eat". If the last syllable after a short break is much quieter than the rest of the
    sentence, raise it (smoothly) until it is clearly heard."""
    import numpy as np
    fr = int(0.02 * SR); n = len(a) // fr
    if n < 20:
        return a
    rms = np.array([np.sqrt(np.mean(a[i * fr:(i + 1) * fr] ** 2)) for i in range(n)])
    peak = rms.max() or 1
    voiced = np.where(rms > peak * 0.06)[0]
    if not len(voiced):
        return a
    end = voiced[-1]
    i = end
    while i > 0 and rms[i] > peak * 0.06: i -= 1          # back through the last syllable to the break before it
    gap = i
    while i > 0 and rms[i] <= peak * 0.06: i -= 1
    if gap - i < 2 or end - gap < 4 or end - gap > 25:   # needs a real break, and a short final syllable
        return a
    level = np.sort(rms[gap + 1:end + 1])[-3:].mean()
    if level > peak * 0.55:
        return a
    gain = min(2.2, peak * 0.6 / max(level, 1e-6))
    env = np.ones(len(a), dtype="float32")
    s0 = (gap + 1) * fr; ramp = min(fr, len(a) - s0)
    env[s0:] = gain; env[s0:s0 + ramp] = np.linspace(1, gain, ramp)
    return np.clip(a * env, -1, 1)


def trim(a, thresh=0.01, final=None):
    import numpy as np
    if final is not None:
        a = drop_stray_hiss(a, final)
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
        ps = ph(k, sent, british)
        a, _ = k.create(ps, voice=voices.style(voice_name), speed=speed, is_phonemes=True)
        a = trim(a, final=last_sound(ps))
        if n == len(sents) - 1:
            a = lift_soft_ending(a)
        out.append(a)
        if n < len(sents) - 1:
            out.append(silence(0.5))
    return np.concatenate(out)


def render(k, voices, ph, cast, segs, speeds, timing=None):
    """timing (optional list) receives [speaker, start_s, end_s] for each part, so the film can move the right mouth."""
    import numpy as np
    out = []; pos = 0
    for n, (who, text, kind, mood) in enumerate(segs):
        spec = cast.get(who, cast.get("narrator", "af_heart"))
        speed = speeds["verse"] if kind == "scripture" else speeds["dialog"] if kind == "dialog" else speeds["story"]
        mo = MOODS.get(mood) or {"speed": 1, "pitch": 1}
        speed = speed * mo["speed"]
        if isinstance(spec, list):   # a crowd: one clear lead voice, the others quieter, further back and a beat behind
            parts = [speak(k, voices, ph, v, text, speed * (1, 0.95, 1.05, 0.98)[j % 4]) for j, v in enumerate(spec)]
            offs = [int(SR * d) for d in (0, 0.24, 0.38, 0.15)][:len(parts)]
            mix = np.zeros(max(o + len(p) for o, p in zip(offs, parts)), dtype="float32")
            for j, (o, p) in enumerate(zip(offs, parts)):
                if j:   # soften the background voices so they sound a few steps away
                    p = p.copy()
                    for n in range(1, len(p)): p[n] = p[n - 1] + 0.35 * (p[n] - p[n - 1])
                mix[o:o + len(p)] += p * (1.0, 0.42, 0.34, 0.3)[j % 4]
            audio = mix / max(1e-6, np.max(np.abs(mix))) * 0.95
        else:
            audio = speak(k, voices, ph, spec, text, speed)
            if who != "narrator" and kind != "dialog":    # narrator and short shouted lines keep their natural voice; characters get a gentle lift or drop
                audio = pitch_shift(audio, mo["pitch"])
        if n:
            gap = silence(0.75 if kind == "ref" else 0.55); out.append(gap); pos += len(gap)
        out.append(audio.astype("float32"))
        if timing is not None:
            timing.append([who, round(pos / SR, 2), round((pos + len(audio)) / SR, 2)])
        pos += len(audio)
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
        timing = []
        audio = render(k, voices, ph, cast, segs, speeds, timing)
        with tempfile.TemporaryDirectory() as td:
            wav = os.path.join(td, "x.wav"); sf.write(wav, audio, SR)
            if ffmpeg:
                fname = f"{id_}.mp3"
                subprocess.run([ffmpeg, "-y", "-loglevel", "error", "-i", wav, "-af", "adelay=150,apad=pad_dur=0.35",
                                "-codec:a", "libmp3lame", "-q:a", "3", os.path.join(OUT, fname)], check=True)
            else:
                fname = f"{id_}.wav"; shutil.copy(wav, os.path.join(OUT, fname))
        speakers = "+".join(dict.fromkeys(s[0] for s in segs))
        lead = 0.15 if fname.endswith(".mp3") else 0   # the mp3 starts with 150 ms of silence
        manifest[id_] = {"file": fname, "hash": h, "take": key, "voice": speakers,
                         "segs": [[w, round(a + lead, 2), round(b + lead, 2)] for w, a, b in timing]}
        made += 1
        print(f"  ✓ {id_:22} {speakers:18} ({len(audio) / SR:.1f}s)", flush=True)
        write_manifest(manifest)
    write_manifest(manifest)
    print(f"Done: {made} recorded, {len(items) - made} unchanged. Stray end-of-sentence hiss removed {STRAY_HISS[0]} times.")


if __name__ == "__main__":
    main()
