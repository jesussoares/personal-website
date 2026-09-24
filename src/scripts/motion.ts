import Lenis from 'lenis';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------- Floating nav turns into a glass pill once we scroll ---------- */
const nav = document.querySelector<HTMLElement>('[data-nav]');
if (nav) {
  ScrollTrigger.create({
    start: 'top -40',
    onToggle: ({ isActive }) => {
      nav.classList.toggle('bg-white/75', isActive);
      nav.classList.toggle('backdrop-blur-xl', isActive);
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
      scrollTrigger: { trigger: '#hero', start: 'top top', end: 'bottom bottom', scrub: 0.5 },
      defaults: { ease: 'power2.inOut' },
    })
    .to('[data-stage="0"]', { autoAlpha: 0, y: -40, filter: 'blur(8px)', duration: 0.2 }, 0.04)
    .to('[data-scroll-hint]', { autoAlpha: 0, duration: 0.08 }, 0)
    .fromTo('[data-stage="1"]', { autoAlpha: 0, y: 20 }, { autoAlpha: 1, y: 0, duration: 0.12 }, 0.4)
    .to('[data-stage="1"]', { autoAlpha: 0, y: -20, duration: 0.1 }, 0.7)
    .to({}, { duration: 0.2 }, 0.8);

  /* ---------- Section reveals ---------- */
  ScrollTrigger.batch('[data-reveal]', {
    start: 'top 88%',
    once: true,
    onEnter: (els) => gsap.to(els, { autoAlpha: 1, y: 0, duration: 1, ease: 'expo.out', stagger: 0.08 }),
  });
}
