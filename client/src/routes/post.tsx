import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { PostCard } from "@/components/post-card";
import { postQueryOptions } from "@/services/posts";
import { pathSearchSchema } from "@/validators/path.validation";

export const Route = createFileRoute("/post")({
	component: Post,
	validateSearch: pathSearchSchema,
});

function Post() {
	const { id } = Route.useSearch();
	const { data } = useSuspenseQuery(postQueryOptions(id));
	return (
		<div className="mx-auto max-w-3xl">
			{data && <PostCard post={data.data} />}
		</div>
	);
}
