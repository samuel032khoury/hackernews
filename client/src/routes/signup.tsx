import type { ApiError } from "@shared/types";
import { useForm } from "@tanstack/react-form";
import { useQueryClient } from "@tanstack/react-query";
import {
	createFileRoute,
	Link,
	redirect,
	useNavigate,
	useRouter,
} from "@tanstack/react-router";
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
import { currentUserQueryOptions } from "@/services/current-user";
import { signUpSchema } from "@/validators/auth.validation";
import { urlRedirectSchema } from "@/validators/url.validation";

export const Route = createFileRoute("/signup")({
	component: SignUp,
	validateSearch: urlRedirectSchema,
	beforeLoad: async ({ context, search }) => {
		const currentUser = await context.queryClient.ensureQueryData(
			currentUserQueryOptions,
		);
		if (currentUser) {
			throw redirect({
				to: search.redirect,
			});
		}
	},
});

const signUp = async ({
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

function SignUp() {
	const search = Route.useSearch();
	const router = useRouter();
	const navigate = useNavigate();
	const queryClient = useQueryClient();
	const [showPassword, setShowPassword] = useState(false);
	const form = useForm({
		defaultValues: {
			name: "",
			email: "",
			username: "",
			password: "",
			confirmPassword: "",
		},
		validators: {
			onChange: signUpSchema,
		},
		onSubmit: async ({ value }) => {
			const result = await signUp({
				name: value.name,
				username: value.username,
				email: value.email,
				password: value.password,
			});

			if (result.success) {
				toast.success("Account created successfully");
				router.invalidate();
				queryClient.invalidateQueries({ queryKey: ["currentUser"] });
				navigate({ to: search.redirect });
				return;
			}

			if (result.code === "USERNAME_IS_ALREADY_TAKEN_PLEASE_TRY_ANOTHER") {
				form.setFieldMeta("username", (prev) => ({
					...prev,
					errorMap: {
						onSubmit: "This username is already taken",
					},
				}));
			} else if (result.code === "USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL") {
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
					</CardHeader>
					<CardContent>
						<div className="grid gap-2">
							<form.Field name="name">
								{(field) => (
									<div className="grid gap-2">
										<Label htmlFor={field.name}>Full Name</Label>
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
							<form.Field name="username">
								{(field) => (
									<div className="grid gap-2">
										<Label htmlFor={field.name}>Username</Label>
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
							<p className="mt-2 text-center text-muted-foreground text-sm">
								Already have an account?{" "}
								<Link
									to="/login"
									search={{ redirect: search.redirect }}
									className="text-primary underline hover:text-primary/80"
								>
									Log in
								</Link>
							</p>
						</div>
					</CardContent>
				</form>
			</Card>
		</div>
	);
}
