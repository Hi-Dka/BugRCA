import type { LiteralUnionString } from '../../utils/';

export interface MessageSender {
    openId?: string;
    userId?: string;
    unionId?: string;
    senderType?: string;
}

export interface MessageEvent {
    /** Feishu message ID */
    messageId: string;
    /** Chat ID where the message was received */
    chatId: string;
    /** Chat type: 'p2p' (direct message) or 'group' (group chat) */
    chatType: LiteralUnionString<'p2p' | 'group'>;
    /** Message type: text, post, image, etc. */
    messageType: string;
    /** Parsed text string if messageType is 'text' */
    text?: string;
    /** Raw content payload string */
    content: string;
    /** Information about the sender */
    sender?: MessageSender;
    /** Timestamp when message was created */
    createTime?: string;
    /** Full raw event received from Feishu SDK */
    raw: unknown;
}

export interface CardActionEvent {
    /** Open ID of the user triggering the action */
    openId?: string;
    /** User ID of the user triggering the action */
    userId?: string;
    /** Target message ID holding the card */
    messageId?: string;
    /** Custom key-value pairs assigned to the clicked button/action */
    actionValue?: Record<string, unknown>;
    /** Tag of the action element (e.g. 'button') */
    actionTag?: string;
    /** Full raw event payload from Feishu */
    raw: unknown;
}

export type MessageHandler = (event: MessageEvent) => Promise<void> | void;
export type CardActionHandler = (
    event: CardActionEvent,
) => Promise<Record<string, unknown> | void> | Record<string, unknown> | void;
