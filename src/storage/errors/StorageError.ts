export class StorageError extends Error {
  constructor(
    message: string,
    public readonly code?: string | number | undefined,
    public readonly rawError?: unknown,
  ) {
    super(message);
    this.name = 'StorageError';
  }

  /**
   * Normalizes an unknown exception into a standardized StorageError.
   */
  static fromError(err: unknown): StorageError {
    if (err instanceof StorageError) {
      return err;
    }
    if (typeof err === 'object' && err !== null) {
      const code = 'code' in err ? (err as Record<string, unknown>)['code'] : undefined;
      const message =
        'message' in err
          ? String((err as Record<string, unknown>)['message'])
          : 'Storage operation failed';
      return new StorageError(
        message,
        typeof code === 'string' || typeof code === 'number' ? code : undefined,
        err,
      );
    }
    return new StorageError(String(err));
  }
}
