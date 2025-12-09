import { relations } from "drizzle-orm";
import { integer, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";
import { users } from "./auth.schema";
import { comments } from "./comments.schema";
import { postUpvotes } from "./upvotes.schema";

export const posts = pgTable("posts", {
	id: serial("id").primaryKey(),
	userId: text("user_id").notNull(),
	title: text("title").notNull(),
	url: text("url"),
	content: text("content"),
	points: integer("points").default(0).notNull(),
	commentsCount: integer("comments_count").default(0).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true })
		.defaultNow()
		.notNull(),
});

export const postRelations = relations(posts, ({ one, many }) => ({
	author: one(users, {
		fields: [posts.userId],
		references: [users.id],
		relationName: "author",
	}),
	postUpvotes: many(postUpvotes, { relationName: "postUpvotes" }),
	comments: many(comments),
}));
