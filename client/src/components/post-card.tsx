import type { Post } from "@shared/types";
import { Link } from "@tanstack/react-router";
import { ChevronUpIcon } from "lucide-react";
import { useCurrentUser } from "@/contexts/current-user-context";
import { useUpvotePost } from "@/hooks/upvote";
import { cn, relativeTime } from "@/lib/utils";
import { Badge } from "./ui/badge";
import { Card, CardContent, CardDescription, CardTitle } from "./ui/card";

export const PostCard = ({ post }: { post: Post }) => {
	const { mutate: upvote } = useUpvotePost();
	const { currentUser } = useCurrentUser();

	const handleUpvote = () => {
		if (!currentUser) {
			return;
		}
		upvote(post.id.toString());
	};

	return (
		<Card className="flex flex-row items-start justify-start py-3">
			<button
				type="button"
				onClick={handleUpvote}
				disabled={!currentUser}
				className={cn(
					"ml-3 flex flex-col items-center justify-center transition-opacity",
					currentUser ? "cursor-pointer" : "cursor-not-allowed opacity-60",
					post.isUpvoted ? "text-primary" : "text-muted-foreground",
				)}
			>
				<ChevronUpIcon size={20} />
				<span className="font-medium text-xs">{post.points}</span>
			</button>
			<div className="flex grow flex-col justify-between gap-0.5 pe-5">
				<div className="flex items-start py-0">
					<div className="flex grow flex-wrap items-center gap-x-2 pb-1">
						<CardTitle className="flex flex-row space-x-2 font-medium text-xl">
							{post.url ? (
								<a
									href={post.url}
									className="text-foreground hover:text-primary hover:underline"
								>
									{post.title}
								</a>
							) : (
								<Link
									to="/post/$id"
									params={{ id: post.id.toString() }}
									className="text-foreground hover:text-primary hover:underline"
								>
									{post.title}
								</Link>
							)}
							{post.url && (
								<Badge variant={"secondary"} asChild>
									<Link
										className="cursor-pointer font-normal text-xs transition-colors hover:bg-primary/80! hover:underline"
										to={`/`}
										search={{ site: post.url }}
									>
										{(() => {
											try {
												return new URL(post.url).hostname;
											} catch {
												return post.url;
											}
										})()}
									</Link>
								</Badge>
							)}
						</CardTitle>
					</div>
				</div>
				<CardContent className="p-0">
					<CardDescription className="text-muted-foreground text-sm">
						{post.content && (
							<p className="line-clamp-3 text-foreground text-sm">
								{post.content}
							</p>
						)}
						<div className="flex flex-wrap items-center gap-x-1 text-muted-foreground text-xs">
							<span>
								by{" "}
								<Link
									to={`/`}
									search={{ author: post.author.id }}
									className="hover:text-primary/80 hover:underline"
								>
									{post.author.username}
								</Link>{" "}
							</span>
							<span>•</span>
							<span>{relativeTime(post.createdAt)}</span>
							<span>•</span>
							<Link
								to="/post/$id"
								params={{ id: post.id.toString() }}
								className="hover:text-foreground/80 hover:underline"
							>
								{post.commentsCount} comment
								{post.commentsCount > 1 ? "s" : ""}
							</Link>
						</div>
					</CardDescription>
				</CardContent>
			</div>
		</Card>
	);
};
