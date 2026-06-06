import { sql } from "./db";
import type {
  DbSubmitResult,
  ExtractedQuiz,
  GradedQuestionResult,
  PublicQuestion,
  QuestionRow,
  QuizQuestionInput,
  QuizRow,
  QuizSummaryRow,
  SubmissionRow,
} from "./db-types";

const SLUG_CHARS = "abcdefghijklmnopqrstuvwxyz0123456789";
const SLUG_LENGTH = 10;
const PASSWORD_LENGTH = 8;
const MAX_UNIQUE_ATTEMPTS = 20;

export function generateSlug(): string {
  let slug = "";
  for (let i = 0; i < SLUG_LENGTH; i++) {
    slug += SLUG_CHARS[Math.floor(Math.random() * SLUG_CHARS.length)];
  }
  return slug;
}

export function generatePassword(): string {
  let password = "";
  for (let i = 0; i < PASSWORD_LENGTH; i++) {
    password += Math.floor(Math.random() * 10).toString();
  }
  return password;
}

async function generateUniqueSlug(): Promise<string> {
  for (let attempt = 0; attempt < MAX_UNIQUE_ATTEMPTS; attempt++) {
    const slug = generateSlug();
    const rows = await sql`SELECT 1 FROM quizzes WHERE slug = ${slug} LIMIT 1`;
    if (rows.length === 0) return slug;
  }
  throw new Error("Failed to generate unique slug");
}

async function generateUniquePassword(): Promise<string> {
  for (let attempt = 0; attempt < MAX_UNIQUE_ATTEMPTS; attempt++) {
    const password = generatePassword();
    const rows = await sql`SELECT 1 FROM quizzes WHERE password = ${password} LIMIT 1`;
    if (rows.length === 0) return password;
  }
  throw new Error("Failed to generate unique password");
}

export function validateQuestionInput(q: QuizQuestionInput, index: number): void {
  if (!q.text?.trim()) {
    throw new Error(`Question ${index + 1}: text is required`);
  }
  if (!Array.isArray(q.options) || q.options.length !== 4) {
    throw new Error(`Question ${index + 1}: exactly 4 options are required`);
  }
  if (q.correctIndex < 0 || q.correctIndex > 3) {
    throw new Error(`Question ${index + 1}: correctIndex must be 0-3`);
  }
}

export function gradeSubmission(
  questions: QuestionRow[],
  answers: (number | null)[]
): { score: number; total: number; results: GradedQuestionResult[] } {
  if (answers.length !== questions.length) {
    throw new Error(
      `Expected ${questions.length} answers, received ${answers.length}`
    );
  }

  let score = 0;
  const results: GradedQuestionResult[] = questions.map((q, i) => {
    const selectedIndex = answers[i];
    const isCorrect =
      selectedIndex !== null && selectedIndex === q.correct_index;
    if (isCorrect) score++;

    return {
      questionId: q.id,
      orderNum: q.order_num,
      text: q.text,
      options: q.options,
      selectedIndex,
      correctIndex: q.correct_index,
      isCorrect,
      rationale: q.rationale,
    };
  });

  return { score, total: questions.length, results };
}

export async function createQuiz(data: ExtractedQuiz): Promise<QuizRow & { questionCount: number }> {
  if (!data.title?.trim()) {
    throw new Error("Quiz title is required");
  }
  if (!data.questions?.length) {
    throw new Error("At least one question is required");
  }

  data.questions.forEach(validateQuestionInput);

  const slug = await generateUniqueSlug();
  const password = await generateUniquePassword();

  const quizRows = await sql`
    INSERT INTO quizzes (slug, password, title, source_url)
    VALUES (${slug}, ${password}, ${data.title.trim()}, ${data.sourceUrl ?? null})
    RETURNING id, slug, password, title, source_url, created_at
  `;
  const quiz = quizRows[0] as QuizRow;

  for (let i = 0; i < data.questions.length; i++) {
    const q = data.questions[i];
    await sql`
      INSERT INTO questions (quiz_id, order_num, text, options, correct_index, rationale)
      VALUES (
        ${quiz.id},
        ${i + 1},
        ${q.text.trim()},
        ${JSON.stringify(q.options)},
        ${q.correctIndex},
        ${q.rationale ?? null}
      )
    `;
  }

  return { ...quiz, questionCount: data.questions.length };
}

export async function getQuizBySlug(slug: string): Promise<(QuizRow & { questions: PublicQuestion[] }) | null> {
  const quizRows = await sql`
    SELECT id, slug, password, title, source_url, created_at
    FROM quizzes
    WHERE slug = ${slug}
    LIMIT 1
  `;
  if (quizRows.length === 0) return null;

  const quiz = quizRows[0] as QuizRow;
  const questionRows = await sql`
    SELECT id, order_num, text, options
    FROM questions
    WHERE quiz_id = ${quiz.id}
    ORDER BY order_num ASC
  `;

  const questions: PublicQuestion[] = (questionRows as Array<{
    id: string;
    order_num: number;
    text: string;
    options: string[];
  }>).map((q) => ({
    id: q.id,
    orderNum: q.order_num,
    text: q.text,
    options: q.options,
  }));

  return { ...quiz, questions };
}

export async function getQuizQuestionsWithAnswers(quizId: string): Promise<QuestionRow[]> {
  const rows = await sql`
    SELECT id, quiz_id, order_num, text, options, correct_index, rationale
    FROM questions
    WHERE quiz_id = ${quizId}
    ORDER BY order_num ASC
  `;
  return rows as QuestionRow[];
}

export async function getQuizSlugByPassword(password: string): Promise<string | null> {
  if (!/^\d{8}$/.test(password)) {
    return null;
  }
  const rows = await sql`
    SELECT slug FROM quizzes WHERE password = ${password} LIMIT 1
  `;
  if (rows.length === 0) return null;
  return (rows[0] as { slug: string }).slug;
}

export async function submitQuizAnswers(
  slug: string,
  studentName: string,
  answers: (number | null)[]
): Promise<DbSubmitResult> {
  const trimmedName = studentName?.trim();
  if (!trimmedName) {
    throw new Error("Student name is required");
  }

  const quizRows = await sql`
    SELECT id FROM quizzes WHERE slug = ${slug} LIMIT 1
  `;
  if (quizRows.length === 0) {
    throw new Error("Quiz not found");
  }

  const quizId = (quizRows[0] as { id: string }).id;
  const questions = await getQuizQuestionsWithAnswers(quizId);
  const { score, total, results } = gradeSubmission(questions, answers);

  const submissionRows = await sql`
    INSERT INTO submissions (quiz_id, student_name, answers, score, total)
    VALUES (${quizId}, ${trimmedName}, ${JSON.stringify(answers)}, ${score}, ${total})
    RETURNING id
  `;

  return {
    submissionId: (submissionRows[0] as { id: string }).id,
    studentName: trimmedName,
    score,
    total,
    results,
  };
}

export async function updateQuizTitle(
  slug: string,
  title: string
): Promise<QuizRow> {
  const trimmed = title?.trim();
  if (!trimmed) {
    throw new Error("Quiz title is required");
  }

  const rows = await sql`
    UPDATE quizzes
    SET title = ${trimmed}
    WHERE slug = ${slug}
    RETURNING id, slug, password, title, source_url, created_at
  `;

  if (rows.length === 0) {
    throw new Error("Quiz not found");
  }

  return rows[0] as QuizRow;
}

export async function listAllQuizzes(): Promise<QuizSummaryRow[]> {
  const rows = await sql`
    SELECT
      q.slug,
      q.title,
      q.password,
      q.created_at,
      COUNT(DISTINCT qu.id)::int AS question_count,
      COUNT(DISTINCT s.id)::int AS submission_count,
      CASE
        WHEN COUNT(s.id) = 0 THEN NULL
        ELSE ROUND(AVG(s.score::float / NULLIF(s.total, 0) * 100)::numeric, 1)
      END AS average_score
    FROM quizzes q
    LEFT JOIN questions qu ON qu.quiz_id = q.id
    LEFT JOIN submissions s ON s.quiz_id = q.id
    GROUP BY q.id, q.slug, q.title, q.password, q.created_at
    ORDER BY q.created_at DESC
  `;
  return rows as QuizSummaryRow[];
}

export async function listQuizSubmissions(slug: string): Promise<SubmissionRow[]> {
  const quizRows = await sql`
    SELECT id FROM quizzes WHERE slug = ${slug} LIMIT 1
  `;
  if (quizRows.length === 0) {
    throw new Error("Quiz not found");
  }

  const quizId = (quizRows[0] as { id: string }).id;
  const rows = await sql`
    SELECT id, quiz_id, student_name, answers, score, total, submitted_at
    FROM submissions
    WHERE quiz_id = ${quizId}
    ORDER BY submitted_at DESC
  `;
  return rows as SubmissionRow[];
}

export function toPublicQuizResponse(quiz: QuizRow & { questions: PublicQuestion[] }) {
  return {
    slug: quiz.slug,
    title: quiz.title,
    questionCount: quiz.questions.length,
    createdAt: quiz.created_at,
    questions: quiz.questions.map((q) => ({
      number: q.orderNum,
      text: q.text,
      options: q.options,
    })),
  };
}

export function toImportResult(quiz: QuizRow & { questionCount: number }) {
  return {
    slug: quiz.slug,
    title: quiz.title,
    password: quiz.password,
    questionCount: quiz.questionCount,
  };
}

export function toSubmitResponse(result: DbSubmitResult) {
  const percentage =
    result.total > 0 ? Math.round((result.score / result.total) * 100) : 0;

  return {
    score: result.score,
    total: result.total,
    percentage,
    results: result.results.map((r) => ({
      number: r.orderNum,
      text: r.text,
      options: r.options,
      selectedIndex: r.selectedIndex,
      correctIndex: r.correctIndex,
      correctAnswer: r.options[r.correctIndex] ?? "",
      rationale: r.rationale ?? undefined,
      isCorrect: r.isCorrect,
    })),
  };
}

export function toAdminQuizSummaries(rows: QuizSummaryRow[]) {
  return rows.map((row) => ({
    slug: row.slug,
    title: row.title,
    password: row.password,
    questionCount: row.question_count,
    submissionCount: row.submission_count,
    averageScore: row.average_score,
    createdAt: row.created_at,
  }));
}
