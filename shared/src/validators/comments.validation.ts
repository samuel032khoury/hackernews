import z from "zod";

export const createCommentSchema = z.object({
	content: z
		.string()
		.trim()
		.min(1, "Content is required")
		.max(1000, "Content is too long"),
});
