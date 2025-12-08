import { hcWithType } from "@server/client";

const SERVER_URL = import.meta.env.VITE_SERVER_URL || "http://localhost:3000";

export const api = hcWithType(SERVER_URL);
