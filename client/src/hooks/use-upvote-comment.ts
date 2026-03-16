import type { Comment, PaginatedResponse, PostState } from "@shared/types";
import type { InfiniteData, QueryClient } from "@tanstack/react-query";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { produce } from "immer";
import { useRef } from "react";
import { toast } from "sonner";
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
	commentList: Comment[],
	commentId: number,
): Comment | null => {
	for (const commentNode of commentList) {
		if (commentNode.id === commentId) return commentNode;
		if (commentNode.childComments?.length) {
			const matchingComment = findCommentInTree(
				commentNode.childComments,
				commentId,
			);
			if (matchingComment) return matchingComment;
		}
	}

	return null;
};

const findCommentInPages = (
	cacheData: CommentsCacheData,
	commentId: number,
): Comment | null => {
	for (const page of cacheData.pages) {
		const matchingComment = findCommentInTree(page.data, commentId);
		if (matchingComment) return matchingComment;
	}

	return null;
};

const getRelevantCommentQueryKeys = ({
	postId,
	parentCommentId,
}: UpvoteCommentVariables): ReadonlyArray<CommentQueryKey> => {
	const queryKeys: CommentQueryKey[] = [["comments", "post", postId]];

	if (parentCommentId !== null) {
		queryKeys.push(["comments", "comment", parentCommentId]);
	}

	return queryKeys;
};

const findCommentStateInRelevantCaches = (
	queryClient: QueryClient,
	variables: UpvoteCommentVariables,
): PostState | null => {
	for (const queryKey of getRelevantCommentQueryKeys(variables)) {
		const cacheEntries = queryClient.getQueriesData<CommentsCacheData>({
			queryKey,
		});

		for (const [, cacheData] of cacheEntries) {
			if (!cacheData) continue;

			const matchingComment = findCommentInPages(
				cacheData,
				variables.commentId,
			);
			if (matchingComment) {
				return {
					isUpvoted: matchingComment.isUpvoted,
					points: matchingComment.points,
				};
			}
		}
	}

	return null;
};

const writeCommentStateToRelevantCaches = (
	queryClient: QueryClient,
	variables: UpvoteCommentVariables,
	update: PostState,
) => {
	for (const queryKey of getRelevantCommentQueryKeys(variables)) {
		queryClient.setQueriesData<CommentsCacheData>(
			{ queryKey },
			(existingCacheData) => {
				if (!existingCacheData) return existingCacheData;

				return produce(existingCacheData, (draftCacheData) => {
					const targetComment = findCommentInPages(
						draftCacheData,
						variables.commentId,
					);
					if (!targetComment) return;

					targetComment.isUpvoted = update.isUpvoted;
					targetComment.points = update.points;
				});
			},
		);
	}
};

type MutationEntry = { pendingRequests: number; prevState: PostState | null };

const useUpvoteComment = () => {
	const queryClient = useQueryClient();
	const mutationState = useRef(new Map<number, MutationEntry>());

	return useMutation({
		mutationKey: ["upvoteComment"],
		mutationFn: ({ commentId }: UpvoteCommentVariables) =>
			upvoteComment(commentId),

		onMutate: async (variables: UpvoteCommentVariables) => {
			await Promise.all(
				getRelevantCommentQueryKeys(variables).map((queryKey) =>
					queryClient.cancelQueries({ queryKey }),
				),
			);

			const targetCommentId = variables.commentId;
			const trackedMutation = mutationState.current.get(targetCommentId);

			if (trackedMutation) {
				trackedMutation.pendingRequests += 1;
			} else {
				mutationState.current.set(targetCommentId, {
					pendingRequests: 1,
					prevState: findCommentStateInRelevantCaches(queryClient, variables),
				});
			}

			const currentCommentState = findCommentStateInRelevantCaches(
				queryClient,
				variables,
			);
			if (!currentCommentState) return;

			writeCommentStateToRelevantCaches(queryClient, variables, {
				isUpvoted: !currentCommentState.isUpvoted,
				points:
					currentCommentState.points + (currentCommentState.isUpvoted ? -1 : 1),
			});
		},

		onSuccess: (response, variables) => {
			const trackedMutation = mutationState.current.get(variables.commentId);
			if (!trackedMutation) return;

			trackedMutation.pendingRequests -= 1;
			trackedMutation.prevState = response.data;

			if (trackedMutation.pendingRequests !== 0) return;

			writeCommentStateToRelevantCaches(queryClient, variables, response.data);
			mutationState.current.delete(variables.commentId);
		},

		onError: (_error, variables) => {
			toast.error("An error occurred", {
				description: "Failed to update upvote. Please try again.",
				icon: "⚠️",
			});

			const trackedMutation = mutationState.current.get(variables.commentId);
			if (!trackedMutation) return;

			trackedMutation.pendingRequests -= 1;
			if (trackedMutation.pendingRequests !== 0) return;

			if (trackedMutation.prevState) {
				writeCommentStateToRelevantCaches(
					queryClient,
					variables,
					trackedMutation.prevState,
				);
			}

			mutationState.current.delete(variables.commentId);
		},

		onSettled: (_data, _error, variables) => {
			if (mutationState.current.has(variables.commentId)) return;

			for (const queryKey of getRelevantCommentQueryKeys(variables)) {
				queryClient.invalidateQueries({
					queryKey,
					refetchType: "none",
				});
			}
		},
	});
};

export default useUpvoteComment;
