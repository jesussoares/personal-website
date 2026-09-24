import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const localized = z.object({ en: z.string(), es: z.string() });

// Each project is one Markdown file in src/content/projects.
// Files starting with "_" are ignored (see _example.md).
const projects = defineCollection({
  loader: glob({ pattern: '**/[^_]*.md', base: './src/content/projects' }),
  schema: z.object({
    order: z.number(),
    title: localized,
    summary: localized,
    tags: z.array(z.string()).default([]),
    url: z.url().optional(),
    repo: z.url().optional(),
    year: z.number().optional(),
  }),
});

export const collections = { projects };
