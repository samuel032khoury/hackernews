import type { ApiError } from "@shared/types";
import { api } from "@/lib/api";

export const getPost = async (id: number) => {
	const res = await api.posts[":id"].$get({ param: { id: id.toString() } });
	if (res.ok) {
		return await res.json();
	} else {
		const data = await res.json();
		if (data.success === false) {
			throw new Error(data.message);
		}
	}
};

export const submitPost = async (
	title: string,
	url: string,
	content: string,
) => {
	try {
		const res = await api.posts.$post({
			form: { title, url, content },
		});
		return await res.json();
	} catch {
		return {
			success: false as const,
			message: "Failed to submit post (network error)",
		} satisfies ApiError;
	}
};
