#!/usr/bin/env python3
from __future__ import annotations

import shutil
import subprocess
from pathlib import Path

from PIL import Image, ImageDraw


BRAND_PRIMARY = (0x2D, 0xD4, 0xBF)  # #2DD4BF
BRAND_SECONDARY = (0x81, 0x8C, 0xF8)  # #818CF8


def lerp(a: int, b: int, t: float) -> int:
    return int(round(a + (b - a) * t))


def make_diagonal_gradient(size: int) -> Image.Image:
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    px = img.load()
    denom = float(2 * (size - 1))

    for y in range(size):
        for x in range(size):
            t = (x + y) / denom
            r = lerp(BRAND_PRIMARY[0], BRAND_SECONDARY[0], t)
            g = lerp(BRAND_PRIMARY[1], BRAND_SECONDARY[1], t)
            b = lerp(BRAND_PRIMARY[2], BRAND_SECONDARY[2], t)
            px[x, y] = (r, g, b, 255)

    return img


def draw_k_mark(img: Image.Image) -> None:
    size = img.size[0]
    draw = ImageDraw.Draw(img)

    # Tuned to look like the in-app gradient "K" mark.
    stroke = int(size * 0.115)
    x0 = int(size * 0.37)
    x1 = int(size * 0.73)
    y0 = int(size * 0.22)
    y1 = int(size * 0.78)
    ym = int((y0 + y1) / 2)

    shadow_offset = int(size * 0.02)
    shadow = (0, 0, 0, 70)
    white = (255, 255, 255, 245)

    # Subtle shadow for depth (helps at small sizes).
    draw.line([(x0 + shadow_offset, y0 + shadow_offset), (x0 + shadow_offset, y1 + shadow_offset)],
              fill=shadow, width=stroke)
    draw.line([(x0 + shadow_offset, ym + shadow_offset), (x1 + shadow_offset, y0 + shadow_offset)],
              fill=shadow, width=stroke)
    draw.line([(x0 + shadow_offset, ym + shadow_offset), (x1 + shadow_offset, y1 + shadow_offset)],
              fill=shadow, width=stroke)

    # Main "K"
    draw.line([(x0, y0), (x0, y1)], fill=white, width=stroke)
    draw.line([(x0, ym), (x1, y0)], fill=white, width=stroke)
    draw.line([(x0, ym), (x1, y1)], fill=white, width=stroke)


def write_png(base: Image.Image, path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    base.save(path, format="PNG", optimize=True)


def write_ico(base: Image.Image, path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    sizes = [16, 24, 32, 48, 64, 128, 256]
    base.save(path, format="ICO", sizes=[(s, s) for s in sizes])


def write_icns(base: Image.Image, out_path: Path, iconset_dir: Path) -> None:
    if iconset_dir.exists():
        shutil.rmtree(iconset_dir)
    iconset_dir.mkdir(parents=True, exist_ok=True)

    # macOS iconset convention
    mapping: dict[str, int] = {
        "icon_16x16.png": 16,
        "icon_16x16@2x.png": 32,
        "icon_32x32.png": 32,
        "icon_32x32@2x.png": 64,
        "icon_128x128.png": 128,
        "icon_128x128@2x.png": 256,
        "icon_256x256.png": 256,
        "icon_256x256@2x.png": 512,
        "icon_512x512.png": 512,
        "icon_512x512@2x.png": 1024,
    }

    for filename, size in mapping.items():
        resized = base.resize((size, size), resample=Image.Resampling.LANCZOS)
        resized.save(iconset_dir / filename, format="PNG", optimize=True)

    out_path.parent.mkdir(parents=True, exist_ok=True)
    subprocess.run(
        ["iconutil", "-c", "icns", str(iconset_dir), "-o", str(out_path)],
        check=True,
    )

    shutil.rmtree(iconset_dir)


def main() -> int:
    repo_root = Path(__file__).resolve().parents[1]
    assets_dir = repo_root / "assets"
    app_assets_dir = repo_root / "src" / "KorProxy" / "Assets"

    png_path = assets_dir / "KorProxy.png"
    ico_path = assets_dir / "KorProxy.ico"
    icns_path = assets_dir / "KorProxy.icns"
    iconset_dir = assets_dir / "KorProxy.iconset"

    # Render high-res icon once, then downsample.
    base = make_diagonal_gradient(1024)
    draw_k_mark(base)

    write_png(base, png_path)
    write_ico(base, ico_path)
    write_icns(base, icns_path, iconset_dir)

    # Keep the Windows app icon in the Avalonia project in sync.
    app_assets_dir.mkdir(parents=True, exist_ok=True)
    (app_assets_dir / "KorProxy.ico").write_bytes(ico_path.read_bytes())

    print(f"Wrote {png_path}")
    print(f"Wrote {ico_path}")
    print(f"Wrote {icns_path}")
    print(f"Synced {app_assets_dir / 'KorProxy.ico'}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

