import { relations } from "drizzle-orm";
import { integer, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import z from "zod";
import { user } from "./auth.schema";
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

export const postsInsertSchema = createInsertSchema(posts, {
	title: z
		.string()
		.min(3, { error: "Title must be at least 3 characters long" })
		.max(255, { error: "Title must be at most 255 characters long" }),
	url: z.url({ error: "Invalid URL" }).optional().or(z.literal("")),
	content: z.string().max(5000).optional().or(z.literal("")),
});

export const postRelations = relations(posts, ({ one, many }) => ({
	author: one(user, {
		fields: [posts.userId],
		references: [user.id],
		relationName: "author",
	}),
	postUpvotes: many(postUpvotes, { relationName: "postUpvotes" }),
	comments: many(comments),
}));
