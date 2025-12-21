import type { ApiError, ValidationError } from "@shared/types";
import type { Context } from "hono";
import { HTTPException } from "hono/http-exception";
import { ZodError } from "zod";

export const handleError = (err: Error, c: Context) => {
	if (err instanceof ZodError) {
		return c.json<ValidationError>(
			{
				success: false,
				code: "VALIDATION_ERROR",
				message: "Validation failed",
				issues: err.issues.map((issue) => ({
					path: issue.path,
					message: issue.message,
				})),
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
					message: err.message,
					code: err.name,
				},
				err.status,
			);
		return errResponse;
	}

	return c.json<ApiError>(
		{
			success: false,
			message:
				process.env.NODE_ENV === "development"
					? (err.stack ?? err.message)
					: "Internal Server Error",
		},
		500,
	);
};
