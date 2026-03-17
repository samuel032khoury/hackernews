import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { createComment, createSubComment } from "@/services/comments";

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

		onSuccess: (_data, variables) => {
			queryClient.invalidateQueries({
				queryKey: getCommentsQueryKey(variables),
			});
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
