import * as lark from '@larksuiteoapi/node-sdk';
import { logger } from '../../utils/logger';
import { type LarkManager } from '../client/LarkManager';
import {
  type MessageEvent,
  type CardActionEvent,
  type MessageHandler,
  type CardActionHandler,
} from './types';

const log = logger.tag('EventReceiver');

export class EventReceiver {
  private readonly messageHandlers = new Set<MessageHandler>();
  private readonly cardActionHandlers = new Set<CardActionHandler>();
  private running = false;

  constructor(private readonly larkManager: LarkManager) {}

  /**
   * Registers a subscriber for inbound messages.
   * Returns an unregister function.
   */
  onMessage(handler: MessageHandler): () => void {
    this.messageHandlers.add(handler);
    return () => {
      this.messageHandlers.delete(handler);
    };
  }

  /**
   * Registers a subscriber for interactive card action callbacks.
   * Returns an unregister function.
   */
  onCardAction(handler: CardActionHandler): () => void {
    this.cardActionHandlers.add(handler);
    return () => {
      this.cardActionHandlers.delete(handler);
    };
  }

  /**
   * Starts the WebSocket connection and listens for Feishu events.
   */
  async start(): Promise<void> {
    if (this.running) {
      log.warn('EventReceiver WebSocket is already running');
      return;
    }

    log.info('Starting Feishu WebSocket EventReceiver');

    const eventDispatcher = new lark.EventDispatcher({});

    // Register inbound message handler
    eventDispatcher.register({
      'im.message.receive_v1': async (data: Record<string, unknown>) => {
        log.debug('Received im.message.receive_v1 event');
        try {
          const rawMessage = (data['message'] ?? {}) as Record<string, unknown>;
          const rawSender = (data['sender'] ?? {}) as Record<string, unknown>;
          const senderId = (rawSender['sender_id'] ?? {}) as Record<string, unknown>;

          let parsedText: string | undefined;
          const content = String(rawMessage['content'] ?? '');
          const messageType = String(rawMessage['message_type'] ?? '');

          if (messageType === 'text') {
            try {
              const parsed = JSON.parse(content) as Record<string, unknown>;
              parsedText = typeof parsed['text'] === 'string' ? parsed['text'] : undefined;
            } catch {
              parsedText = content;
            }
          }

          const event: MessageEvent = {
            messageId: String(rawMessage['message_id'] ?? ''),
            chatId: String(rawMessage['chat_id'] ?? ''),
            chatType: String(rawMessage['chat_type'] ?? ''),
            messageType,
            content,
            raw: data,
          };

          if (parsedText !== undefined) {
            event.text = parsedText;
          }
          if (rawMessage['create_time']) {
            event.createTime = String(rawMessage['create_time']);
          }

          if (rawSender['sender_type'] || Object.keys(senderId).length > 0) {
            event.sender = {
              ...(senderId['open_id'] !== undefined && { openId: String(senderId['open_id']) }),
              ...(senderId['user_id'] !== undefined && { userId: String(senderId['user_id']) }),
              ...(senderId['union_id'] !== undefined && { unionId: String(senderId['union_id']) }),
              ...(rawSender['sender_type'] !== undefined && {
                senderType: String(rawSender['sender_type']),
              }),
            };
          }

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
      'card.action.trigger': async (data: Record<string, unknown>) => {
        log.debug('Received card.action.trigger event');
        try {
          const context = (data['context'] ?? {}) as Record<string, unknown>;
          const operator = (data['operator'] ?? {}) as Record<string, unknown>;
          const action = (data['action'] ?? {}) as Record<string, unknown>;

          const messageId =
            (context['open_message_id'] as string | undefined) ??
            (data['open_message_id'] as string | undefined);
          const openId =
            (operator['open_id'] as string | undefined) ?? (data['open_id'] as string | undefined);
          const userId =
            (operator['user_id'] as string | undefined) ?? (data['user_id'] as string | undefined);

          const event: CardActionEvent = {
            raw: data,
          };

          if (messageId !== undefined) {
            event.messageId = messageId;
          }
          if (openId !== undefined) {
            event.openId = openId;
          }
          if (userId !== undefined) {
            event.userId = userId;
          }
          if (action['value'] !== undefined && typeof action['value'] === 'object') {
            event.actionValue = action['value'] as Record<string, unknown>;
          }
          if (action['tag'] !== undefined) {
            event.actionTag = String(action['tag']);
          }

          let lastResult: Record<string, unknown> | undefined;

          for (const handler of this.cardActionHandlers) {
            try {
              const result = await handler(event);
              if (result && typeof result === 'object') {
                lastResult = result;
              }
            } catch (handlerErr) {
              log.error(`Error in card action handler: ${String(handlerErr)}`);
            }
          }

          return lastResult;
        } catch (err) {
          log.error(`Failed to process card.action.trigger: ${String(err)}`);
          return undefined;
        }
      },
    });

    const wsClient = this.larkManager.getWSClient();
    this.running = true;

    try {
      await wsClient.start({ eventDispatcher });
      log.info('Feishu WebSocket EventReceiver started');
    } catch (err) {
      this.running = false;
      log.error(`Failed to start Feishu WebSocket client: ${String(err)}`);
      throw err;
    }
  }

  /**
   * Stops the WebSocket client.
   */
  async stop(): Promise<void> {
    if (!this.running) {
      return;
    }
    log.info('Stopping EventReceiver');
    this.running = false;
    await this.larkManager.closeWSClient();
  }

  /**
   * Returns whether the WebSocket event receiver is currently running.
   */
  isRunning(): boolean {
    return this.running;
  }

  /**
   * Returns current detailed WebSocket connection status.
   */
  getConnectionStatus(): lark.WSConnectionStatus {
    return this.larkManager.getConnectionStatus();
  }
}
