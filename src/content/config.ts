import { defineCollection, z } from 'astro:content';

const blog = defineCollection({
	schema: z.object({
		title: z.string(),
		summary: z.string().optional(),
		date: z.coerce.date(),
		updatedDate: z.coerce.date().optional(),
		keywords: z.string().optional(),
		image: z.string().optional(),
	}),
});

export const collections = { blog };
