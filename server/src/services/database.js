export function databaseStatus() {
  return {
    postgres: Boolean(process.env.DATABASE_URL),
    pgvector: true,
    note: process.env.DATABASE_URL
      ? 'DATABASE_URL configured; run db/schema.sql before production use.'
      : 'DATABASE_URL missing; API uses contract stubs until Postgres is configured.',
  }
}
