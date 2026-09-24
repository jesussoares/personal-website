import type { Lang } from '../i18n/ui';

type Localized<T = string> = Record<Lang, T>;

export const profile = {
  name: 'Jesús Soares',
  email: 'jesusandressoares@gmail.com',
  links: {
    linkedin: 'https://linkedin.com/in/jesus-soares',
    github: 'https://github.com/jesussoares',
  },
  resume: {
    en: '/Jesus-Soares-Resume.pdf',
    es: '/Jesus-Soares-CV.pdf',
  } satisfies Localized,
};

export interface Role {
  company: string;
  role: Localized;
  place: Localized;
  period: Localized;
  points: Localized<string[]>;
  tags?: string[];
}

export const roles: Role[] = [
  {
    company: 'Bops',
    role: { en: 'Senior Software Engineer', es: 'Senior Software Engineer' },
    place: { en: 'New York, NY · Remote', es: 'Nueva York, NY · Remoto' },
    period: { en: 'Mar 2025 — Present', es: 'Mar 2025 — Presente' },
    points: {
      en: [
        'Lead technical design, architecture and requirements for a full-stack retail analytics platform serving enterprise clients across the US and Latin America.',
        'Designed a configurable data validation and routing framework that cut invalid data reaching the processing pipeline by ~99%.',
        'Built 10+ partner integrations on a ports-and-adapters architecture, and shipped the company’s AI agent on Amazon Bedrock with streaming and persistence.',
        'Built the internal admin panel from scratch — automating 10+ manual processes across all 5 teams — and mentor 7+ engineers.',
      ],
      es: [
        'Lidero el diseño técnico, la arquitectura y el levantamiento de requerimientos de una plataforma full-stack de analítica retail para clientes enterprise en EE. UU. y Latinoamérica.',
        'Diseñé un framework configurable de validación y enrutamiento de datos que redujo en ~99% los datos inválidos que llegan al pipeline de procesamiento.',
        'Construí más de 10 integraciones con partners sobre una arquitectura de puertos y adaptadores, y lancé el agente de IA de la empresa en Amazon Bedrock con streaming y persistencia.',
        'Construí desde cero el panel administrativo interno — automatizando más de 10 procesos manuales en los 5 equipos — y hago mentoría a más de 7 ingenieros.',
      ],
    },
    tags: ['React', 'Python', 'AWS', 'Amazon Bedrock'],
  },
  {
    company: 'Avila Tek',
    role: { en: 'Software Engineer · Tech Lead', es: 'Software Engineer · Tech Lead' },
    place: { en: 'Caracas, Venezuela', es: 'Caracas, Venezuela' },
    period: { en: 'Jul 2023 — Feb 2025', es: 'Jul 2023 — Feb 2025' },
    points: {
      en: [
        'Led solution design, planning and development direction across 7+ client projects.',
        'Primary technical liaison for clients — translating business needs into tailored technical solutions.',
        'Built web apps, cross-platform desktop apps and APIs on clean architecture principles; coordinated developers and ran code reviews.',
      ],
      es: [
        'Lideré el diseño de soluciones, la planificación y la dirección de desarrollo en más de 7 proyectos para clientes.',
        'Principal enlace técnico con los clientes — traduciendo necesidades de negocio en soluciones técnicas a la medida.',
        'Construí aplicaciones web, apps de escritorio multiplataforma y APIs con principios de arquitectura limpia; coordiné desarrolladores e hice code reviews.',
      ],
    },
  },
  {
    company: 'Universidad Católica Andrés Bello',
    role: { en: 'B.S. Computer Science', es: 'Ingeniería Informática' },
    place: { en: 'Caracas, Venezuela', es: 'Caracas, Venezuela' },
    period: { en: '2023', es: '2023' },
    points: {
      en: [
        'Thesis: a self-service kiosk desktop app with an integrated point-of-sale system for movie theaters — graded 20/20 with honorable mention.',
      ],
      es: [
        'Tesis: aplicación de escritorio de autoservicio con punto de venta integrado para cines — calificada 20/20 con mención honorífica.',
      ],
    },
  },
];

export interface Discipline {
  title: Localized;
  items: string[];
}

export const disciplines: Discipline[] = [
  {
    title: { en: 'Languages', es: 'Lenguajes' },
    items: ['TypeScript', 'JavaScript', 'Python', 'SQL'],
  },
  {
    title: { en: 'Frontend', es: 'Frontend' },
    items: ['React', 'Next.js', 'Tailwind CSS', 'Tauri'],
  },
  {
    title: { en: 'Backend', es: 'Backend' },
    items: ['Node.js', 'NestJS', 'FastAPI', 'Fastify', 'Prisma'],
  },
  {
    title: { en: 'Cloud & Infrastructure', es: 'Cloud e Infraestructura' },
    items: ['AWS Lambda', 'S3', 'DynamoDB', 'Terraform', 'Docker', 'GitHub Actions'],
  },
  {
    title: { en: 'Practices', es: 'Prácticas' },
    items: ['Clean / Hexagonal Architecture', 'Domain-Driven Design', 'SOLID', 'Agile'],
  },
  {
    title: { en: 'AI', es: 'IA' },
    items: ['Amazon Bedrock', 'Claude Code'],
  },
];
