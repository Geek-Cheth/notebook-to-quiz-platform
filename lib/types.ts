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
  allowedCountries: string[] | null;
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

export interface ClientMetadata {
  ip: string | null;
  country: string | null;
  city: string | null;
  region: string | null;
  timezone: string | null;
  isp: string | null;
  browser: string | null;
  os: string | null;
  device: string | null;
  userAgent: string | null;
  acceptLanguage: string | null;
}

export interface SubmissionSummary {
  id: string;
  studentName: string;
  score: number;
  total: number;
  percentage: number;
  submittedAt: string;
  clientMetadata?: ClientMetadata | null;
}

export interface SubmissionReview {
  id: string;
  studentName: string;
  score: number;
  total: number;
  percentage: number;
  submittedAt: string;
  quizTitle: string;
  results: QuestionResult[];
  clientMetadata?: ClientMetadata | null;
}

export interface QuizSubmissionsResponse {
  slug: string;
  submissions: SubmissionSummary[];
}

export interface ApiError {
  error: string;
}
