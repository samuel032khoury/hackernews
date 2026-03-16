import type { Comment, PaginatedResponse } from "@shared/types";
import type { InfiniteData } from "@tanstack/react-query";
import { produce } from "immer";
import {
	type CacheAdapter,
	createOptimisticUpvoteMutation,
} from "@/hooks/upvote/use-optimistic-upvote";
import { upvoteComment } from "@/services/comments";

type SuccessOf<T> = Extract<T, { success: true }>;
type CommentsPageSuccess = SuccessOf<PaginatedResponse<Comment>>;
type CommentsCacheData = InfiniteData<CommentsPageSuccess, number>;

type UpvoteCommentVariables = {
	commentId: number;
	parentCommentId: number | null;
	postId: string;
};

type CommentQueryKey =
	| readonly ["comments", "post", string]
	| readonly ["comments", "comment", number];

const findCommentInTree = (
	comments: Comment[],
	commentId: number,
): Comment | null => {
	for (const node of comments) {
		if (node.id === commentId) return node;
		if (node.childComments?.length) {
			const match = findCommentInTree(node.childComments, commentId);
			if (match) return match;
		}
	}
	return null;
};

const findCommentInPages = (
	cacheData: CommentsCacheData,
	commentId: number,
): Comment | null => {
	for (const page of cacheData.pages) {
		const match = findCommentInTree(page.data, commentId);
		if (match) return match;
	}
	return null;
};

const createCommentCacheAdapter = (
	getQueryKey: (variables: UpvoteCommentVariables) => CommentQueryKey | null,
): CacheAdapter<UpvoteCommentVariables> => ({
	read(queryClient, variables) {
		const queryKey = getQueryKey(variables);
		if (!queryKey) return null;

		const entries = queryClient.getQueriesData<CommentsCacheData>({ queryKey });
		for (const [, cacheData] of entries) {
			if (!cacheData) continue;
			const comment = findCommentInPages(cacheData, variables.commentId);
			if (comment) {
				return { isUpvoted: comment.isUpvoted, points: comment.points };
			}
		}
		return null;
	},

	write(queryClient, variables, update) {
		const queryKey = getQueryKey(variables);
		if (!queryKey) return;

		queryClient.setQueriesData<CommentsCacheData>({ queryKey }, (existing) => {
			if (!existing) return existing;
			return produce(existing, (draft) => {
				const comment = findCommentInPages(draft, variables.commentId);
				if (!comment) return;
				comment.isUpvoted = update.isUpvoted;
				comment.points = update.points;
			});
		});
	},

	async cancel(queryClient, variables) {
		const queryKey = getQueryKey(variables);
		if (!queryKey) return;
		await queryClient.cancelQueries({ queryKey });
	},

	invalidate(queryClient, variables) {
		const queryKey = getQueryKey(variables);
		if (!queryKey) return;
		queryClient.invalidateQueries({ queryKey, refetchType: "none" });
	},
});

const postCommentsAdapter = createCommentCacheAdapter((vars) => [
	"comments",
	"post",
	vars.postId,
]);

const subCommentsAdapter = createCommentCacheAdapter((vars) =>
	vars.parentCommentId !== null
		? ["comments", "comment", vars.parentCommentId]
		: null,
);

const useUpvoteComment = createOptimisticUpvoteMutation({
	mutationKey: ["upvoteComment"],
	mutationFn: ({ commentId }: UpvoteCommentVariables) =>
		upvoteComment(commentId),
	getId: (variables: UpvoteCommentVariables) => variables.commentId,
	adapters: [postCommentsAdapter, subCommentsAdapter],
});

export default useUpvoteComment;
