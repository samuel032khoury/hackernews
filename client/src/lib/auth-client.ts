import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
	basePath: "/api/auth",
});

export type AuthError = {
	code?: string;
	message?: string;
	status: number;
	statusText: string;
};

export class SignUpError extends Error {
	code?: string;

	constructor(error: AuthError) {
		super(error.message ?? error.statusText);
		this.code = error.code;
		this.name = "SignUpError";
	}
}

export const signUp = async ({
	name,
	email,
	password,
}: {
	name: string;
	email: string;
	password: string;
}) => {
	const res = await authClient.signUp.email({ name, email, password });
	if (res.error) {
		throw new SignUpError(res.error);
	}
	return res.data;
};
