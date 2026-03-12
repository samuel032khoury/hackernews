import type {
	ApiResponse,
	PaginatedResponse,
	Post,
	PostState,
} from "@shared/types";
import type { InfiniteData, QueryClient } from "@tanstack/react-query";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { produce } from "immer";
import { useRef } from "react";
import { toast } from "sonner";
import { upvotePost } from "@/services/posts";

type SuccessOf<T> = Extract<T, { success: true }>;
type PostsPageSuccess = SuccessOf<PaginatedResponse<Post>>;
type PostsListCacheData = InfiniteData<PostsPageSuccess, number>;
type PostDetailsCacheData = SuccessOf<ApiResponse<Post>>;

// ============================================================================
// Cache Shape Helpers
// ============================================================================

const findPostInListCache = (data: PostsListCacheData, postId: string) => {
	for (const page of data.pages) {
		const post = page.data.find((p) => p.id.toString() === postId);
		if (post) return post;
	}
	return null;
};

const updatePostInListCache = (
	data: PostsListCacheData,
	postId: string,
	update: PostState,
): PostsListCacheData => {
	return produce(data, (draft) => {
		const post = findPostInListCache(draft, postId);
		if (post) {
			post.isUpvoted = update.isUpvoted;
			post.points = update.points;
		}
	});
};

// ============================================================================
// Adapter Type
// ============================================================================

type CacheAdapter = {
	read: (queryClient: QueryClient, postId: string) => PostState | null;
	write: (queryClient: QueryClient, postId: string, update: PostState) => void;
	cancel: (queryClient: QueryClient, postId: string) => Promise<void>;
	invalidate: (queryClient: QueryClient, postId: string) => void;
};

// ============================================================================
// Adapters
// ============================================================================

const postDetailAdapter: CacheAdapter = {
	read(queryClient, postId) {
		const data = queryClient.getQueryData<PostDetailsCacheData>([
			"post",
			postId,
		]);
		if (!data?.data) return null;
		return { isUpvoted: data.data.isUpvoted, points: data.data.points };
	},

	write(queryClient, postId, update) {
		queryClient.setQueryData<PostDetailsCacheData>(["post", postId], (old) =>
			old ? { ...old, data: { ...old.data, ...update } } : old,
		);
	},

	async cancel(queryClient, postId) {
		await queryClient.cancelQueries({ queryKey: ["post", postId] });
	},

	invalidate(queryClient, postId) {
		queryClient.invalidateQueries({
			queryKey: ["post", postId],
			refetchType: "none",
		});
	},
};

const postsListAdapter: CacheAdapter = {
	read(queryClient, postId) {
		const entries = queryClient.getQueriesData<PostsListCacheData>({
			queryKey: ["posts"],
		});
		for (const [, data] of entries) {
			if (!data) continue;
			const post = findPostInListCache(data, postId);
			if (post) return { isUpvoted: post.isUpvoted, points: post.points };
		}
		return null;
	},

	write(queryClient, postId, update) {
		queryClient.setQueriesData<PostsListCacheData>(
			{ queryKey: ["posts"] },
			(old) => (old ? updatePostInListCache(old, postId, update) : old),
		);
	},

	async cancel(queryClient) {
		await queryClient.cancelQueries({ queryKey: ["posts"] });
	},

	invalidate(queryClient) {
		queryClient.invalidateQueries({
			queryKey: ["posts"],
			refetchType: "none",
		});
	},
};

// ============================================================================
// Adapter Registry (order matters — most specific first)
// ============================================================================

const cacheAdapters: CacheAdapter[] = [postDetailAdapter, postsListAdapter];

// ============================================================================
// Registry Helpers
// ============================================================================

const getPostStateFromCache = (
	queryClient: QueryClient,
	postId: string,
): PostState | null => {
	for (const adapter of cacheAdapters) {
		const state = adapter.read(queryClient, postId);
		if (state) return state;
	}
	return null;
};

const writePostStateToAllCaches = (
	queryClient: QueryClient,
	postId: string,
	update: PostState,
) => {
	for (const adapter of cacheAdapters) {
		adapter.write(queryClient, postId, update);
	}
};

const cancelAllCacheQueries = async (
	queryClient: QueryClient,
	postId: string,
) => {
	await Promise.all(
		cacheAdapters.map((adapter) => adapter.cancel(queryClient, postId)),
	);
};

const invalidateAllCaches = (queryClient: QueryClient, postId: string) => {
	cacheAdapters.forEach((adapter) => {
		adapter.invalidate(queryClient, postId);
	});
};

// ============================================================================
// Hook
// ============================================================================

export const useUpvotePost = () => {
	const queryClient = useQueryClient();

	const postMutationState = useRef(
		new Map<string, { pendingRequests: number; prevState: PostState | null }>(),
	);

	return useMutation({
		mutationKey: ["upvote"],
		mutationFn: upvotePost,

		onMutate: async (postId: string) => {
			await cancelAllCacheQueries(queryClient, postId);

			const tracked = postMutationState.current.get(postId);

			if (!tracked) {
				postMutationState.current.set(postId, {
					pendingRequests: 1,
					prevState: getPostStateFromCache(queryClient, postId),
				});
			} else {
				tracked.pendingRequests += 1;
			}

			const currentPostState = getPostStateFromCache(queryClient, postId);
			if (currentPostState) {
				writePostStateToAllCaches(queryClient, postId, {
					isUpvoted: !currentPostState.isUpvoted,
					points:
						currentPostState.points + (currentPostState.isUpvoted ? -1 : 1),
				});
			}
		},

		onSuccess: (response, postId) => {
			const state = postMutationState.current.get(postId);
			if (!state) return;

			state.pendingRequests -= 1;
			state.prevState = response.data;

			if (state.pendingRequests === 0) {
				writePostStateToAllCaches(queryClient, postId, response.data);
				postMutationState.current.delete(postId);
			}
		},

		onError: (_err, postId) => {
			toast.error("An error occurred", {
				description: "gFailed to update upvote. Please try aain.",
				icon: "⚠️",
			});

			const state = postMutationState.current.get(postId);
			if (!state) return;

			state.pendingRequests -= 1;

			if (state.pendingRequests === 0) {
				const { prevState } = state;
				if (prevState) {
					writePostStateToAllCaches(queryClient, postId, prevState);
				}
				postMutationState.current.delete(postId);
			}
		},

		onSettled: (_data, _error, postId) => {
			const isLastRequest = !postMutationState.current.has(postId);
			if (isLastRequest) {
				invalidateAllCaches(queryClient, postId);
			}
		},
	});
};
