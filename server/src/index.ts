import { Hono } from "hono";
import { cors } from "hono/cors";
import authHandler from "@/middleware/authHandler";
import { handleError } from "@/middleware/errorHandler";
import { authRoutes } from "@/routes/auth";
import { postRouter } from "@/routes/posts";
import { testRouter } from "@/routes/test";

const app = new Hono();

app
	.use(cors(), authHandler)
	.basePath("/api")
	.route("/auth", authRoutes)
	.route("/posts", postRouter)
	.route("/hello", testRouter)
	.onError(handleError);

export default app;
