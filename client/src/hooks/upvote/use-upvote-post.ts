import { produce } from "immer";
import {
	type CacheAdapter,
	createOptimisticUpdateMutation,
} from "@/hooks/use-optimistic-update";
import { upvotePost } from "@/services/posts";
import type {
	PostDetailsCacheData,
	PostsListCacheData,
	UpvotableItemState,
} from "@/types/query-types";

const findPostInListCache = (data: PostsListCacheData, postId: string) => {
	for (const page of data.pages) {
		const post = page.data.find((p) => p.id.toString() === postId);
		if (post) return post;
	}
	return null;
};

const postDetailAdapter: CacheAdapter<string, UpvotableItemState> = {
	read(queryClient, postId) {
		const cached = queryClient.getQueryData<PostDetailsCacheData>([
			"post",
			postId,
		]);
		if (!cached) return null;
		return { isUpvoted: cached.data.isUpvoted, points: cached.data.points };
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

const postsListAdapter: CacheAdapter<string, UpvotableItemState> = {
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
			(old) => {
				if (!old) return old;
				return produce(old, (draft) => {
					const post = findPostInListCache(draft, postId);
					if (post) {
						post.isUpvoted = update.isUpvoted;
						post.points = update.points;
					}
				});
			},
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

export default createOptimisticUpdateMutation({
	mutationKey: ["upvotePost"],
	mutationFn: upvotePost,
	getId: (postId: string) => postId,
	getOptimisticUpdate: (currentState: UpvotableItemState) => ({
		...currentState,
		isUpvoted: !currentState.isUpvoted,
		points: currentState.points + (currentState.isUpvoted ? -1 : 1),
	}),
	adapters: [postDetailAdapter, postsListAdapter],
});
