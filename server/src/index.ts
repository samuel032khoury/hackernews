import { Hono } from "hono";
import { serveStatic } from "hono/bun";
import { cors } from "hono/cors";
import { processEnv } from "@/lib/env";
import authHandler from "@/middlewares/authHandler";
import { handleError } from "@/middlewares/errorHandler";
import { authRoutes } from "@/routes/auth";
import { commentRouter } from "@/routes/comments";
import { postRouter } from "@/routes/posts";

const api = new Hono()
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

const app = new Hono()
	.route("/", api)
	.use("*", serveStatic({ root: "../client/dist" }))
	.get("*", serveStatic({ root: "../client/dist", path: "index.html" }));

export default {
	port: processEnv.PORT,
	hostname: processEnv.HOSTNAME,
	fetch: app.fetch,
};
export type AppType = typeof api;
