import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
	component: Index,
});

function Index() {
	return (
		<div className="max-w-xl mx-auto flex flex-col gap-6 items-center justify-center min-h-screen">
			<div className="flex flex-col items-center gap-4">
				<h1 className="text-2xl font-bold">Hello World</h1>
			</div>
		</div>
	);
}
