import type { ApiError } from "@shared/index";
import type { Context } from "hono";
import { HTTPException } from "hono/http-exception";
import { ZodError } from "zod";

export const handleError = (err: Error, c: Context) => {
	if (err instanceof ZodError) {
		return c.json<ApiError>(
			{
				success: false,
				error: {
					name: "ValidationError",
					issues: err.issues.map((i) => ({
						...i,
					})),
				},
				isFormError: true,
			},
			400,
		);
	}
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
