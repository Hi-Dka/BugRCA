import { logger } from '../../utils/logger';
import { HttpClient } from '../client/HttpClient';
import type { BugId, ProductId, ZenTaoBugDetailData, ZenTaoBugListItem } from '../types';
import { parseBugDetailData, parseBugListData } from '../parsers/bug';
import { parseEnvelope } from '../parsers/envelope';

const log = logger.tag('BugApi');

export class BugApi {
    constructor(private readonly httpClient: HttpClient) {
        log.info('BugApi initialized');
    }

    async getBugsByProductId(productId: ProductId): Promise<ZenTaoBugListItem[]> {
        const raw = await this.httpClient.get(`/products/${productId}/bugs`, {
            params: { browseType: 'assigntome' },
        });
        const bugs = parseBugListData(parseEnvelope(raw));
        log.info(`Fetched ${bugs.length} bugs for product with ID ${productId}`);
        return bugs;
    }

    async getBugDetail(bugId: BugId): Promise<ZenTaoBugDetailData> {
        const raw = await this.httpClient.get(`/bugs/${bugId}`);
        const detail = parseBugDetailData(parseEnvelope(raw));
        log.info(`Fetched bug detail for bug with ID ${bugId}`);
        return detail;
    }
}
