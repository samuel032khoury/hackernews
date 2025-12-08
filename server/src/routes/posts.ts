import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { z } from "zod";
import type { AuthEnv } from "@/lib/auth";
import requireAuth from "@/middleware/requireAuth";

// Schema for creating a post
const createPostSchema = z.object({
	title: z
		.string()
		.min(3, "Title must be at least 3 characters")
		.max(255, "Title must be at most 255 characters"),
	url: z.string().url("Invalid URL").optional().or(z.literal("")),
	content: z.string().max(5000, "Content too long").optional(),
});

// Schema for listing posts
const listPostsSchema = z.object({
	limit: z.coerce.number().min(1).max(100).optional().default(10),
	page: z.coerce.number().min(1).optional().default(1),
});

export const postRouter = new Hono<AuthEnv>()
	// GET /posts - List posts (public)
	.get("/", zValidator("query", listPostsSchema), async (c) => {
		const { limit, page } = c.req.valid("query");
		// In a real app, you'd fetch from the database
		return c.json({
			success: true,
			message: "Posts retrieved successfully",
			data: {
				posts: [],
				pagination: { limit, page, total: 0 },
			},
		});
	})
	// POST /posts - Create a post (authenticated)
	.post("/", requireAuth, zValidator("json", createPostSchema), async (c) => {
		const { title, url, content } = c.req.valid("json");
		const user = c.get("user");
		// In a real app, you'd insert into the database
		return c.json({
			success: true,
			message: "Post created successfully",
			data: {
				id: 1,
				title,
				url: url || null,
				content: content || null,
				userId: user?.id,
				createdAt: new Date().toISOString(),
			},
		});
	});

