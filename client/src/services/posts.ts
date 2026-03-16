import type { paginationSchema } from "@shared/validators/search.validation";
import {
	infiniteQueryOptions,
	keepPreviousData,
	queryOptions,
} from "@tanstack/react-query";
import { notFound } from "@tanstack/react-router";
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
		queryFn: ({ pageParam: page }) =>
			getAllPosts({ page, limit, sortBy, order, author, site }),
		placeholderData: keepPreviousData,
		initialPageParam: 1,
		staleTime: Infinity,
		getNextPageParam: (lastPage, _, lastPageParam) => {
			if (lastPage.pagination.totalPages <= lastPageParam) {
				return undefined;
			}
			return lastPageParam + 1;
		},
	});

export const postQueryOptions = (id: string) =>
	queryOptions({
		queryKey: ["post", id],
		queryFn: () => getPost(id),
		staleTime: Infinity,
		retry: false,
		throwOnError: true,
		select: (data) => data.data,
	});

const getAllPosts = async ({
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

const getPost = async (id: string) => {
	const res = await api.posts[":id"].$get({ param: { id } });
	const data = await res.json();
	if (data.success) {
		return data;
	} else {
		if (res.status === 404) {
			throw notFound();
		}
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

export async function upvotePost(postId: string) {
	const res = await api.posts[":id"].upvote.$post({ param: { id: postId } });
	const data = await res.json();
	if (!data.success) {
		throw new Error(data.message);
	}
	return data;
}
