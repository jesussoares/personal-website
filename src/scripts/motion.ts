import Lenis from 'lenis';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------- Floating nav gets a background once we scroll ---------- */
const nav = document.querySelector<HTMLElement>('[data-nav]');
if (nav) {
  ScrollTrigger.create({
    start: 'top -40',
    onToggle: ({ isActive }) => {
      // Solid instead of backdrop-blur: blurring the live WebGL canvas behind it every frame is expensive
      nav.classList.toggle('bg-white/90', isActive);
      nav.classList.toggle('border-line', isActive);
      nav.classList.toggle('shadow-[0_8px_30px_rgba(0,0,0,0.04)]', isActive);
    },
  });
}

/* ---------- Copy email ---------- */
document.querySelectorAll<HTMLButtonElement>('[data-copy-email]').forEach((button) => {
  const original = button.textContent;
  button.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(button.dataset.copyEmail!);
      button.textContent = `${button.dataset.copiedLabel} ✓`;
      setTimeout(() => (button.textContent = original), 1800);
    } catch {}
  });
});

if (!reduceMotion) {
  /* ---------- Smooth scroll ---------- */
  const lenis = new Lenis({ anchors: true, lerp: 0.1 });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((time) => lenis.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);

  /* ---------- Hero intro ---------- */
  gsap.from('[data-hero-in]', {
    autoAlpha: 0,
    y: 24,
    filter: 'blur(8px)',
    duration: 1.2,
    ease: 'expo.out',
    stagger: 0.1,
    delay: 0.15,
  });

  /* ---------- Hero scrollytelling (particles are driven from the same scroll range) ---------- */
  gsap
    .timeline({
      scrollTrigger: { trigger: '#hero', start: 'top top', end: 'bottom bottom', scrub: 0.3 },
      defaults: { ease: 'power2.inOut' },
    })
    // transform/opacity only: animating filter on full-screen layers over the canvas tanks the frame rate
    .to('[data-stage="0"]', { autoAlpha: 0, y: -40, duration: 0.3 }, 0)
    .to('[data-scroll-hint]', { autoAlpha: 0, duration: 0.1 }, 0)
    .fromTo('[data-stage="1"]', { autoAlpha: 0, y: 20 }, { autoAlpha: 1, y: 0, duration: 0.2 }, 0.55)
    .to({}, { duration: 0.25 }, 0.75);

  // Once the pin releases, the caption fades out while the particles disperse.
  // Targets the inner wrapper so it never overwrites the pinned timeline's fade-in.
  gsap.fromTo(
    '[data-stage-exit]',
    { autoAlpha: 1, y: 0 },
    {
      autoAlpha: 0,
      y: -30,
      ease: 'none',
      immediateRender: false,
      scrollTrigger: { trigger: '#hero', start: 'bottom bottom', end: 'bottom 70%', scrub: 0.3 },
    },
  );

  /* ---------- Section reveals ---------- */
  ScrollTrigger.batch('[data-reveal]', {
    start: 'top 88%',
    once: true,
    onEnter: (els) => gsap.to(els, { autoAlpha: 1, y: 0, duration: 1, ease: 'expo.out', stagger: 0.08 }),
  });
}
