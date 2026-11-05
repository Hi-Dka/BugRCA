import * as lark from '@larksuiteoapi/node-sdk';
import { logger } from '../../utils/logger';
import { type NotificationConfig } from '../types/NotificationConfig';
import { NotificationError } from '../errors/NotificationError';

const log = logger.tag('LarkManager');

export class LarkManager {
  private readonly config: NotificationConfig;
  private httpClient: lark.Client | undefined;
  private wsClient: lark.WSClient | undefined;

  constructor(config: NotificationConfig) {
    if (!config.appId || !config.appSecret) {
      throw new NotificationError('Feishu appId and appSecret must be provided');
    }
    this.config = {
      ...config,
      domain: config.domain ?? lark.Domain.Feishu,
      appType: config.appType ?? lark.AppType.SelfBuild,
    };
    log.info(`LarkManager initialized for appId: ${config.appId}`);
  }

  /**
   * Retrieves or initializes the HTTP REST Client.
   */
  getClient(): lark.Client {
    if (!this.httpClient) {
      const clientParams: ConstructorParameters<typeof lark.Client>[0] = {
        appId: this.config.appId,
        appSecret: this.config.appSecret,
      };

      if (this.config.domain !== undefined) {
        clientParams.domain = this.config.domain;
      }
      if (this.config.appType !== undefined) {
        clientParams.appType = this.config.appType;
      }
      if (this.config.loggerLevel !== undefined) {
        clientParams.loggerLevel = this.config.loggerLevel;
      }

      this.httpClient = new lark.Client(clientParams);
      log.debug('Feishu HTTP Client instantiated');
    }
    return this.httpClient;
  }

  /**
   * Retrieves or initializes the WebSocket Client.
   */
  getWSClient(): lark.WSClient {
    if (!this.wsClient) {
      const wsParams: ConstructorParameters<typeof lark.WSClient>[0] = {
        appId: this.config.appId,
        appSecret: this.config.appSecret,
        autoReconnect: true,
      };

      if (this.config.domain !== undefined) {
        wsParams.domain = this.config.domain;
      }

      this.wsClient = new lark.WSClient(wsParams);
      log.debug('Feishu WSClient instantiated');
    }
    return this.wsClient;
  }

  getConfig(): NotificationConfig {
    return this.config;
  }

  /**
   * Returns current WebSocket connection status.
   */
  getConnectionStatus(): lark.WSConnectionStatus {
    if (!this.wsClient) {
      return {
        state: 'idle',
        reconnectAttempts: 0,
      };
    }
    return this.wsClient.getConnectionStatus();
  }

  /**
   * Closes the active WebSocket connection if present.
   */
  async closeWSClient(): Promise<void> {
    if (this.wsClient) {
      log.info('Closing Feishu WebSocket connection');
      try {
        this.wsClient.close();
      } catch (err) {
        log.warn(`Error while closing WSClient: ${String(err)}`);
      }
      this.wsClient = undefined;
    }
  }
}
