import type { InfiniteData, QueryClient } from "@tanstack/react-query";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { produce } from "immer";
import { toast } from "sonner";
import type { PostsPage } from "@/lib/api";
import { upvotePost } from "@/services/posts";

type PostsInfiniteData = InfiniteData<PostsPage, number>;
type PostState = { isUpvoted: boolean; points: number };

// ============================================================================
// Cache Helper Functions
// ============================================================================

const findPost = (data: PostsInfiniteData, postId: number) => {
	for (const page of data.pages) {
		const post = page.data.find((p) => p.id === postId);
		if (post) return post;
	}
	return null;
};

const updatePostInCache = (
	data: PostsInfiniteData,
	postId: number,
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
	postId: number,
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

// ============================================================================
// Hook
// ============================================================================

export const useUpvotePost = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationKey: ["upvote"],
		mutationFn: upvotePost,

		onMutate: async (postId: string) => {
			const postIdNum = Number(postId);

			await queryClient.cancelQueries({ queryKey: ["posts"] });

			const previousPostState = getPreviousPostState(queryClient, postIdNum);

			if (previousPostState) {
				const toggledState: PostState = {
					isUpvoted: !previousPostState.isUpvoted,
					points:
						previousPostState.points + (previousPostState.isUpvoted ? -1 : 1),
				};

				queryClient.setQueriesData<PostsInfiniteData>(
					{ queryKey: ["posts"] },
					(oldData) =>
						oldData
							? updatePostInCache(oldData, postIdNum, toggledState)
							: oldData,
				);
			}

			return { previousPostState, postIdNum };
		},

		onSuccess: (response, postId) => {
			queryClient.setQueriesData<PostsInfiniteData>(
				{ queryKey: ["posts"] },
				(oldData) =>
					oldData
						? updatePostInCache(oldData, Number(postId), response.data)
						: oldData,
			);
		},

		onError: (_err, _postId, context) => {
			toast.error("Failed to upvote post. Please try again.");

			const { previousPostState, postIdNum } = context ?? {};
			if (previousPostState && postIdNum !== undefined) {
				queryClient.setQueriesData<PostsInfiniteData>(
					{ queryKey: ["posts"] },
					(oldData) =>
						oldData
							? updatePostInCache(oldData, postIdNum, previousPostState)
							: oldData,
				);
			}
		},
	});
};
