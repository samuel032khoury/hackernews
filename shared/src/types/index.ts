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

export type ValidationIssue = {
	path: PropertyKey[];
	message: string;
};

export type ValidationError = {
	success: false;
	code: "VALIDATION_ERROR";
	issues: ValidationIssue[];
};

export type ApiError = {
	success: false;
	message: string;
	code?: string;
};

export type AppError = ApiError | ValidationError;

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
