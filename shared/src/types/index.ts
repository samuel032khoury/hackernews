export type ApiResponse<T = void> = {
	success: true;
	message: string;
} & (T extends void ? object : { data: T });

export type ApiError = {
	success: false;
	error: string;
};

export type FormValidationError = {
	success: false;
	errors: Record<string, string>;
};
