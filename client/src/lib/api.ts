import type { AppType } from "@server/index";
import { hc } from "hono/client";

const SERVER_URL = import.meta.env.VITE_SERVER_URL || "/";

export const api = hc<AppType>(SERVER_URL, {
	fetch: (input: RequestInfo | URL, init?: RequestInit) =>
		fetch(input, { ...init, credentials: "include" }),
}).api;
