import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";

const client = postgres(process.env.DATABASE_URL || "");
const db = drizzle(client);

try {
	await migrate(db, { migrationsFolder: "./src/db/drizzle" });
	console.log("Migrations applied ✅");
	process.exit(0);
} catch (err) {
	console.error("Migration failed ❌", err);
	process.exit(1);
} finally {
	await client.end();
}
