export const PASSWORD_LENGTH = 4;

const PASSWORD_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

export const QUIZ_PASSWORD_PATTERN = /^[A-Z0-9]{4}$/;

export function normalizeQuizPassword(input: string): string {
  return input.trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
}

export function isValidQuizPassword(input: string): boolean {
  return QUIZ_PASSWORD_PATTERN.test(normalizeQuizPassword(input));
}

export function formatQuizPasswordInput(input: string): string {
  return normalizeQuizPassword(input).slice(0, PASSWORD_LENGTH);
}

export function generatePassword(): string {
  let password = "";
  for (let i = 0; i < PASSWORD_LENGTH; i++) {
    password += PASSWORD_CHARS[Math.floor(Math.random() * PASSWORD_CHARS.length)];
  }
  return password;
}
