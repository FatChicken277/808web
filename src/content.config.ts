import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const artistsCollection = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/artists" }),
  schema: z.object({
    name: z.string(),
    instagram: z.string().optional(),
    image: z.string().optional(),
  }),
});

const caosCollection = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/caos" }),
  schema: z.object({
    title: z.string(),
    description: z.string().optional(),
    image: z.string().optional(),
    width: z.string().optional(),
    direction: z.string().optional(),
    distribution: z.string().optional(),
  }),
});

const teamCollection = defineCollection({
  type: 'content',
  schema: z.object({
    name: z.string(),
    role: z.string().optional(),
    image: z.string().optional(),
  }),
});

export const collections = {
  'artists': artistsCollection,
  'caos': caosCollection,
  'team': teamCollection,
};
