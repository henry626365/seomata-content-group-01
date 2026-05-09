import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const blog = defineCollection({
	loader: glob({ base: './src/content/blog', pattern: '**/*.{md,mdx}' }),
	schema: ({ image }) =>
		z.object({
			title: z.string(),
			description: z.string(),
			pubDate: z.coerce.date(),
			updatedDate: z.coerce.date(),
			category: z.string(),
			heroImage: z.optional(image()),
			/** Served from site public/ directory (copied bundle, e.g. /blog-images/...) */
			heroPhoto: z.string().optional(),
			author: z.string().optional(),
		}),
});

export const collections = { blog };
