import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { PostCard } from "@/components/post-card";
import { PostCommentsSection } from "@/components/post-comments-section";
import { commentsInfiniteQueryOptions } from "@/services/comments";
import { postQueryOptions } from "@/services/posts";
import { searchSchema } from "@/validators/search.validation";

export const Route = createFileRoute("/post/$id")({
	component: Post,
	validateSearch: searchSchema,
	loaderDeps: ({ search }) => ({
		sortBy: search.sortBy,
		order: search.order,
	}),
	loader: async ({ context, deps: { sortBy, order }, params: { id } }) => {
		await context.queryClient.ensureQueryData(postQueryOptions(id));
		await context.queryClient.ensureInfiniteQueryData(
			commentsInfiniteQueryOptions(id, { sortBy, order }),
		);
	},
});

function Post() {
	const { id } = Route.useParams();
	const { data } = useSuspenseQuery(postQueryOptions(id));
	return (
		<div className="mx-auto max-w-3xl">
			{data && <PostCard post={data} />}
			<PostCommentsSection postId={id} />
		</div>
	);
}
