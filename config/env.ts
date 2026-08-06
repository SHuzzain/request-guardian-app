import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

const envConfig = createEnv({
  server: {
    GENERATE_SOURCEMAP: z.coerce.boolean().default(false),
  },
  client: {
    NEXT_PUBLIC_API_URL: z.string().min(1),
    NEXT_PUBLIC_NODE_ENV: z.string().default("development"),
  },
  experimental__runtimeEnv: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
    NEXT_PUBLIC_NODE_ENV: process.env.NODE_ENV,
  },
});

export default envConfig;
