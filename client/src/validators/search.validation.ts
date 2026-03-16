import {
	orderSchema,
	paginationSchema,
	sortBySchema,
} from "@shared/validators/search.validation";
import { z } from "zod";

export const homeSearchSchema = paginationSchema.omit({
	page: true,
	limit: true,
});

export const postSearchSchema = z.object({
	id: z.coerce.string().catch("0").default("0"),
	sortBy: sortBySchema.catch("points").default("points"),
	order: orderSchema.catch("desc").default("desc"),
});
