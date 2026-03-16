import type { UpvotableItemState } from "@shared/types";
import type { QueryClient } from "@tanstack/react-query";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRef } from "react";
import { toast } from "sonner";

export type CacheAdapter<TVariables> = {
	read: (
		queryClient: QueryClient,
		variables: TVariables,
	) => UpvotableItemState | null;
	write: (
		queryClient: QueryClient,
		variables: TVariables,
		update: UpvotableItemState,
	) => void;
	cancel: (queryClient: QueryClient, variables: TVariables) => Promise<void>;
	invalidate: (queryClient: QueryClient, variables: TVariables) => void;
};

type MutationEntry = {
	pendingRequests: number;
	prevState: UpvotableItemState | null;
};

type OptimisticUpvoteConfig<
	TVariables,
	TResponse extends { data: UpvotableItemState },
> = {
	mutationKey: string[];
	mutationFn: (variables: TVariables) => Promise<TResponse>;
	getId: (variables: TVariables) => string | number;
	adapters: CacheAdapter<TVariables>[];
};

function readState<TVariables>(
	adapters: CacheAdapter<TVariables>[],
	queryClient: QueryClient,
	variables: TVariables,
): UpvotableItemState | null {
	for (const adapter of adapters) {
		const state = adapter.read(queryClient, variables);
		if (state) return state;
	}
	return null;
}

function writeState<TVariables>(
	adapters: CacheAdapter<TVariables>[],
	queryClient: QueryClient,
	variables: TVariables,
	update: UpvotableItemState,
) {
	for (const adapter of adapters) {
		adapter.write(queryClient, variables, update);
	}
}

export function createOptimisticUpvoteMutation<
	TVariables,
	TResponse extends { data: UpvotableItemState },
>(config: OptimisticUpvoteConfig<TVariables, TResponse>) {
	const { adapters, getId } = config;

	return function useOptimisticUpvote() {
		const queryClient = useQueryClient();
		const mutationState = useRef(new Map<string | number, MutationEntry>());

		return useMutation({
			mutationKey: config.mutationKey,
			mutationFn: config.mutationFn,

			onMutate: async (variables: TVariables) => {
				await Promise.all(
					adapters.map((a) => a.cancel(queryClient, variables)),
				);

				const id = getId(variables);
				const tracked = mutationState.current.get(id);

				if (tracked) {
					tracked.pendingRequests += 1;
				} else {
					mutationState.current.set(id, {
						pendingRequests: 1,
						prevState: readState(adapters, queryClient, variables),
					});
				}

				const currentState = readState(adapters, queryClient, variables);
				if (!currentState) return;

				writeState(adapters, queryClient, variables, {
					isUpvoted: !currentState.isUpvoted,
					points: currentState.points + (currentState.isUpvoted ? -1 : 1),
				});
			},

			onSuccess: (response, variables) => {
				const id = getId(variables);
				const tracked = mutationState.current.get(id);
				if (!tracked) return;

				tracked.pendingRequests -= 1;
				tracked.prevState = response.data;

				if (tracked.pendingRequests !== 0) return;

				writeState(adapters, queryClient, variables, response.data);
				mutationState.current.delete(id);
			},

			onError: (_error, variables) => {
				toast.error("An error occurred", {
					description: "Failed to update upvote. Please try again.",
					icon: "⚠️",
				});

				const id = getId(variables);
				const tracked = mutationState.current.get(id);
				if (!tracked) return;

				tracked.pendingRequests -= 1;
				if (tracked.pendingRequests !== 0) return;

				if (tracked.prevState) {
					writeState(adapters, queryClient, variables, tracked.prevState);
				}

				mutationState.current.delete(id);
			},

			onSettled: (_data, _error, variables) => {
				const id = getId(variables);
				if (mutationState.current.has(id)) return;

				for (const adapter of adapters) {
					adapter.invalidate(queryClient, variables);
				}
			},
		});
	};
}
