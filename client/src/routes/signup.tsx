import type { ApiError } from "@shared/types";
import { useForm } from "@tanstack/react-form";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";
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
import { authClient } from "@/lib/auth-client";
import { signUpSchema } from "@/validators/auth.validation";
import { urlRedirectSchema } from "@/validators/url.validation";

export const Route = createFileRoute("/signup")({
	component: SignUp,
	validateSearch: urlRedirectSchema,
});

const signUp = async ({
	name,
	email,
	password,
}: {
	name: string;
	email: string;
	password: string;
}) => {
	const res = await authClient.signUp.email({ name, email, password });
	if (res.error || !res.data) {
		return {
			success: false,
			message: res.error?.message ?? "Sign up failed",
			code: res.error?.code,
		} satisfies ApiError;
	}
	return { success: true, data: res.data };
};

function SignUp() {
	const search = Route.useSearch();
	const navigate = useNavigate();
	const [showPassword, setShowPassword] = useState(false);
	const form = useForm({
		defaultValues: {
			name: "",
			email: "",
			password: "",
			confirmPassword: "",
		},
		validators: {
			onChange: signUpSchema,
		},
		onSubmit: async ({ value }) => {
			const result = await signUp({
				name: value.name,
				email: value.email,
				password: value.password,
			});

			if (result.success) {
				navigate({ to: search.redirect });
				return;
			}

			if (result.code === "USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL") {
				form.setFieldMeta("email", (prev) => ({
					...prev,
					errorMap: {
						onSubmit: "This email is already registered",
					},
				}));
			} else {
				toast.error("Sign up failed", {
					description: result.message,
				});
			}
		},
	});

	return (
		<div className="w-full">
			<Card className="mx-auto mt-12 max-w-sm border-border/25">
				<form
					onSubmit={(e) => {
						e.preventDefault();
						e.stopPropagation();
						form.handleSubmit();
					}}
				>
					<CardHeader>
						<CardTitle className="text-center text-2xl">Sign Up</CardTitle>
						<CardDescription className="mb-[0.8rem] text-center text-muted-foreground text-sm">
							Create an account to get started!
						</CardDescription>
						<CardContent>
							<div className="grid gap-2">
								<form.Field name="name">
									{(field) => (
										<div className="grid gap-2">
											<Label htmlFor={field.name}>Name</Label>
											<Input
												id={field.name}
												name={field.name}
												value={field.state.value}
												onBlur={field.handleBlur}
												onChange={(e) => field.handleChange(e.target.value)}
											/>
											<FieldError field={field} />
										</div>
									)}
								</form.Field>
								<form.Field name="email">
									{(field) => (
										<div className="grid gap-2">
											<Label htmlFor={field.name}>Email</Label>
											<Input
												id={field.name}
												name={field.name}
												type="email"
												value={field.state.value}
												onBlur={field.handleBlur}
												onChange={(e) => field.handleChange(e.target.value)}
											/>
											<FieldError field={field} />
										</div>
									)}
								</form.Field>
								<form.Field name="password">
									{(field) => (
										<div className="grid gap-2">
											<Label htmlFor={field.name}>Password</Label>
											<div className="relative">
												<Input
													id={field.name}
													name={field.name}
													type={showPassword ? "text" : "password"}
													value={field.state.value}
													onBlur={field.handleBlur}
													onChange={(e) => field.handleChange(e.target.value)}
													className="pr-10"
												/>
												<button
													type="button"
													className="-translate-y-1/2 absolute top-1/2 right-3 text-muted-foreground hover:text-foreground"
													onClick={() => setShowPassword(!showPassword)}
													tabIndex={-1}
												>
													{showPassword ? (
														<EyeOff className="h-4 w-4" />
													) : (
														<Eye className="h-4 w-4" />
													)}
												</button>
											</div>
											<FieldError field={field} />
										</div>
									)}
								</form.Field>
								<form.Field name="confirmPassword">
									{(field) => (
										<div className="grid gap-2">
											<Label htmlFor={field.name}>Confirm Password</Label>
											<div className="relative">
												<Input
													id={field.name}
													name={field.name}
													type={showPassword ? "text" : "password"}
													value={field.state.value}
													onBlur={field.handleBlur}
													onChange={(e) => field.handleChange(e.target.value)}
													className="pr-10"
												/>
												<button
													type="button"
													className="-translate-y-1/2 absolute top-1/2 right-3 text-muted-foreground hover:text-foreground"
													onClick={() => setShowPassword(!showPassword)}
													tabIndex={-1}
												>
													{showPassword ? (
														<EyeOff className="h-4 w-4" />
													) : (
														<Eye className="h-4 w-4" />
													)}
												</button>
											</div>
											<FieldError field={field} />
										</div>
									)}
								</form.Field>
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
											{isSubmitting ? "Signing Up..." : "Sign Up"}
										</Button>
									)}
								</form.Subscribe>
							</div>
						</CardContent>
					</CardHeader>
				</form>
			</Card>
		</div>
	);
}
