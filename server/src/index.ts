import { Hono } from "hono";
import { cors } from "hono/cors";
import { processEnv } from "@/lib/env";
import authHandler from "@/middlewares/authHandler";
import { handleError } from "@/middlewares/errorHandler";
import { authRoutes } from "@/routes/auth";
import { commentRouter } from "@/routes/comments";
import { postRouter } from "@/routes/posts";

const app = new Hono()
	.use(
		cors({
			origin: processEnv.CLIENT_URL,
			credentials: true,
		}),
		authHandler,
	)
	.basePath("/api")
	.route("/auth", authRoutes)
	.route("/posts", postRouter)
	.route("/comments", commentRouter)
	.onError(handleError);

export default app;
export type AppType = typeof app;
