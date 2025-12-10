import type { AppType } from "@server/index";
import { hc } from "hono/client";

const SERVER_URL = import.meta.env.VITE_SERVER_URL || "http://localhost:3000";

export const api = hc<AppType>(SERVER_URL).api;
