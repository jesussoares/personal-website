# Jesús Soares — Portfolio

Astro + React Three Fiber (particle hero) + GSAP/Lenis + Tailwind. Bilingual (`/` English, `/es/` Spanish).

```sh
npm run dev      # http://localhost:4321
npm run build    # static output in dist/
```

## Where things live

| What | File |
| --- | --- |
| UI copy (EN/ES) | `src/i18n/ui.ts` |
| Experience & skills | `src/data/profile.ts` |
| Portfolio projects | `src/content/projects/*.md` — copy `_example.md` without the `_` |
| Particle hero (shaders) | `src/components/ParticleField.tsx` |
| Scroll animations | `src/scripts/motion.ts` |
| Colors / fonts (Geist) | `src/styles/global.css` |
| Résumé PDFs | `public/Jesus-Soares-Resume.pdf`, `public/Jesus-Soares-CV.pdf` |
