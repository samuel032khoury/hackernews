import { createPostSchema } from "@shared/validators/posts.validation";
import { useForm } from "@tanstack/react-form";
import { useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useBlocker, useRouter } from "@tanstack/react-router";
import { toast } from "sonner";
import { FieldError } from "@/components/fieldError";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { submitPost } from "@/services/posts";

export const Route = createFileRoute("/_auth/submit")({
	component: Submit,
});

function Submit() {
	const queryClient = useQueryClient();
	const router = useRouter();
	const form = useForm({
		defaultValues: {
			title: "",
			url: "",
			content: "",
		},
		validators: {
			onChange: createPostSchema,
		},
		onSubmit: async ({ value }) => {
			const res = await submitPost(value.title, value.url, value.content);
			if (res.success) {
				await queryClient.invalidateQueries({ queryKey: ["posts"] });
				await router.invalidate();
				form.reset();
				await router.navigate({
					to: "/post",
					search: { id: res.data.postId },
				});
				return;
			} else {
				toast.error("Submission Failed", {
					description: res.message || "Unknown error",
				});
			}
		},
	});
	useBlocker({
		shouldBlockFn: () =>
			form.state.isDirty &&
			!confirm("Form will not be saved. Are you sure you want to leave?"),
		enableBeforeUnload: () => form.state.isDirty,
	});
	return (
		<div className="w-full">
			<Card className="mx-auto mt-12 max-w-lg border-border/25">
				<CardHeader>
					<CardTitle>Create New Post</CardTitle>
					<CardDescription>
						Share a link or start a discussion. Add a URL to share an article,
						or leave it empty and add text to ask a question.
					</CardDescription>
				</CardHeader>
				<CardContent>
					<form
						onSubmit={(e) => {
							e.preventDefault();
							e.stopPropagation();
							form.handleSubmit();
						}}
						className="grid gap-4"
					>
						<div className="grid gap-4">
							<form.Field name="title">
								{(field) => (
									<div className="grid gap-2">
										<Label htmlFor={field.name}>
											Title <span className="text-red-500">*</span>
										</Label>
										<Input
											id={field.name}
											name={field.name}
											value={field.state.value}
											onBlur={field.handleBlur}
											onChange={(e) => field.handleChange(e.target.value)}
											placeholder="Post title"
										/>
										<FieldError field={field} />
									</div>
								)}
							</form.Field>
							<form.Field name="url">
								{(field) => (
									<div className="grid gap-2">
										<Label htmlFor={field.name}>URL</Label>
										<Input
											id={field.name}
											name={field.name}
											value={field.state.value}
											onBlur={field.handleBlur}
											onChange={(e) => field.handleChange(e.target.value)}
											placeholder="https://example.com"
										/>
										<FieldError field={field} />
									</div>
								)}
							</form.Field>
							<form.Subscribe selector={(state) => state.values.url}>
								{(url) => {
									const isValidUrl =
										url !== "" &&
										createPostSchema.shape.url.safeParse(url).success;
									return (
										<form.Field name="content">
											{(field) => (
												<div className="grid gap-2">
													<Label htmlFor={field.name}>
														Content{" "}
														{!isValidUrl && (
															<span className="text-red-500">*</span>
														)}
													</Label>
													<Textarea
														id={field.name}
														name={field.name}
														value={field.state.value}
														onBlur={field.handleBlur}
														onChange={(e) => field.handleChange(e.target.value)}
														placeholder="Enter text content here"
													/>
													<FieldError field={field} />
												</div>
											)}
										</form.Field>
									);
								}}
							</form.Subscribe>
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
										className="w-full"
									>
										{isSubmitting ? "Signing Up..." : "Submit Post"}
									</Button>
								)}
							</form.Subscribe>
						</div>
					</form>
				</CardContent>
			</Card>
		</div>
	);
}
