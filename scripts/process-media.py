"""Builds web-ready media from the client folders and media-src/.

- Client photos -> src/assets/** (slugged, max 2400px) so astro:assets can make AVIF/WebP srcsets
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


def copy_image(src, dst, max_w=2400):
    os.makedirs(os.path.dirname(dst), exist_ok=True)
    im = Image.open(src)
    im = im.convert('RGB')
    if im.width > max_w:
        im = im.resize((max_w, round(im.height * max_w / im.width)), Image.LANCZOS)
    im.save(dst, 'JPEG', quality=90, optimize=True, progressive=True)


def photos():
    # Applications (8)
    for f in os.listdir(os.path.join(ROOT, 'aplicaciones')):
        copy_image(os.path.join(ROOT, 'aplicaciones', f), os.path.join(ASSETS, 'applications', slug(os.path.splitext(f)[0]) + '.jpg'))
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
                copy_image(os.path.join(d, f), os.path.join(ASSETS, 'scenes', slug(os.path.splitext(f)[0]) + '.jpg'))
    print('  photos copied to src/assets')


if __name__ == '__main__':
    import sys
    what = set(sys.argv[1:]) or {'posters', 'photos'}
    if 'posters' in what:
        poster('legacy', 'legacy.mp4')
    if 'photos' in what:
        photos()
