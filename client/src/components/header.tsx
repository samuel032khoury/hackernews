import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate } from "@tanstack/react-router";
import { MenuIcon } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { currentUserQueryOptions } from "@/services/current-user";
import { Button } from "./ui/button";
import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetHeader,
	SheetTitle,
	SheetTrigger,
} from "./ui/sheet";

export function Header() {
	const navigate = useNavigate();
	const queryClient = useQueryClient();
	const { data: currentUser } = useQuery(currentUserQueryOptions());
	const handleLogout = async () => {
		await authClient.signOut();
		await queryClient.invalidateQueries({ queryKey: ["currentUser"] });
		navigate({ to: "/" });
	};
	return (
		<header className="sticky top-0 z-50 w-full border-border/40 bg-primary/95 backdrop-blur supports-backdrop-filter:bg-primary/90">
			<div className="container mx-auto flex items-center justify-between p-4">
				<div className="flex items-center space-x-4">
					<Link to="/" className="font-bold text-2xl">
						HackerNews
					</Link>
					<nav className="hidden items-center space-x-4 md:flex">
						<Link to="/" className="hover:underline">
							New
						</Link>
						<Link to="/" className="hover:underline">
							Top
						</Link>
						<Link to="/" className="hover:underline">
							Submit
						</Link>
					</nav>
				</div>
				<div className="hidden items-center space-x-4 md:flex">
					{currentUser ? (
						<>
							<span>{currentUser.username}</span>
							<Button
								size={"sm"}
								variant={"secondary"}
								className="bg-secondary-foreground text-primary-foreground hover:bg-secondary-foreground/70"
								onClick={handleLogout}
							>
								Log out
							</Button>
						</>
					) : (
						<div className="flex items-center space-x-2">
							<Button
								asChild
								size={"sm"}
								variant={"secondary"}
								className="bg-primary-foreground text-secondary-foreground hover:bg-primary-foreground/70"
							>
								<Link to="/login">Log in</Link>
							</Button>
							<Button
								asChild
								size={"sm"}
								variant={"secondary"}
								className="bg-secondary-foreground text-primary-foreground hover:bg-secondary-foreground/70"
							>
								<Link to="/signup">Sign up</Link>
							</Button>
						</div>
					)}
				</div>
				<Sheet>
					<SheetTrigger asChild>
						<Button variant={"secondary"} size={"icon"} className="md:hidden">
							<MenuIcon className="size-6" />
						</Button>
					</SheetTrigger>
					<SheetContent className="mb-2">
						<SheetHeader>
							<SheetTitle>HackerNews</SheetTitle>
							<SheetDescription className="sr-only">
								Navigation
							</SheetDescription>
						</SheetHeader>
						<nav className="flex flex-col space-y-4 px-4">
							<Link to="/" className="hover:underline">
								New
							</Link>
							<Link to="/" className="hover:underline">
								Top
							</Link>
							<Link to="/" className="hover:underline">
								Submit
							</Link>
							{currentUser ? (
								<>
									<span>Profile [{currentUser.username}]</span>
									<Button
										size={"sm"}
										variant={"secondary"}
										className="bg-secondary-foreground text-primary-foreground hover:bg-secondary-foreground/70"
										onClick={handleLogout}
									>
										Logout
									</Button>
								</>
							) : (
								<div className="items-center space-x-2">
									<Button
										asChild
										size={"sm"}
										variant={"secondary"}
										className="bg-primary text-primary-foreground hover:bg-primary-foreground/70"
									>
										<Link to="/login">Log in</Link>
									</Button>
									<Button
										asChild
										size={"sm"}
										variant={"secondary"}
										className="bg-secondary-foreground text-primary-foreground hover:bg-secondary-foreground/70"
									>
										<Link to="/signup">Sign up</Link>
									</Button>
								</div>
							)}
						</nav>
					</SheetContent>
				</Sheet>
			</div>
		</header>
	);
}
