import type { PostState } from "@shared/types";
import type { InfiniteData, QueryClient } from "@tanstack/react-query";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { produce } from "immer";
import { useRef } from "react";
import { toast } from "sonner";
import type { PostsPage } from "@/lib/api";
import { upvotePost } from "@/services/posts";

type PostsInfiniteData = InfiniteData<PostsPage, number>;

// ============================================================================
// Cache Helper Functions
// ============================================================================

const findPost = (data: PostsInfiniteData, postId: string) => {
	for (const page of data.pages) {
		const post = page.data.find((p) => p.id === Number(postId));
		if (post) return post;
	}
	return null;
};

const updatePostInCache = (
	data: PostsInfiniteData,
	postId: string,
	update: PostState,
): PostsInfiniteData => {
	return produce(data, (draft) => {
		const post = findPost(draft, postId);
		if (post) {
			post.isUpvoted = update.isUpvoted;
			post.points = update.points;
		}
	});
};

const getPreviousPostState = (
	queryClient: QueryClient,
	postId: string,
): PostState | null => {
	const queries = queryClient.getQueriesData<PostsInfiniteData>({
		queryKey: ["posts"],
	});

	for (const [, data] of queries) {
		if (data) {
			const post = findPost(data, postId);
			if (post) {
				return { isUpvoted: post.isUpvoted, points: post.points };
			}
		}
	}
	return null;
};

// // ============================================================================
// // Hook
// // ============================================================================

export const useUpvotePost = () => {
	const queryClient = useQueryClient();

	// Track Pending Requests & Previous State
	const postTracker = useRef(
		new Map<string, { pendingRequests: number; prevState: PostState | null }>(),
	);

	return useMutation({
		mutationKey: ["upvote"],
		mutationFn: upvotePost,

		onMutate: async (postId: string) => {
			await queryClient.cancelQueries({ queryKey: ["posts"] });

			const currentPost = postTracker.current.get(postId) || {
				pendingRequests: 0,
				prevState: null,
			};

			// Capture the synced server state only on the first click of a burst
			const currentState = getPreviousPostState(queryClient, postId);
			const prevState =
				currentPost.pendingRequests === 0
					? currentState
					: currentPost.prevState;

			postTracker.current.set(postId, {
				pendingRequests: currentPost.pendingRequests + 1,
				prevState,
			});

			// Apply Optimistic Update
			if (currentState) {
				const toggledState: PostState = {
					isUpvoted: !currentState.isUpvoted,
					points: currentState.points + (currentState.isUpvoted ? -1 : 1),
				};

				queryClient.setQueriesData<PostsInfiniteData>(
					{ queryKey: ["posts"] },
					(old) => (old ? updatePostInCache(old, postId, toggledState) : old),
				);
			}
		},

		onSuccess: (response, postId) => {
			const state = postTracker.current.get(postId);

			if (!state) return;

			state.pendingRequests -= 1;

			// Update the prevState to the server response
			state.prevState = response.data;

			// If it's the last pending request, update the cache
			if (state.pendingRequests === 0) {
				queryClient.setQueriesData<PostsInfiniteData>(
					{ queryKey: ["posts"] },
					(old) => (old ? updatePostInCache(old, postId, response.data) : old),
				);
				postTracker.current.delete(postId);
			}
		},

		onError: (_err, postId) => {
			toast.error("An error occurred", {
				description: "Failed to update upvote. Please try again.",
				icon: "⚠️",
			});

			const state = postTracker.current.get(postId);

			if (!state) return;

			state.pendingRequests -= 1;

			if (state.pendingRequests === 0) {
				const { prevState } = state;

				if (prevState) {
					queryClient.setQueriesData<PostsInfiniteData>(
						{ queryKey: ["posts"] },
						(old) => (old ? updatePostInCache(old, postId, prevState) : old),
					);
				}
				postTracker.current.delete(postId);
			}
		},

		onSettled: (_data, _error, postId) => {
			const state = postTracker.current.get(postId);

			// Only invalidate if no more clicks are pending
			if (!state || state.pendingRequests === 0) {
				queryClient.invalidateQueries({
					queryKey: ["posts"],
					refetchType: "none",
				});
			}
		},
	});
};
