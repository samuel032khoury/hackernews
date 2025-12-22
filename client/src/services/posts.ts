import type { paginationSchema } from "@shared/validators/search.validation";
import { infiniteQueryOptions } from "@tanstack/react-query";
import type z from "zod";
import { api } from "@/lib/api";

export const postsInfiniteQueryOptions = ({
	sortBy,
	limit,
	order,
	author,
	site,
}: z.infer<typeof paginationSchema>) =>
	infiniteQueryOptions({
		queryKey: ["posts", sortBy, order, author, site],
		queryFn: ({ pageParam }) =>
			getAllPosts({ page: pageParam, limit, sortBy, order, author, site }),
		initialPageParam: 1,
		staleTime: Infinity,
		getNextPageParam: (lastPage, _, lastPageParam) => {
			if (lastPage.pagination.totalPages <= lastPageParam) {
				return undefined;
			}
			return lastPageParam + 1;
		},
	});

export const getAllPosts = async ({
	page = 1,
	sortBy,
	order,
	author,
	site,
}: z.infer<typeof paginationSchema>) => {
	const res = await api.posts.$get({
		query: {
			page: page.toString(),
			sortBy,
			order,
			author,
			site,
		},
	});
	const data = await res.json();
	if (data.success) {
		return data;
	} else {
		throw new Error(data.message);
	}
};

export const getPost = async (id: number) => {
	const res = await api.posts[":id"].$get({ param: { id: id.toString() } });
	const data = await res.json();
	if (data.success) {
		return data;
	} else {
		throw new Error(data.message);
	}
};

export const submitPost = async (
	title: string,
	url: string,
	content: string,
) => {
	try {
		const res = await api.posts.$post({
			form: { title, url, content },
		});
		return await res.json();
	} catch {
		return {
			success: false as const,
			message: "Network error",
		};
	}
};

export const upvotePost = async (id: string) => {
	const res = await api.posts[":id"].upvote.$post({ param: { id } });
	return await res.json();
};
