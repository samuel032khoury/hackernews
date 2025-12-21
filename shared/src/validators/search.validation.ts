import z from "zod";
import type z from "../../../node_modules/zod/v4/classic/external.cjs";

export const sortBySchema = z.enum(["points", "recent"]);
export const orderSchema = z.enum(["asc", "desc"]);
export const paginationSchema = z.object({
	limit: z.coerce.number().optional().default(10),
	page: z.coerce.number().optional().default(1),
	sortBy: sortBySchema.optional().default("recent"),
	order: orderSchema.optional().default("desc"),
	author: z.string().optional(),
	site: z.string().optional(),
});
