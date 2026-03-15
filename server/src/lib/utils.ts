import { type SQL, sql } from "drizzle-orm";
import type { PgColumn } from "drizzle-orm/pg-core";

export function getISOFormatDateQuery(dateTimeColumn: PgColumn): SQL<string> {
	return sql<string>`to_char(${dateTimeColumn}, 'YYYY-MM-DD"T"HH24:MI:SS"Z"')`;
}

export function getCommentIsUpvotedQuery(
	commentIdColumn: PgColumn,
	userId: string | undefined,
): SQL<boolean> {
	if (!userId) {
		return sql<boolean>`false`;
	}

	return sql<boolean>`EXISTS (
		SELECT 1
		FROM "comment_upvotes"
		WHERE "comment_upvotes"."comment_id" = ${commentIdColumn}
		AND "comment_upvotes"."user_id" = ${userId}
	)`;
}

export const throwValidationError = (
	result: { success: true } | { success: false; error: Error },
) => {
	if (!result.success) throw result.error;
};
