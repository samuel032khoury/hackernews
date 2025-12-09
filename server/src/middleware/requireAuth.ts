import { createMiddleware } from "hono/factory";
import type { AppEnv } from "@/lib/env";

const requireAuth = createMiddleware<AppEnv>(async (c, next) => {
	const user = c.get("user");
	if (!user) {
		return c.json({ error: "Unauthorized" }, 401);
	}
	await next();
});
export default requireAuth;
