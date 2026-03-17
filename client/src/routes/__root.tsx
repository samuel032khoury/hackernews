import type { QueryClient } from "@tanstack/react-query";
import { createRootRouteWithContext, Outlet } from "@tanstack/react-router";
import { lazy, Suspense } from "react";
import { Toaster } from "sonner";
import { Header } from "@/components/header";
import { CurrentUserProvider } from "@/contexts/current-user-context";
import { currentUserQueryOptions } from "@/services/users";

const TanStackRouterDevtools = import.meta.env.DEV
	? lazy(() =>
			import("@tanstack/react-router-devtools").then((m) => ({
				default: m.TanStackRouterDevtools,
			})),
		)
	: () => null;

const ReactQueryDevtools = import.meta.env.DEV
	? lazy(() =>
			import("@tanstack/react-query-devtools").then((m) => ({
				default: m.ReactQueryDevtools,
			})),
		)
	: () => null;

interface AppRouterContext {
	queryClient: QueryClient;
}

export const Route = createRootRouteWithContext<AppRouterContext>()({
	beforeLoad: async ({ context }) => {
		await context.queryClient.ensureQueryData(currentUserQueryOptions);
	},
	component: () => (
		<CurrentUserProvider>
			<div className="flex min-h-screen flex-col bg-[#f5f5ed] text-foreground">
				<Header />
				<main className="container mx-auto grow p-4">
					<Outlet />
				</main>
				<footer className="p-4 text-center">
					<p className="text-muted-foreground text-sm">
						&copy; {new Date().getFullYear()} HackerNews
					</p>
				</footer>
			</div>
			<Toaster />
			<Suspense>
				<TanStackRouterDevtools />
				<ReactQueryDevtools />
			</Suspense>
		</CurrentUserProvider>
	),
});
