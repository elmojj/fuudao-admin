import { Pool, QueryResultRow } from 'pg';

const globalForPg = globalThis as typeof globalThis & {
  pgPool?: Pool;
};

export function getPool() {
  if (!globalForPg.pgPool) {
    globalForPg.pgPool = new Pool({
      connectionString:
        process.env.DATABASE_URL ||
        'postgresql://postgres@localhost:5432/fuudao_admin',
    });
  }
  return globalForPg.pgPool;
}

export async function query<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params?: unknown[],
) {
  const pool = getPool();
  const result = await pool.query<T>(text, params);
  return result;
}
