#!/usr/bin/env python3
"""
Build public/images/philosophy-hands.jpg from Michelangelo's Creation of Adam.

Source: Wikimedia Commons, "'Adam's Creation Sistine Chapel ceiling' by
Michelangelo JBU33cut.jpg" (4492x2000, the panel alone at the highest
resolution Commons carries). Michelangelo died in 1564, so the fresco is
public domain; Commons hosts the photograph as public domain too.

Usage:  python3 scripts/grade-philosophy-image.py [path-to-source.jpg]
        (downloads the source if no path is given)

Requires Pillow and numpy.
"""
import sys
import urllib.request
from pathlib import Path

import numpy as np
from PIL import Image, ImageFilter, ImageOps

SRC_URL = (
    "https://upload.wikimedia.org/wikipedia/commons/3/30/"
    "%27Adam%27s_Creation_Sistine_Chapel_ceiling%27_by_Michelangelo_JBU33cut.jpg"
)
OUT = Path("public/images/philosophy-hands.jpg")

# Tight 16:9 window on the touching hands: both forearms reach in from the
# edges and nothing else is in frame. A wider crop pulls in Adam's torso and
# the ring of angels, which buries the gesture that is the whole point.
# Coordinates are in source pixels.
CENTER = (1714, 880)
CROP = (1420, 799)
SIZE = (1920, 1080)


def load(path: str | None) -> Image.Image:
    if path:
        return Image.open(path).convert("RGB")
    req = urllib.request.Request(SRC_URL, headers={"User-Agent": "portfolio-build/1.0"})
    with urllib.request.urlopen(req, timeout=180) as r:
        tmp = Path("/tmp/creation-of-adam.jpg")
        tmp.write_bytes(r.read())
    return Image.open(tmp).convert("RGB")


def main() -> None:
    src = load(sys.argv[1] if len(sys.argv) > 1 else None)

    cx, cy = CENTER
    w, h = CROP
    im = src.crop((cx - w // 2, cy - h // 2, cx + w // 2, cy + h // 2))
    im = im.resize(SIZE, Image.LANCZOS)

    lum = np.asarray(ImageOps.autocontrast(im.convert("L"), cutoff=1), np.float32) / 255

    # Frequency separation. The fresco is five centuries of craquelure and
    # patched plaster; a straight tone map turns every crack into a bright red
    # line and the whole thing reads as dirty. Split the smooth forms from the
    # fine detail, keep most of the former and only a trace of the latter.
    base = np.asarray(
        Image.fromarray((lum * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(7)),
        np.float32,
    ) / 255
    detail = lum - base
    clean = np.clip(base + detail * 0.42, 0, 1)

    # Gentle S-curve rather than a hard gamma, so the arms keep their modelling
    # without crushing the surrounding wall into mud.
    b = np.clip(clean, 0, 1)
    b = b * b * (3 - 2 * b)
    b = np.power(b, 1.25)

    # Soft vignette centred on the touching fingertips.
    yy, xx = np.mgrid[0 : SIZE[1], 0 : SIZE[0]].astype(np.float32)
    d = np.sqrt(((xx - SIZE[0] / 2) / 1150) ** 2 + ((yy - SIZE[1] / 2) / 720) ** 2)
    b *= np.clip(1.06 - 0.62 * d**1.8, 0.08, 1.0)
    b = np.clip(b * 1.04, 0, 1)

    # Ember ramp, matching the site's --color-ember / --color-vibrant-orange.
    stops = np.array([0.00, 0.25, 0.50, 0.72, 0.88, 1.00], np.float32)
    cols = np.array(
        [[6, 4, 5], [58, 12, 10], [126, 25, 20], [180, 42, 32], [217, 71, 52], [248, 145, 110]],
        np.float32,
    )
    out = np.stack([np.interp(b, stops, cols[:, i]) for i in range(3)], -1)

    img = Image.fromarray(np.clip(out, 0, 255).astype(np.uint8))
    # The crop is enlarged to fill a 1080p frame, so restore a little bite.
    img = img.filter(ImageFilter.UnsharpMask(radius=2.2, percent=58, threshold=4))

    OUT.parent.mkdir(parents=True, exist_ok=True)
    img.save(OUT, quality=90, optimize=True, progressive=True)
    print(f"wrote {OUT} ({OUT.stat().st_size // 1024} KB)")


if __name__ == "__main__":
    main()
