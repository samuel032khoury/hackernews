import type { ApiError } from "@shared/types";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { HTTPException } from "hono/http-exception";
import { auth } from "@/lib/auth";

export const app = new Hono()
	.use(cors())
	.basePath("/api")
	.on(["POST", "GET"], "/auth/**", (c) => auth.handler(c.req.raw))
	.onError((err, c) => {
		if (err instanceof HTTPException) {
			const errResponse =
				err.res ??
				c.json<ApiError>(
					{
						success: false,
						error: err.message,
						isFormError: err.status === 422,
						// isFormError:
						// 	err.cause && typeof err.cause === "object" && "form" in err.cause
						// 		? err.cause.form === true
						// 		: false,
					},
					err.status,
				);
			return errResponse;
		}
		return c.json<ApiError>(
			{
				success: false,
				error:
					process.env.NODE_ENV === "development"
						? (err.stack ?? err.message)
						: "Internal Server Error",
			},
			500,
		);
	});

export default app;
