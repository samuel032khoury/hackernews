import { Hono } from "hono";

export const testRouter = new Hono();

testRouter.get("/", (c) => {
	return c.json({ success: true, message: "Test route is working!" });
});

export default testRouter;
