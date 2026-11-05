import { type WSConnectionStatus } from '@larksuiteoapi/node-sdk';
import { logger } from '../../utils/logger';
import { type NotificationConfig } from '../types/NotificationConfig';
import { type ReceiverTargetInput } from '../types/ReceiverTypes';
import {
  type SendMessageResult,
  type SendTextOptions,
  type SendCardOptions,
  type ReplyOptions,
} from '../types/MessagePayloadTypes';
import { type MessageHandler, type CardActionHandler } from '../event/types';
import { LarkManager } from './LarkManager';
import { MessageApi } from '../message/MessageApi';
import { EventReceiver } from '../event/EventReceiver';
import { CardBuilder } from '../message/CardBuilder';
import { type FeishuCardPayload } from '../message/types';

const log = logger.tag('NotificationClient');

export class NotificationClient {
  private readonly larkManager: LarkManager;
  private readonly messageApi: MessageApi;
  private readonly eventReceiver: EventReceiver;

  constructor(config: NotificationConfig) {
    this.larkManager = new LarkManager(config);
    this.messageApi = new MessageApi(this.larkManager);
    this.eventReceiver = new EventReceiver(this.larkManager);

    log.info('NotificationClient initialized');
  }

  /**
   * Helper factory to create a new fluent CardBuilder.
   */
  createCard(): CardBuilder {
    return new CardBuilder();
  }

  /**
   * Sends a plain text message to a chat, user, or email.
   */
  async sendText(
    target: ReceiverTargetInput | undefined,
    text: string,
    options?: SendTextOptions,
  ): Promise<SendMessageResult> {
    return this.messageApi.sendText(target, text, options);
  }

  /**
   * Sends an interactive card to a chat, user, or email.
   * Accepts a CardBuilder instance, card object, or card JSON string.
   */
  async sendCard(
    target: ReceiverTargetInput | undefined,
    card: CardBuilder | FeishuCardPayload | Record<string, unknown> | string,
    options?: SendCardOptions,
  ): Promise<SendMessageResult> {
    const payload = card instanceof CardBuilder ? card.build() : card;
    return this.messageApi.sendCard(target, payload, options);
  }

  /**
   * Replies to an existing message thread with plain text.
   */
  async replyText(
    messageId: string,
    text: string,
    options?: ReplyOptions,
  ): Promise<SendMessageResult> {
    return this.messageApi.replyText(messageId, text, options);
  }

  /**
   * Replies to an existing message thread with an interactive card.
   * Accepts a CardBuilder instance, card object, or card JSON string.
   */
  async replyCard(
    messageId: string,
    card: CardBuilder | FeishuCardPayload | Record<string, unknown> | string,
    options?: ReplyOptions,
  ): Promise<SendMessageResult> {
    const payload = card instanceof CardBuilder ? card.build() : card;
    return this.messageApi.replyCard(messageId, payload, options);
  }

  /**
   * Subscribes to inbound messages received via WebSocket.
   * Returns an unregister function.
   */
  onMessage(handler: MessageHandler): () => void {
    return this.eventReceiver.onMessage(handler);
  }

  /**
   * Subscribes to card action button clicks received via WebSocket.
   * Returns an unregister function.
   */
  onCardAction(handler: CardActionHandler): () => void {
    return this.eventReceiver.onCardAction(handler);
  }

  /**
   * Starts the WebSocket connection to begin listening for incoming Feishu events.
   */
  async start(): Promise<void> {
    return this.eventReceiver.start();
  }

  /**
   * Stops the active WebSocket connection.
   */
  async stop(): Promise<void> {
    return this.eventReceiver.stop();
  }

  /**
   * Returns whether the WebSocket receiver is currently running.
   */
  isRunning(): boolean {
    return this.eventReceiver.isRunning();
  }

  /**
   * Returns detailed connection lifecycle status from the underlying Feishu WebSocket client.
   * State: 'idle' | 'connecting' | 'connected' | 'reconnecting' | 'failed'
   */
  getConnectionStatus(): WSConnectionStatus {
    return this.eventReceiver.getConnectionStatus();
  }

  /**
   * Returns the current resolved notification configuration.
   */
  getConfig(): NotificationConfig {
    return this.larkManager.getConfig();
  }
}
