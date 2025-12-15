import type { QueryClient } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { createRootRouteWithContext, Outlet } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
import { Toaster } from "sonner";
import { Header } from "@/components/header";

interface AppRouterContext {
	queryClient: QueryClient;
}

export const Route = createRootRouteWithContext<AppRouterContext>()({
	component: () => (
		<>
			<div className="flex min-h-screen flex-col bg-[#f5f5ed] text-foreground">
				<Header />
				<main className="container mx-auto grow p-4">
					<Outlet />
				</main>
				<footer className="p-4 text-center">
					<p className="text-muted-foreground text-sm">
						&copy; 2025 HackerNews
					</p>
				</footer>
			</div>
			<Toaster />
			<TanStackRouterDevtools />
			<ReactQueryDevtools />
		</>
	),
});
