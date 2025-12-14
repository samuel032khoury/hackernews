import type { AnyFieldApi } from "@tanstack/react-form";

export function FieldError({ field }: { field: AnyFieldApi }) {
	const errors = field.state.meta.errors;
	const submitError = field.state.meta.errorMap.onSubmit;
	// Show validation errors
	if (submitError) {
		return (
			<p className="font-light text-[0.7rem] text-destructive">
				{typeof submitError === "string" ? submitError : String(submitError)}
			</p>
		);
	}
	if (
		!field.state.meta.isPristine &&
		field.state.meta.isBlurred &&
		errors.length > 0
	) {
		return (
			<p className="font-light text-[0.7rem] text-destructive">
				{errors.map((err) => err.message).join(", ")}
			</p>
		);
	}

	return <p className="font-medium text-[0.7rem] text-destructive">&nbsp;</p>;
}
