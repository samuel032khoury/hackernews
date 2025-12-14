import { z } from "zod";

export const urlRedirectSchema = z.object({
	redirect: z.string().catch("/").default("/"),
});
