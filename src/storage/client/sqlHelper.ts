import type { SQLInputValue } from 'node:sqlite';
import { StorageError } from '../errors/StorageError';
import { type QueryOptions, type SortDirection } from '../types/QueryTypes';

const IDENTIFIER_REGEX = /^[a-zA-Z_][a-zA-Z0-9_]*$/;

/**
 * Validates that an identifier (table name or column name) contains only safe alphanumeric characters.
 */
export function validateIdentifier(name: string): string {
  if (!name || !IDENTIFIER_REGEX.test(name)) {
    throw new StorageError(`Invalid SQL identifier: "${name}"`);
  }
  return name;
}

/**
 * Builds a parameterized WHERE clause from a key-value filter object.
 */
export function buildWhereClause(where?: Record<string, unknown>): {
  sql: string;
  params: unknown[];
} {
  if (!where || Object.keys(where).length === 0) {
    return { sql: '', params: [] };
  }

  const conditions: string[] = [];
  const params: unknown[] = [];

  for (const [key, value] of Object.entries(where)) {
    validateIdentifier(key);
    if (value === null) {
      conditions.push(`${key} IS NULL`);
    } else {
      conditions.push(`${key} = ?`);
      params.push(value);
    }
  }

  return {
    sql: ` WHERE ${conditions.join(' AND ')}`,
    params,
  };
}

/**
 * Builds a parameterized INSERT statement.
 */
export function buildInsert(
  table: string,
  data: Record<string, unknown>,
): {
  sql: string;
  params: unknown[];
} {
  validateIdentifier(table);
  const keys = Object.keys(data);
  if (keys.length === 0) {
    throw new StorageError('Cannot insert an empty record object');
  }

  const columns: string[] = [];
  const placeholders: string[] = [];
  const params: unknown[] = [];

  for (const key of keys) {
    validateIdentifier(key);
    columns.push(key);
    placeholders.push('?');
    params.push(data[key]);
  }

  const sql = `INSERT INTO ${table} (${columns.join(', ')}) VALUES (${placeholders.join(', ')})`;
  return { sql, params };
}

/**
 * Builds a parameterized UPDATE statement.
 */
export function buildUpdate(
  table: string,
  data: Record<string, unknown>,
  where?: Record<string, unknown>,
): {
  sql: string;
  params: unknown[];
} {
  validateIdentifier(table);
  const keys = Object.keys(data);
  if (keys.length === 0) {
    throw new StorageError('Cannot update with an empty record object');
  }

  const setClauses: string[] = [];
  const params: unknown[] = [];

  for (const key of keys) {
    validateIdentifier(key);
    setClauses.push(`${key} = ?`);
    params.push(data[key]);
  }

  const wherePart = buildWhereClause(where);
  params.push(...wherePart.params);

  const sql = `UPDATE ${table} SET ${setClauses.join(', ')}${wherePart.sql}`;
  return { sql, params };
}

/**
 * Builds a parameterized SELECT query.
 */
export function buildSelect(
  table: string,
  options?: QueryOptions,
): {
  sql: string;
  params: unknown[];
} {
  validateIdentifier(table);

  let columnSql = '*';
  if (options?.columns && options.columns.length > 0) {
    columnSql = options.columns.map(validateIdentifier).join(', ');
  }

  let sql = `SELECT ${columnSql} FROM ${table}`;
  const params: unknown[] = [];

  if (options?.where) {
    const wherePart = buildWhereClause(options.where);
    sql += wherePart.sql;
    params.push(...wherePart.params);
  }

  if (options?.orderBy) {
    if (typeof options.orderBy === 'string') {
      validateIdentifier(options.orderBy);
      sql += ` ORDER BY ${options.orderBy} ASC`;
    } else if (typeof options.orderBy === 'object') {
      const orderClauses: string[] = [];
      for (const [col, dir] of Object.entries(options.orderBy)) {
        validateIdentifier(col);
        const direction = (String(dir).toUpperCase() as SortDirection) === 'DESC' ? 'DESC' : 'ASC';
        orderClauses.push(`${col} ${direction}`);
      }
      if (orderClauses.length > 0) {
        sql += ` ORDER BY ${orderClauses.join(', ')}`;
      }
    }
  }

  if (options?.limit !== undefined) {
    sql += ` LIMIT ?`;
    params.push(Number(options.limit));
  }

  if (options?.offset !== undefined) {
    sql += ` OFFSET ?`;
    params.push(Number(options.offset));
  }

  return { sql, params };
}

/**
 * Builds a parameterized DELETE statement.
 */
export function buildDelete(
  table: string,
  where?: Record<string, unknown>,
): {
  sql: string;
  params: unknown[];
} {
  validateIdentifier(table);
  const wherePart = buildWhereClause(where);
  const sql = `DELETE FROM ${table}${wherePart.sql}`;
  return { sql, params: wherePart.params };
}

/**
 * Normalizes parameter values to types accepted by node:sqlite StatementSync.
 */
export function normalizeParam(val: unknown): SQLInputValue {
  if (val === null || val === undefined) {
    return null;
  }
  if (typeof val === 'boolean') {
    return val ? 1 : 0;
  }
  if (val instanceof Date) {
    return val.toISOString();
  }
  if (typeof val === 'number' || typeof val === 'bigint' || typeof val === 'string') {
    return val;
  }
  if (ArrayBuffer.isView(val)) {
    return val as NodeJS.ArrayBufferView;
  }
  return String(val);
}
