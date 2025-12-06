import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import type { AuthEnv } from "@/lib/auth";
import requireAuth from "@/middleware/requireAuth";

export const postRouter = new Hono<AuthEnv>().post(
	"/",
	requireAuth,
	// zValidator("form", {}),
	async (c) => {
		return c.json({ message: "Create a post" });
	},
);
