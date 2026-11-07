#!/usr/bin/env python3
"""Build the holiday experiences.

  python build.py                 build dist/, then list the files to FTP since the last deploy
  python build.py --local         ...and copy dist/holidays into the local Apache folder (replaces sync.bat)
  python build.py --mark-deployed record dist/holidays as what's now on IONOS (run after you upload)

Output (dist/ is never committed):
  dist/<experience>/   a complete, standalone copy of each experience (what a Pi station runs)
  dist/holidays/       exactly what goes on the web host (holidays.theoutreachcc.com)

Shared files live once in shared/ and are copied into every experience at build time.
Needs only Python 3 (Windows or a Pi).
"""
import hashlib, json, os, shutil, sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent
EXP, SHARED, GATE, DIST = ROOT / "experiences", ROOT / "shared", ROOT / "holidays", ROOT / "dist"
DEPLOYED = ROOT / "deployed.json"
LOCAL_HOLIDAYS = Path(os.environ.get("HOLIDAYS_LOCAL", r"C:\Apache24\htdocs\outreach\holidays"))

WEB_PARTS = ["index.html", "css", "js", "fonts", "vendor", "audio"]   # what each holiday puts online
GATE_SKIP = {"README.md", "preview-key.example.php"}                  # never uploaded
KEEP_ON_PI = ["pi/venv", "pi/config.json"]                            # made by install.sh; survive rebuilds
IGNORE = shutil.ignore_patterns("__pycache__", "*.pyc", "*.bak")


def copy(src: Path, dst: Path):
    if src.is_dir():
        shutil.copytree(src, dst, dirs_exist_ok=True, ignore=IGNORE)
    else:
        dst.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(src, dst)


def build_experience(src: Path) -> Path:
    out = DIST / src.name
    keep = DIST / f".keep-{src.name}"
    if out.exists():
        for k in KEEP_ON_PI:                       # park the Pi's own files while we rebuild
            if (out / k).exists():
                copy(out / k, keep / k)
        shutil.rmtree(out)
    copy(src, out)
    for item in SHARED.iterdir():                  # shared/js/*.js -> js/, shared/fonts -> fonts/, ...
        copy(item, out / item.name)
    if keep.exists():
        for k in KEEP_ON_PI:
            if (keep / k).exists():
                copy(keep / k, out / k)
        shutil.rmtree(keep)
    return out


def build_holidays(exps):
    out = DIST / "holidays"
    if out.exists():
        shutil.rmtree(out)
    shutil.copytree(GATE, out, ignore=shutil.ignore_patterns(*GATE_SKIP, "__pycache__", "*.bak"))
    if not (GATE / "gate" / "preview-key.php").exists():
        print("  note: holidays/gate/preview-key.php not found (it's kept out of git); preview switch will be off")
    copy(SHARED / "fonts", out / "fonts")          # countdown pages
    for e in exps:
        for part in WEB_PARTS:
            if (e / part).exists():
                copy(e / part, out / e.name / part)
    return out


def hashes(folder: Path):
    return {p.relative_to(folder).as_posix(): hashlib.sha256(p.read_bytes()).hexdigest()
            for p in sorted(folder.rglob("*")) if p.is_file()}


def main(args):
    DIST.mkdir(exist_ok=True)
    exps = [build_experience(d) for d in sorted(EXP.iterdir()) if d.is_dir()]
    for e in exps:
        print(f"built dist/{e.name}/")
    web = build_holidays(exps)
    print("built dist/holidays/")
    now = hashes(web)

    if "--mark-deployed" in args:
        DEPLOYED.write_text(json.dumps(now, indent=1, sort_keys=True) + "\n")
        print(f"recorded {len(now)} files as deployed (deployed.json) - commit it")
        return

    if "--local" in args:
        if LOCAL_HOLIDAYS.exists():
            copy(web, LOCAL_HOLIDAYS)
            print(f"copied into {LOCAL_HOLIDAYS}")
        else:
            print(f"skipped --local: {LOCAL_HOLIDAYS} not found (set HOLIDAYS_LOCAL)")

    before = json.loads(DEPLOYED.read_text()) if DEPLOYED.exists() else {}
    changed = [f for f in now if before.get(f) != now[f]]
    gone = [f for f in before if f not in now]
    if not changed and not gone:
        print("\nNothing to upload: dist/holidays matches what's on IONOS.")
        return
    print(f"\nUpload to IONOS (from dist\\holidays\\, {len(changed)} file(s)):")
    for f in changed:
        print("  " + f)
    if gone:
        print("Delete from IONOS:")
        for f in gone:
            print("  " + f)
    print("\nAfter uploading: python build.py --mark-deployed, then commit.")


if __name__ == "__main__":
    main(sys.argv[1:])
