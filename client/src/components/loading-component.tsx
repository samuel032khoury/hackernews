import { Loader2Icon } from "lucide-react";

export function LoadingComponent() {
	return (
		<div className="mx-auto mt-16 flex flex-col items-center justify-center">
			<Loader2Icon className="h-8 w-8 animate-spin text-primary" />
			<p className="mt-3 text-muted-foreground text-sm">Loading...</p>
		</div>
	);
}
