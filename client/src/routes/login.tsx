import { Label } from "@radix-ui/react-label";
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
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { authClient } from "@/lib/auth-client";
import { currentUserQueryOptions } from "@/services/current-user";
import { logInSchema } from "@/validators/auth.validation";
import { pathRedirectSchema } from "@/validators/path.validation";

export const Route = createFileRoute("/login")({
	component: Login,
	validateSearch: pathRedirectSchema,
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

const signIn = async ({
	username,
	password,
}: {
	username: string;
	password: string;
}) => {
	const res = await authClient.signIn.username({
		username,
		password,
	});
	if (res.error || !res.data) {
		return {
			success: false,
			message: res.error?.message ?? "Log in failed",
			code: res.error?.code,
		} satisfies ApiError;
	}
	return { success: true, data: res.data };
};

function Login() {
	const search = Route.useSearch();
	const router = useRouter();
	const navigate = useNavigate();
	const queryClient = useQueryClient();
	const form = useForm({
		defaultValues: {
			username: "",
			password: "",
		},
		validators: {
			onChange: logInSchema,
		},
		onSubmit: async ({ value }) => {
			const result = await signIn({
				username: value.username,
				password: value.password,
			});

			if (result.success) {
				toast.success("Logged in successfully");
				await queryClient.invalidateQueries({ queryKey: ["currentUser"] });
				await router.invalidate();
				await navigate({ to: search.redirect });
				return;
			} else {
				toast.error("Sign in failed", {
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
						<CardTitle className="text-center text-2xl">Log In</CardTitle>
						<CardDescription className="mb-[0.8rem] text-center text-muted-foreground text-sm">
							Use your username and password to log in!
						</CardDescription>
					</CardHeader>
					<CardContent>
						<div className="grid gap-4">
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
									</div>
								)}
							</form.Field>
							<form.Field name="password">
								{(field) => (
									<div className="grid gap-2">
										<Label htmlFor={field.name}>Password</Label>
										<Input
											id={field.name}
											name={field.name}
											type="password"
											value={field.state.value}
											onBlur={field.handleBlur}
											onChange={(e) => field.handleChange(e.target.value)}
										/>
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
										{isSubmitting ? "Logging In..." : "Log In"}
									</Button>
								)}
							</form.Subscribe>
							<p className="mt-2 text-center text-muted-foreground text-sm">
								Don't have an account?{" "}
								<Link
									to="/signup"
									search={{ redirect: search.redirect }}
									className="text-primary underline hover:text-primary/80"
								>
									Sign up
								</Link>
							</p>
						</div>
					</CardContent>
				</form>
			</Card>
		</div>
	);
}
