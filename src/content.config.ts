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

export const collections = {
  'artists': artistsCollection,
};
