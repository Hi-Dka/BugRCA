import { logger } from '../../utils/logger';
import { type LarkManager } from '../client/LarkManager';
import {
  type ReceiverTargetInput,
  type ReceiverTarget,
  normalizeReceiverTarget,
} from '../types/ReceiverTypes';
import {
  type SendMessageResult,
  type SendTextOptions,
  type SendCardOptions,
  type ReplyOptions,
} from '../types/MessagePayloadTypes';
import { NotificationError } from '../errors/NotificationError';
import { type FeishuCardPayload } from './types';

const log = logger.tag('MessageApi');

export class MessageApi {
  constructor(private readonly larkManager: LarkManager) {}

  /**
   * Resolves the target recipient, falling back to defaultChatId if not provided.
   */
  private resolveTarget(target?: ReceiverTargetInput): ReceiverTarget {
    if (target) {
      return normalizeReceiverTarget(target);
    }
    const defaultChatId = this.larkManager.getConfig().defaultChatId;
    if (defaultChatId) {
      return { type: 'chat_id', id: defaultChatId };
    }
    throw new NotificationError('Recipient target must be provided or defaultChatId configured');
  }

  /**
   * Sends a plain text message to a chat, user, or email.
   */
  async sendText(
    target: ReceiverTargetInput | undefined,
    text: string,
    options?: SendTextOptions,
  ): Promise<SendMessageResult> {
    const resolved = this.resolveTarget(target);
    const content = JSON.stringify({ text });

    return this.createMessage(resolved, 'text', content, options?.uuid);
  }

  /**
   * Sends an interactive card message to a chat, user, or email.
   */
  async sendCard(
    target: ReceiverTargetInput | undefined,
    card: FeishuCardPayload | Record<string, unknown> | string,
    options?: SendCardOptions,
  ): Promise<SendMessageResult> {
    const resolved = this.resolveTarget(target);
    const content = typeof card === 'string' ? card : JSON.stringify(card);

    return this.createMessage(resolved, 'interactive', content, options?.uuid);
  }

  /**
   * Replies to an existing message with text.
   */
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

  /**
   * Replies to an existing message with an interactive card.
   */
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

  /**
   * Internal helper to create a message using Feishu SDK.
   */
  private async createMessage(
    target: ReceiverTarget,
    msgType: 'text' | 'interactive' | 'post',
    content: string,
    uuid?: string | undefined,
  ): Promise<SendMessageResult> {
    const client = this.larkManager.getClient();
    log.debug(`Sending ${msgType} message to ${target.type}:${target.id}`);

    try {
      const dataPayload: {
        receive_id: string;
        msg_type: string;
        content: string;
        uuid?: string;
      } = {
        receive_id: target.id,
        msg_type: msgType,
        content,
      };

      if (uuid !== undefined) {
        dataPayload.uuid = uuid;
      }

      const res = await client.im.message.create({
        params: {
          receive_id_type: target.type,
        },
        data: dataPayload,
      });

      if (res.code !== 0 && res.code !== undefined) {
        throw new NotificationError(
          res.msg || `Failed to send message (code ${res.code})`,
          res.code,
          res,
        );
      }

      const messageId = res.data?.message_id ?? '';
      const chatId = res.data?.chat_id ?? undefined;
      const createTime = res.data?.create_time ?? undefined;

      log.info(`Message sent successfully, message_id: ${messageId}`);
      return {
        messageId,
        ...(chatId !== undefined && { chatId }),
        ...(createTime !== undefined && { createTime }),
        raw: res,
      };
    } catch (err) {
      log.error(`Failed to send message: ${String(err)}`);
      throw NotificationError.fromLarkError(err);
    }
  }

  /**
   * Internal helper to reply to an existing message using Feishu SDK.
   */
  private async replyMessage(
    messageId: string,
    msgType: 'text' | 'interactive' | 'post',
    content: string,
    uuid?: string | undefined,
  ): Promise<SendMessageResult> {
    const client = this.larkManager.getClient();
    log.debug(`Replying ${msgType} to message_id: ${messageId}`);

    try {
      const dataPayload: {
        msg_type: string;
        content: string;
        uuid?: string;
      } = {
        msg_type: msgType,
        content,
      };

      if (uuid !== undefined) {
        dataPayload.uuid = uuid;
      }

      const res = await client.im.message.reply({
        path: {
          message_id: messageId,
        },
        data: dataPayload,
      });

      if (res.code !== 0 && res.code !== undefined) {
        throw new NotificationError(
          res.msg || `Failed to reply message (code ${res.code})`,
          res.code,
          res,
        );
      }

      const replyId = res.data?.message_id ?? '';
      const chatId = res.data?.chat_id ?? undefined;
      const createTime = res.data?.create_time ?? undefined;

      log.info(`Reply sent successfully, message_id: ${replyId}`);
      return {
        messageId: replyId,
        ...(chatId !== undefined && { chatId }),
        ...(createTime !== undefined && { createTime }),
        raw: res,
      };
    } catch (err) {
      log.error(`Failed to reply message: ${String(err)}`);
      throw NotificationError.fromLarkError(err);
    }
  }
}
