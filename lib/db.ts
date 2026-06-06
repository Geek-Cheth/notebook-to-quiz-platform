import { neon, NeonQueryFunction } from "@neondatabase/serverless";

let sqlInstance: NeonQueryFunction<false, false> | null = null;

export function getSql(): NeonQueryFunction<false, false> {
  if (!sqlInstance) {
    const url = process.env.DATABASE_URL;
    if (!url) {
      throw new Error("DATABASE_URL environment variable is not set");
    }
    sqlInstance = neon(url);
  }
  return sqlInstance;
}

/** Tagged-template SQL helper (lazy-connects on first use). */
export const sql = ((strings: TemplateStringsArray, ...values: unknown[]) => {
  return getSql()(strings, ...(values as never[]));
}) as NeonQueryFunction<false, false>;
