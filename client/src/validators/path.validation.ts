import {
	orderSchema,
	sortBySchema,
} from "@shared/validators/search.validation";
import { z } from "zod";

export const pathRedirectSchema = z.object({
	redirect: z.string().catch("/").default("/"),
});

export const pathSearchSchema = z.object({
	id: z.number().catch(0).default(0),
	sortBy: sortBySchema.catch("points").default("points"),
	order: orderSchema.catch("desc").default("desc"),
});
