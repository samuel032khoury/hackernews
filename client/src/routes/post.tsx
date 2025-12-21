import { createFileRoute } from "@tanstack/react-router";
import { pathSearchSchema } from "@/validators/path.validation";

export const Route = createFileRoute("/post")({
	component: Post,
	validateSearch: pathSearchSchema,
});

function Post() {
	const { id, sortBy, order } = Route.useSearch();
	return <div>Hello "/post"! {id}</div>;
}
