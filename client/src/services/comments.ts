import type { Comment } from "@shared/types";
import type { paginationSchema } from "@shared/validators/search.validation";
import { infiniteQueryOptions, keepPreviousData } from "@tanstack/react-query";
import type z from "zod";
import { api } from "@/lib/api";
import type { postSearchSchema } from "@/validators/search.validation";

export const commentsInfiniteQueryOptions = ({
	id,
	sortBy,
	order,
}: z.infer<typeof postSearchSchema>) =>
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
		queryKey: ["comments", "comment", comment.id.toString()],
		queryFn: async ({ pageParam }) =>
			getSubComments(comment.id.toString(), pageParam),
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
	commentId: string,
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
export async function createComment(postId: string, content: string) {
	const res = await api.posts[":id"].comment.$post({
		param: { id: postId },
		form: { content },
	});
	const data = await res.json();
	if (!data.success) {
		throw new Error(`Failed to create comment: ${data.message}`);
	}
	return data;
}
export async function createSubComment(commentId: string, content: string) {
	const res = await api.comments[":id"].comment.$post({
		param: { id: commentId },
		form: { content },
	});
	const data = await res.json();
	if (!data.success) {
		throw new Error(`Failed to create sub-comment: ${data.message}`);
	}
	return data;
}
export async function upvoteComment(commentId: string) {
	const res = await api.comments[":id"].upvote.$post({
		param: { id: commentId },
	});
	const data = await res.json();
	if (!data.success) {
		throw new Error(`Failed to upvote comment: ${data.message}`);
	}
	return data;
}
