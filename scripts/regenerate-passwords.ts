import "dotenv/config";
import { Pool } from "@neondatabase/serverless";

import { generatePassword } from "../lib/password";

function generateUniquePassword(used: Set<string>): string {
  for (let attempt = 0; attempt < 100; attempt++) {
    const password = generatePassword();
    if (!used.has(password)) {
      used.add(password);
      return password;
    }
  }
  throw new Error("Failed to generate unique password");
}

export async function regenerateQuizPasswords(pool: Pool): Promise<void> {
  const { rows } = await pool.query<{ id: string; slug: string; password: string }>(
    "SELECT id, slug, password FROM quizzes ORDER BY created_at"
  );

  if (rows.length === 0) {
    console.log("No quizzes to update.");
    return;
  }

  const used = new Set<string>();

  for (const row of rows) {
    const newPassword = generateUniquePassword(used);
    await pool.query("UPDATE quizzes SET password = $1 WHERE id = $2", [
      newPassword,
      row.id,
    ]);
    console.log(`${row.slug}: ${row.password.trim()} -> ${newPassword}`);
  }

  console.log(`Regenerated ${rows.length} quiz password(s).`);
}

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error("DATABASE_URL is not set.");
    process.exit(1);
  }

  const pool = new Pool({ connectionString: databaseUrl });

  try {
    await regenerateQuizPasswords(pool);
  } finally {
    await pool.end();
  }
}

if (require.main === module) {
  main().catch((err) => {
    console.error("Password regeneration failed:", err);
    process.exit(1);
  });
}
