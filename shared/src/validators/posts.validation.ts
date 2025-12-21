import { z } from "zod";

export const createPostSchema = z
	.object({
		title: z
			.string()
			.min(3, "Title must be at least 3 characters")
			.max(255, "Title must be at most 255 characters"),
		url: z.url("Invalid URL").or(z.literal("")),
		content: z.string().max(5000, "Content too long").or(z.literal("")),
	})
	.refine((data) => data.url || data.content, {
		message: "Either URL or content is required",
		path: ["url", "content"],
	});
