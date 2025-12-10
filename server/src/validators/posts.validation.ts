import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { posts } from "@/db/schema";

export const createPostSchema = createInsertSchema(posts, {
	title: z
		.string()
		.min(3, "Title must be at least 3 characters")
		.max(255, "Title must be at most 255 characters"),
	url: z.url("Invalid URL").optional().or(z.literal("")),
	content: z
		.string()
		.max(5000, "Content too long")
		.optional()
		.or(z.literal("")),
})
	.pick({
		title: true,
		url: true,
		content: true,
	})
	.refine((data) => data.url || data.content, {
		message: "Either URL or content is required",
		path: ["url", "content"],
	});

export type CreatePostInput = z.infer<typeof createPostSchema>;
