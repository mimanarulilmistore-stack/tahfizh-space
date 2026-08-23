#!/usr/bin/env python3
"""
Olah logo PNG transparan untuk header Tahfizh Space (white-label).

Menghasilkan 3 file di public/:
  - {slug}-source.png   (500×500, transparan, hasil trim + resize)
  - {slug}-on-light.png (sama, untuk latar terang / favicon)
  - {slug}-on-dark.png  (teks/gelap → putih+emas, untuk login/admin)

Contoh:
  python3 scripts/process-brand-logo.py public/logo-rtmi-makassar-source.png

  python3 scripts/process-brand-logo.py /path/Logo\\ MI\\ Makassar.png \\
    --slug logo-rtmi-makassar --size 500
"""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

from PIL import Image

OUTPUT_SIZE = 500


def luminance(r: int, g: int, b: int) -> float:
    return 0.299 * r + 0.587 * g + 0.114 * b


def is_gold(r: int, g: int, b: int) -> bool:
    return r > 140 and g > 100 and b < 130 and r >= g >= b


def to_dark_pixel(r: int, g: int, b: int, a: int) -> tuple[int, int, int, int]:
    """Peta piksel logo terang → varian kontras untuk latar gelap."""
    if a < 8:
        return (0, 0, 0, 0)

    lum = luminance(r, g, b)

    if is_gold(r, g, b):
        # Emas lebih terang & pekat (mirip logo MIO on-dark)
        return (255, min(255, int(g * 1.08 + 20)), max(90, int(b * 0.85 + 40)), min(255, a + 40))

    if lum < 115 or max(r, g, b) < 105:
        # Teks hitam, hijau gelap, navy → putih solid
        return (255, 255, 255, min(255, a + 60))

    if lum > 210:
        # Gradasi putih/abu di dalam bintang — biarkan agak redup di dark UI
        return (min(255, r), min(255, g), min(255, b), max(0, a - 20))

    if g > r + 15 and g > b + 15:
        # Hijau medium → putih agar terbaca di header gelap
        return (255, 255, 255, min(255, a + 50))

    return (255, 255, 255, min(255, a + 40))


def fit_square(img: Image.Image, size: int) -> Image.Image:
    """Trim transparan, lalu muat proporsional di kotak size×size."""
    if img.mode != "RGBA":
        img = img.convert("RGBA")

    bbox = img.getbbox()
    if bbox:
        img = img.crop(bbox)

    w, h = img.size
    scale = min(size / w, size / h)
    new_w = max(1, int(w * scale))
    new_h = max(1, int(h * scale))
    resized = img.resize((new_w, new_h), Image.Resampling.LANCZOS)

    canvas = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    ox = (size - new_w) // 2
    oy = (size - new_h) // 2
    canvas.paste(resized, (ox, oy), resized)
    return canvas


def make_dark_variant(img: Image.Image) -> Image.Image:
    px = img.load()
    out = img.copy()
    opx = out.load()
    for y in range(img.height):
        for x in range(img.width):
            opx[x, y] = to_dark_pixel(*px[x, y])
    return out


def derive_slug(source: Path, explicit: str | None) -> str:
    if explicit:
        return explicit.removeprefix("/").removesuffix(".png")
    stem = source.stem
    for suffix in ("-source", "_source", " source"):
        if stem.endswith(suffix.replace(" ", "")):
            stem = stem[: -len(suffix.replace(" ", ""))]
    if stem.lower().startswith("logo "):
        stem = "logo-" + stem[5:].strip().lower().replace(" ", "-")
    return stem


def main() -> int:
    parser = argparse.ArgumentParser(description="Proses logo PNG transparan untuk Tahfizh Space")
    parser.add_argument("source", type=Path, help="File PNG sumber (transparan)")
    parser.add_argument("--slug", help="Awalan nama file output, mis. logo-rtmi-makassar")
    parser.add_argument("--size", type=int, default=OUTPUT_SIZE, help="Ukuran output persegi (px)")
    parser.add_argument("--out-dir", type=Path, default=Path("public"), help="Folder output")
    args = parser.parse_args()

    if not args.source.is_file():
        print(f"ERROR: file tidak ditemukan: {args.source}", file=sys.stderr)
        return 1

    slug = derive_slug(args.source, args.slug)
    out_dir = args.out_dir
    out_dir.mkdir(parents=True, exist_ok=True)

    raw = Image.open(args.source)
    fitted = fit_square(raw, args.size)
    on_light = fitted.copy()
    on_dark = make_dark_variant(fitted)

    paths = {
        "source": out_dir / f"{slug}-source.png",
        "on_light": out_dir / f"{slug}-on-light.png",
        "on_dark": out_dir / f"{slug}-on-dark.png",
    }

    fitted.save(paths["source"], optimize=True)
    on_light.save(paths["on_light"], optimize=True)
    on_dark.save(paths["on_dark"], optimize=True)

    print("Logo siap:")
    for key, path in paths.items():
        print(f"  [{key}] /{path.name}")
    print("\nEnv Vercel (contoh Makassar):")
    print(f"  NEXT_PUBLIC_LOGO_URL=/{paths['on_light'].name}")
    print(f"  NEXT_PUBLIC_LOGO_ON_LIGHT=/{paths['on_light'].name}")
    print(f"  NEXT_PUBLIC_LOGO_ON_DARK=/{paths['on_dark'].name}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
