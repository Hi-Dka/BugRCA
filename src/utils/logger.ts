import pino, { type Logger } from 'pino';
import pretty from 'pino-pretty';

const isDev = process.env.NODE_ENV !== 'production';

const stream = isDev
  ? pretty({
      colorize: true,
      translateTime: 'SYS:yy-mm-dd HH:MM:ss.l',
      ignore: 'pid,hostname,tags,tag',
      messageFormat: (log: Record<string, unknown>, messageKey: string) => {
        const rawTags = log.tags || log.tag;
        const tags = Array.isArray(rawTags) ? rawTags : rawTags ? [rawTags] : [];
        const tagStr = tags.length > 0 ? `[${tags.join(':')}] ` : '';
        const formattedTag = tagStr.padEnd(15, ' ');
        return `${formattedTag}${String(log[messageKey] ?? '')}`;
      },
    })
  : undefined;

const baseLogger = pino(
  {
    level: process.env.LOG_LEVEL || (isDev ? 'debug' : 'info'),
  },
  stream,
);

export const logger = Object.assign(baseLogger, {
  tag(name: string | string[]): Logger {
    return baseLogger.child({
      tags: Array.isArray(name) ? name : [name],
    });
  },
});
