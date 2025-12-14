import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import { MenuIcon } from "lucide-react";
import { useEffect, useState } from "react";
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
import { UserControls } from "./userControls";

export function Header() {
	const navigate = useNavigate();
	const location = useLocation();
	const queryClient = useQueryClient();
	const { data: currentUser } = useQuery(currentUserQueryOptions());
	const [sheetOpen, setSheetOpen] = useState(false);

	const isAuthPage =
		location.pathname === "/login" || location.pathname === "/signup";

	const handleLogout = async () => {
		await authClient.signOut();
		await queryClient.invalidateQueries({ queryKey: ["currentUser"] });
		navigate({ to: "/" });
	};

	const closeSheet = () => setSheetOpen(false);

	useEffect(() => {
		const handleResize = () => {
			if (window.innerWidth >= 768) {
				setSheetOpen(false);
			}
		};

		window.addEventListener("resize", handleResize);
		return () => window.removeEventListener("resize", handleResize);
	}, []);

	return (
		<header className="sticky top-0 z-50 w-full border-border/40 bg-primary/95 backdrop-blur supports-backdrop-filter:bg-primary/90">
			<div className="container mx-auto flex items-center justify-between p-4">
				<div className="flex items-center space-x-4">
					<Link to="/" className="font-bold text-2xl">
						HackerNews
					</Link>
					{!isAuthPage && (
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
					)}
				</div>
				{!isAuthPage && (
					<>
						<div className="hidden items-center space-x-4 md:flex">
							<UserControls
								currentUser={currentUser}
								onLogout={handleLogout}
								variant="desktop"
							/>
						</div>
						<Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
							<SheetTrigger asChild>
								<Button variant="secondary" size="icon" className="md:hidden">
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
									<Link to="/" className="hover:underline" onClick={closeSheet}>
										New
									</Link>
									<Link to="/" className="hover:underline" onClick={closeSheet}>
										Top
									</Link>
									<Link to="/" className="hover:underline" onClick={closeSheet}>
										Submit
									</Link>
									<UserControls
										currentUser={currentUser}
										onLogout={handleLogout}
										onNavigate={closeSheet}
										variant="mobile"
									/>
								</nav>
							</SheetContent>
						</Sheet>
					</>
				)}
			</div>
		</header>
	);
}
