import { paginationSchema } from "@shared/validators/search.validation";
import { useSuspenseInfiniteQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { PostCard } from "@/components/post-card";
import { SortBar } from "@/components/sort-bar";
import { postsInfiniteQueryOptions } from "@/services/posts";

export const Route = createFileRoute("/")({
	component: Index,
	validateSearch: paginationSchema,
});

function Index() {
	const { page, limit, sortBy, order, author, site } = Route.useSearch();
	const { data, isFetchingNextPage, fetchNextPage, hasNextPage } =
		useSuspenseInfiniteQuery(
			postsInfiniteQueryOptions({ page, limit, sortBy, order, author, site }),
		);
	return (
		<div className="mx-auto max-w-3xl p-4">
			<h1 className="mb-6 font-bold text-2xl text-foreground">Submissions</h1>
			<SortBar sortBy={sortBy} order={order} />
			{data?.pages.map((page) =>
				page.data.map((post) => <PostCard key={post.id} post={post} />),
			)}
		</div>
	);
}
