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

export interface ClientMetadataHints {
  timezone?: string | null;
  screen?: string | null;
  language?: string | null;
}

export interface ClientMetadata {
  ip: string | null;
  headers: {
    acceptLanguage: string | null;
    referer: string | null;
    userAgent: string | null;
  };
  userAgent: {
    browser: string | null;
    os: string | null;
    deviceType: "mobile" | "desktop" | "tablet" | null;
  };
  geo: {
    country: string | null;
    countryCode: string | null;
    region: string | null;
    city: string | null;
    timezone: string | null;
    isp: string | null;
  } | null;
  clientHints: ClientMetadataHints | null;
  capturedAt: string;
}

export interface QuizRow {
  id: string;
  slug: string;
  password: string;
  title: string;
  source_url: string | null;
  allowed_countries: string[] | null;
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
  client_metadata: ClientMetadata | null;
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
  allowed_countries: string[] | null;
  created_at: string;
}
