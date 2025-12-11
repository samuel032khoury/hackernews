import { Hono } from "hono";
import { cors } from "hono/cors";
import authHandler from "@/middleware/authHandler";
import { handleError } from "@/middleware/errorHandler";
import { authRoutes } from "@/routes/auth";
import { commentRouter } from "@/routes/comments";
import { postRouter } from "@/routes/posts";

const app = new Hono()
	.use(cors(), authHandler)
	.basePath("/api")
	.route("/auth", authRoutes)
	.route("/posts", postRouter)
	.route("/comments", commentRouter)
	.onError(handleError);

export default app;
export type AppType = typeof app;
