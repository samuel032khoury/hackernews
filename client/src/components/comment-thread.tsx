import type { Comment } from "@shared/types";
import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import {
	ChevronUpIcon,
	MessageSquare,
	MinusCircle,
	PlusCircle,
} from "lucide-react";
import { memo, useState } from "react";
import { useCurrentUser } from "@/contexts/current-user-context";
import { useUpvoteComment } from "@/hooks/upvote";
import { cn, relativeTime } from "@/lib/utils";
import { subCommentsInfiniteQueryOptions } from "@/services/comments";
import { CommentForm } from "./comment-form";
import { LoadMoreRepliesButton } from "./load-more-replies-button";
import { Separator } from "./ui/separator";

type CommentThreadProps = {
	comment: Comment;
	depth: number;
	activeReplyId: string | null;
	setActiveReplyId: React.Dispatch<React.SetStateAction<string | null>>;
	isLast: boolean;
};

export const CommentThread = memo(function CommentThread({
	comment,
	depth = 0,
	activeReplyId,
	setActiveReplyId,
	isLast,
}: CommentThreadProps) {
	const { currentUser } = useCurrentUser();
	const [isCollapsed, setIsCollapsed] = useState(false);
	const queryClient = useQueryClient();
	const { mutate: upvote } = useUpvoteComment();
	const {
		data: commentsData,
		hasNextPage,
		fetchNextPage,
		isFetchingNextPage,
	} = useInfiniteQuery(subCommentsInfiniteQueryOptions(comment));

	const isReplying = activeReplyId === comment.id.toString();
	const hasSubComments =
		commentsData?.pages[0]?.data.length === 0 && comment.commentCount > 0;

	return (
		<div className={cn(depth > 0 && "ml-4 border-border border-l pl-4")}>
			<div className="py-2">
				<div className="mb-2 flex items-center space-x-1 text-xs">
					<button
						disabled={!currentUser}
						type="button"
						className={cn(
							"flex items-center space-x-1 hover:text-primary",
							currentUser ? "cursor-pointer" : "cursor-not-allowed opacity-60",
							comment.isUpvoted ? "text-primary" : "text-muted-foreground",
						)}
						onClick={() =>
							upvote({
								commentId: comment.id.toString(),
								parentCommentId: comment.parentCommentId?.toString() ?? null,
								postId: comment.postId.toString(),
							})
						}
					>
						<ChevronUpIcon size={20} />
						<span className="font-medium">{comment.points}</span>
					</button>
					<span className="text-muted-foreground">•</span>
					<span className="font-medium">{comment.author.username}</span>
					<span className="text-muted-foreground">•</span>
					<span className="text-muted-foreground">
						{relativeTime(comment.createdAt)}
					</span>
					<span className="text-muted-foreground">•</span>
					<button
						className="text-muted-foreground hover:text-foreground"
						type="button"
						onClick={() => setIsCollapsed((prev) => !prev)}
					>
						{isCollapsed ? <PlusCircle size={14} /> : <MinusCircle size={14} />}
					</button>
				</div>
				{!isCollapsed && (
					<div className="ml-[0.25em]">
						<p className="mb-2 text-foreground text-sm">{comment.content}</p>
						<div className="flex items-center space-x-1 text-muted-foreground text-xs">
							{currentUser && (
								<button
									type="button"
									className="flex items-center space-x-1 hover:text-foreground"
									onClick={() => setActiveReplyId(comment.id.toString())}
								>
									<MessageSquare size={16} />
									<span>Reply</span>
								</button>
							)}
						</div>
						{isReplying && (
							<div className="mt-2">
								<CommentForm
									postId={comment.postId.toString()}
									parentCommentId={comment.id.toString()}
									onCompletion={() => setActiveReplyId(null)}
								/>
							</div>
						)}
					</div>
				)}
			</div>
			{!isCollapsed &&
				commentsData &&
				commentsData.pages.map((page, index) => {
					const isLastPage = index === commentsData.pages.length - 1;
					return page.data.map((subComment, index) => (
						<CommentThread
							key={subComment.id.toString()}
							comment={subComment}
							depth={depth + 1}
							activeReplyId={activeReplyId}
							setActiveReplyId={setActiveReplyId}
							isLast={isLastPage && index === page.data.length - 1}
						/>
					));
				})}
			{!isCollapsed && (hasNextPage || hasSubComments) && (
				<div className="mt-2">
					<LoadMoreRepliesButton
						onClick={() => {
							if (hasSubComments) {
								queryClient.invalidateQueries({
									queryKey: ["comments", "comment", comment.id.toString()],
								});
							} else {
								fetchNextPage();
							}
						}}
						isLoading={isFetchingNextPage}
					/>
				</div>
			)}
			{!isLast && <Separator className="my-2" />}
		</div>
	);
});
