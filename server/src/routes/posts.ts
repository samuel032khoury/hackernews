import { zValidator } from "@hono/zod-validator";
import { and, asc, countDistinct, desc, eq, sql } from "drizzle-orm";
import { Hono } from "hono";
import { db } from "@/db";
import { posts, postUpvotes, users } from "@/db/schema";
import type { AppEnv, ProtectedEnv } from "@/lib/env";
import { getISOFormatDateQuery } from "@/lib/utils";
import requireAuth from "@/middleware/requireAuth";
import { createPostSchema } from "@/validators/posts";
import { querySchema } from "@/validators/query";

const protectedRoutes = new Hono<ProtectedEnv>().post(
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
		return c.json(
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

const publicRoutes = new Hono<AppEnv>().get(
	"/",
	zValidator("query", querySchema),
	async (c) => {
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
			.leftJoin(users, eq(posts.userId, users.id))
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

		return c.json({
			success: true,
			message: "Fetched posts",
			pagination: {
				page,
				totalPages: Math.ceil(count.count / limit),
			},
			data: result,
		});
	},
);

export const postRouter = new Hono()
	.route("/", protectedRoutes)
	.route("/", publicRoutes);
