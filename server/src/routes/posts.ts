import { zValidator } from "@hono/zod-validator";
import type {
	ApiResponse,
	Comment,
	PaginatedResponse,
	Post,
} from "@shared/types";
import { and, asc, countDistinct, desc, eq, isNull, sql } from "drizzle-orm";
import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import z from "zod";
import { db } from "@/db";
import {
	comments,
	commentUpvotes,
	posts,
	postUpvotes,
	users,
} from "@/db/schema";
import type { AppEnv, ProtectedEnv } from "@/lib/env";
import { getISOFormatDateQuery } from "@/lib/utils";
import requireAuth from "@/middlewares/requireAuth";
import { throwOnError } from "@/validators";
import { createCommentSchema } from "@/validators/comments.validation";
import { createPostSchema } from "@/validators/posts.validation";
import { paginationSchema } from "@/validators/query.validation";

const protectedRoutes = new Hono<ProtectedEnv>()
	.post(
		"/",
		requireAuth,
		zValidator("form", createPostSchema, throwOnError),
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
	)
	.post(
		"/:id/upvote",
		requireAuth,
		zValidator("param", z.object({ id: z.coerce.number() }), throwOnError),
		async (c) => {
			const { id } = c.req.valid("param");
			const user = c.get("user");
			let pointsChange: -1 | 1 = 1;

			const points = await db.transaction(async (tx) => {
				const [existingUpvote] = await tx
					.select()
					.from(postUpvotes)
					.where(
						and(eq(postUpvotes.userId, user.id), eq(postUpvotes.postId, id)),
					)
					.limit(1);

				pointsChange = existingUpvote ? -1 : 1;
				const [updated] = await tx
					.update(posts)
					.set({ points: sql`${posts.points} + ${pointsChange}` })
					.where(eq(posts.id, id))
					.returning({ points: posts.points });
				if (!updated)
					throw new HTTPException(404, { message: "Post not found" });
				if (existingUpvote) {
					await tx
						.delete(postUpvotes)
						.where(eq(postUpvotes.id, existingUpvote.id));
				} else {
					await tx.insert(postUpvotes).values({
						userId: user.id,
						postId: id,
					});
				}
				return updated.points;
			});
			return c.json<ApiResponse<{ isUpvoted: boolean; points: number }>>({
				success: true,
				message: "Post updated successfully",
				data: {
					isUpvoted: pointsChange === 1,
					points,
				},
			});
		},
	)
	.post(
		"/:id/comment",
		requireAuth,
		zValidator("param", z.object({ id: z.coerce.number() }), throwOnError),
		zValidator("form", createCommentSchema, throwOnError),
		async (c) => {
			const { id } = c.req.valid("param");
			const { content } = c.req.valid("form");
			const user = c.get("user");
			const [result] = await db.transaction(async (tx) => {
				const [updated] = await tx
					.update(posts)
					.set({
						commentsCount: sql`${posts.commentsCount} + 1`,
					})
					.where(eq(posts.id, id))
					.returning({ commentsCount: posts.commentsCount });
				if (!updated)
					throw new HTTPException(404, { message: "Post not found" });
				return await tx
					.insert(comments)
					.values({
						content,
						userId: user.id,
						postId: id,
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
	);

const publicRoutes = new Hono<AppEnv>()
	.get("/", zValidator("query", paginationSchema, throwOnError), async (c) => {
		const { limit, page, sortBy, order, author, site } = c.req.valid("query");
		const user = c.get("user");
		const offset = (page - 1) * limit;
		const sortByColumn = sortBy === "points" ? posts.points : posts.createdAt;
		const sortOrder = order === "desc" ? desc(sortByColumn) : asc(sortByColumn);
		const [count] = await db
			.select({ count: countDistinct(posts.id) })
			.from(posts)
			.where(
				and(
					author ? eq(posts.userId, author) : undefined,
					site ? eq(posts.url, site) : undefined,
				),
			);
		const postsQuery = db
			.select({
				id: posts.id,
				title: posts.title,
				url: posts.url,
				content: posts.content,
				points: posts.points,
				commentsCount: posts.commentsCount,
				createdAt: getISOFormatDateQuery(posts.createdAt),
				author: {
					username: users.name,
					id: users.id,
				},
				isUpvoted: user
					? sql<boolean>`CASE WHEN ${postUpvotes.userId} IS NOT NULL THEN true ELSE false END`
					: sql<boolean>`false`,
			})
			.from(posts)
			.innerJoin(users, eq(posts.userId, users.id))
			.orderBy(sortOrder)
			.limit(limit)
			.offset(offset)
			.where(
				and(
					author ? eq(posts.userId, author) : undefined,
					site ? eq(posts.url, site) : undefined,
				),
			);
		if (user) {
			postsQuery.leftJoin(
				postUpvotes,
				and(eq(postUpvotes.postId, posts.id), eq(postUpvotes.userId, user.id)),
			);
		}
		const result = await postsQuery;

		return c.json<PaginatedResponse<Post[]>>({
			success: true,
			message: "Fetched posts",
			pagination: {
				page,
				totalPages: Math.ceil(count.count / limit),
			},
			data: result satisfies Post[],
		});
	})
	.get(
		"/:id/comments",
		zValidator("param", z.object({ id: z.coerce.number() }), throwOnError),
		zValidator(
			"query",
			paginationSchema.extend({
				includeChildren: z.coerce.boolean().optional(),
			}),
			throwOnError,
		),
		async (c) => {
			const user = c.get("user");
			const { id } = c.req.valid("param");
			const { limit, page, sortBy, order, includeChildren } =
				c.req.valid("query");
			const offset = (page - 1) * limit;
			const [postExists] = await db
				.select({ exists: sql`1` })
				.from(posts)
				.where(eq(posts.id, id))
				.limit(1);
			if (!postExists) {
				throw new HTTPException(404, { message: "Post not found" });
			}

			const sortByColumn = sortBy === "points" ? posts.points : posts.createdAt;
			const sortOrder =
				order === "desc" ? desc(sortByColumn) : asc(sortByColumn);
			const [count] = await db
				.select({ count: countDistinct(comments.id) })
				.from(comments)
				.where(and(eq(comments.postId, id), isNull(comments.parentCommentId)));
			const result = await db.query.comments.findMany({
				where: and(eq(comments.postId, id), isNull(comments.parentCommentId)),
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
					childComments: {
						limit: includeChildren ? 2 : 0,
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
						orderBy: sortOrder,
						extras: {
							createdAt: getISOFormatDateQuery(comments.createdAt).as(
								"created_at",
							),
						},
					},
				},
				extras: {
					createdAt: getISOFormatDateQuery(comments.createdAt).as("created_at"),
				},
			});
			return c.json<PaginatedResponse<Comment[]>>(
				{
					success: true,
					message: "Fetched comments",
					pagination: {
						page,
						totalPages: Math.ceil(count.count / limit),
					},
					data: result satisfies Comment[],
				},
				200,
			);
		},
	)
	.get(
		"/:id",
		zValidator("param", z.object({ id: z.coerce.number() }), throwOnError),
		async (c) => {
			const user = c.get("user");
			const { id } = c.req.valid("param");
			const postQuery = db
				.select({
					id: posts.id,
					title: posts.title,
					url: posts.url,
					content: posts.content,
					points: posts.points,
					commentsCount: posts.commentsCount,
					createdAt: getISOFormatDateQuery(posts.createdAt),
					author: {
						username: users.name,
						id: users.id,
					},
					isUpvoted: user
						? sql<boolean>`CASE WHEN ${postUpvotes.userId} IS NOT NULL THEN true ELSE false END`
						: sql<boolean>`false`,
				})
				.from(posts)
				.innerJoin(users, eq(posts.userId, users.id))
				.where(eq(posts.id, id));
			if (user) {
				postQuery.leftJoin(
					postUpvotes,
					and(
						eq(postUpvotes.postId, posts.id),
						eq(postUpvotes.userId, user.id),
					),
				);
			}
			const [result] = await postQuery;
			if (!result) {
				throw new HTTPException(404, { message: "Post not found" });
			}
			return c.json<ApiResponse<Post>>({
				success: true,
				message: "Fetched post",
				data: result satisfies Post,
			});
		},
	);

export const postRouter = new Hono()
	.route("/", protectedRoutes)
	.route("/", publicRoutes);
