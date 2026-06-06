import "dotenv/config";
import fs from "fs";
import path from "path";
import { createQuiz } from "../lib/quiz";
import { parseSeedFile } from "../lib/notebooklm-import";

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error("DATABASE_URL is not set. Copy .env.example to .env and add your Neon connection string.");
    process.exit(1);
  }

  const seedPath = path.join(process.cwd(), "data", "digital-quiz.json");
  if (!fs.existsSync(seedPath)) {
    console.error("Seed file not found:", seedPath);
    process.exit(1);
  }

  const raw = JSON.parse(fs.readFileSync(seedPath, "utf8")) as {
    title: string;
    sourceUrl?: string;
    questions: Array<{
      text: string;
      options: string[];
      correctIndex: number;
      rationale?: string | null;
    }>;
  };

  const quizData = parseSeedFile(raw);
  const quiz = await createQuiz(quizData);

  console.log("Seeded quiz:");
  console.log("  Title:", quiz.title);
  console.log("  Slug:", quiz.slug);
  console.log("  Password:", quiz.password);
  console.log("  Share URL:", `/q/${quiz.slug}`);
  console.log("  Questions:", quiz.questionCount);
}

main().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
