import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createRouter, RouterProvider } from "@tanstack/react-router";
import { StrictMode } from "react";
import ReactDOM from "react-dom/client";
import "./index.css";

const queryClient = new QueryClient();

import { ErrorComponent } from "./components/errorComponent";
import { LoadingComponent } from "./components/loadingComponent";
import { NotFoundComponent } from "./components/notFoundComponent";
// Import the generated route tree
import { routeTree } from "./routeTree.gen";

// Create a new router instance
const router = createRouter({
	routeTree,
	defaultPreload: "intent",
	defaultStaleTime: 0,
	context: { queryClient },
	defaultNotFoundComponent: NotFoundComponent,
	defaultErrorComponent: ErrorComponent,
	defaultPendingComponent: LoadingComponent,
});

// Register the router instance for type safety
declare module "@tanstack/react-router" {
	interface Register {
		router: typeof router;
	}
}

const rootElement = document.getElementById("root");

if (!rootElement) {
	throw new Error(
		"Root element not found. Check if it's in your index.html or if the id is correct.",
	);
}

// Render the app
if (!rootElement.innerHTML) {
	const root = ReactDOM.createRoot(rootElement);
	root.render(
		<StrictMode>
			<QueryClientProvider client={queryClient}>
				<RouterProvider router={router} />
			</QueryClientProvider>
		</StrictMode>,
	);
}
