export type ApiResponse<T = void> = {
	success: true;
	message: string;
} & (T extends void ? object : { data: T });

export type PaginatedResponse<T> = ApiResponse<T> & {
	pagination: {
		totalPages: number;
		page: number;
	};
};

type ValidationError = {
	name: "ValidationError";
	issues: object[];
};

export type ApiError = {
	success: false;
	error: string | ValidationError;
	isFormError?: boolean;
};

export interface Comment {
	id: number;
	userId: string;
	postId: number;
	content: string;
	points: number;
	depth: number;
	parentCommentId: number | null;
	createdAt: string;
	commentCount: number;
	commentUpvotes: { userId: string }[];
	childComments?: Comment[];
	author: {
		id: string;
		name: string;
	};
}

export interface Post {
	id: number;
	title: string;
	url: string | null;
	content: string | null;
	points: number;
	commentsCount: number;
	createdAt: string;
	author: {
		id: string;
		username: string;
	};
	isUpvoted: boolean;
}
