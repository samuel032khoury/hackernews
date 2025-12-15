import { queryOptions } from "@tanstack/react-query";
import { authClient } from "@/lib/auth-client";

const getCurrentUser = async () => {
	const { data: session } = await authClient.getSession();

	if (!session?.user) {
		return null;
	}

	return {
		name: session.user.name,
		email: session.user.email,
		username: session.user.username,
	};
};

export const currentUserQueryOptions = queryOptions({
	queryKey: ["currentUser"],
	queryFn: getCurrentUser,
	staleTime: Infinity,
});
