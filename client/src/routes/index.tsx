import { useSuspenseInfiniteQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { PostCard } from "@/components/post-card";
import { SortBar } from "@/components/sort-bar";
import { Button } from "@/components/ui/button";
import { postsInfiniteQueryOptions } from "@/services/posts";
import { homeSearchSchema } from "@/validators/search.validation";

export const Route = createFileRoute("/")({
	component: Index,
	validateSearch: homeSearchSchema,
	loaderDeps: ({ search }) => ({
		sortBy: search.sortBy,
		order: search.order,
		author: search.author,
		site: search.site,
	}),
	loader: ({ context, deps: { sortBy, order, author, site } }) => {
		context.queryClient.ensureInfiniteQueryData(
			postsInfiniteQueryOptions({ sortBy, order, author, site }),
		);
	},
});

function Index() {
	const { sortBy, order, author, site } = Route.useSearch();
	const { data, isFetchingNextPage, isFetching, fetchNextPage, hasNextPage } =
		useSuspenseInfiniteQuery(
			postsInfiniteQueryOptions({ sortBy, order, author, site }),
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
					disabled={!hasNextPage || isFetching}
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
