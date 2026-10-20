"""Turns media-src/video/hero-<page>.mp4 into scroll frame sequences used by MediaHero:
public/media/seq/<page>/d/NNN.webp (16:9, 1280 px) and /m/NNN.webp (9:16 crop, 640 px), at most 6 s.

    npm run frames                            # every hero video found
    python -I scripts/video-frames.py home    # just one
Requires ffmpeg on PATH and Pillow.
"""
import os, shutil, subprocess, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
VID = os.path.join(ROOT, 'media-src', 'video')
SEQ = os.path.join(ROOT, 'public', 'media', 'seq')
COUNT = 72          # frames per sequence
SECONDS = 6         # client rule: videos are at most 6 s and only advance with the scroll
# Extra sources that are not hero-<page>.mp4: page -> file in media-src/video
EXTRA = {'casanova': 'legacy.mp4'}
# Heroes that now show the client's still photograph in a split layout (Oct 2026 corrections): no sequence.
STILL = {'home', 'technology', 'materials'}
# Horizontal focus (0 = left, 1 = right) for the 9:16 mobile crop.
FOCUS = {'casanova': 0.78, 'technology': 0.36}
# Fewer frames for grainy footage (dust/film grain compresses poorly).
COUNTS = {'casanova': 48, 'materials': 40}
# Stronger denoise for speckled stone (granular texture compresses poorly).
DENOISE = {'materials': 'hqdn3d=8:8:8:8'}
Q_DROP = {'materials': 12}  # lower WebP quality where grain hides artefacts


def frames(page):
    src = os.path.join(VID, EXTRA.get(page, f'hero-{page}.mp4'))
    fx = FOCUS.get(page, 0.5)
    n = COUNTS.get(page, COUNT)
    dn = DENOISE.get(page, 'hqdn3d=3:3:5:5')
    qd = Q_DROP.get(page, 0)
    for variant, vf, q in (('d', f'{dn},scale=1280:-2:flags=lanczos', 56 - qd), ('m', f'{dn},crop=ih*9/16:ih:(iw-ow)*{fx}:0,scale=640:-2:flags=lanczos', 54 - qd)):
        out = os.path.join(SEQ, page, variant)
        shutil.rmtree(out, ignore_errors=True); os.makedirs(out)
        subprocess.run(['ffmpeg', '-y', '-v', 'error', '-i', src, '-t', str(SECONDS), '-vf', f'fps={n / SECONDS},{vf}', '-frames:v', str(n),
                        '-c:v', 'libwebp', '-quality', str(q), '-compression_level', '6', os.path.join(out, '%03d.webp')], check=True)
        size = sum(os.path.getsize(os.path.join(out, f)) for f in os.listdir(out)) / 1e6
        print(f'  {page}/{variant}: {len(os.listdir(out))} frames, {size:.1f} MB')


if __name__ == '__main__':
    found = {*(f[5:-4] for f in os.listdir(VID) if f.startswith('hero-') and f.endswith('.mp4')), *(k for k, v in EXTRA.items() if os.path.exists(os.path.join(VID, v)))}
    pages = sys.argv[1:] or sorted(found - STILL)
    for p in pages: frames(p)
