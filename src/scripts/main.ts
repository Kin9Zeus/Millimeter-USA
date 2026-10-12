// Site-wide interaction layer. Every effect is progressive: content is readable without JS.
// <html data-motion="on|off"> is set before first paint by /motion-mode.js (footer switch, Save-Data).
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import Lenis from 'lenis';
import { Sequence } from './sequence';

gsap.registerPlugin(ScrollTrigger, SplitText);

const root = document.documentElement;
// A late load may have tripped the failsafe; if the visitor did not choose "off", turn motion back on.
if (root.dataset.motionFailsafe === '1') { root.dataset.motion = 'on'; delete root.dataset.motionFailsafe; }
root.dataset.motionReady = '1';
const reduce = root.dataset.motion === 'off';
const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
const $ = <T extends Element = HTMLElement>(s: string, r: ParentNode = document) => r.querySelector<T>(s);
const $$ = <T extends Element = HTMLElement>(s: string, r: ParentNode = document) => Array.from(r.querySelectorAll<T>(s));

const whenIdle = (fn: () => void) => {
  const run = () => ('requestIdleCallback' in window ? requestIdleCallback(fn, { timeout: 2500 }) : setTimeout(fn, 600));
  if (document.readyState === 'complete') run(); else addEventListener('load', run, { once: true });
};

/* ---------------- smooth scroll ---------------- */
let lenis: Lenis | null = null;
// Touch devices keep native (momentum) scrolling; Lenis only smooths wheel/trackpad input.
if (!reduce && finePointer) {
  lenis = new Lenis({ lerp: 0.09, wheelMultiplier: 0.95, smoothWheel: true });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((time) => lenis!.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);
  addEventListener('mm:lock', () => lenis!.stop());
  addEventListener('mm:unlock', () => lenis!.start());
}
// In-page anchors go through Lenis so the offset under the fixed header is respected.
document.addEventListener('click', (e) => {
  const a = (e.target as HTMLElement).closest<HTMLAnchorElement>('a[href^="#"]');
  if (!a) return;
  const id = a.getAttribute('href')!.slice(1);
  const el = id ? document.getElementById(id) : null;
  if (!el) return;
  e.preventDefault();
  if (lenis) lenis.scrollTo(el, { offset: id === 'main' ? 0 : -80, duration: 1.4 });
  else el.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' });
  if (id === 'main') (el as HTMLElement).focus({ preventScroll: true });
});

/* ---------------- reveals ---------------- */
// Chrome intersects against the target's clip-path, so a fully clipped element (inset 100%) would never
// "enter": clip reveals are observed through their parent instead.
const revealOf = new Map<Element, HTMLElement[]>();
const io = new IntersectionObserver(
  (entries) => entries.forEach((en) => {
    if (!en.isIntersecting) return;
    revealOf.get(en.target)?.forEach((el) => el.classList.add('is-in'));
    io.unobserve(en.target);
  }),
  { rootMargin: '0px 0px -8% 0px', threshold: 0.08 },
);
$$('[data-reveal]').forEach((el) => {
  const target = el.dataset.reveal === 'clip' && el.parentElement ? el.parentElement : el;
  revealOf.set(target, [...(revealOf.get(target) ?? []), el]);
  io.observe(target);
});

/** Run `fn` once when `el` comes within `margin` of the viewport (lazy, per-section setup). */
function near(el: Element, fn: () => void, margin = '60% 0px') {
  const o = new IntersectionObserver((es) => { if (es.some((e) => e.isIntersecting)) { o.disconnect(); fn(); } }, { rootMargin: margin });
  o.observe(el);
}

// Line-by-line headline reveals: split just before the heading arrives, animate on entry, then restore the DOM.
function splitLines() {
  if (reduce) return;
  $$('[data-split]').forEach((el) => {
    near(el, () => {
      const split = SplitText.create(el, { type: 'lines', mask: 'lines', linesClass: 'split-l', aria: 'none' });
      gsap.set(split.lines, { yPercent: 110 });
      near(el, () => gsap.to(split.lines, {
        yPercent: 0, duration: 1.15, ease: 'expo.out', stagger: 0.09, onComplete: () => split.revert(),
      }), '0px 0px -12% 0px');
    });
  });
}

// Word-by-word "ink" reading effect. Words go from muted (still AA contrast) to full ink.
function inkWords() {
  if (reduce) return;
  $$('[data-ink]').forEach((el) => {
    near(el, () => {
      const split = SplitText.create(el, { type: 'words', aria: 'none' });
      const from = getComputedStyle(document.body).getPropertyValue('--muted-light').trim() || '#6b6258';
      gsap.fromTo(split.words, { color: from }, {
        color: 'inherit', ease: 'none', stagger: 0.05,
        scrollTrigger: { trigger: el, start: 'top 82%', end: 'bottom 45%', scrub: true },
      });
    }, '100% 0px');
  });
}

/* ---------------- counters ---------------- */
function counters() {
  $$('[data-count]').forEach((el) => {
    const to = parseFloat(el.dataset.count!);
    const dec = parseInt(el.dataset.dec || '0', 10);
    const prefix = el.dataset.prefix || '';
    const suffix = el.dataset.suffix || '';
    const fmt = (v: number) => prefix + v.toFixed(dec).replace('.', el.dataset.comma ? ',' : '.') + suffix;
    if (reduce) { el.textContent = fmt(to); return; }
    const obj = { v: parseFloat(el.dataset.from || '0') };
    near(el, () => {
      el.textContent = fmt(obj.v);
      near(el, () => gsap.to(obj, { v: to, duration: 2, ease: 'power3.out', onUpdate: () => (el.textContent = fmt(obj.v)) }), '0px 0px -15% 0px');
    }, '30% 0px');
  });
}

/* ---------------- bars (weight comparison) ---------------- */
function bars() {
  $$('[data-bar]').forEach((el) => {
    const r = parseFloat(el.dataset.bar!);
    if (reduce) return; // inline style already shows the final ratio
    near(el, () => {
      gsap.set(el, { scaleX: 0 });
      near(el, () => gsap.to(el, { scaleX: r, duration: 1.8, ease: 'expo.out' }), '0px 0px -12% 0px');
    }, '30% 0px');
  });
}

/* ---------------- parallax ---------------- */
function parallax() {
  if (reduce) return;
  $$('[data-parallax]').forEach((el) => {
    near(el, () => {
      const amt = parseFloat(el.dataset.parallax || '0.12');
      gsap.fromTo(el, { yPercent: -amt * 100 }, { yPercent: amt * 100, ease: 'none',
        scrollTrigger: { trigger: el.parentElement!, start: 'top bottom', end: 'bottom top', scrub: true } });
    }, '50% 0px');
  });
}

/* ---------------- media heroes: image push-in / frames while the sticky hero scrolls ---------------- */
function heroes() {
  $$('[data-mh]').forEach((hero) => {
    const img = $('[data-mh-img]', hero);
    const content = $('[data-mh-content]', hero);
    const side = $('[data-mh-side]', hero);
    const canvas = $<HTMLCanvasElement>('[data-mh-seq]', hero);
    if (reduce) return;
    let seq: Sequence | null = null;
    if (canvas) {
      seq = new Sequence(canvas, canvas.dataset.mhSeq!, () => hero.classList.add('has-seq'));
      whenIdle(() => seq!.start());
    }
    const tl = gsap.timeline({
      defaults: { ease: 'none' },
      scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom bottom', scrub: 0.6,
        onUpdate: seq ? (st) => seq!.set(st.progress) : undefined },
    });
    if (img) tl.fromTo(img, { scale: 1.16, yPercent: 0 }, { scale: 1, yPercent: -3, duration: 1 }, 0);
    if (side) tl.to(side, { opacity: 0.25, duration: 0.7 }, 0.3);
    if (content) tl.to(content, { y: -70, opacity: 0, duration: 0.45, ease: 'power1.in' }, 0.55);
  });
}

/* ---------------- scroll-played footage outside heroes (never looped) ---------------- */
function scrubSequences() {
  if (reduce) return;
  $$<HTMLCanvasElement>('[data-scrub-seq]').forEach((canvas) => {
    const box = canvas.parentElement!;
    near(box, () => {
      const seq = new Sequence(canvas, canvas.dataset.scrubSeq!, () => box.classList.add('has-seq'));
      seq.start();
      ScrollTrigger.create({ trigger: box, start: 'top bottom', end: 'bottom top', scrub: 0.5, onUpdate: (st) => seq.set(st.progress) });
    }, '80% 0px');
  });
}

/* ---------------- curvature: pinned wipe from bare column to clad column ---------------- */
function curve() {
  const root = $('[data-curve]');
  if (!root) return;
  const steps = $$('[data-step]', root);
  const clad = $('[data-curve-after]', root);
  if (reduce) { steps.forEach((s) => s.classList.add('is-on')); return; }
  const meter = $('[data-curve-meter]', root);
  const setStep = (p: number) => {
    const i = Math.min(steps.length - 1, Math.floor(p * steps.length * 0.999));
    steps.forEach((s, j) => s.classList.toggle('is-on', j === i));
    meter?.style.setProperty('--p', p.toFixed(3));
  };
  ScrollTrigger.create({
    trigger: root, start: 'top top', end: () => '+=' + innerHeight * 1.6, pin: true, scrub: 0.5,
    onUpdate: (st) => {
      setStep(st.progress);
      // The marble cladding "rises" up the column as you scroll.
      const k = Math.min(1, Math.max(0, (st.progress - 0.1) / 0.75));
      if (clad) clad.style.clipPath = `inset(${(1 - k) * 100}% 0 0 0)`;
    },
  });
  setStep(0);
}

/* ---------------- horizontal applications gallery (desktop) ---------------- */
function hscroll() {
  const root = $('[data-hscroll]');
  if (!root || reduce) return;
  const track = $('[data-track]', root)!;
  const counter = $('[data-hcount]', root);
  const mm = gsap.matchMedia();
  mm.add('(min-width: 901px)', () => {
    const dist = () => track.scrollWidth - innerWidth;
    const tween = gsap.to(track, {
      x: () => -dist(), ease: 'none',
      scrollTrigger: {
        trigger: root, start: 'top top', end: () => '+=' + dist(), pin: true, scrub: 0.6, invalidateOnRefresh: true, anticipatePin: 1,
        onUpdate: (st) => counter && (counter.style.transform = `scaleX(${st.progress})`),
      },
    });
    $$('[data-hcard] img', root).forEach((img) => {
      gsap.fromTo(img, { scale: 1.18 }, { scale: 1, ease: 'none',
        scrollTrigger: { trigger: img, containerAnimation: tween, start: 'left right', end: 'right left', scrub: true } });
    });
  });
}

/* ---------------- stone library: cursor-following preview ---------------- */
function library() {
  const root = $('[data-library]');
  if (!root) return;
  const preview = $('[data-preview]', root);
  const rows = $$<HTMLElement>('[data-swatch]', root);
  if (!preview || !finePointer) return;
  const imgs = $$<HTMLElement>('[data-pimg]', preview);
  const xTo = gsap.quickTo(preview, 'x', { duration: 0.6, ease: 'power3' });
  const yTo = gsap.quickTo(preview, 'y', { duration: 0.6, ease: 'power3' });
  root.addEventListener('pointermove', (e) => {
    const r = root.getBoundingClientRect();
    xTo(e.clientX - r.left); yTo(e.clientY - r.top);
  });
  rows.forEach((row) => {
    const show = () => {
      preview.classList.add('is-on');
      imgs.forEach((im) => im.classList.toggle('is-on', im.dataset.pimg === row.dataset.swatch));
    };
    row.addEventListener('pointerenter', show);
    row.addEventListener('focusin', show);
  });
  root.addEventListener('pointerleave', () => preview.classList.remove('is-on'));
}

/* ---------------- filters (materials page) ---------------- */
function filters() {
  const bar = $('[data-filters]');
  if (!bar) return;
  const items = $$<HTMLElement>('[data-kind]');
  bar.addEventListener('click', (e) => {
    const b = (e.target as HTMLElement).closest<HTMLButtonElement>('button[data-filter]');
    if (!b) return;
    $$('button[data-filter]', bar).forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
    const f = b.dataset.filter!;
    items.forEach((it) => { it.hidden = f !== 'all' && it.dataset.kind !== f; });
    const live = $('[data-filter-live]');
    if (live) live.textContent = `${items.filter((i) => !i.hidden).length}`;
    ScrollTrigger.refresh();
  });
}

/* ---------------- ambient videos: play only while visible ---------------- */
function videos() {
  const vids = $$<HTMLVideoElement>('video[data-autoplay]');
  if (reduce) return;
  const vio = new IntersectionObserver((entries) => entries.forEach((en) => {
    const v = en.target as HTMLVideoElement;
    if (en.isIntersecting) {
      if (!v.dataset.ready) {
        $$<HTMLSourceElement>('source[data-src]', v).forEach((s) => { s.src = s.dataset.src!; });
        v.load(); v.dataset.ready = '1';
      }
      v.play().catch(() => {});
    } else v.pause();
  }), { rootMargin: '200px 0px' });
  vids.forEach((v) => vio.observe(v));
}

/* ---------------- cursor + magnetic buttons ---------------- */
function cursor() {
  if (!finePointer || reduce) return;
  const c = $('.cursor');
  if (!c) return;
  const label = $('.cursor__label', c)!;
  const xTo = gsap.quickTo(c, 'x', { duration: 0.35, ease: 'power3' });
  const yTo = gsap.quickTo(c, 'y', { duration: 0.35, ease: 'power3' });
  addEventListener('pointermove', (e) => { c.classList.add('is-on'); xTo(e.clientX - c.offsetWidth / 2); yTo(e.clientY - c.offsetHeight / 2); }, { passive: true });
  document.addEventListener('pointerleave', () => c.classList.remove('is-on'));
  document.addEventListener('pointerover', (e) => {
    const t = (e.target as HTMLElement).closest<HTMLElement>('[data-cursor]');
    c.classList.toggle('is-big', !!t);
    label.textContent = t?.dataset.cursor || '';
  });

  $$('[data-magnetic]').forEach((el) => {
    const xm = gsap.quickTo(el, 'x', { duration: 0.6, ease: 'elastic.out(1, 0.4)' });
    const ym = gsap.quickTo(el, 'y', { duration: 0.6, ease: 'elastic.out(1, 0.4)' });
    el.addEventListener('pointermove', (e) => {
      const r = el.getBoundingClientRect();
      xm((e.clientX - r.left - r.width / 2) * 0.25); ym((e.clientY - r.top - r.height / 2) * 0.35);
    });
    el.addEventListener('pointerleave', () => { xm(0); ym(0); });
  });
}

/* ---------------- boot ---------------- */
const yieldToMain = () => new Promise<void>((r) => setTimeout(r, 0));
async function boot() {
  // Pinned sections first, in page order, so later triggers measure the page with pin spacing in place.
  // Yield between steps so no single task blocks input for long.
  heroes();
  await yieldToMain();
  hscroll();
  await yieldToMain();
  curve();
  await yieldToMain();
  // Below-the-fold effects: set up after first paint, then re-measure.
  whenIdle(rest);
}
async function rest() {
  splitLines();
  inkWords();
  scrubSequences();
  bars();
  counters();
  await yieldToMain();
  library();
  filters();
  parallax();
  videos();
  cursor();
  document.fonts?.ready.then(() => ScrollTrigger.refresh());
  // Sections with content-visibility:auto settle their real height when first rendered: re-measure (debounced).
  let rt = 0, lastH = document.body.offsetHeight;
  new ResizeObserver(() => {
    const h = document.body.offsetHeight;
    if (Math.abs(h - lastH) < 2) return;
    lastH = h; clearTimeout(rt); rt = window.setTimeout(() => ScrollTrigger.refresh(), 300);
  }).observe(document.body);
}
boot();
