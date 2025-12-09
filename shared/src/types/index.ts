export type ApiResponse<T = void> = {
	success: true;
	message: string;
} & (T extends void ? object : { data: T });

type ValidationError = {
	name: "ValidationError";
	issues: object[];
};

export type ApiError = {
	success: false;
	error: string | ValidationError;
	isFormError?: boolean;
};
