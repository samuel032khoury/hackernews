import { createInsertSchema } from "drizzle-zod";
import z from "zod";
import { comments } from "@/db/schema";

export const createCommentSchema = createInsertSchema(comments, {
	content: z
		.string()
		.min(1, "Content is required")
		.max(1000, "Content is too long"),
}).pick({
	content: true,
});
