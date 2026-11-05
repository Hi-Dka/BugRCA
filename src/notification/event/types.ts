export interface MessageSender {
  openId?: string | undefined;
  userId?: string | undefined;
  unionId?: string | undefined;
  senderType?: string | undefined;
}

export interface MessageEvent {
  /** Feishu message ID */
  messageId: string;
  /** Chat ID where the message was received */
  chatId: string;
  /** Chat type: 'p2p' (direct message) or 'group' (group chat) */
  chatType: 'p2p' | 'group' | string;
  /** Message type: text, post, image, etc. */
  messageType: string;
  /** Parsed text string if messageType is 'text' */
  text?: string | undefined;
  /** Raw content payload string */
  content: string;
  /** Information about the sender */
  sender?: MessageSender | undefined;
  /** Timestamp when message was created */
  createTime?: string | undefined;
  /** Full raw event received from Feishu SDK */
  raw: unknown;
}

export interface CardActionEvent {
  /** Open ID of the user triggering the action */
  openId?: string | undefined;
  /** User ID of the user triggering the action */
  userId?: string | undefined;
  /** Target message ID holding the card */
  messageId?: string | undefined;
  /** Custom key-value pairs assigned to the clicked button/action */
  actionValue?: Record<string, unknown> | undefined;
  /** Tag of the action element (e.g. 'button') */
  actionTag?: string | undefined;
  /** Full raw event payload from Feishu */
  raw: unknown;
}

export type MessageHandler = (event: MessageEvent) => Promise<void> | void;
export type CardActionHandler = (
  event: CardActionEvent,
) => Promise<Record<string, unknown> | void> | Record<string, unknown> | void;
