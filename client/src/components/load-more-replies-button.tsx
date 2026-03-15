import { ChevronDownIcon, LoaderIcon } from "lucide-react";

type LoadMoreRepliesButtonProps = {
	onClick: () => void;
	isLoading: boolean;
	label?: string;
};

export function LoadMoreRepliesButton({
	onClick,
	isLoading,
	label = "More replies",
}: LoadMoreRepliesButtonProps) {
	return (
		<button
			type="button"
			className="flex items-center space-x-1 text-muted-foreground text-xs hover:text-foreground"
			onClick={onClick}
			disabled={isLoading}
		>
			{isLoading ? (
				<>
					<LoaderIcon size={12} className="animate-spin" />
					<span>Loading...</span>
				</>
			) : (
				<>
					<ChevronDownIcon size={12} />
					<span>{label}</span>
				</>
			)}
		</button>
	);
}
