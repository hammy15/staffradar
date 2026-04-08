import { Pool } from "@neondatabase/serverless";

export function getDb() {
  return new Pool({ connectionString: process.env.DATABASE_URL });
}
