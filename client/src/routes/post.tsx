import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { PostCard } from "@/components/post-card";
import { postQueryOptions } from "@/services/posts";
import { pathPostSchema } from "@/validators/path.validation";

export const Route = createFileRoute("/post")({
	component: Post,
	validateSearch: pathPostSchema,
});

function Post() {
	const { id } = Route.useSearch();
	// get data with suspense
	const { data } = useSuspenseQuery(postQueryOptions(id));
	return (
		<div className="mx-auto max-w-3xl">
			{data && <PostCard post={data.data} />}
		</div>
	);
}
