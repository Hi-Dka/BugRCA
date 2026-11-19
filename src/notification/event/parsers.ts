import { asRecord, isRecord, optional, parseShape, parseString } from '../../utils';
import type { CardActionEvent, MessageEvent, MessageSender } from './types';

interface RawMessageFields {
    message_id: string;
    chat_id: string;
    chat_type: string;
    message_type: string;
    content: string;
    create_time?: string;
}

interface RawSenderId {
    open_id?: string;
    user_id?: string;
    union_id?: string;
}

interface RawSender {
    sender_id?: RawSenderId;
    sender_type?: string;
}

interface RawMessageEnvelope {
    message: RawMessageFields;
    sender?: RawSender;
}

interface RawCardContext {
    open_message_id?: string;
}

interface RawCardOperator {
    open_id?: string;
    user_id?: string;
}

interface RawCardActionBlock {
    tag?: string;
    value?: Record<string, unknown>;
}

interface RawCardActionTrigger {
    context?: RawCardContext;
    operator?: RawCardOperator;
    action?: RawCardActionBlock;
    open_message_id?: string;
    open_id?: string;
    user_id?: string;
}

const parseRawMessage = parseShape<RawMessageFields>({
    message_id: parseString,
    chat_id: parseString,
    chat_type: parseString,
    message_type: parseString,
    content: parseString,
    create_time: optional(parseString),
});

const parseRawSenderId = parseShape<RawSenderId>({
    open_id: optional(parseString),
    user_id: optional(parseString),
    union_id: optional(parseString),
});

const parseRawSender = parseShape<RawSender>({
    sender_id: optional(parseRawSenderId),
    sender_type: optional(parseString),
});

const parseRawMessageEnvelope = parseShape<RawMessageEnvelope>({
    message: parseRawMessage,
    sender: optional(parseRawSender),
});

const parseRawCardContext = parseShape<RawCardContext>({
    open_message_id: optional(parseString),
});

const parseRawCardOperator = parseShape<RawCardOperator>({
    open_id: optional(parseString),
    user_id: optional(parseString),
});

const parseRawCardActionBlock = parseShape<RawCardActionBlock>({
    tag: optional(parseString),
    value: optional(asRecord),
});

const parseRawCardActionTrigger = parseShape<RawCardActionTrigger>({
    context: optional(parseRawCardContext),
    operator: optional(parseRawCardOperator),
    action: optional(parseRawCardActionBlock),
    open_message_id: optional(parseString),
    open_id: optional(parseString),
    user_id: optional(parseString),
});

function extractTextContent(content: string): string | undefined {
    try {
        const parsed: unknown = JSON.parse(content);
        if (isRecord(parsed) && typeof parsed['text'] === 'string') {
            return parsed['text'];
        }
        return undefined;
    } catch {
        return content;
    }
}

function buildMessageSender(rawSender: RawSender | undefined): MessageSender | undefined {
    if (!rawSender) {
        return undefined;
    }

    const sender: MessageSender = {
        ...(rawSender.sender_id?.open_id !== undefined && {
            openId: rawSender.sender_id.open_id,
        }),
        ...(rawSender.sender_id?.user_id !== undefined && {
            userId: rawSender.sender_id.user_id,
        }),
        ...(rawSender.sender_id?.union_id !== undefined && {
            unionId: rawSender.sender_id.union_id,
        }),
        ...(rawSender.sender_type !== undefined && {
            senderType: rawSender.sender_type,
        }),
    };

    return Object.keys(sender).length > 0 ? sender : undefined;
}

/**
 * Validates and normalizes an inbound Feishu `im.message.receive_v1` payload.
 */
export function parseMessageEvent(raw: unknown): MessageEvent {
    const { message, sender } = parseRawMessageEnvelope(raw, 'event');
    const parsedText =
        message.message_type === 'text' ? extractTextContent(message.content) : undefined;
    const mappedSender = buildMessageSender(sender);

    return {
        messageId: message.message_id,
        chatId: message.chat_id,
        chatType: message.chat_type,
        messageType: message.message_type,
        content: message.content,
        raw,
        ...(parsedText !== undefined && { text: parsedText }),
        ...(message.create_time !== undefined && { createTime: message.create_time }),
        ...(mappedSender !== undefined && { sender: mappedSender }),
    };
}

/**
 * Validates and normalizes an inbound Feishu `card.action.trigger` payload.
 */
export function parseCardActionEvent(raw: unknown): CardActionEvent {
    const parsed = parseRawCardActionTrigger(raw, 'event');
    const messageId = parsed.context?.open_message_id ?? parsed.open_message_id;
    const openId = parsed.operator?.open_id ?? parsed.open_id;
    const userId = parsed.operator?.user_id ?? parsed.user_id;

    return {
        raw,
        ...(messageId !== undefined && { messageId }),
        ...(openId !== undefined && { openId }),
        ...(userId !== undefined && { userId }),
        ...(parsed.action?.value !== undefined && { actionValue: parsed.action.value }),
        ...(parsed.action?.tag !== undefined && { actionTag: parsed.action.tag }),
    };
}
