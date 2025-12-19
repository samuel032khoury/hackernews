import { zValidator } from "@hono/zod-validator";
import type { ApiResponse, Comment, PaginatedResponse } from "@shared/types";
import { createCommentSchema } from "@shared/validators/comments.validation";
import { and, asc, countDistinct, desc, eq, sql } from "drizzle-orm";
import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import z from "zod";
import { db } from "@/db";
import { comments, commentUpvotes, posts, users } from "@/db/schema";
import type { AppEnv, ProtectedEnv } from "@/lib/env";
import { getISOFormatDateQuery } from "@/lib/utils";
import requireAuth from "@/middlewares/requireAuth";
import { throwOnError } from "@/validators/errors";
import { paginationSchema } from "@/validators/query.validation";

const publicRoutes = new Hono<AppEnv>().get(
	"/:id/comments",
	zValidator(
		"param",
		z.object({
			id: z.coerce.number(),
		}),
		throwOnError,
	),
	zValidator("query", paginationSchema, throwOnError),
	async (c) => {
		const { id } = c.req.valid("param");
		const user = c.get("user");
		const { limit, page, sortBy, order } = c.req.valid("query");
		const offset = (page - 1) * limit;
		const sortByColumn =
			sortBy === "points" ? comments.points : comments.createdAt;
		const sortOrder = order === "desc" ? desc(sortByColumn) : asc(sortByColumn);
		const [count] = await db
			.select({ count: countDistinct(comments.id) })
			.from(comments)
			.where(eq(comments.parentCommentId, id));
		const result = await db.query.comments.findMany({
			where: eq(comments.parentCommentId, id),
			orderBy: sortOrder,
			limit,
			offset,
			with: {
				author: {
					columns: {
						id: true,
						name: true,
					},
				},
				commentUpvotes: {
					columns: {
						userId: true,
					},
					where: eq(commentUpvotes.userId, user?.id ?? ""),
					limit: 1,
				},
			},
			extras: {
				createdAt: getISOFormatDateQuery(comments.createdAt).as("created_at"),
			},
		});
		return c.json<PaginatedResponse<Comment[]>>({
			success: true,
			message: "Fetched comments",
			pagination: {
				page,
				totalPages: Math.ceil(count.count / limit),
			},
			data: result satisfies Comment[],
		});
	},
);

const protectedRoutes = new Hono<ProtectedEnv>()
	.post(
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
						createdAt: getISOFormatDateQuery(comments.createdAt).as(
							"created_at",
						),
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
	)
	.post(
		"/:id/upvote",
		requireAuth,
		zValidator(
			"param",
			z.object({
				id: z.coerce.number(),
			}),
			throwOnError,
		),
		async (c) => {
			const { id } = c.req.valid("param");
			const user = c.get("user");
			let pointsChange: -1 | 1 = 1;

			const points = await db.transaction(async (tx) => {
				const [existingUpvote] = await tx
					.select()
					.from(commentUpvotes)
					.where(
						and(
							eq(commentUpvotes.userId, user.id),
							eq(commentUpvotes.commentId, id),
						),
					)
					.limit(1);

				pointsChange = existingUpvote ? -1 : 1;
				const [updated] = await tx
					.update(comments)
					.set({ points: sql`${comments.points} + ${pointsChange}` })
					.where(eq(comments.id, id))
					.returning({ points: comments.points });
				if (!updated)
					throw new HTTPException(404, { message: "Comment not found" });
				if (existingUpvote) {
					await tx
						.delete(commentUpvotes)
						.where(eq(commentUpvotes.id, existingUpvote.id));
				} else {
					await tx.insert(commentUpvotes).values({
						userId: user.id,
						commentId: id,
					});
				}
				return updated.points;
			});
			return c.json<
				ApiResponse<{ commentUpvotes: { userId: string }[]; points: number }>
			>(
				{
					success: true,
					message: "Comment updated successfully",
					data: {
						commentUpvotes: pointsChange === 1 ? [{ userId: user.id }] : [],
						points,
					},
				},
				200,
			);
		},
	);

export const commentRouter = new Hono()
	.route("/", protectedRoutes)
	.route("/", publicRoutes);
