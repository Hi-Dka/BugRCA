export type ReceiverTargetType = 'chat_id' | 'open_id' | 'user_id' | 'email' | 'union_id';

export interface ReceiverTarget {
    type: ReceiverTargetType;
    id: string;
}

export const createTarget = (type: ReceiverTargetType, id: string): ReceiverTarget => ({
    type,
    id,
});
