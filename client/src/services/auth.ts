import type { ApiError } from "@shared/types";
import { authClient } from "@/lib/auth-client";

export const signIn = async ({
	username,
	password,
}: {
	username: string;
	password: string;
}) => {
	const res = await authClient.signIn.username({
		username,
		password,
	});
	if (res.error || !res.data) {
		return {
			success: false,
			message: res.error?.message ?? "Log in failed",
			code: res.error?.code,
		} satisfies ApiError;
	}
	return { success: true, data: res.data };
};

export const signUp = async ({
	name,
	username,
	email,
	password,
}: {
	name: string;
	username: string;
	email: string;
	password: string;
}) => {
	const res = await authClient.signUp.email({
		name,
		username,
		email,
		password,
	});
	if (res.error || !res.data) {
		return {
			success: false,
			message: res.error?.message ?? "Sign up failed",
			code: res.error?.code,
		} satisfies ApiError;
	}
	return { success: true, data: res.data };
};
