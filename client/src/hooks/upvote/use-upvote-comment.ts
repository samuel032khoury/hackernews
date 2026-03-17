import { produce } from "immer";
import {
	type CacheAdapter,
	createOptimisticUpdateMutation,
} from "@/hooks/use-optimistic-update";
import { upvoteComment } from "@/services/comments";
import type {
	CommentsCacheData,
	UpvotableItemState,
} from "@/types/query-types";

type UpvoteCommentVariables = {
	commentId: string;
	parentCommentId: string | null;
	postId: string;
};

const findCommentInPages = (data: CommentsCacheData, commentId: string) => {
	for (const page of data.pages) {
		const comment = page.data.find((c) => c.id.toString() === commentId);
		if (comment) return comment;
	}
	return null;
};

const getCommentQueryKey = (vars: UpvoteCommentVariables) =>
	vars.parentCommentId === null
		? ["comments", "post", vars.postId]
		: ["comments", "comment", vars.parentCommentId];

const commentsCacheAdapter: CacheAdapter<
	UpvoteCommentVariables,
	UpvotableItemState
> = {
	read(queryClient, variables) {
		const entries = queryClient.getQueriesData<CommentsCacheData>({
			queryKey: getCommentQueryKey(variables),
		});
		for (const [, cacheData] of entries) {
			if (!cacheData) continue;
			const comment = findCommentInPages(cacheData, variables.commentId);
			if (comment)
				return { isUpvoted: comment.isUpvoted, points: comment.points };
		}
		return null;
	},
	write(queryClient, variables, update) {
		queryClient.setQueriesData<CommentsCacheData>(
			{ queryKey: getCommentQueryKey(variables) },
			(existing) => {
				if (!existing) return existing;
				return produce(existing, (draft) => {
					const comment = findCommentInPages(draft, variables.commentId);
					if (!comment) return;
					comment.isUpvoted = update.isUpvoted;
					comment.points = update.points;
				});
			},
		);
	},
	async cancel(queryClient, variables) {
		await queryClient.cancelQueries({
			queryKey: getCommentQueryKey(variables),
		});
	},
	invalidate(queryClient, variables) {
		queryClient.invalidateQueries({
			queryKey: getCommentQueryKey(variables),
			refetchType: "none",
		});
	},
};

export default createOptimisticUpdateMutation({
	mutationKey: ["upvoteComment"],
	mutationFn: ({ commentId }: UpvoteCommentVariables) =>
		upvoteComment(commentId),
	getId: (variables: UpvoteCommentVariables) => variables.commentId,
	getOptimisticUpdate: (currentState: UpvotableItemState) => ({
		...currentState,
		isUpvoted: !currentState.isUpvoted,
		points: currentState.points + (currentState.isUpvoted ? -1 : 1),
	}),
	adapters: [commentsCacheAdapter],
});
