import type { InfiniteData } from "@tanstack/react-query";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { produce } from "immer";
import { toast } from "sonner";
import type { PostsPage } from "@/lib/api";
import { upvotePost } from "@/services/posts";

type PostsInfiniteData = InfiniteData<PostsPage, number>;

/**
 * Updates a post's upvote state within the infinite query cache
 */
const updatePostInCache = (
	data: PostsInfiniteData,
	postId: number,
	update: { isUpvoted: boolean; points: number },
): PostsInfiniteData => {
	return produce(data, (draft) => {
		for (const page of draft.pages) {
			const post = page.data.find((p) => p.id === postId);
			if (post) {
				post.isUpvoted = update.isUpvoted;
				post.points = update.points;
				return; // Exit early once we find and update the post
			}
		}
	});
};

/**
 * Toggles a post's upvote state optimistically
 */
const togglePostUpvote = (
	data: PostsInfiniteData,
	postId: number,
): PostsInfiniteData => {
	return produce(data, (draft) => {
		for (const page of draft.pages) {
			const post = page.data.find((p) => p.id === postId);
			if (post) {
				post.points += post.isUpvoted ? -1 : 1;
				post.isUpvoted = !post.isUpvoted;
				return;
			}
		}
	});
};

export const useUpvotePost = () => {
	const queryClient = useQueryClient();

	return useMutation({
		// Use mutation key to ensure only one upvote mutation per post at a time
		mutationKey: ["upvote"],
		mutationFn: upvotePost,
		onMutate: async (postId: string) => {
			const postIdNum = Number(postId);

			// Cancel outgoing re-fetches to prevent race conditions
			await queryClient.cancelQueries({ queryKey: ["posts"] });

			// Snapshot all active posts queries for rollback
			const previousQueries = queryClient.getQueriesData<PostsInfiniteData>({
				queryKey: ["posts"],
			});

			// Optimistically update all matching queries
			queryClient.setQueriesData<PostsInfiniteData>(
				{ queryKey: ["posts"] },
				(oldData) => {
					if (!oldData) return oldData;
					return togglePostUpvote(oldData, postIdNum);
				},
			);

			return { previousQueries };
		},
		onSuccess: (response, postId) => {
			// Sync with server response to ensure consistency
			if (response.success) {
				const postIdNum = Number(postId);
				queryClient.setQueriesData<PostsInfiniteData>(
					{ queryKey: ["posts"] },
					(oldData) => {
						if (!oldData) return oldData;
						return updatePostInCache(oldData, postIdNum, response.data);
					},
				);
			}
		},
		onError: (_err, _postId, context) => {
			toast.error("Failed to upvote post. Please try again.");

			// Restore all queries to their previous state
			if (context?.previousQueries) {
				for (const [queryKey, data] of context.previousQueries) {
					queryClient.setQueryData(queryKey, data);
				}
			}
		},
	});
};
