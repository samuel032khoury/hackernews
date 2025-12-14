import { useQueryErrorResetBoundary } from "@tanstack/react-query";
import { Link, useRouter } from "@tanstack/react-router";
import { AlertTriangle, RotateCcw } from "lucide-react";
import { useEffect } from "react";
import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from "./ui/accordion";
import { Button } from "./ui/button";

export function ErrorComponent({ error }: { error: Error }) {
	const router = useRouter();
	const isDev = process.env.NODE_ENV === "development";

	const queryClientBoundary = useQueryErrorResetBoundary();

	useEffect(() => {
		queryClientBoundary.reset();
	}, [queryClientBoundary]);

	return (
		<div className="flex min-h-[50vh] flex-col items-center justify-center gap-6 p-4 text-center">
			<div className="flex size-20 items-center justify-center rounded-full bg-destructive/10">
				<AlertTriangle className="size-10 text-destructive" />
			</div>
			<div className="space-y-2">
				<h1 className="font-bold text-3xl tracking-tighter sm:text-4xl">
					Something went wrong
				</h1>
				<p className="max-w-[600px] text-muted-foreground md:text-xl/relaxed">
					We encountered an unexpected error. Please try again later.
				</p>
			</div>
			{isDev && (
				<div className="w-full max-w-md">
					<Accordion type="single" collapsible className="w-full">
						<AccordionItem value="error-details" className="border-none">
							<AccordionTrigger className="justify-center py-2 text-muted-foreground hover:text-foreground">
								View Error Details
							</AccordionTrigger>
							<AccordionContent>
								<div className="max-h-[200px] overflow-auto rounded-md bg-white p-4 text-left font-mono text-muted-foreground text-xs">
									<h3 className="mb-2 font-bold">Error Message:</h3>
									<p className="mb-2">{error.message}</p>
									<h3 className="mb-2 font-bold">Stack Trace:</h3>
									{error.stack && (
										<pre className="whitespace-pre-wrap">{error.stack}</pre>
									)}
								</div>
							</AccordionContent>
						</AccordionItem>
					</Accordion>
				</div>
			)}

			<div className="flex gap-4">
				<Button onClick={() => router.invalidate()} size="lg">
					<RotateCcw className="mr-2 size-4" />
					Try Again
				</Button>
				<Button asChild variant="outline" size="lg">
					<Link to="/">Go Home</Link>
				</Button>
			</div>
		</div>
	);
}
