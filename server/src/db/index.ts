import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { processEnv } from "@/lib/env";
import * as schema from "./schema";

const queryClient = postgres(processEnv.DATABASE_URL);
export const db = drizzle(queryClient, { schema });
