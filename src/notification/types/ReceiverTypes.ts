export type ReceiverTargetType = 'chat_id' | 'open_id' | 'user_id' | 'email' | 'union_id';

export interface ReceiverTarget {
  /** Target identifier type: chat_id, open_id, user_id, email, union_id */
  type: ReceiverTargetType;
  /** Actual target identifier value (e.g. oc_xxx, ou_xxx, or user@example.com) */
  id: string;
}

export type ReceiverTargetInput =
  ReceiverTarget | { chatId: string } | { openId: string } | { email: string } | { userId: string };

/**
 * Normalizes user-friendly receiver target input into standard ReceiverTarget.
 */
export function normalizeReceiverTarget(target: ReceiverTargetInput): ReceiverTarget {
  if ('type' in target && 'id' in target) {
    return target;
  }
  if ('chatId' in target) {
    return { type: 'chat_id', id: target.chatId };
  }
  if ('openId' in target) {
    return { type: 'open_id', id: target.openId };
  }
  if ('email' in target) {
    return { type: 'email', id: target.email };
  }
  if ('userId' in target) {
    return { type: 'user_id', id: target.userId };
  }
  throw new Error(`Invalid receiver target input: ${JSON.stringify(target)}`);
}
