import {
  captureBatchexecuteRaw,
  parseNotebookLmRaw,
} from "../lib/notebooklm-import";

const url =
  "https://notebooklm.google.com/notebook/d523dbcc-ae2d-4987-a93e-f354523743f0/artifact/7a86bb7e-8071-4d7d-bac9-9d6036f188f9";

async function main() {
  const raw = await captureBatchexecuteRaw(url);
  const quiz = parseNotebookLmRaw(raw, { sourceUrl: url });
  console.log("OK:", quiz.questions.length, "questions,", quiz.title);
}

main().catch((err) => {
  console.error("FAIL:", err.message);
  process.exit(1);
});
