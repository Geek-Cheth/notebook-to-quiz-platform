import "dotenv/config";
import { neon } from "@neondatabase/serverless";

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error("DATABASE_URL is not set. Copy .env.example to .env and add your Neon connection string.");
    process.exit(1);
  }

  const sql = neon(databaseUrl);

  console.log("Running migration: migrations/001_init.sql");

  await sql`CREATE EXTENSION IF NOT EXISTS "pgcrypto"`;

  await sql`
    CREATE TABLE IF NOT EXISTS quizzes (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      slug VARCHAR(32) NOT NULL UNIQUE,
      password CHAR(8) NOT NULL UNIQUE,
      title TEXT NOT NULL,
      source_url TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS questions (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      quiz_id UUID NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
      order_num INTEGER NOT NULL,
      text TEXT NOT NULL,
      options JSONB NOT NULL,
      correct_index INTEGER NOT NULL CHECK (correct_index >= 0 AND correct_index <= 3),
      rationale TEXT,
      UNIQUE (quiz_id, order_num)
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS submissions (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      quiz_id UUID NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
      student_name TEXT NOT NULL,
      answers JSONB NOT NULL,
      score INTEGER NOT NULL,
      total INTEGER NOT NULL,
      submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;

  await sql`CREATE INDEX IF NOT EXISTS idx_questions_quiz_id ON questions(quiz_id)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_submissions_quiz_id ON submissions(quiz_id)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_quizzes_password ON quizzes(password)`;

  console.log("Migration completed successfully.");
}

main().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
