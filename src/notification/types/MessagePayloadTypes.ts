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

export interface MessageSendOptions {
    /** Optional UUID for request idempotency */
    uuid?: string | undefined;
}

export type SendTextOptions = MessageSendOptions;
export type SendCardOptions = MessageSendOptions;
export type ReplyOptions = MessageSendOptions;
