export type MessageType = 'text' | 'interactive' | 'post';

export interface SendMessageResult {
  /** Feishu message ID assigned upon creation */
  messageId: string;
  /** Chat ID where message was delivered */
  chatId?: string;
  /** Creation timestamp in milliseconds */
  createTime?: string;
  /** Raw response from Feishu SDK */
  raw?: unknown;
}

export interface SendTextOptions {
  /** Optional UUID for request idempotency */
  uuid?: string;
}

export interface SendCardOptions {
  /** Optional UUID for request idempotency */
  uuid?: string;
}

export interface ReplyOptions {
  /** Optional UUID for request idempotency */
  uuid?: string;
}
