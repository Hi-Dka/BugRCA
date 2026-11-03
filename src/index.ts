// src/index.ts
import { logger } from './utils/logger';
import { ZenTaoClient } from './zentao_api/client/ZenTaoClient';

const log = logger.tag('index');

log.info('BugRCA started');
const client = new ZenTaoClient({ baseUrl: 'https://zd.bicv.com' });
await client.login('yangxinxin', 'QWEasdzxc123@');
const bugs = await client.getAllBugs();
log.info(`Retrieved a total of ${bugs.length} bugs across all products`);
