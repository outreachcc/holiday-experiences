"""Convert espeak-ng phonemes (what kokoro-onnx produces) into the phoneme alphabet Kokoro was trained on
(misaki). Without this, sounds like j, ch, ay, eye, ow, oy and oh are fed to the model as two separate symbols,
which makes words such as "joy" and "rejoiced" come out oddly."""
import re

COMMON = [("dʒ", "ʤ"), ("tʃ", "ʧ"), ("eɪ", "A"), ("aɪ", "I"), ("aʊ", "W"), ("ɔɪ", "Y"),
          ("ɐ", "ə"), ("r", "ɹ"), ("x", "k"), ("ç", "k"), ("ɬ", "l")]


def to_misaki(ps, british=False):
    for a, b in COMMON:
        ps = ps.replace(a, b)
    if british:
        ps = ps.replace("əʊ", "Q").replace("oʊ", "Q")
    else:
        ps = ps.replace("oʊ", "O").replace("əʊ", "O")
        ps = ps.replace("ɚ", "əɹ")
        ps = re.sub(r"ɜː?(?!ɹ)", "ɜɹ", ps)   # American r-coloured "er"
        ps = ps.replace("ː", "")            # American voices were trained without length marks
        ps = ps.replace("ɾ", "T")           # flap t ("water")
    return ps
