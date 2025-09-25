// import type { ApiResponse } from "shared/src";

import { Hono } from "hono";
import { cors } from "hono/cors";
import type { ApiResponse } from "shared";

export const app = new Hono()

	.use(cors())

	.get("/", (c) => {
		return c.text("Hello Hono!");
	})

	.get("/hello", async (c) => {
		const data: ApiResponse = {
			message: "Hello BHVR!",
			success: true,
		};

		return c.json(data, { status: 200 });
	});

// app.onError((err, c) => {
// 	if (err instanceof HTTPException) {
// 		const errResponse = err.res ?? c.json<ApiError>();
// 	}
// })

export default app;
