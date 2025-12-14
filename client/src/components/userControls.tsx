import { Link } from "@tanstack/react-router";
import { cn } from "@/lib/utils";
import { Button } from "./ui/button";

interface UserControlsProps {
	currentUser: { username: string | null | undefined } | null | undefined;
	onLogout: () => void;
	onNavigate?: () => void;
	variant: "desktop" | "mobile";
}

export const UserControls = ({
	currentUser,
	onLogout,
	onNavigate,
	variant,
}: UserControlsProps) => {
	const isMobile = variant === "mobile";

	if (currentUser) {
		const displayName = currentUser.username ?? "User";
		return (
			<div
				className={
					isMobile ? "flex w-full flex-col gap-2" : "flex items-center gap-4"
				}
			>
				<span>{isMobile ? `Profile [${displayName}]` : displayName}</span>
				<Button
					size="sm"
					variant="secondary"
					className={cn(
						"bg-secondary-foreground text-primary-foreground hover:bg-secondary-foreground/70",
						isMobile && "w-full",
					)}
					onClick={() => {
						onLogout();
						onNavigate?.();
					}}
				>
					Log out
				</Button>
			</div>
		);
	}

	return (
		<div
			className={
				isMobile ? "flex w-full flex-col gap-2" : "flex items-center gap-2"
			}
		>
			<Button
				asChild
				size="sm"
				variant="secondary"
				className={
					isMobile
						? "w-full bg-primary text-secondary hover:bg-primary/70"
						: "bg-primary-foreground text-secondary-foreground hover:bg-primary-foreground/70"
				}
			>
				<Link to="/login" onClick={onNavigate}>
					Log in
				</Link>
			</Button>
			<Button
				asChild
				size="sm"
				variant="secondary"
				className={cn(
					"bg-secondary-foreground text-primary-foreground hover:bg-secondary-foreground/70",
					isMobile && "w-full",
				)}
			>
				<Link to="/signup" onClick={onNavigate}>
					Sign up
				</Link>
			</Button>
		</div>
	);
};
