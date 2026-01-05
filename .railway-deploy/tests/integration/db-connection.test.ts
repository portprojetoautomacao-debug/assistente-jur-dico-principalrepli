import dotenv from "dotenv";
import path from "path";
import pg from "pg";
import { describe, expect, it } from "vitest";

// Load .env.test explicitly to ensure we have the variables
dotenv.config({ path: path.resolve(process.cwd(), ".env.test") });

const shouldRun = process.env.ENABLE_DB_TEST === "true";
const describeFn = shouldRun ? describe : describe.skip;

describeFn("Database Connection", () => {
  it("should connect to the PostgreSQL database", async () => {
    const connectionString = process.env.DATABASE_URL;

    if (!connectionString) {
      console.warn("Skipping DB test: DATABASE_URL not defined");
      return;
    }

    console.log(`Testing connection to: ${connectionString.replace(/:[^:@]*@/, ":***@")}`); // Hide password

    const pool = new pg.Pool({
      connectionString,
      ssl: { rejectUnauthorized: false }, // Neon often requires SSL
      connectionTimeoutMillis: 5000,
    });

    try {
      const client = await pool.connect();
      try {
        const res = await client.query("SELECT NOW()");
        expect(res.rows).toHaveLength(1);
        console.log("✅ DB Connection successful:", res.rows[0]);
      } finally {
        client.release();
      }
    } catch (error) {
      console.error("❌ DB Connection failed:", error);
      throw error;
    } finally {
      await pool.end();
    }
  });
});
