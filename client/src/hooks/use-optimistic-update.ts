import type { QueryClient } from "@tanstack/react-query";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRef } from "react";
import { toast } from "sonner";

export type CacheAdapter<TVariables, TState> = {
	read: (queryClient: QueryClient, variables: TVariables) => TState | null;
	write: (
		queryClient: QueryClient,
		variables: TVariables,
		update: TState,
	) => void;
	cancel: (queryClient: QueryClient, variables: TVariables) => Promise<void>;
	invalidate: (queryClient: QueryClient, variables: TVariables) => void;
};

type MutationEntry<TState> = {
	pendingRequests: number;
	prevState: TState | null;
};

type OptimisticUpdateConfig<
	TVariables,
	TState,
	TResponse extends { data: TState },
> = {
	mutationKey: string[];
	mutationFn: (variables: TVariables) => Promise<TResponse>;
	getId: (variables: TVariables) => string;
	getOptimisticUpdate: (currentState: TState) => TState;
	adapters: CacheAdapter<TVariables, TState>[];
};

function readState<TVariables, TState>(
	adapters: CacheAdapter<TVariables, TState>[],
	queryClient: QueryClient,
	variables: TVariables,
): TState | null {
	for (const adapter of adapters) {
		const state = adapter.read(queryClient, variables);
		if (state) return state;
	}
	return null;
}

function writeState<TVariables, TState>(
	adapters: CacheAdapter<TVariables, TState>[],
	queryClient: QueryClient,
	variables: TVariables,
	update: TState,
) {
	for (const adapter of adapters) {
		adapter.write(queryClient, variables, update);
	}
}

export function createOptimisticUpdateMutation<
	TVariables,
	TState,
	TResponse extends { data: TState },
>(config: OptimisticUpdateConfig<TVariables, TState, TResponse>) {
	const { adapters, getId, getOptimisticUpdate } = config;

	return function useOptimisticUpdate() {
		const queryClient = useQueryClient();
		const mutationState = useRef(new Map<string, MutationEntry<TState>>());

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

				writeState(
					adapters,
					queryClient,
					variables,
					getOptimisticUpdate(currentState),
				);
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
					description: "Something went wrong. Please try again.",
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
