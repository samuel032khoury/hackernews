import type { ApiError, ApiResponse } from "@shared/types";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { HTTPException } from "hono/http-exception";

export const app = new Hono()

	.use(cors())

	.get("/", (c) => {
		return c.json({ message: "Welcome to the BHVR!" });
	})

	.get("/hello", async (c) => {
		const data: ApiResponse = {
			message: "Hello BHVR!",
			success: true,
		};

		return c.json(data, { status: 200 });
	});

app.onError((err, c) => {
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
