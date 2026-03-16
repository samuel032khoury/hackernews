import type { QueryClient } from "@tanstack/react-query";
import { useMutation, useQueryClient } from "@tanstack/react-query";
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

	type PendingEntry<TState> = {
		count: number;
		prevState: TState | null;
	};

	const pendingMap = new Map<string, PendingEntry<TState>>();

	return function useOptimisticUpdate() {
		const queryClient = useQueryClient();

		return useMutation({
			mutationKey: config.mutationKey,
			mutationFn: config.mutationFn,

			onMutate: async (variables: TVariables) => {
				await Promise.all(
					adapters.map((a) => a.cancel(queryClient, variables)),
				);

				const id = getId(variables);
				const existing = pendingMap.get(id);

				if (existing) {
					existing.count += 1;
				} else {
					const prevState = readState(adapters, queryClient, variables);
					pendingMap.set(id, { count: 1, prevState });
				}

				const currentState = readState(adapters, queryClient, variables);
				if (currentState) {
					writeState(
						adapters,
						queryClient,
						variables,
						getOptimisticUpdate(currentState),
					);
				}
			},

			onSuccess: (response, variables) => {
				const id = getId(variables);
				const tracked = pendingMap.get(id);
				if (!tracked) return;

				tracked.count -= 1;

				tracked.prevState = response.data;

				if (tracked.count === 0) {
					pendingMap.delete(id);
					writeState(adapters, queryClient, variables, response.data);
				}
			},

			onError: (_error, variables) => {
				toast.error("An error occurred", {
					description: "Something went wrong. Please try again.",
					icon: "⚠️",
				});

				const id = getId(variables);
				const tracked = pendingMap.get(id);
				if (!tracked) return;

				tracked.count -= 1;
				if (tracked.count === 0) {
					pendingMap.delete(id);
					if (tracked.prevState) {
						writeState(adapters, queryClient, variables, tracked.prevState);
					}
				}
			},

			onSettled: (_data, _error, variables) => {
				const id = getId(variables);
				if (pendingMap.has(id)) return;

				for (const adapter of adapters) {
					adapter.invalidate(queryClient, variables);
				}
			},
		});
	};
}
