import { type WSConnectionStatus } from '@larksuiteoapi/node-sdk';
import { logger } from '../../utils/logger';
import { type NotificationConfig } from '../types/NotificationConfig';
import { type ReceiverTarget } from '../types/ReceiverTypes';
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

    createCard(): CardBuilder {
        return new CardBuilder();
    }

    async sendText(
        target: ReceiverTarget | undefined,
        text: string,
        options?: SendTextOptions,
    ): Promise<SendMessageResult> {
        return this.messageApi.sendText(target, text, options);
    }

    async sendCard(
        target: ReceiverTarget | undefined,
        card: CardBuilder | FeishuCardPayload | Record<string, unknown> | string,
        options?: SendCardOptions,
    ): Promise<SendMessageResult> {
        const payload = card instanceof CardBuilder ? card.build() : card;
        return this.messageApi.sendCard(target, payload, options);
    }

    async replyText(
        messageId: string,
        text: string,
        options?: ReplyOptions,
    ): Promise<SendMessageResult> {
        return this.messageApi.replyText(messageId, text, options);
    }

    async replyCard(
        messageId: string,
        card: CardBuilder | FeishuCardPayload | Record<string, unknown> | string,
        options?: ReplyOptions,
    ): Promise<SendMessageResult> {
        const payload = card instanceof CardBuilder ? card.build() : card;
        return this.messageApi.replyCard(messageId, payload, options);
    }

    onMessage(handler: MessageHandler): () => void {
        return this.eventReceiver.onMessage(handler);
    }

    onCardAction(handler: CardActionHandler): () => void {
        return this.eventReceiver.onCardAction(handler);
    }

    async start(): Promise<void> {
        return this.eventReceiver.start();
    }

    async stop(): Promise<void> {
        return this.eventReceiver.stop();
    }

    isRunning(): boolean {
        return this.eventReceiver.isRunning();
    }

    getConnectionStatus(): WSConnectionStatus {
        return this.eventReceiver.getConnectionStatus();
    }

    getConfig(): NotificationConfig {
        return this.larkManager.getConfig();
    }
}
