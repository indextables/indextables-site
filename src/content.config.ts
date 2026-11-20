import { defineCollection, z } from 'astro:content';
import { docsLoader } from '@astrojs/starlight/loaders';
import { docsSchema } from '@astrojs/starlight/schema';

// @spec SITE-CONT-FM-001, SITE-CONT-FM-002
const lid = z.object({
  class: z.enum(['generated', 'derived', 'authored']),
  cites: z.array(z.string()).default([]),
  docs: z.array(z.string()).default([]),
  reviewed: z.string().optional(),
  fingerprint: z.string().optional(),
});

export const collections = {
  docs: defineCollection({
    loader: docsLoader(),
    schema: docsSchema({
      extend: z.object({
        lid,
        engine: z.array(z.enum(['spark', 'datafusion'])).default([]),
        status: z.enum(['available', 'planned', 'deferred', 'changing']).default('available'),
        legacy: z.boolean().default(false),
        date: z.coerce.date().optional(),
        authors: z.array(z.string()).default([]),
        tags: z.array(z.string()).default([]),
      }),
    }),
  }),
};
