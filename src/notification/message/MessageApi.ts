import { logger } from '../../utils/logger';
import { type LarkManager } from '../client/LarkManager';
import { type ReceiverTarget } from '../types/ReceiverTypes';
import type {
    MessageType,
    ReplyOptions,
    SendCardOptions,
    SendMessageResult,
    SendTextOptions,
} from '../types/MessagePayloadTypes';
import { NotificationError } from '../errors/NotificationError';
import { type FeishuCardPayload } from './types';

const log = logger.tag('MessageApi');

interface LarkMessageResponse {
    code?: number | undefined;
    msg?: string | undefined;
    data?:
        | {
              message_id?: string | undefined;
              chat_id?: string | undefined;
              create_time?: string | undefined;
          }
        | undefined;
}

export class MessageApi {
    constructor(private readonly larkManager: LarkManager) {}

    private resolveTarget(target?: ReceiverTarget): ReceiverTarget {
        if (target) {
            return target;
        }

        const defaultChatId = this.larkManager.getConfig().defaultChatId;
        if (defaultChatId) {
            return { type: 'chat_id', id: defaultChatId };
        }
        throw new NotificationError(
            'Recipient target must be provided or defaultChatId configured',
        );
    }

    async sendText(
        target: ReceiverTarget | undefined,
        text: string,
        options?: SendTextOptions,
    ): Promise<SendMessageResult> {
        const resolved = this.resolveTarget(target);
        const content = JSON.stringify({ text });

        return this.createMessage(resolved, 'text', content, options?.uuid);
    }

    async sendCard(
        target: ReceiverTarget | undefined,
        card: FeishuCardPayload | Record<string, unknown> | string,
        options?: SendCardOptions,
    ): Promise<SendMessageResult> {
        const resolved = this.resolveTarget(target);
        const content = typeof card === 'string' ? card : JSON.stringify(card);

        return this.createMessage(resolved, 'interactive', content, options?.uuid);
    }

    async replyText(
        messageId: string,
        text: string,
        options?: ReplyOptions,
    ): Promise<SendMessageResult> {
        if (!messageId) {
            throw new NotificationError('messageId must be provided to reply');
        }
        const content = JSON.stringify({ text });
        return this.replyMessage(messageId, 'text', content, options?.uuid);
    }

    async replyCard(
        messageId: string,
        card: FeishuCardPayload | Record<string, unknown> | string,
        options?: ReplyOptions,
    ): Promise<SendMessageResult> {
        if (!messageId) {
            throw new NotificationError('messageId must be provided to reply');
        }
        const content = typeof card === 'string' ? card : JSON.stringify(card);
        return this.replyMessage(messageId, 'interactive', content, options?.uuid);
    }

    private async createMessage(
        target: ReceiverTarget,
        msgType: MessageType,
        content: string,
        uuid?: string | undefined,
    ): Promise<SendMessageResult> {
        const client = this.larkManager.getClient();
        log.debug(`Sending ${msgType} message to ${target.type}:${target.id}`);

        return this.executeMessageRequest('send message', () =>
            client.im.message.create({
                params: {
                    receive_id_type: target.type,
                },
                data: {
                    receive_id: target.id,
                    msg_type: msgType,
                    content,
                    ...(uuid !== undefined && { uuid }),
                },
            }),
        );
    }

    private async replyMessage(
        messageId: string,
        msgType: MessageType,
        content: string,
        uuid?: string | undefined,
    ): Promise<SendMessageResult> {
        const client = this.larkManager.getClient();
        log.debug(`Replying ${msgType} to message_id: ${messageId}`);

        return this.executeMessageRequest('reply message', () =>
            client.im.message.reply({
                path: {
                    message_id: messageId,
                },
                data: {
                    msg_type: msgType,
                    content,
                    ...(uuid !== undefined && { uuid }),
                },
            }),
        );
    }

    private async executeMessageRequest(
        action: string,
        send: () => Promise<LarkMessageResponse>,
    ): Promise<SendMessageResult> {
        try {
            const res = await send();

            if (res.code !== 0 && res.code !== undefined) {
                throw new NotificationError(
                    res.msg || `Failed to ${action} (code ${res.code})`,
                    res.code,
                    res,
                );
            }

            const messageId = res.data?.message_id ?? '';
            const chatId = res.data?.chat_id;
            const createTime = res.data?.create_time;

            log.info(`${action} succeeded, message_id: ${messageId}`);
            return {
                messageId,
                ...(chatId !== undefined && { chatId }),
                ...(createTime !== undefined && { createTime }),
                raw: res,
            };
        } catch (err) {
            log.error(`Failed to ${action}: ${String(err)}`);
            throw NotificationError.fromLarkError(err);
        }
    }
}
