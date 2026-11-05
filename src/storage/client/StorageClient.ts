import { DatabaseSync } from 'node:sqlite';
import fs from 'node:fs';
import path from 'node:path';
import { logger } from '../../utils/logger';
import { StorageError } from '../errors/StorageError';
import { type StorageConfig } from '../types/StorageConfig';
import { type QueryOptions, type RunResult } from '../types/QueryTypes';
import { buildInsert, buildUpdate, buildSelect, buildDelete, normalizeParam } from './sqlHelper';

const log = logger.tag('StorageClient');

export class StorageClient {
  protected readonly db: DatabaseSync;
  protected readonly config: StorageConfig;
  private closed = false;

  constructor(config?: StorageConfig) {
    this.config = {
      dbPath: config?.dbPath ?? 'data/app.db',
      wal: config?.wal ?? true,
      foreignKeys: config?.foreignKeys ?? true,
      busyTimeout: config?.busyTimeout ?? 5000,
    };

    const dbPath = this.config.dbPath!;

    try {
      if (dbPath !== ':memory:') {
        const dir = path.dirname(dbPath);
        if (dir && dir !== '.' && !fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
        }
      }

      this.db = new DatabaseSync(dbPath);

      if (this.config.wal && dbPath !== ':memory:') {
        this.db.exec('PRAGMA journal_mode = WAL;');
      }
      if (this.config.foreignKeys) {
        this.db.exec('PRAGMA foreign_keys = ON;');
      }
      if (this.config.busyTimeout) {
        this.db.exec(`PRAGMA busy_timeout = ${this.config.busyTimeout};`);
      }

      log.info(`StorageClient initialized at: ${dbPath}`);
    } catch (err) {
      log.error(`Failed to initialize database at ${dbPath}: ${String(err)}`);
      throw StorageError.fromError(err);
    }
  }

  /**
   * Inserts a record into the target table and returns the last inserted rowid.
   */
  insert<T extends Record<string, unknown>>(table: string, data: T): number | bigint {
    this.ensureOpen();
    try {
      const { sql, params } = buildInsert(table, data);
      const normalized = params.map(normalizeParam);
      const stmt = this.db.prepare(sql);
      const res = stmt.run(...normalized);
      return res.lastInsertRowid;
    } catch (err) {
      log.error(`Failed to insert into ${table}: ${String(err)}`);
      throw StorageError.fromError(err);
    }
  }

  /**
   * Atomically inserts multiple records into the target table within a single transaction.
   */
  insertMany<T extends Record<string, unknown>>(table: string, dataList: T[]): void {
    if (dataList.length === 0) {
      return;
    }
    this.transaction(() => {
      for (const item of dataList) {
        this.insert(table, item);
      }
    });
  }

  /**
   * Updates matching records in the target table and returns the number of affected rows.
   */
  update<T extends Record<string, unknown>>(
    table: string,
    data: T,
    where?: Record<string, unknown>,
  ): number | bigint {
    this.ensureOpen();
    try {
      const { sql, params } = buildUpdate(table, data, where);
      const normalized = params.map(normalizeParam);
      const stmt = this.db.prepare(sql);
      const res = stmt.run(...normalized);
      return res.changes;
    } catch (err) {
      log.error(`Failed to update ${table}: ${String(err)}`);
      throw StorageError.fromError(err);
    }
  }

  /**
   * Queries records from a table matching optional criteria.
   */
  query<T = Record<string, unknown>>(table: string, options?: QueryOptions): T[] {
    this.ensureOpen();
    try {
      const { sql, params } = buildSelect(table, options);
      const normalized = params.map(normalizeParam);
      const stmt = this.db.prepare(sql);
      return stmt.all(...normalized) as T[];
    } catch (err) {
      log.error(`Failed to query table ${table}: ${String(err)}`);
      throw StorageError.fromError(err);
    }
  }

  /**
   * Queries a single record matching optional criteria, or returns undefined.
   */
  queryOne<T = Record<string, unknown>>(
    table: string,
    where?: Record<string, unknown>,
  ): T | undefined {
    const results = this.query<T>(table, { where, limit: 1 });
    return results[0];
  }

  /**
   * Deletes matching records from the target table and returns the number of deleted rows.
   */
  delete(table: string, where?: Record<string, unknown>): number | bigint {
    this.ensureOpen();
    try {
      const { sql, params } = buildDelete(table, where);
      const normalized = params.map(normalizeParam);
      const stmt = this.db.prepare(sql);
      const res = stmt.run(...normalized);
      return res.changes;
    } catch (err) {
      log.error(`Failed to delete from ${table}: ${String(err)}`);
      throw StorageError.fromError(err);
    }
  }

  /**
   * Executes raw DDL or batch SQL statement without returning rows.
   */
  exec(sql: string): void {
    this.ensureOpen();
    try {
      this.db.exec(sql);
    } catch (err) {
      log.error(`Failed to execute SQL: ${String(err)}`);
      throw StorageError.fromError(err);
    }
  }

  /**
   * Executes a parameterized DML statement and returns affected rows and last insert ID.
   */
  run(sql: string, params: unknown[] = []): RunResult {
    this.ensureOpen();
    try {
      const stmt = this.db.prepare(sql);
      const normalized = params.map(normalizeParam);
      const res = stmt.run(...normalized);
      return {
        changes: res.changes,
        lastInsertRowid: res.lastInsertRowid,
      };
    } catch (err) {
      log.error(`Failed to run statement: ${String(err)}`);
      throw StorageError.fromError(err);
    }
  }

  /**
   * Executes raw parameterized SQL query and returns results.
   */
  querySql<T = Record<string, unknown>>(sql: string, params: unknown[] = []): T[] {
    this.ensureOpen();
    try {
      const stmt = this.db.prepare(sql);
      const normalized = params.map(normalizeParam);
      return stmt.all(...normalized) as T[];
    } catch (err) {
      log.error(`Failed to query SQL: ${String(err)}`);
      throw StorageError.fromError(err);
    }
  }

  /**
   * Executes a callback within an atomic transaction.
   * Automatically commits on completion or rolls back if an error occurs.
   */
  transaction<T>(fn: () => T): T {
    this.ensureOpen();
    this.db.exec('BEGIN IMMEDIATE;');
    try {
      const result = fn();
      this.db.exec('COMMIT;');
      return result;
    } catch (err) {
      try {
        this.db.exec('ROLLBACK;');
      } catch (rollbackErr) {
        log.warn(`Rollback failed: ${String(rollbackErr)}`);
      }
      throw StorageError.fromError(err);
    }
  }

  /**
   * Closes the database connection.
   */
  close(): void {
    if (!this.closed) {
      log.info('Closing database connection');
      this.db.close();
      this.closed = true;
    }
  }

  /**
   * Checks if the database connection is currently open.
   */
  isOpen(): boolean {
    return !this.closed;
  }

  protected ensureOpen(): void {
    if (this.closed) {
      throw new StorageError('Database connection is closed');
    }
  }
}
