import { postsInsertSchema } from "../../../server/src/db/schema/posts.schema";

export type ApiResponse<T = void> = {
	success: true;
	message: string;
} & (T extends void ? object : { data: T });

export type ApiError = {
	success: false;
	error: string;
	isFormError?: boolean;
};

export const postsSchema = postsInsertSchema;
// export type FormValidationError = {
// 	success: false;
// 	errors?: Record<string, string>;
// };
