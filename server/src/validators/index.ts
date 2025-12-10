type ValidationResult = { success: true } | { success: false; error: Error };

export const throwOnError = (result: ValidationResult) => {
	if (!result.success) throw result.error;
};
