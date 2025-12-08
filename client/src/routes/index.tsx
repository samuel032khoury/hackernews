import { useMutation } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
	component: Index,
});

// Response type is inferred from the Hono RPC client
type HelloResponse = Awaited<
	ReturnType<typeof api.hello.$get>
> extends Response
	? Awaited<ReturnType<Awaited<ReturnType<typeof api.hello.$get>>["json"]>>
	: never;

function Index() {
	const [data, setData] = useState<HelloResponse | undefined>();

	const { mutate: sendRequest, isPending } = useMutation({
		mutationFn: async () => {
			// Using Hono RPC client - fully typed!
			const res = await api.hello.$get();
			if (!res.ok) {
				throw new Error("Failed to fetch");
			}
			return res.json();
		},
		onSuccess: (data) => {
			setData(data);
		},
		onError: (error) => {
			console.error("Error fetching data:", error);
		},
	});

	return (
		<div className="max-w-xl mx-auto flex flex-col gap-6 items-center justify-center min-h-screen">
			<div className="flex flex-col items-center gap-4">
				<h1 className="text-2xl font-bold">Hono RPC Example</h1>
				<p className="text-gray-600 text-sm">
					Click the button below to call the API using the typed Hono RPC
					client
				</p>
				<Button onClick={() => sendRequest()} disabled={isPending}>
					{isPending ? "Loading..." : "Call API"}
				</Button>
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
