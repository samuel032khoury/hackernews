import type { Comment } from "@shared/types";
import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import {
	ChevronDownIcon,
	ChevronUpIcon,
	LoaderIcon,
	MessageSquare,
	MinusCircle,
	PlusCircle,
} from "lucide-react";
import { useState } from "react";
import { useCurrentUser } from "@/contexts/current-user-context";
import { cn, relativeTime } from "@/lib/utils";
import { subCommentsInfiniteQueryOptions } from "@/services/comments";

type CommentThreadProps = {
	comment: Comment;
	depth: number;
	activeReplyId: number | null;
	setActiveReplyId: React.Dispatch<React.SetStateAction<number | null>>;
	isLast: boolean;
};

export function CommentThread({
	comment,
	depth = 0,
	activeReplyId,
	setActiveReplyId,
	isLast: _isLast,
}: CommentThreadProps) {
	const { currentUser } = useCurrentUser();
	const [isCollapsed, setIsCollapsed] = useState(false);
	const queryClient = useQueryClient();
	const {
		data: commentsData,
		hasNextPage,
		fetchNextPage,
		isFetchingNextPage,
	} = useInfiniteQuery(subCommentsInfiniteQueryOptions(comment));

	const isReplying = activeReplyId === comment.id;
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
					<>
						<p className="mb-2 text-foreground text-sm">{comment.content}</p>
						<div className="flex items-center space-x-1 text-muted-foreground text-xs">
							{currentUser && (
								<button
									type="button"
									className="flex items-center space-x-1 hover:text-foreground"
									onClick={() => setActiveReplyId(comment.id)}
								>
									<MessageSquare size={16} />
									<span>Reply</span>
								</button>
							)}
						</div>
						{isReplying && (
							<div className="mt-2 flex flex-col items-baseline space-y-2">
								<button type="button" onClick={() => setActiveReplyId(null)}>
									<span>------Cancel------</span>
								</button>
							</div>
						)}
					</>
				)}
			</div>
			{!isCollapsed &&
				commentsData &&
				commentsData.pages.map((page, index) => {
					const isLastPage = index === commentsData.pages.length - 1;
					return page.data.map((subComment, index) => (
						<CommentThread
							key={subComment.id}
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
					<button
						type="button"
						className="flex items-center space-x-1 text-muted-foreground text-xs hover:text-foreground"
						onClick={() => {
							if (hasSubComments) {
								queryClient.invalidateQueries({
									queryKey: ["comments", "comment", comment.id],
								});
							} else {
								fetchNextPage();
							}
						}}
						disabled={isFetchingNextPage}
					>
						{isFetchingNextPage ? (
							<>
								<LoaderIcon size={12} />
								<span>Loading...</span>
							</>
						) : (
							<>
								<ChevronDownIcon size={12} />
								<span>More replies</span>
							</>
						)}
					</button>
				</div>
			)}
		</div>
	);
}
