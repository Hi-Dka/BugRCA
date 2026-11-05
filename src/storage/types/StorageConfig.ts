export interface StorageConfig {
  /**
   * Database file path on disk (e.g., 'data/app.db') or ':memory:' for an in-memory database.
   * Defaults to 'data/app.db'.
   */
  dbPath?: string | undefined;
  /**
   * Whether to enable WAL (Write-Ahead Logging) journal mode.
   * Defaults to true.
   */
  wal?: boolean | undefined;
  /**
   * Whether to enable foreign keys enforcement.
   * Defaults to true.
   */
  foreignKeys?: boolean | undefined;
  /**
   * Busy timeout in milliseconds when database is locked.
   * Defaults to 5000ms.
   */
  busyTimeout?: number | undefined;
}
