import { AUTH_CONSTRAINTS } from "@shared/constants";
import { z } from "zod";

const PASSWORD_MIN_LENGTH = AUTH_CONSTRAINTS.PASSWORD_MIN_LENGTH;
const PASSWORD_MAX_LENGTH = AUTH_CONSTRAINTS.PASSWORD_MAX_LENGTH;
const NAME_MAX_LENGTH = AUTH_CONSTRAINTS.NAME_MAX_LENGTH;
const USERNAME_MIN_LENGTH = AUTH_CONSTRAINTS.USERNAME_MIN_LENGTH;

export const signUpSchema = z
	.object({
		email: z.email({ error: "Invalid email address" }),
		password: z
			.string()
			.min(PASSWORD_MIN_LENGTH, {
				error: `Password must be at least ${PASSWORD_MIN_LENGTH} characters`,
			})
			.max(PASSWORD_MAX_LENGTH, {
				error: "Password is too long",
			}),
		username: z.string().min(USERNAME_MIN_LENGTH, {
			error: `Username must be at least ${USERNAME_MIN_LENGTH} characters`,
		}),
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

export const logInSchema = z.object({
	username: z.string().nonempty({ error: "Username is required" }),
	password: z.string().nonempty({ error: "Password is required" }),
});
