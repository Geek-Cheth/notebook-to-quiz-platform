export interface QuizQuestionInput {
  text: string;
  options: string[];
  correctIndex: number;
  rationale?: string | null;
}

export interface ExtractedQuiz {
  title: string;
  sourceUrl?: string | null;
  questions: QuizQuestionInput[];
}

export interface QuizRow {
  id: string;
  slug: string;
  password: string;
  title: string;
  source_url: string | null;
  created_at: string;
}

export interface QuestionRow {
  id: string;
  quiz_id: string;
  order_num: number;
  text: string;
  options: string[];
  correct_index: number;
  rationale: string | null;
}

export interface SubmissionRow {
  id: string;
  quiz_id: string;
  student_name: string;
  answers: number[];
  score: number;
  total: number;
  submitted_at: string;
}

export interface PublicQuestion {
  id: string;
  orderNum: number;
  text: string;
  options: string[];
}

export interface GradedQuestionResult {
  questionId: string;
  orderNum: number;
  text: string;
  options: string[];
  selectedIndex: number | null;
  correctIndex: number;
  isCorrect: boolean;
  rationale: string | null;
}

export interface DbSubmitResult {
  submissionId: string;
  studentName: string;
  score: number;
  total: number;
  results: GradedQuestionResult[];
}

export interface QuizSummaryRow {
  slug: string;
  title: string;
  password: string;
  question_count: number;
  submission_count: number;
  average_score: number | null;
  created_at: string;
}
