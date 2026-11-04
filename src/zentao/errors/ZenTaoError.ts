export class ZenTaoError extends Error {
  constructor(
    message: string,
    public readonly code?: number,
    public readonly response?: unknown,
  ) {
    super(message);
    this.name = 'ZenTaoError';
  }
}
