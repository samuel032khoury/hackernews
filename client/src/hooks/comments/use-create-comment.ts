import type { Comment, PaginatedResponse } from "@shared/types";
import type { InfiniteData } from "@tanstack/react-query";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { produce } from "immer";
import { toast } from "sonner";
import { createComment, createSubComment } from "@/services/comments";

type SuccessOf<T> = Extract<T, { success: true }>;
type CommentsPageSuccess = SuccessOf<PaginatedResponse<Comment>>;
type CommentsCacheData = InfiniteData<CommentsPageSuccess, number>;

type CreateCommentVariables = {
	postId: string;
	parentCommentId: string | null;
	content: string;
};

const getCommentsQueryKey = (variables: CreateCommentVariables) =>
	variables.parentCommentId === null
		? ["comments", "post", variables.postId]
		: ["comments", "comment", variables.parentCommentId];

export function useCreateComment() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationKey: ["createComment"],

		mutationFn: (variables: CreateCommentVariables) =>
			variables.parentCommentId === null
				? createComment(variables.postId, variables.content)
				: createSubComment(variables.parentCommentId, variables.content),

		onSuccess: (response, variables) => {
			queryClient.setQueriesData<CommentsCacheData>(
				{ queryKey: getCommentsQueryKey(variables) },
				(old) => {
					if (!old) return old;
					return produce(old, (draft) => {
						if (draft.pages.length > 0) {
							draft.pages[0].data.unshift(response.data);
						}
					});
				},
			);

			queryClient.invalidateQueries({
				queryKey: ["post", variables.postId],
			});
			queryClient.invalidateQueries({
				queryKey: ["posts"],
				refetchType: "none",
			});
			if (variables.parentCommentId !== null) {
				queryClient.invalidateQueries({
					queryKey: ["comments", "post", variables.postId],
				});
			}
		},

		onError: () => {
			toast.error("Failed to create comment", {
				description: "Something went wrong. Please try again.",
				icon: "⚠️",
			});
		},
	});
}
