import type { paginationSchema } from "@shared/validators/search.validation";
import { infiniteQueryOptions } from "@tanstack/react-query";
import type z from "zod";
import { api } from "@/lib/api";
import type { pathSearchSchema } from "@/validators/path.validation";

export const commentsInfiniteQueryOptions = ({
	id,
	sortBy,
	order,
}: z.infer<typeof pathSearchSchema>) =>
	infiniteQueryOptions({
		queryKey: ["comments", "post", id, sortBy, order],
		queryFn: async ({ pageParam }) =>
			getComments(id, {
				page: pageParam,
				limit: 10,
				sortBy,
				order,
			}),
		initialPageParam: 1,
		staleTime: Infinity,
		retry: false,
		getNextPageParam: (lastPage, _, lastPageParam) => {
			if (lastPage.pagination.totalPages <= lastPageParam) {
				return undefined;
			}
			return lastPageParam + 1;
		},
	});

export const getComments = async (
	postId: string,
	pagination: z.infer<typeof paginationSchema>,
) => {
	const { page, limit, sortBy, order } = pagination;
	const res = await api.posts[":id"].comments.$get({
		param: { id: postId },
		query: {
			page: page.toString(),
			limit: limit.toString(),
			sortBy,
			order,
			includeChildren: "true",
		},
	});
	const data = await res.json();
	if (!data.success) {
		throw new Error(`Failed to fetch comments: ${data.message}`);
	}
	return data;
};
