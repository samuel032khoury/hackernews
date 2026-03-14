import { useQuery } from "@tanstack/react-query";
import { createContext, useContext } from "react";
import { currentUserQueryOptions } from "@/services/users";

type CurrentUser = {
	name: string | null | undefined;
	email: string | null | undefined;
	username: string | null | undefined;
} | null;

type CurrentUserContextValue = {
	currentUser: CurrentUser;
	isLoadingCurrentUser: boolean;
};

const CurrentUserContext = createContext<CurrentUserContextValue | null>(null);

export const CurrentUserProvider = ({
	children,
}: {
	children: React.ReactNode;
}) => {
	const { data: currentUser, isPending } = useQuery(currentUserQueryOptions);

	return (
		<CurrentUserContext.Provider
			value={{
				currentUser: currentUser ?? null,
				isLoadingCurrentUser: isPending,
			}}
		>
			{children}
		</CurrentUserContext.Provider>
	);
};

export const useCurrentUser = () => {
	const context = useContext(CurrentUserContext);

	if (!context) {
		throw new Error("useCurrentUser must be used within CurrentUserProvider");
	}

	return context;
};
