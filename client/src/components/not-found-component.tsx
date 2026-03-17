import { Link } from "@tanstack/react-router";
import { FileQuestion } from "lucide-react";
import { Button } from "./ui/button";

export function NotFoundComponent() {
	return (
		<div className="flex min-h-[50vh] flex-col items-center justify-center gap-6 p-4 text-center">
			<div className="flex size-20 items-center justify-center rounded-full bg-muted">
				<FileQuestion className="size-10 text-muted-foreground" />
			</div>
			<div className="space-y-2">
				<h1 className="font-bold text-3xl tracking-tighter sm:text-4xl">
					Page not found
				</h1>
				<p className="max-w-[600px] text-muted-foreground md:text-xl/relaxed">
					Sorry, we couldn't find the page you're looking for. It might have
					been moved or deleted.
				</p>
			</div>
			<Button asChild size="lg">
				<Link to="/">Go Home</Link>
			</Button>
		</div>
	);
}
