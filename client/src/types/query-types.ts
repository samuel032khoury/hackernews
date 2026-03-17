import type {
	ApiResponse,
	Comment,
	PaginatedResponse,
	Post,
	UpvotableItemState,
} from "@shared/types";
import type { InfiniteData } from "@tanstack/react-query";

export type SuccessOf<T> = Extract<T, { success: true }>;

export type CommentsPageSuccess = SuccessOf<PaginatedResponse<Comment>>;
export type CommentsCacheData = InfiniteData<CommentsPageSuccess, number>;

export type PostsPageSuccess = SuccessOf<PaginatedResponse<Post>>;
export type PostsListCacheData = InfiniteData<PostsPageSuccess, number>;

export type PostDetailsCacheData = SuccessOf<ApiResponse<Post>>;

export type { UpvotableItemState };
