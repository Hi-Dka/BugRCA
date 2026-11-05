import { Domain, AppType, LoggerLevel } from '@larksuiteoapi/node-sdk';

export interface NotificationConfig {
  /** Feishu application ID */
  appId: string;
  /** Feishu application secret */
  appSecret: string;
  /** Feishu (China) or Lark (International) domain */
  domain?: Domain | string | undefined;
  /** Feishu app type: SelfBuild (default) or ISV */
  appType?: AppType | undefined;
  /** Log level for Lark internal client */
  loggerLevel?: LoggerLevel | undefined;
  /** Optional default chat ID to send notifications to */
  defaultChatId?: string | undefined;
}
