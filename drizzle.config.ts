import type { Config } from "drizzle-kit";

export default {
  schema: "./db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: "postgresql://sysmart:%24m@6iT2027@3.109.35.119:5432/smartapp",
  },
} satisfies Config;
