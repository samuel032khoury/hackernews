import { paginationSchema } from "@shared/validators/search.validation";
import { useSuspenseInfiniteQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { PostCard } from "@/components/post-card";
import { SortBar } from "@/components/sort-bar";
import { Button } from "@/components/ui/button";
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
		<div className="mx-auto max-w-6xl p-4">
			<h1 className="mb-6 font-bold text-2xl text-foreground">Submissions</h1>
			<SortBar sortBy={sortBy} order={order} />
			<div className="space-y-3">
				{data?.pages.map((page) =>
					page.data.map((post) => <PostCard key={post.id} post={post} />),
				)}
			</div>
			<div className="mt-6 flex justify-center">
				<Button
					onClick={() => fetchNextPage()}
					disabled={!hasNextPage || isFetchingNextPage}
				>
					{isFetchingNextPage
						? "Loading more..."
						: hasNextPage
							? "Load More"
							: "No more posts"}
				</Button>
			</div>
		</div>
	);
}
