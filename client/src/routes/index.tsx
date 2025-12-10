import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";

export const Route = createFileRoute("/")({
	component: Index,
});

function Index() {
	const [title, setTitle] = useState<string | null>(null);

	useEffect(() => {
		const fetchPost = async () => {
			const res = await api.posts[":id"].$get({ param: { id: "1" } });
			if (res.ok) {
				const data = await res.json();
				setTitle(data.data.points.toString());
			}
		};
		fetchPost();
	}, []);

	return (
		<div className="mx-auto flex min-h-screen max-w-xl flex-col items-center justify-center gap-6">
			<div className="flex flex-col items-center gap-4">
				<h1 className="font-bold text-2xl">{title ?? "Loading..."}</h1>
			</div>
		</div>
	);
}
