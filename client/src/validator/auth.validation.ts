import { z } from "zod";

export const authSchema = z.object({
	email: z.email({ error: "Invalid email address" }),
	password: z
		.string()
		.min(8, { error: "Password must be at least 8 characters" })
		.max(255, { error: "Password is too long" }),
});

export const signUpSchema = authSchema
	.extend({
		name: z
			.string()
			.min(1, { error: "Name is required" })
			.max(40, { error: "Name is too long" }),
		confirmPassword: z.string(),
	})
	.refine((data) => data.password === data.confirmPassword, {
		message: "Passwords do not match",
		path: ["confirmPassword"],
	});
