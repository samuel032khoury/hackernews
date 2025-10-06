import { relations } from "drizzle-orm";
import { integer, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";
import { user } from "./auth.schema";
import { comments } from "./comments.schema";
import { posts } from "./posts.schema";

export const postUpvotes = pgTable("post_upvotes", {
	id: serial("id").primaryKey(),
	userId: text("user_id").notNull(),
	postId: integer("post_id").notNull(),
	createdAt: timestamp("created_at", { withTimezone: true })
		.defaultNow()
		.notNull(),
});

export const upvoteRelations = relations(postUpvotes, ({ one }) => ({
	user: one(user, {
		fields: [postUpvotes.userId],
		references: [user.id],
		relationName: "user",
	}),
	post: one(posts, {
		fields: [postUpvotes.postId],
		references: [posts.id],
		relationName: "postUpvotes",
	}),
}));

export const commentUpvotes = pgTable("comment_upvotes", {
	id: serial("id").primaryKey(),
	userId: text("user_id").notNull(),
	commentId: integer("comment_id").notNull(),
	createdAt: timestamp("created_at", { withTimezone: true })
		.defaultNow()
		.notNull(),
});

export const commentUpvoteRelations = relations(commentUpvotes, ({ one }) => ({
	user: one(user, {
		fields: [commentUpvotes.userId],
		references: [user.id],
		relationName: "user",
	}),
	comment: one(comments, {
		fields: [commentUpvotes.commentId],
		references: [comments.id],
		relationName: "commentUpvotes",
	}),
}));
