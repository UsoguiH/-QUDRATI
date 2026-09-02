# -*- coding: utf-8 -*-
"""Run one of قدّور's arm edits through the OpenAI images edit API, then make the
result honest.

Why not just take what the API returns: the model re-renders the WHOLE picture, and
the parts outside the mask come back close to the original, not identical. And it
returns a fixed size (1536x1024 here), not the drawing's 1361x1156. Either one would
put the face at a slightly different place in every body, and the face rig needs them
all to line up.

So this script:
  1. pads the drawing and the mask to the API's aspect ratio (cream fill / keep),
  2. calls /v1/images/edits with the exact mask from tools/mascot_masks.py,
  3. resizes the answer back and crops the padding off,
  4. composites ONLY the hole region onto the untouched original --
     everything outside the mask is then byte-identical by construction,
  5. writes a side-by-side (original | raw answer | composite) to look at.

Needs OPENAI_API_KEY in the environment or in a .env file at the repo root
(KEY=VALUE; .env is gitignored). Uses curl, which every machine here has.

    python tools/mascot_edit.py down
    python tools/mascot_edit.py up --model gpt-image-1 --quality high
"""
import argparse, base64, json, os, subprocess, sys, tempfile
import numpy as np
from PIL import Image

ROOT  = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
EDITS = os.path.join(ROOT, "assets", "mascot", "edits")
DOC   = os.path.join(ROOT, "MASCOT-EDITS.md")
BG    = (251, 238, 221)
API   = "https://api.openai.com/v1/images/edits"

def api_key():
    k = os.environ.get("OPENAI_API_KEY")
    if k: return k
    env = os.path.join(ROOT, ".env")
    if os.path.exists(env):
        for line in open(env, encoding="utf-8"):
            line = line.strip()
            if line.startswith("OPENAI_API_KEY="):
                return line.split("=", 1)[1].strip().strip('"').strip("'")
    sys.exit("No OPENAI_API_KEY in the environment or in .env")

def prompt_for(pose):
    """The prompt lives in MASCOT-EDITS.md, once. Pull the fenced block under its heading."""
    md = open(DOC, encoding="utf-8").read()
    head = f"`{pose}`"
    i = md.find(head)
    if i < 0: sys.exit(f"no section for {pose} in MASCOT-EDITS.md")
    a = md.find("```\n", i) + 4
    b = md.find("\n```", a)
    return md[a:b].strip()

def pad_to(img, W, H, fill):
    """Centre img on a W x H canvas of `fill`. Returns (canvas, x_off, y_off)."""
    w, h = img.size
    canvas = Image.new("RGBA", (W, H), fill)
    x, y = (W - w) // 2, (H - h) // 2
    canvas.paste(img, (x, y))
    return canvas, x, y

def main():
    sys.stdout.reconfigure(encoding="utf-8")   # the prompt echo has em-dashes; the console default mangles them
    ap = argparse.ArgumentParser()
    ap.add_argument("pose", choices=["down", "up", "book"])
    ap.add_argument("--model", default="gpt-image-1")
    ap.add_argument("--quality", default="high", choices=["low", "medium", "high", "auto"])
    ap.add_argument("--size", default="1536x1024", help="API output size; sets the padding aspect")
    ap.add_argument("--no-fidelity", action="store_true", help="omit input_fidelity=high if the model rejects it")
    ap.add_argument("--dry", action="store_true", help="prepare files and print the request, no call")
    ap.add_argument("--from", dest="src", help="skip the API: composite this hand-made result (e.g. saved from ChatGPT)")
    a = ap.parse_args()

    base = Image.open(os.path.join(EDITS, "qaddour-base.png")).convert("RGBA")
    mask = Image.open(os.path.join(EDITS, f"mask-{a.pose}.png")).convert("RGBA")
    W, H = base.size

    if a.src:
        # a browser tool returns its own size; assume it kept the framing and scale back.
        # The drift number printed at the end says whether that assumption held.
        back = Image.open(a.src).convert("RGBA").resize((W, H), Image.LANCZOS)
        finish(a.pose, base, mask, back, W, H, src=a.src)
        return

    ow, oh = map(int, a.size.split("x"))

    # pad to the output aspect: the API scales the padded frame to ow x oh uniformly
    if W / H < ow / oh: PW, PH = round(H * ow / oh), H        # add columns
    else:               PW, PH = W, round(W * oh / ow)        # add rows
    pbase, x0, y0 = pad_to(base, PW, PH, BG + (255,))
    pmask, _, _   = pad_to(mask, PW, PH, (0, 0, 0, 255))      # padding is "keep"

    tmp = tempfile.mkdtemp(prefix="qaddour-")
    pb, pm, pp = os.path.join(tmp, "base.png"), os.path.join(tmp, "mask.png"), os.path.join(tmp, "prompt.txt")
    pbase.save(pb); pmask.save(pm)
    prompt = prompt_for(a.pose)
    # curl reads the field from the file (`<`), so the em-dashes and any Arabic never
    # pass through the Windows command line and its code page
    open(pp, "w", encoding="utf-8").write(prompt)

    print(f"{a.pose}: padded {W}x{H} -> {PW}x{PH} (offset {x0},{y0}); model {a.model}, {a.size}, {a.quality}")
    if a.dry:
        print("prompt:\n" + prompt); print("files:", pb, pm); return

    cmd = ["curl", "-sS", API, "-H", f"Authorization: Bearer {api_key()}",
           "-F", f"model={a.model}", "-F", f"image=@{pb}", "-F", f"mask=@{pm}",
           "-F", f"prompt=<{pp}", "-F", f"size={a.size}", "-F", f"quality={a.quality}", "-F", "n=1"]
    if not a.no_fidelity: cmd += ["-F", "input_fidelity=high"]

    out = subprocess.run(cmd, capture_output=True, text=True)
    if out.returncode != 0: sys.exit("curl failed: " + out.stderr)
    try:
        js = json.loads(out.stdout)
    except json.JSONDecodeError:
        sys.exit("not JSON:\n" + out.stdout[:800])
    if "error" in js: sys.exit("API error: " + json.dumps(js["error"], ensure_ascii=False, indent=2))

    raw = Image.open(__import__("io").BytesIO(base64.b64decode(js["data"][0]["b64_json"]))).convert("RGBA")
    raw.save(os.path.join(EDITS, f"raw-{a.pose}.png"))

    # back to the drawing's own frame
    back = raw.resize((PW, PH), Image.LANCZOS).crop((x0, y0, x0 + W, y0 + H))
    finish(a.pose, base, mask, back, W, H, src="API")

def finish(pose, base, mask, back, W, H, src):
    """Composite the hole from `back` onto the untouched original, prove it, picture it."""
    hole = (np.asarray(mask.split()[3]) == 0)
    comp = np.asarray(base).copy()
    comp[hole] = np.asarray(back)[hole]
    result = Image.fromarray(comp, "RGBA")
    out_path = os.path.join(EDITS, f"qaddour-{pose}.png")
    result.save(out_path)

    # proof, and a picture to judge the arm and the seam by
    diff = np.abs(comp[~hole].astype(int) - np.asarray(base)[~hole].astype(int)).max()
    drift = np.abs(np.asarray(back)[~hole].astype(int) - np.asarray(base)[~hole].astype(int)).mean()
    print(f"wrote {out_path}  size {result.size}")
    print(f"outside the mask: composite max diff = {diff}   ({src} answer had drifted {drift:.1f}/255 on average"
          + ("" if drift < 12 else " -- HIGH: the framing did not match, the arm is probably misplaced too") + ")")
    strip = Image.new("RGB", (W * 3 + 40, H), BG)
    for i, im in enumerate((base, back, result)):
        strip.paste(im.convert("RGB"), (i * (W + 20), 0))
    strip.thumbnail((1800, 1800))
    strip.save(os.path.join(EDITS, f"compare-{pose}.png"))
    print(f"compare-{pose}.png: original | answer | composite")

if __name__ == "__main__":
    main()
