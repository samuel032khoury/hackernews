import { Hono } from "hono";
import { cors } from "hono/cors";
import { processEnv } from "@/lib/env";
import authHandler from "@/middleware/authHandler";
import { handleError } from "@/middleware/errorHandler";
import { authRoutes } from "@/routes/auth";
import { postRouter } from "@/routes/posts";

const app = new Hono()
	.use(
		cors({
			origin: processEnv.CLIENT_URL || "",
			credentials: true,
		}),
		authHandler,
	)
	.route("/auth", authRoutes)
	.route("/posts", postRouter)
	.onError(handleError);

export default app;
export type AppType = typeof app;
