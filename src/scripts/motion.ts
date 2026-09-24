import Lenis from 'lenis';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------- Nav ---------- */
const header = document.querySelector<HTMLElement>('[data-nav-header]');
const nav = document.querySelector<HTMLElement>('[data-nav]');
const hero = document.getElementById('hero');

if (header && nav) {
  const setFlag = (el: HTMLElement, name: string, on: boolean) => el.toggleAttribute(`data-${name}`, on);

  // Transparent over the hero, a solid pill afterwards (solid, not backdrop-blur: blurring the live canvas is expensive)
  ScrollTrigger.create({
    trigger: hero ?? document.body,
    start: 'bottom 80px',
    end: 'max',
    onToggle: ({ isActive }) => setFlag(nav, 'solid', isActive),
  });

  // Past the hero: hide while scrolling down, reveal on the way up
  ScrollTrigger.create({
    start: 0,
    end: 'max',
    onUpdate: (self) => {
      const pastHero = !hero || self.scroll() > hero.offsetHeight;
      setFlag(header, 'hidden', pastHero && self.direction === 1);
    },
  });
  header.addEventListener('focusin', () => setFlag(header, 'hidden', false));
}

/* ---------- Nav indicator: follows the section in view, and the hovered link ---------- */
const linkList = document.querySelector<HTMLElement>('[data-nav-links]');
const indicator = document.querySelector<HTMLElement>('[data-nav-indicator]');
if (linkList && indicator) {
  const links = [...linkList.querySelectorAll<HTMLAnchorElement>('[data-nav-link]')];
  let active: HTMLAnchorElement | null = null;

  const moveTo = (link: HTMLAnchorElement | null) => {
    indicator.style.opacity = link ? '1' : '0';
    if (!link) return;
    const list = linkList.getBoundingClientRect();
    const box = link.getBoundingClientRect();
    indicator.style.left = `${box.left - list.left}px`;
    indicator.style.width = `${box.width}px`;
  };
  const setActive = (link: HTMLAnchorElement | null) => {
    active = link;
    links.forEach((l) => l.toggleAttribute('data-active', l === link));
    moveTo(link);
  };

  links.forEach((link) => {
    link.addEventListener('pointerenter', () => moveTo(link));
    const section = document.querySelector(link.hash);
    if (!section) return;
    ScrollTrigger.create({
      trigger: section,
      start: 'top 50%',
      end: 'bottom 50%',
      onToggle: ({ isActive }) => {
        if (isActive) setActive(link);
        else if (active === link) setActive(null);
      },
    });
  });
  linkList.addEventListener('pointerleave', () => moveTo(active));
}

/* ---------- Cursor-following glow on cards ---------- */
document.querySelectorAll<HTMLElement>('[data-spotlight]').forEach((el) => {
  el.addEventListener('pointermove', (e) => {
    const r = el.getBoundingClientRect();
    el.style.setProperty('--mx', `${e.clientX - r.left}px`);
    el.style.setProperty('--my', `${e.clientY - r.top}px`);
  });
});

/* ---------- Copy email ---------- */
// Sets data-copied briefly; the button's styles swap the icon and show the "copied" tooltip
document.querySelectorAll<HTMLButtonElement>('[data-copy-email]').forEach((button) => {
  let timer: number | undefined;
  button.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(button.dataset.copyEmail!);
      button.dataset.copied = '';
      clearTimeout(timer);
      timer = window.setTimeout(() => delete button.dataset.copied, 1800);
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

  /* ---------- Experience roadmap ---------- */
  // The line fills as the list scrolls past the 60% mark; each node lights up once the fill reaches it
  gsap.to('[data-roadmap-fill]', {
    scaleY: 1,
    ease: 'none',
    scrollTrigger: { trigger: '[data-roadmap]', start: 'top 60%', end: 'bottom 60%', scrub: 0.3 },
  });

  const desktop = window.matchMedia('(min-width: 768px)');
  document.querySelectorAll<HTMLElement>('[data-roadmap-item]').forEach((item) => {
    ScrollTrigger.create({
      trigger: item,
      start: 'top 60%',
      onEnter: () => item.setAttribute('data-active', ''),
      onLeaveBack: () => item.removeAttribute('data-active'),
    });

    const card = item.querySelector<HTMLElement>('[data-roadmap-card]')!;
    // Slide in from its side on desktop; on mobile rise from below (a sideways offset would overflow the viewport)
    const from = desktop.matches ? { x: card.dataset.side === 'right' ? 48 : -48, y: 0 } : { x: 0, y: 24 };
    gsap.fromTo(
      card,
      { autoAlpha: 0, ...from },
      {
        autoAlpha: 1,
        x: 0,
        y: 0,
        duration: 1,
        ease: 'expo.out',
        scrollTrigger: { trigger: item, start: 'top 85%', once: true },
      },
    );
  });

  /* ---------- Section reveals ---------- */
  ScrollTrigger.batch('[data-reveal]', {
    start: 'top 88%',
    once: true,
    onEnter: (els) => gsap.to(els, { autoAlpha: 1, y: 0, duration: 1, ease: 'expo.out', stagger: 0.08 }),
  });
}
