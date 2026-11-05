export class NotificationError extends Error {
  constructor(
    message: string,
    public readonly code?: number,
    public readonly rawError?: unknown,
  ) {
    super(message);
    this.name = 'NotificationError';
  }

  /**
   * Constructs a NotificationError from an arbitrary Feishu error response or exception.
   */
  static fromLarkError(err: unknown): NotificationError {
    if (err instanceof NotificationError) {
      return err;
    }
    if (typeof err === 'object' && err !== null) {
      const resData =
        'response' in err && typeof (err as { response?: unknown }).response === 'object'
          ? ((err as { response?: { data?: unknown } }).response?.data as Record<string, unknown> | undefined)
          : undefined;

      const rawCode =
        resData && 'code' in resData
          ? resData['code']
          : 'code' in err
            ? (err as Record<string, unknown>)['code']
            : undefined;
      const parsedCode =
        typeof rawCode === 'number'
          ? rawCode
          : typeof rawCode === 'string' && !isNaN(Number(rawCode))
            ? Number(rawCode)
            : undefined;

      const rawMsg =
        resData && 'msg' in resData
          ? resData['msg']
          : 'msg' in err
            ? (err as Record<string, unknown>)['msg']
            : 'message' in err
              ? (err as Record<string, unknown>)['message']
              : 'Unknown Feishu error';

      return new NotificationError(String(rawMsg), parsedCode, err);
    }
    return new NotificationError(String(err));
  }
}
