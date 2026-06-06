export interface QuizQuestion {
  number: number;
  text: string;
  options: string[];
}

export interface Quiz {
  slug: string;
  title: string;
  questionCount: number;
  questions: QuizQuestion[];
  createdAt?: string;
}

export interface QuizSummary {
  slug: string;
  title: string;
  password: string;
  questionCount: number;
  submissionCount: number;
  averageScore: number | null;
  createdAt: string;
}

export interface SubmitPayload {
  studentName: string;
  answers: (number | null)[];
}

export interface QuestionResult {
  number: number;
  text: string;
  options: string[];
  selectedIndex: number | null;
  correctIndex: number;
  correctAnswer: string;
  rationale?: string;
  isCorrect: boolean;
}

export interface SubmitResult {
  score: number;
  total: number;
  percentage: number;
  results: QuestionResult[];
}

export interface ImportResult {
  slug: string;
  title: string;
  password: string;
  questionCount: number;
}

export interface ApiError {
  error: string;
}
