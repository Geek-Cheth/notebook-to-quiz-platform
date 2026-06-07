import "dotenv/config";
import fs from "fs";
import path from "path";
import { Pool } from "@neondatabase/serverless";

import { regenerateQuizPasswords } from "./regenerate-passwords";

const migrationsDir = path.join(process.cwd(), "migrations");

function splitStatements(sql: string): string[] {
  return sql
    .split(";")
    .map((s) => s.trim())
    .filter((s) => s.length > 0 && !s.split("\n").every((line) => line.trim().startsWith("--") || line.trim() === ""));
}

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error("DATABASE_URL is not set. Copy .env.example to .env and add your Neon connection string.");
    process.exit(1);
  }

  const pool = new Pool({ connectionString: databaseUrl });

  try {
    const files = fs
      .readdirSync(migrationsDir)
      .filter((f) => f.endsWith(".sql"))
      .sort();

    if (files.length === 0) {
      console.log("No migration files found.");
      return;
    }

    for (const file of files) {
      if (file === "003_password_format.sql") {
        const { rows: columnRows } = await pool.query<{ character_maximum_length: number }>(
          `SELECT character_maximum_length
           FROM information_schema.columns
           WHERE table_schema = 'public'
             AND table_name = 'quizzes'
             AND column_name = 'password'`
        );
        const currentLength = columnRows[0]?.character_maximum_length;
        if (currentLength && currentLength > 4) {
          console.log("Regenerating quiz passwords before column format migration...");
          await regenerateQuizPasswords(pool);
        }
      }

      const filePath = path.join(migrationsDir, file);
      const content = fs.readFileSync(filePath, "utf8");
      console.log(`Running migration: migrations/${file}`);

      for (const statement of splitStatements(content)) {
        await pool.query(statement);
      }
    }

    console.log("Migration completed successfully.");
  } finally {
    await pool.end();
  }
}

main().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
