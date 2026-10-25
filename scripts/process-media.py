"""Builds web-ready media from the client folders and media-src/.

- Client photos -> src/assets/** (slugged, max 2400px) so astro:assets can make AVIF/WebP srcsets
- Client corrections (Oct 2026) -> heroes, applications, scenes and drawings (CORRECTIONS map)
- Poster stills for scroll sequences -> public/media/video/<name>-poster.webp
Scroll frame sequences themselves are built by scripts/video-frames.py (npm run frames).

Usage: npm run media   (requires ffmpeg on PATH and Pillow)
Original client folders are read-only: this script never writes to them.
"""
import os, re, subprocess, unicodedata
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC_VIDEO = os.path.join(ROOT, 'media-src', 'video')
PUB = os.path.join(ROOT, 'public', 'media')
ASSETS = os.path.join(ROOT, 'src', 'assets')


def run(cmd):
    subprocess.run(cmd, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.PIPE)


def slug(s):
    s = unicodedata.normalize('NFKD', s).encode('ascii', 'ignore').decode()
    return re.sub(r'[^a-z0-9]+', '-', s.lower()).strip('-')


def poster(name, src, at=0.8):
    """Still frame shown behind a scroll sequence until its first frame is drawn (and when motion is off)."""
    out = os.path.join(PUB, 'video')
    os.makedirs(out, exist_ok=True)
    run(['ffmpeg', '-y', '-ss', str(at), '-i', os.path.join(SRC_VIDEO, src), '-frames:v', '1', '-vf', 'scale=1600:-2',
         '-c:v', 'libwebp', '-quality', '70', os.path.join(out, f'{name}-poster.webp')])
    print(f'  poster {name}')


def copy_image(src, dst, max_w=2400, crop=None):
    os.makedirs(os.path.dirname(dst), exist_ok=True)
    im = Image.open(src)
    im = im.convert('RGB')
    if crop:
        im = im.crop(crop)
    if im.width > max_w:
        im = im.resize((max_w, round(im.height * max_w / im.width)), Image.LANCZOS)
    im.save(dst, 'JPEG', quality=90, optimize=True, progressive=True)


def photos():
    # Applications: originals from aplicaciones/. Feature walls and fireplaces were retired (review 21-oct: kitchens and
    # bathrooms come from CORRECTIONS); the shower is the full-height-slab still in media-src/images/duchas.png.
    RETIRED = {'muros', 'chimeneas', 'duchas'}
    for f in os.listdir(os.path.join(ROOT, 'aplicaciones')):
        k = slug(os.path.splitext(f)[0])
        if k not in RETIRED:
            copy_image(os.path.join(ROOT, 'aplicaciones', f), os.path.join(ASSETS, 'applications', k + '.jpg'))
    shower = os.path.join(ROOT, 'media-src', 'images', 'duchas.png')
    if os.path.exists(shower):
        copy_image(shower, os.path.join(ASSETS, 'applications', 'duchas.jpg'))
    # Materials: canonical 12 + extra swatches from the mixed folder
    for f in os.listdir(os.path.join(ROOT, 'materiales')):
        copy_image(os.path.join(ROOT, 'materiales', f), os.path.join(ASSETS, 'materials', slug(os.path.splitext(f)[0]) + '.jpg'), 1800)
    mixed = os.path.join(ROOT, 'fotos_y_recursos_mixtos')
    for f in os.listdir(mixed):
        base, ext = os.path.splitext(f)
        if ext.lower() not in ('.jpg', '.jpeg', '.png'):
            continue
        s = slug(base)
        if re.search(r'(marble|quartzite|travertine|terrazo)$', s) and 'bed' not in s:
            name = s
            copy_image(os.path.join(mixed, f), os.path.join(ASSETS, 'materials', 'x-' + name + '.jpg'), 1800)
        else:
            copy_image(os.path.join(mixed, f), os.path.join(ASSETS, 'photos', s + '.jpg'))
    copy_image(os.path.join(ROOT, 'equipo', 'jesus-casanova_main_pic.jpeg'), os.path.join(ASSETS, 'team', 'jesus-casanova.jpg'), 1600)
    # Art-directed scene stills (media-src/keyframes, media-src/images) -> src/assets/scenes
    for sub in ('keyframes', 'images'):
        d = os.path.join(ROOT, 'media-src', sub)
        if os.path.isdir(d):
            for f in os.listdir(d):
                if slug(os.path.splitext(f)[0]) == 'duchas':
                    continue
                copy_image(os.path.join(d, f), os.path.join(ASSETS, 'scenes', slug(os.path.splitext(f)[0]) + '.jpg'))
    print('  photos copied to src/assets')


# Client corrections, October 2026 (correcciones_millimeter_usa/, read-only). Each entry: source → asset.
# Runs after photos() so the approved replacements win over the original application photos.
CORRECTIONS = {
    'Portada/WhatsApp Image 2026-10-16 at 3.15.12 AM (1).jpeg': 'heroes/home',
    # Technology hero: the wide view of the kitchen (review 21-oct #5), cropped to drop the poster's title and logo.
    'Cocina 02/WhatsApp Image 2026-10-16 at 3.18.11 AM (2).jpeg': ('heroes/technology', (0, 300, 941, 1345)),
    # Applications: Kitchens and Bathrooms replace Fireplaces and Feature walls (review 21-oct #2).
    'Cocina 02/WhatsApp Image 2026-10-16 at 3.18.11 AM (1).jpeg': 'applications/cocinas',
    'Bathroom/WhatsApp Image 2026-10-16 at 3.16.57 AM (2).jpeg': 'applications/banos',
    'Cocina 03/WhatsApp Image 2026-10-16 at 3.17.28 AM (1).jpeg': 'heroes/materials',
    'Furnitures/WhatsApp Image 2026-10-16 at 3.19.22 AM (1).jpeg': 'applications/mobiliario',
    'Doors/WhatsApp Image 2026-10-16 at 3.19.21 AM (1).jpeg': 'applications/puertas',
    'Cantera/WhatsApp Image 2026-10-16 at 3.16.16 AM.jpeg': 'scenes/warehouse',
    'Cantera/WhatsApp Image 2026-10-16 at 7.08.43 AM.jpeg': 'scenes/quarry',
    'Closet/Sculptural marble and oak kitchen island 00.png': 'scenes/closet-island',
    'Vanity/WhatsApp Image 2026-10-16 at 3.14.27 AM (2).jpeg': 'scenes/vanity',
    'Gruesos/WhatsApp Image 2026-10-16 at 3.24.05 AM.jpeg': 'scenes/thin-sheet',
    'Design/WhatsApp Image 2026-10-16 at 3.16.57 AM.jpeg': 'drawings/01-freestanding-sink',
    'Design/WhatsApp Image 2026-10-16 at 3.17.28 AM.jpeg': 'drawings/02-cabinet-section',
    'Design/WhatsApp Image 2026-10-16 at 3.19.22 AM.jpeg': 'drawings/03-bedside-table',
    'Design/WhatsApp Image 2026-10-16 at 3.20.33 AM.jpeg': 'drawings/04-console',
    'Design/WhatsApp Image 2026-10-16 at 3.59.21 AM.jpeg': 'drawings/05-closet-island',
}


def corrections():
    base = os.path.join(ROOT, 'correcciones_millimeter_usa')
    if not os.path.isdir(base):
        print('  corrections: folder not found, skipped')
        return
    for src, dst in CORRECTIONS.items():
        dst, box = dst if isinstance(dst, tuple) else (dst, None)
        # Re-encoded without metadata (EXIF/GPS never reaches the site); never upscaled; optional crop box.
        copy_image(os.path.join(base, src), os.path.join(ASSETS, dst + '.jpg'), crop=box)
    print(f'  corrections: {len(CORRECTIONS)} images copied to src/assets')


if __name__ == '__main__':
    import sys
    what = set(sys.argv[1:]) or {'posters', 'photos', 'corrections'}
    if 'posters' in what:
        poster('legacy', 'legacy.mp4')
    if 'photos' in what:
        photos()
    if 'corrections' in what:
        corrections()
