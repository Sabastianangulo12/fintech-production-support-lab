import { readFile } from "node:fs/promises";
import initSqlJs from "sql.js";
import type { BindParams, Database, SqlValue } from "sql.js";

export async function loadSeededDatabase(schemaPath: string, seedPath: string): Promise<Database> {
  const [schemaSql, seedSql] = await Promise.all([
    readFile(schemaPath, "utf8"),
    readFile(seedPath, "utf8")
  ]);

  const SQL = await initSqlJs();
  const db = new SQL.Database();

  db.run("PRAGMA foreign_keys = ON;");
  db.run(schemaSql);
  db.run(seedSql);

  return db;
}

export function selectOne<TRecord extends object>(
  db: Database,
  sql: string,
  params: BindParams = null
): TRecord | null {
  const rows = selectAll<TRecord>(db, sql, params);
  return rows[0] ?? null;
}

export function selectAll<TRecord extends object>(
  db: Database,
  sql: string,
  params: BindParams = null
): TRecord[] {
  const statement = db.prepare(sql);

  try {
    statement.bind(params);
    const rows: TRecord[] = [];

    while (statement.step()) {
      rows.push(statement.getAsObject() as TRecord);
    }

    return rows;
  } finally {
    statement.free();
  }
}

export function required<TRecord>(record: TRecord | null, message: string): TRecord {
  if (!record) {
    throw new Error(message);
  }

  return record;
}

export function toSqlParams(params: Record<string, SqlValue>): BindParams {
  return params;
}
