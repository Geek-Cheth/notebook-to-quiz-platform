import "dotenv/config";
import { createQuiz } from "../lib/quiz";
import { importQuizFromNotebookLmUrl } from "../lib/notebooklm-import";

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error("DATABASE_URL is not set. Copy .env.example to .env and add your Neon connection string.");
    process.exit(1);
  }

  const sourceUrl = process.argv[2]?.trim();
  const title = process.argv[3]?.trim();

  if (!sourceUrl) {
    console.error("Usage: tsx scripts/import.ts <notebooklm-quiz-url> [title]");
    process.exit(1);
  }

  console.log("Importing from:", sourceUrl);
  const extracted = await importQuizFromNotebookLmUrl(sourceUrl, title);
  const quiz = await createQuiz(extracted);

  console.log("Imported quiz:");
  console.log("  Title:", quiz.title);
  console.log("  Slug:", quiz.slug);
  console.log("  Password:", quiz.password);
  console.log("  Share URL:", `/q/${quiz.slug}`);
  console.log("  Questions:", quiz.questionCount);
}

main().catch((err) => {
  console.error("Import failed:", err);
  process.exit(1);
});
