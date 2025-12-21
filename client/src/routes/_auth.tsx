import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { currentUserQueryOptions } from "@/services/users";

export const Route = createFileRoute("/_auth")({
	component: () => <Outlet />,
	beforeLoad: async ({ context, location }) => {
		const currentUser = await context.queryClient.ensureQueryData(
			currentUserQueryOptions,
		);
		if (!currentUser) {
			throw redirect({ to: "/login", search: { redirect: location.href } });
		}
	},
});
