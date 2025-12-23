import { relations } from "drizzle-orm";
import {
	integer,
	pgTable,
	serial,
	text,
	timestamp,
	uniqueIndex,
} from "drizzle-orm/pg-core";
import { users } from "./auth.schema";
import { comments } from "./comments.schema";
import { posts } from "./posts.schema";

export const postUpvotes = pgTable(
	"post_upvotes",
	{
		id: serial("id").primaryKey(),
		userId: text("user_id").notNull(),
		postId: integer("post_id").notNull(),
		createdAt: timestamp("created_at", { withTimezone: true })
			.defaultNow()
			.notNull(),
	},
	(t) => [uniqueIndex("post_upvote_user_post_unique").on(t.userId, t.postId)],
);

export const upvoteRelations = relations(postUpvotes, ({ one }) => ({
	user: one(users, {
		fields: [postUpvotes.userId],
		references: [users.id],
		relationName: "user",
	}),
	post: one(posts, {
		fields: [postUpvotes.postId],
		references: [posts.id],
		relationName: "postUpvotes",
	}),
}));

export const commentUpvotes = pgTable(
	"comment_upvotes",
	{
		id: serial("id").primaryKey(),
		userId: text("user_id").notNull(),
		commentId: integer("comment_id").notNull(),
		createdAt: timestamp("created_at", { withTimezone: true })
			.defaultNow()
			.notNull(),
	},
	(t) => [
		uniqueIndex("comment_upvote_user_comment_unique").on(t.userId, t.commentId),
	],
);

export const commentUpvoteRelations = relations(commentUpvotes, ({ one }) => ({
	user: one(users, {
		fields: [commentUpvotes.userId],
		references: [users.id],
		relationName: "user",
	}),
	comment: one(comments, {
		fields: [commentUpvotes.commentId],
		references: [comments.id],
		relationName: "commentUpvotes",
	}),
}));
