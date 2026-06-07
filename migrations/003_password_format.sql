-- Quiz passwords are 4-character uppercase alphanumeric codes (A-Z, 0-9).
-- Run scripts/regenerate-passwords.ts before this migration on existing databases.
ALTER TABLE quizzes ALTER COLUMN password TYPE CHAR(4);
