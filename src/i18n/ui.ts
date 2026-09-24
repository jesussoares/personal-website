export const languages = { en: 'English', es: 'Español' } as const;
export type Lang = keyof typeof languages;
export const defaultLang: Lang = 'en';

export const ui = {
  en: {
    meta: {
      title: 'Jesús Soares — Senior Software Engineer',
      description:
        'Senior full-stack software engineer. I design and build software end-to-end — from the interface to the infrastructure beneath it.',
    },
    nav: {
      experience: 'Experience',
      skills: 'Skills',
      work: 'Work',
      contact: 'Contact',
      language: 'Leer en español',
    },
    hero: {
      eyebrow: 'Senior Software Engineer · Caracas, VE',
      title: 'I design and build software,',
      titleAccent: 'end to end.',
      tagline: 'Frontend, backend, infrastructure — and the architecture that ties them together.',
      ctaPrimary: 'Get in touch',
      ctaSecondary: 'See experience',
      scroll: 'Scroll',
      role: 'Senior Software Engineer',
    },
    experience: {
      label: 'Experience',
      title: 'Where I’ve been building.',
    },
    skills: {
      label: 'Skills',
      title: 'The toolkit.',
    },
    work: {
      label: 'Work',
      title: 'Selected projects.',
      emptyTitle: 'New projects are on the way.',
      emptyText: 'I’m currently building things worth showing. Check back soon — or ask me about them.',
      live: 'Live',
      code: 'Code',
    },
    contact: {
      label: 'Contact',
      title: 'Have a hard problem worth solving?',
      text: 'I’m always happy to talk about architecture, products, and ambitious ideas.',
      copy: 'Copy email',
      copied: 'Copied',
      resume: 'Download résumé',
      location: 'Caracas, Venezuela · Remote worldwide',
    },
  },
  es: {
    meta: {
      title: 'Jesús Soares — Senior Software Engineer',
      description:
        'Ingeniero de software full-stack senior. Diseño y construyo software de punta a punta — desde la interfaz hasta la infraestructura que la sostiene.',
    },
    nav: {
      experience: 'Experiencia',
      skills: 'Habilidades',
      work: 'Proyectos',
      contact: 'Contacto',
      language: 'Read in English',
    },
    hero: {
      eyebrow: 'Senior Software Engineer · Caracas, VE',
      title: 'Diseño y construyo software,',
      titleAccent: 'de punta a punta.',
      tagline: 'Frontend, backend, infraestructura — y la arquitectura que los mantiene unidos.',
      ctaPrimary: 'Hablemos',
      ctaSecondary: 'Ver experiencia',
      scroll: 'Desliza',
      role: 'Senior Software Engineer',
    },
    experience: {
      label: 'Experiencia',
      title: 'Dónde he estado construyendo.',
    },
    skills: {
      label: 'Habilidades',
      title: 'Las herramientas.',
    },
    work: {
      label: 'Proyectos',
      title: 'Proyectos seleccionados.',
      emptyTitle: 'Nuevos proyectos en camino.',
      emptyText: 'Estoy construyendo cosas que valga la pena mostrar. Vuelve pronto — o pregúntame por ellas.',
      live: 'Ver',
      code: 'Código',
    },
    contact: {
      label: 'Contacto',
      title: '¿Tienes un problema difícil que valga la pena resolver?',
      text: 'Siempre me gusta conversar de arquitectura, productos e ideas ambiciosas.',
      copy: 'Copiar email',
      copied: 'Copiado',
      resume: 'Descargar CV',
      location: 'Caracas, Venezuela · Remoto para todo el mundo',
    },
  },
} as const;

export function t(lang: Lang) {
  return ui[lang];
}

export function localePath(lang: Lang, path = '/') {
  return lang === defaultLang ? path : `/${lang}${path}`;
}
