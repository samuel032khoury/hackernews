import { paginationSchema } from "@shared/validators/search.validation";
import { useSuspenseInfiniteQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { postsInfiniteQueryOptions } from "@/services/posts";

export const Route = createFileRoute("/")({
	component: Index,
	validateSearch: paginationSchema,
});

function Index() {
	const { page, limit, sortBy, order, author, site } = Route.useSearch();
	const { data } = useSuspenseInfiniteQuery(
		postsInfiniteQueryOptions({ page, limit, sortBy, order, author, site }),
	);
	return (
		<div className="p-2">
			<h3>Welcome Home!</h3>
			{JSON.stringify(data)}
		</div>
	);
}
