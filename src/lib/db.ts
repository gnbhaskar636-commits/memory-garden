/**
 * Postgres access (server-only) — Supabase Postgres via `DATABASE_URL`.
 *
 * A direct Postgres connection string (Supabase gives you one per project,
 * or `supabase start` for local dev against Docker) with the plain `pg`
 * driver — the simplest of the two paths the migration brief describes, and
 * the one this app uses: `migrations/*.sql` and `src/lib/memories/server.ts`
 * work unchanged, just against Supabase's database instead of Neon/PGLite.
 *
 * There is no local fallback anymore (the old embedded PGLite instance is
 * gone) — set `DATABASE_URL` for local dev too, via `supabase start` or a
 * free-tier hosted project. See README.md.
 */
import { loadServerEnv } from "./env.server";


/**
 * Minimal shared SQL surface. Both the tagged-template and `.query()` forms
 * resolve to an array of row objects:
 *
 *   const sql = await getSql();
 *   const rows = await sql`select * from todos where id = ${id}`; // parameterized
 *   const rows2 = await sql.query("select * from todos where id = $1", [id]);
 */
export interface Sql {
  <T = Record<string, unknown>>(
    strings: TemplateStringsArray,
    ...values: unknown[]
  ): Promise<T[]>;
  query<T = Record<string, unknown>>(
    text: string,
    params?: unknown[],
  ): Promise<T[]>;
}

/**
 * Init state lives on globalThis: dev HMR creates new instances of this
 * module, and two instances racing module-level state would open a second
 * connection pool. A failed init clears its slot so the next call retries.
 */
const globalRef = globalThis as typeof globalThis & {
  __pgSqlPromise__?: Promise<Sql>;
};

/**
 * Result-type parity: Postgres sends every value as text plus a type OID — the
 * JS value is the DRIVER's parsing choice, and `pg`'s defaults disagree with
 * what a JSON API wants (int8 -> string by default; JS `Date` objects don't
 * round-trip through `JSON.stringify` the way a plain string does). Normalize
 * so every response is a JSON-safe shape:
 *   int8/bigint (incl. count(*)) -> number (past 2^53 loses precision — cast
 *                                   `::text` if you ever need huge integers)
 *   date                         -> 'YYYY-MM-DD' string (no timezone shifting)
 *   interval                     -> Postgres interval text
 * numeric already comes back as a string (arbitrary precision).
 */
const OID_INT8 = 20;
const OID_DATE = 1082;
const OID_INTERVAL = 1186;
const identity = (v: string) => v;

type Run = <T>(text: string, params: unknown[]) => Promise<T[]>;

/** Wrap a query runner in the tagged-template + `.query()` `Sql` surface. */
function toSql(run: Run): Sql {
  const sql = (async <T = Record<string, unknown>>(
    strings: TemplateStringsArray,
    ...values: unknown[]
  ): Promise<T[]> => {
    // Rebuild with $1, $2, … placeholders so values stay parameterized.
    let text = strings[0];
    for (let i = 0; i < values.length; i += 1) text += `$${i + 1}${strings[i + 1]}`;
    return run<T>(text, values);
  }) as unknown as Sql;
  sql.query = <T = Record<string, unknown>>(text: string, params: unknown[] = []) =>
    run<T>(text, params);
  return sql;
}

function createPgSql(): Promise<Sql> {
  globalRef.__pgSqlPromise__ ??= (async () => {
    loadServerEnv();
    const databaseUrl = process.env.DATABASE_URL?.trim();
    if (!databaseUrl) {
      throw new Error(
        "DATABASE_URL is not set. Point it at your Supabase Postgres " +
          "connection string (Project Settings → Database), or run " +
          "`supabase start` for a local Postgres instance. See README.md.",
      );
    }
    // Regular Postgres driver: node-postgres (`pg`) — works directly with
    // Supabase's connection string. One pool per process; warm serverless
    // instances reuse it.
    const { Pool, types } = await import("pg");
    types.setTypeParser(OID_INT8, Number);
    types.setTypeParser(OID_DATE, identity);
    types.setTypeParser(OID_INTERVAL, identity);
    const pool = new Pool({ connectionString: databaseUrl });
    return toSql(async <T>(text: string, params: unknown[]) => {
      try {
        const res = await pool.query(text, params);
        return res.rows as T[];
      } catch (error) {
        console.error("[db] query failed", {
          code: error instanceof Error && "code" in error ? String(error.code) : "unknown",
        });
        throw new Error("Database unavailable");
      }
    });
  })().catch((err) => {
    globalRef.__pgSqlPromise__ = undefined;
    throw err;
  });
  return globalRef.__pgSqlPromise__;
}

let sqlPromise: Promise<Sql> | null = null;

async function createSql(): Promise<Sql> {
  if (typeof window !== "undefined") {
    throw new Error(
      "@/lib/db is server-only — call getSql() from a createServerFn handler " +
        "or a server route loader, never from client code.",
    );
  }
  return createPgSql();
}

/**
 * Get the shared, **server-only** SQL client, backed by `DATABASE_URL`.
 * Memoized — safe to call per request.
 *
 * Schema comes from `migrations/*.sql`, applied with `npm run db:migrate`
 * (`scripts/migrate.mjs`) or `supabase db push` — define tables there, never
 * inline in server functions.
 */
export function getSql(): Promise<Sql> {
  sqlPromise ??= createSql().catch((err) => {
    sqlPromise = null; // don't memoize failures — let the next call retry
    throw err;
  });
  return sqlPromise;
}
