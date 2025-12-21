import { createFileRoute } from "@tanstack/react-router";
import { api } from "@/lib/api";
import { pathSearchSchema } from "@/validators/path.validation";

export const Route = createFileRoute("/post")({
	component: Post,
	validateSearch: pathSearchSchema,
});

const getPost = async (id: number) => {
	const res = await api.posts[":id"].$get({ param: { id: id.toString() } });
	if (res.ok) {
		return await res.json();
	} else {
		const data = await res.json();
		if (data.success === false) {
			throw new Error(data.message);
		}
	}
};

function Post() {
	const { id, sortBy, order } = Route.useSearch();
	return <div>Hello "/post"! {id}</div>;
}
