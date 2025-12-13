import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
	component: Index,
});

function Index() {
	throw new Error("Test error");

	return <div>Hello world</div>;
}
