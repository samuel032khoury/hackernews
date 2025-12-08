import { useMutation, useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/rpc-example")({
	component: RpcExample,
});

/**
 * This page demonstrates how to use Hono RPC client for type-safe API calls.
 *
 * Key benefits of Hono RPC:
 * 1. Type safety - Request/response types are inferred from the server
 * 2. No manual type definitions needed
 * 3. IDE autocomplete for API endpoints
 * 4. Compile-time errors if API changes
 */

function RpcExample() {
	const [title, setTitle] = useState("");
	const [url, setUrl] = useState("");
	const [content, setContent] = useState("");

	// GET request with query parameters - fully typed!
	const { data: postsData, isLoading: postsLoading } = useQuery({
		queryKey: ["posts", { limit: 10, page: 1 }],
		queryFn: async () => {
			// The `$get` method is typed based on the server route definition
			// Query params are type-checked at compile time
			const res = await api.posts.$get({
				query: { limit: "10", page: "1" },
			});
			if (!res.ok) throw new Error("Failed to fetch posts");
			return res.json();
		},
	});

	// POST request with JSON body - also fully typed!
	const {
		mutate: createPost,
		isPending,
		data: newPost,
		error,
	} = useMutation({
		mutationFn: async (input: {
			title: string;
			url?: string;
			content?: string;
		}) => {
			// The `$post` method knows what body shape to expect
			// based on the zValidator schema on the server
			const res = await api.posts.$post({
				json: input,
			});
			if (!res.ok) {
				const errorData = await res.json();
				throw new Error(JSON.stringify(errorData));
			}
			return res.json();
		},
	});

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		createPost({
			title,
			url: url || undefined,
			content: content || undefined,
		});
	};

	return (
		<div className="max-w-2xl mx-auto p-6 space-y-8">
			<div className="space-y-2">
				<h1 className="text-3xl font-bold">Hono RPC Example</h1>
				<p className="text-gray-600">
					This page demonstrates type-safe API calls using Hono RPC client.
				</p>
			</div>

			{/* GET Example */}
			<section className="space-y-4 p-4 bg-gray-50 rounded-lg">
				<h2 className="text-xl font-semibold">GET /posts</h2>
				<p className="text-sm text-gray-600">
					Fetches posts with typed query parameters
				</p>
				<pre className="bg-gray-800 text-green-400 p-4 rounded text-sm overflow-x-auto">
					{`// Type-safe GET request with query params
const res = await api.posts.$get({
  query: { limit: "10", page: "1" }
});
const data = await res.json();`}
				</pre>
				<div className="p-3 bg-white rounded border">
					<strong>Response:</strong>
					{postsLoading ? (
						<span className="text-gray-500"> Loading...</span>
					) : (
						<pre className="text-sm mt-2">
							{JSON.stringify(postsData, null, 2)}
						</pre>
					)}
				</div>
			</section>

			{/* POST Example */}
			<section className="space-y-4 p-4 bg-gray-50 rounded-lg">
				<h2 className="text-xl font-semibold">POST /posts</h2>
				<p className="text-sm text-gray-600">
					Creates a post with typed JSON body (requires authentication)
				</p>
				<pre className="bg-gray-800 text-green-400 p-4 rounded text-sm overflow-x-auto">
					{`// Type-safe POST request with JSON body
const res = await api.posts.$post({
  json: { title, url, content }
});
const data = await res.json();`}
				</pre>

				<form onSubmit={handleSubmit} className="space-y-3 p-3 bg-white rounded border">
					<div>
						<label className="block text-sm font-medium mb-1">Title *</label>
						<input
							type="text"
							value={title}
							onChange={(e) => setTitle(e.target.value)}
							className="w-full p-2 border rounded"
							placeholder="Enter post title (min 3 chars)"
							required
						/>
					</div>
					<div>
						<label className="block text-sm font-medium mb-1">URL</label>
						<input
							type="url"
							value={url}
							onChange={(e) => setUrl(e.target.value)}
							className="w-full p-2 border rounded"
							placeholder="https://example.com"
						/>
					</div>
					<div>
						<label className="block text-sm font-medium mb-1">Content</label>
						<textarea
							value={content}
							onChange={(e) => setContent(e.target.value)}
							className="w-full p-2 border rounded"
							placeholder="Post content..."
							rows={3}
						/>
					</div>
					<Button type="submit" disabled={isPending}>
						{isPending ? "Creating..." : "Create Post"}
					</Button>
				</form>

				{error && (
					<div className="p-3 bg-red-50 text-red-700 rounded border border-red-200">
						<strong>Error:</strong> {error.message}
					</div>
				)}

				{newPost && (
					<div className="p-3 bg-green-50 rounded border border-green-200">
						<strong>Created Post:</strong>
						<pre className="text-sm mt-2">
							{JSON.stringify(newPost, null, 2)}
						</pre>
					</div>
				)}
			</section>

			{/* Key Points */}
			<section className="space-y-3 p-4 bg-blue-50 rounded-lg">
				<h2 className="text-xl font-semibold text-blue-800">
					How Hono RPC Works
				</h2>
				<ul className="list-disc list-inside space-y-2 text-sm text-blue-900">
					<li>
						<strong>Server defines routes</strong> with chained methods (
						<code>.get()</code>, <code>.post()</code>)
					</li>
					<li>
						<strong>Types are exported</strong> via{" "}
						<code>export type AppType = typeof app</code>
					</li>
					<li>
						<strong>Client imports</strong> <code>hcWithType</code> which wraps{" "}
						<code>hc&lt;AppType&gt;</code>
					</li>
					<li>
						<strong>Method names</strong> become <code>$get</code>,{" "}
						<code>$post</code>, etc.
					</li>
					<li>
						<strong>Validators</strong> (like zValidator) infer request body
						types
					</li>
				</ul>
			</section>
		</div>
	);
}
