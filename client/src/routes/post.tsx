import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { PostCard } from "@/components/post-card";
import { PostCommentsSection } from "@/components/post-comments-section";
import { commentsInfiniteQueryOptions } from "@/services/comments";
import { postQueryOptions } from "@/services/posts";
import { postSearchSchema } from "@/validators/search.validation";

export const Route = createFileRoute("/post")({
	component: Post,
	validateSearch: postSearchSchema,
	loaderDeps: ({ search }) => ({
		id: search.id,
		sortBy: search.sortBy,
		order: search.order,
	}),
	loader: async ({ context, deps: { id, sortBy, order } }) => {
		await Promise.all([
			context.queryClient.ensureQueryData(postQueryOptions(id)),
			context.queryClient.ensureInfiniteQueryData(
				commentsInfiniteQueryOptions({ id: id, sortBy, order }),
			),
		]);
	},
});

function Post() {
	const { id } = Route.useSearch();
	const { data } = useSuspenseQuery(postQueryOptions(id));
	return (
		<div className="mx-auto max-w-3xl">
			{data && <PostCard post={data} />}
			<PostCommentsSection postId={id} />
		</div>
	);
}
