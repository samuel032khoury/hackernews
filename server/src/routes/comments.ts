import { zValidator } from "@hono/zod-validator";
import type { ApiResponse, Comment } from "@shared/types";
import { eq, sql } from "drizzle-orm";
import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import z from "zod";
import { db } from "@/db";
import { comments, posts, users } from "@/db/schema";
import type { ProtectedEnv } from "@/lib/env";
import { getISOFormatDateQuery } from "@/lib/utils";
import requireAuth from "@/middleware/requireAuth";
import { throwOnError } from "@/validators";
import { createCommentSchema } from "@/validators/comments.validation";

export const commentRouter = new Hono<ProtectedEnv>().post(
	"/:id",
	requireAuth,
	zValidator(
		"param",
		z.object({
			id: z.coerce.number(),
		}),
		throwOnError,
	),
	zValidator("form", createCommentSchema, throwOnError),
	async (c) => {
		const { id } = c.req.valid("param");
		const { content } = c.req.valid("form");
		const user = c.get("user");

		const [result] = await db.transaction(async (tx) => {
			const [parentComment] = await tx
				.select({
					id: comments.id,
					postId: comments.postId,
					depth: comments.depth,
				})
				.from(comments)
				.where(eq(comments.id, id))
				.limit(1);

			if (!parentComment) {
				throw new HTTPException(404, { message: "Parent comment not found" });
			}

			const postId = parentComment.postId;
			const [updatedParentComment] = await tx
				.update(comments)
				.set({
					commentCount: sql`${comments.commentCount} + 1`,
				})
				.where(eq(comments.id, parentComment.id))
				.returning({ commentCount: comments.commentCount });
			const [updatedPost] = await tx
				.update(posts)
				.set({
					commentsCount: sql`${posts.commentsCount} + 1`,
				})
				.where(eq(posts.id, postId))
				.returning({ commentsCount: posts.commentsCount });

			if (!updatedParentComment || !updatedPost) {
				throw new HTTPException(404, { message: "Post not found" });
			}
			return await tx
				.insert(comments)
				.values({
					content,
					userId: user.id,
					postId,
					depth: parentComment.depth + 1,
					parentCommentId: parentComment.id,
				})
				.returning({
					id: comments.id,
					userId: users.id,
					postId: posts.id,
					content: comments.content,
					points: comments.points,
					depth: comments.depth,
					parentCommentId: comments.parentCommentId,
					createdAt: getISOFormatDateQuery(comments.createdAt).as("created_at"),
					commentCount: comments.commentCount,
				});
		});
		return c.json<ApiResponse<Comment>>({
			success: true,
			message: "Comment created successfully",
			data: {
				...result,
				commentUpvotes: [] as { userId: string }[],
				childComments: [] as Comment[],
				author: {
					id: user.id,
					name: user.name,
				},
			} satisfies Comment,
		});
	},
);
