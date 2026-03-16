import type { Comment } from "@shared/types";
import type { paginationSchema } from "@shared/validators/search.validation";
import { infiniteQueryOptions, keepPreviousData } from "@tanstack/react-query";
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
		placeholderData: keepPreviousData,
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

const getComments = async (
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
export const subCommentsInfiniteQueryOptions = (comment: Comment) =>
	infiniteQueryOptions({
		queryKey: ["comments", "comment", comment.id],
		queryFn: async ({ pageParam }) => getSubComments(comment.id, pageParam),
		initialPageParam: 1,
		staleTime: Infinity,
		initialData: {
			pageParams: [1],
			pages: [
				{
					success: true,
					message: "Fetched sub-comments",
					data: comment.childComments ?? [], // childComments is only available on top-level comments
					pagination: {
						page: 1,
						totalPages: Math.ceil(comment.commentCount / 2),
					},
				},
			],
		},
		getNextPageParam: (lastPage, _, lastPageParam) => {
			if (lastPage.pagination.totalPages <= lastPageParam) {
				return undefined;
			}
			return lastPageParam + 1;
		},
	});

const getSubComments = async (
	commentId: number,
	page: number = 1,
	limit: number = 2,
) => {
	const res = await api.comments[":id"].comments.$get({
		param: { id: commentId.toString() },
		query: {
			page: page.toString(),
			limit: limit.toString(),
		},
	});
	const data = await res.json();
	if (!data.success) {
		throw new Error(`Failed to fetch sub-comments: ${data.message}`);
	}
	return data;
};

export async function upvoteComment(commentId: number) {
	const res = await api.comments[":id"].upvote.$post({
		param: { id: commentId.toString() },
	});
	const data = await res.json();
	if (!data.success) {
		throw new Error(`Failed to upvote comment: ${data.message}`);
	}
	return data;
}
