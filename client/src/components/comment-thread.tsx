import type { Comment } from "@shared/types";
import {
	ChevronUpIcon,
	MessageSquare,
	MinusCircle,
	PlusCircle,
} from "lucide-react";
import { useState } from "react";
import { useCurrentUser } from "@/contexts/current-user-context";
import { cn, relativeTime } from "@/lib/utils";

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
	const isUpvoted = comment.commentUpvotes.length > 0;
	const isReplying = activeReplyId === comment.id;

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
							isUpvoted ? "text-primary" : "text-muted-foreground",
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
								<span>TEXTAREA</span>
								<button type="button" onClick={() => setActiveReplyId(null)}>
									Cancel
								</button>
							</div>
						)}
					</>
				)}
			</div>
		</div>
	);
}
