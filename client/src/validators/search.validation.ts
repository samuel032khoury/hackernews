import { paginationSchema } from "@shared/validators/search.validation";

export const searchSchema = paginationSchema.omit({
	page: true,
	limit: true,
});
