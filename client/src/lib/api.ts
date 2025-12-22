import type { AppType } from "@server/index";
import { hc, type InferResponseType } from "hono/client";

const SERVER_URL = import.meta.env.VITE_SERVER_URL || "/";

export const api = hc<AppType>(SERVER_URL, {
	fetch: (input: RequestInfo | URL, init?: RequestInit) =>
		fetch(input, { ...init, credentials: "include" }),
}).api;

export type PostsPage = Extract<
	InferResponseType<typeof api.posts.$get>,
	{ success: true }
>;
