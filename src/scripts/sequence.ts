// Canvas frame-sequence player for scroll-scrubbed video (more reliable than seeking <video> on iOS/Android).
// Frames: /media/seq/<name>/<d|m>/NNN.webp, built by scripts/video-frames.py (npm run frames).


export class Sequence {
  private ctx: CanvasRenderingContext2D;
  private frames: (HTMLImageElement | null)[];
  private loaded: boolean[];
  private variant: 'd' | 'm';
  private count: number;
  private current = -1;
  private progress = 0;
  private started = false;
  private ro: ResizeObserver;

  constructor(private canvas: HTMLCanvasElement, private name: string, private onFirst?: () => void) {
    // Frame counts come from the markup (MediaHero counts the files at build time).
    this.ctx = canvas.getContext('2d', { alpha: false })!;
    const portrait = window.matchMedia('(max-aspect-ratio: 4/5)').matches;
    const cd = Number(canvas.dataset.countD || 0), cm = Number(canvas.dataset.countM || 0);
    this.variant = (portrait && cm) || !cd ? 'm' : 'd';
    this.count = this.variant === 'm' ? cm : cd;
    this.frames = new Array(this.count).fill(null);
    this.loaded = new Array(this.count).fill(false);
    this.ro = new ResizeObserver(() => this.resize());
    this.ro.observe(canvas);
    this.resize();
  }

  private src(i: number) {
    return `${import.meta.env.BASE_URL.replace(/\/$/, '')}/media/seq/${this.name}/${this.variant}/${String(i + 1).padStart(3, '0')}.webp`;
  }

  /** Progressive loading: first, last, then coarse-to-fine passes so scrubbing works early. */
  start() {
    if (this.started) return;
    this.started = true;
    const order: number[] = [0, this.count - 1];
    for (const step of [16, 8, 4, 2, 1]) {
      for (let i = 0; i < this.count; i += step) if (!order.includes(i)) order.push(i);
    }
    let inflight = 0;
    const MAX = 6;
    const next = () => {
      while (inflight < MAX && order.length) {
        const i = order.shift()!;
        inflight++;
        const img = new Image();
        img.decoding = 'async';
        img.onload = () => {
          this.frames[i] = img; this.loaded[i] = true; inflight--;
          if (i === 0) { this.draw(true); this.onFirst?.(); }
          else if (Math.abs(i - this.target()) < 3) this.draw(true);
          next();
        };
        img.onerror = () => { inflight--; next(); };
        img.src = this.src(i);
      }
    };
    next();
  }

  private target() { return Math.round(this.progress * (this.count - 1)); }

  set(p: number) {
    this.progress = Math.min(1, Math.max(0, p));
    this.draw();
  }

  private nearest(i: number) {
    if (this.loaded[i]) return i;
    for (let k = 1; k < this.count; k++) {
      if (this.loaded[i - k]) return i - k;
      if (this.loaded[i + k]) return i + k;
    }
    return -1;
  }

  private resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const { width, height } = this.canvas.getBoundingClientRect();
    if (!width || !height) return;
    this.canvas.width = Math.round(width * dpr);
    this.canvas.height = Math.round(height * dpr);
    this.draw(true);
  }

  private draw(force = false) {
    const i = this.nearest(this.target());
    if (i < 0 || (i === this.current && !force)) return;
    this.current = i;
    const img = this.frames[i]!;
    const { width: cw, height: ch } = this.canvas;
    const s = Math.max(cw / img.naturalWidth, ch / img.naturalHeight);
    const w = img.naturalWidth * s, h = img.naturalHeight * s;
    this.ctx.drawImage(img, (cw - w) / 2, (ch - h) / 2, w, h);
  }

  destroy() { this.ro.disconnect(); }
}
