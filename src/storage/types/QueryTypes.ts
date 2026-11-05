export type SortDirection = 'ASC' | 'DESC' | 'asc' | 'desc';

export type WhereClause = Record<string, unknown>;

export interface QueryOptions {
  /**
   * Key-value equality filter conditions.
   */
  where?: WhereClause | undefined;
  /**
   * Ordering criteria: column name string or Record<column, 'ASC' | 'DESC'>.
   */
  orderBy?: Record<string, SortDirection> | string | undefined;
  /**
   * Maximum number of rows to retrieve.
   */
  limit?: number | undefined;
  /**
   * Number of rows to skip.
   */
  offset?: number | undefined;
  /**
   * Specific column names to select. Defaults to '*' if omitted.
   */
  columns?: string[] | undefined;
}

export interface RunResult {
  /**
   * Number of rows affected by the execution.
   */
  changes: number | bigint;
  /**
   * Last inserted rowid, if an INSERT occurred.
   */
  lastInsertRowid: number | bigint;
}

export type PrimitiveValue = string | number | bigint | boolean | null | undefined | Uint8Array;
