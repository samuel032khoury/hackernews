import { Hono } from "hono";
import { cors } from "hono/cors";
import authHandler from "@/middleware/authHandler";
import { handleError } from "@/middleware/errorHandler";
import { authRoutes } from "@/routes/auth";
import { postRouter } from "@/routes/posts";

const app = new Hono()
	.use(cors(), authHandler)
	.route("/auth", authRoutes)
	.route("/posts", postRouter)
	.onError(handleError);

export default app;
