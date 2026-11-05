// src/index.ts
import { logger } from './utils/logger';
import { NotificationClient, CardBuilder } from './notification';

const log = logger.tag('index');

const notificationClient = new NotificationClient({
  appId: 'cli_aa6371cc2bf9dc09',
  appSecret: 'Ord2PgV9sS9h6WjrRePbMbdXlakZyDUH',
});

// 1. 发送测试文本
log.info('正在发送测试文本消息...');
const textRes = await notificationClient.sendText(
  { openId: 'ou_4cef56016f7f1f297598300cc34b2009' },
  '你好！这是来自 BugRCA 的测试通知 🎉',
);
log.info(`文本消息已发送，messageId: ${textRes.messageId}`);

// 2. 发送测试卡片
log.info('正在发送测试卡片消息...');
const card = new CardBuilder()
  .setTitle('【测试】BugRCA 系统通知', 'blue')
  .addField('系统状态', '运行中 (Active)')
  .addField('测试模块', 'notification (飞书 SDK)')
  .addDivider()
  .addButton('打开飞书开放平台', {
    url: 'https://open.feishu.cn',
    type: 'primary',
  });

const cardRes = await notificationClient.sendCard(
  { openId: 'ou_4cef56016f7f1f297598300cc34b2009' },
  card,
);
log.info(`卡片消息已发送，messageId: ${cardRes.messageId}`);

// 3. 注册消息监听与长连接
notificationClient.onMessage(async (event) => {
  log.info(`收到飞书消息: ${event.text ?? event.content} (来自: ${event.chatId})`);
  await notificationClient.replyText(event.messageId, 'BugRCA 已收到你的消息！');
});

notificationClient.onCardAction(async (event) => {
  log.info(`收到卡片点击: ${JSON.stringify(event.actionValue)}`);
});

log.info('正在启动飞书长连接监听...');
await notificationClient.start();
// log.info('飞书长连接已就绪，当前状态:', notificationClient.getConnectionStatus());
