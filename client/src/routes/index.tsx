import type { ApiResponse } from "@shared/index";
import { useMutation } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
	component: Index,
});

const SERVER_URL = import.meta.env.VITE_SERVER_URL || "http://localhost:3000";

function Index() {
	const [data, setData] = useState<ApiResponse | undefined>();

	const { mutate: sendRequest } = useMutation({
		mutationFn: async () => {
			try {
				const res = await fetch(`${SERVER_URL}/api/hello`);
				if (!res.ok) {
					console.log("Error fetching data");
					return;
				}
				const data: ApiResponse = await res.json();
				setData(data);
			} catch (error) {
				console.log(error);
			}
		},
	});

	return (
		<div className="max-w-xl mx-auto flex flex-col gap-6 items-center justify-center min-h-screen">
			<div className="flex items-center gap-4">
				<Button onClick={() => sendRequest()}>Call API</Button>
			</div>
			{data && (
				<pre className="bg-gray-100 p-4 rounded-md">
					<code>
						Message: {data.message} <br />
						Success: {data.success.toString()}
					</code>
				</pre>
			)}
		</div>
	);
}
