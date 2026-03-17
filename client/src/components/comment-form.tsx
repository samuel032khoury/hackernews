import { createCommentSchema } from "@shared/validators/comments.validation";
import { useForm } from "@tanstack/react-form";
import { useCreateComment } from "@/hooks/comments/use-create-comment";
import { FieldError } from "./fieldError";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";

export function CommentForm({
	postId,
	parentCommentId,
	onCompletion,
}: {
	postId: string;
	parentCommentId?: string;
	onCompletion?: () => void;
}) {
	const { mutateAsync: createComment } = useCreateComment();
	const form = useForm({
		defaultValues: {
			content: "",
		},
		validators: {
			onChange: createCommentSchema,
		},
		onSubmit: async ({ value }) => {
			await createComment(
				{
					postId: postId,
					content: value.content,
					parentCommentId: parentCommentId ?? null,
				},
				{
					onSuccess: (data) => {
						if (!data.success) {
							return;
						}
						form.reset();
						onCompletion?.();
					},
				},
			);
		},
	});
	const isSubmitting = form.baseStore.state.isSubmitting;
	return (
		<form
			onSubmit={(e) => {
				e.preventDefault();
				e.stopPropagation();
				form.handleSubmit();
			}}
			className="grid gap-2"
		>
			<form.Field name="content">
				{(field) => (
					<div className="grid gap-2">
						<Textarea
							id={field.name}
							aria-label={field.name}
							name={field.name}
							value={field.state.value}
							onBlur={field.handleBlur}
							onChange={(e) => field.handleChange(e.target.value)}
							placeholder="Enter comments here..."
							rows={4}
							className="w-full p-2 text-sm"
							disabled={isSubmitting}
						/>
						<FieldError field={field} showOnChange />
					</div>
				)}
			</form.Field>
			<div className="flex justify-end space-x-2">
				<Button
					type="button"
					variant="outline"
					onClick={() => {
						form.reset();
						onCompletion?.();
					}}
					disabled={isSubmitting}
				>
					{parentCommentId ? "Cancel" : "Reset"}
				</Button>
				<form.Subscribe
					selector={(state) => [
						state.canSubmit,
						state.isSubmitting,
						state.isPristine,
					]}
				>
					{([canSubmit, isSubmitting, isPristine]) => (
						<Button
							type="submit"
							disabled={!canSubmit || isSubmitting || isPristine}
						>
							{isSubmitting ? "Submitting..." : "Add Comment"}
						</Button>
					)}
				</form.Subscribe>
			</div>
		</form>
	);
}
