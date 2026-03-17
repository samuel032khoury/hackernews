import { useSuspenseInfiniteQuery } from "@tanstack/react-query";
import { getRouteApi } from "@tanstack/react-router";
import { useState } from "react";
import { useCurrentUser } from "@/contexts/current-user-context";
import { commentsInfiniteQueryOptions } from "@/services/comments";
import { CommentForm } from "./comment-form";
import { CommentThread } from "./comment-thread";
import { LoadMoreRepliesButton } from "./load-more-replies-button";
import { SortBar } from "./sort-bar";
import { Card, CardContent } from "./ui/card";

const postRouteApi = getRouteApi("/post/$id");

export const PostCommentsSection = ({ postId }: { postId: string }) => {
	const { sortBy, order } = postRouteApi.useSearch();
	const [activeReplyId, setActiveReplyId] = useState<string | null>(null);
	const {
		data: comments,
		hasNextPage,
		fetchNextPage,
		isFetchingNextPage,
	} = useSuspenseInfiniteQuery(
		commentsInfiniteQueryOptions(postId, { sortBy, order }),
	);
	const { currentUser } = useCurrentUser();

	return (
		<>
			{currentUser && (
				<div className="my-4">
					<Card>
						<CardContent className="">
							<h2 className="mb-2 font-bold text-foreground text-lg">
								Leave a comment
							</h2>
							<CommentForm postId={postId} />
						</CardContent>
					</Card>
				</div>
			)}
			{comments.pages[0].data.length > 0 && (
				<>
					<div className="mt-8 mb-4">
						<h2 className="mb-2 font-bold text-foreground text-lg">Comments</h2>
						{comments.pages[0].data.length > 0 && (
							<SortBar sortBy={sortBy} order={order} />
						)}
					</div>
					<Card>
						<CardContent className="px-4">
							{comments.pages.map((page) =>
								page.data.map((comment, index) => (
									<CommentThread
										key={comment.id}
										comment={comment}
										depth={0}
										activeReplyId={activeReplyId}
										setActiveReplyId={setActiveReplyId}
										isLast={index === page.data.length - 1}
									/>
								)),
							)}
							{hasNextPage && (
								<div className="mt-2">
									<LoadMoreRepliesButton
										onClick={() => {
											fetchNextPage();
										}}
										isLoading={isFetchingNextPage}
									/>
								</div>
							)}
						</CardContent>
					</Card>
				</>
			)}
		</>
	);
};
