import type { ApiError } from "@shared/types";
import { createFileRoute } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";

export const Route = createFileRoute("/_auth/submit")({
	component: Submit,
});

const submitPost = async (title: string, url: string, content: string) => {
	try {
		const res = await api.posts.$post({
			form: { title, url, content },
		});
		return await res.json();
	} catch (error) {
		console.log({
			success: false,
			message: (error as Error).message || "Submission failed",
		});
		return {
			success: false,
			message: (error as Error).message || "Submission failed",
		} satisfies ApiError;
	}
};

function Submit() {
	return (
		<div>
			<Button
				onClick={() =>
					submitPost(
						"Test Title",
						"http://example.com",
						"This is the content of the post.",
					)
				}
			>
				Submit Post
			</Button>
		</div>
	);
}
