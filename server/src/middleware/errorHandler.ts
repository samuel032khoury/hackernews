import type { ApiError } from "@shared/index";
import type { Context } from "hono";
import { HTTPException } from "hono/http-exception";

export const handleError = (err: Error, c: Context) => {
	if (err instanceof HTTPException) {
		const errResponse =
			err.res ??
			c.json<ApiError>(
				{
					success: false,
					error: err.message,
					isFormError: err.status === 422,
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
};
