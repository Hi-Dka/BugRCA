import * as lark from '@larksuiteoapi/node-sdk';
import { isRecord } from '../../utils';
import { logger } from '../../utils/logger';
import { type LarkManager } from '../client/LarkManager';
import { parseCardActionEvent, parseMessageEvent } from './parsers';
import { type CardActionHandler, type MessageHandler } from './types';

const log = logger.tag('EventReceiver');

export class EventReceiver {
    private readonly messageHandlers = new Set<MessageHandler>();
    private readonly cardActionHandlers = new Set<CardActionHandler>();
    private running = false;
    private startPromise: Promise<void> | undefined = undefined;

    constructor(private readonly larkManager: LarkManager) {}

    onMessage(handler: MessageHandler): () => void {
        this.messageHandlers.add(handler);
        return () => {
            this.messageHandlers.delete(handler);
        };
    }

    onCardAction(handler: CardActionHandler): () => void {
        this.cardActionHandlers.add(handler);
        return () => {
            this.cardActionHandlers.delete(handler);
        };
    }

    async start(): Promise<void> {
        if (this.running) {
            log.warn('EventReceiver WebSocket is already running');
            return;
        }
        if (this.startPromise) {
            return this.startPromise;
        }

        this.startPromise = this.doStart();
        try {
            await this.startPromise;
        } finally {
            this.startPromise = undefined;
        }
    }

    private async doStart(): Promise<void> {
        log.info('Starting Feishu WebSocket EventReceiver');

        const eventDispatcher = new lark.EventDispatcher({});

        eventDispatcher.register({
            'im.message.receive_v1': async (data: unknown) => {
                log.debug('Received im.message.receive_v1 event');
                try {
                    const event = parseMessageEvent(data);

                    for (const handler of this.messageHandlers) {
                        try {
                            await handler(event);
                        } catch (handlerErr) {
                            log.error(`Error in message handler: ${String(handlerErr)}`);
                        }
                    }
                } catch (err) {
                    log.error(`Failed to process im.message.receive_v1: ${String(err)}`);
                }
            },
            'card.action.trigger': async (data: unknown) => {
                log.debug('Received card.action.trigger event');
                try {
                    const event = parseCardActionEvent(data);
                    let firstResponse: Record<string, unknown> | undefined;

                    for (const handler of this.cardActionHandlers) {
                        try {
                            const result = await handler(event);
                            if (firstResponse === undefined && isRecord(result)) {
                                firstResponse = result;
                            }
                        } catch (handlerErr) {
                            log.error(`Error in card action handler: ${String(handlerErr)}`);
                        }
                    }

                    return firstResponse;
                } catch (err) {
                    log.error(`Failed to process card.action.trigger: ${String(err)}`);
                    return undefined;
                }
            },
        });

        const wsClient = this.larkManager.getWSClient();

        try {
            await wsClient.start({ eventDispatcher });
            this.running = true;
            log.info('Feishu WebSocket EventReceiver started');
        } catch (err) {
            this.running = false;
            log.error(`Failed to start Feishu WebSocket client: ${String(err)}`);
            throw err;
        }
    }

    async stop(): Promise<void> {
        if (!this.running && !this.startPromise) {
            return;
        }
        log.info('Stopping EventReceiver');
        this.running = false;
        this.startPromise = undefined;
        await this.larkManager.closeWSClient();
    }

    isRunning(): boolean {
        return this.running;
    }

    getConnectionStatus(): lark.WSConnectionStatus {
        return this.larkManager.getConnectionStatus();
    }
}
