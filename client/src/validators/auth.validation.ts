import { authConfig } from "@shared/config";
import { z } from "zod";

const PASSWORD_MIN_LENGTH = authConfig.password.minLength;
const PASSWORD_MAX_LENGTH = authConfig.password.maxLength;
const NAME_MAX_LENGTH = authConfig.name.maxLength;
const USERNAME_MIN_LENGTH = authConfig.username.minLength;

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
