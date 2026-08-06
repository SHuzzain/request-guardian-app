import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error(
    "[db] DATABASE_URL is not set.\n" +
      "Add it to your .env.local file:\n" +
      "DATABASE_URL=postgresql://user:password@host:5432/dbname",
  );
}

export const queryClient = postgres(connectionString, { prepare: false });

export const db = drizzle({ client: queryClient, schema });

export * from "./schema";
