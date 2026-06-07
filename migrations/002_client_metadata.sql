-- Client metadata capture and quiz country restrictions

ALTER TABLE quizzes
  ADD COLUMN IF NOT EXISTS allowed_countries TEXT[];

ALTER TABLE submissions
  ADD COLUMN IF NOT EXISTS client_metadata JSONB;
