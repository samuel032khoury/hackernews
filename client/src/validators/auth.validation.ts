import { AUTH_CONSTRAINTS } from "@shared/constants";
import { z } from "zod";

const PASSWORD_MIN_LENGTH = AUTH_CONSTRAINTS.PASSWORD_MIN_LENGTH;
const PASSWORD_MAX_LENGTH = AUTH_CONSTRAINTS.PASSWORD_MAX_LENGTH;
const NAME_MAX_LENGTH = AUTH_CONSTRAINTS.NAME_MAX_LENGTH;

export const authSchema = z.object({
	email: z.email({ error: "Invalid email address" }),
	password: z
		.string()
		.min(PASSWORD_MIN_LENGTH, {
			error: `Password must be at least ${PASSWORD_MIN_LENGTH} characters`,
		})
		.max(PASSWORD_MAX_LENGTH, {
			error: "Password is too long",
		}),
});

export const signUpSchema = authSchema
	.extend({
		name: z
			.string()
			.nonempty({ error: "Name is required" })
			.max(NAME_MAX_LENGTH, { error: "Name is too long" }),
		confirmPassword: z.string(),
	})
	.refine((data) => data.password === data.confirmPassword, {
		message: "Passwords do not match",
		path: ["confirmPassword"],
	});
