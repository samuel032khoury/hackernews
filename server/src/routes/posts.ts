import { zValidator } from "@hono/zod-validator";
import type { ApiResponse } from "@shared/types";
import { Hono } from "hono";
import { db } from "@/db";
import { posts } from "@/db/schema";
import type { ProtectedEnv } from "@/lib/env";
import requireAuth from "@/middleware/requireAuth";
import { createPostSchema } from "@/validators/posts";

export const postRouter = new Hono<ProtectedEnv>().post(
	"/",
	requireAuth,
	zValidator("form", createPostSchema, (result, _) => {
		if (!result.success) throw result.error;
	}),
	async (c) => {
		const { title, url, content } = c.req.valid("form");
		const user = c.get("user");
		const [result] = await db
			.insert(posts)
			.values({
				title,
				content,
				url,
				userId: user.id,
			})
			.returning({ id: posts.id });
		return c.json<ApiResponse<{ postId: number }>>(
			{
				success: true,
				message: "Post created successfully",
				data: {
					postId: result.id,
				},
			},
			201,
		);
	},
);
