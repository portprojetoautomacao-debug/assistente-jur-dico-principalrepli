import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import pg from "pg";
import { fileURLToPath } from "url";

console.log("Starting db init script...");

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env.local from root if it exists
const rootEnvPath = path.resolve(__dirname, "../../../.env.local");
if (fs.existsSync(rootEnvPath)) {
  dotenv.config({ path: rootEnvPath });
}

// Also load .env from backend root if it exists
const backendEnvPath = path.resolve(__dirname, "../../.env");
if (fs.existsSync(backendEnvPath)) {
  dotenv.config({ path: backendEnvPath });
} else {
  dotenv.config();
}

async function initDb() {
  if (!process.env.DATABASE_URL) {
    console.error("❌ DATABASE_URL not found in environment variables.");
    process.exit(1);
  }

  const pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    console.log("🔌 Connecting to PostgreSQL...");
    const client = await pool.connect();
    console.log("✅ Connected successfully.");

    const schemaPath = path.join(__dirname, "schema.sql");
    const schemaSql = fs.readFileSync(schemaPath, "utf8");

    console.log("📝 Applying schema...");
    await client.query(schemaSql);
    console.log("✅ Schema applied successfully.");

    client.release();
  } catch (err) {
    console.error("❌ Error initializing database:", err);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

initDb();
