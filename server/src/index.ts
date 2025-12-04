import { Hono } from "hono";
import { cors } from "hono/cors";
import { handleError } from "@/middleware/errorHandler";
import { authRoutes } from "@/routes/auth";
import { postRouter } from "@/routes/posts";

const app = new Hono();

app
	.use(cors())
	.basePath("/api")
	.get("/hello", (c) => {
		return c.json({ message: "Hello from the server!", success: true });
	})
	.route("/auth", authRoutes)
	.route("/posts", postRouter)
	.onError(handleError);

export default app;
