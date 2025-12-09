export type ApiResponse<T = void> = {
	success: true;
	message: string;
} & (T extends void ? object : { data: T });

export type ValidationError = {
	name: "ValidationError";
	issues: { path: PropertyKey[]; message: string }[];
};

export type ApiError = {
	success: false;
	error: string | ValidationError;
	isFormError?: boolean;
};
