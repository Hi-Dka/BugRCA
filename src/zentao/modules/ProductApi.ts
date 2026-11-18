import { logger } from '../../utils/logger';
import { HttpClient } from '../client/HttpClient';
import { type ZenTaoProduct } from '../types';
import { parseProductListData } from '../parsers/product';
import { parseEnvelope } from '../parsers/envelope';

const log = logger.tag('ProductApi');

export class ProductApi {
    constructor(private readonly httpClient: HttpClient) {
        log.info('ProductApi initialized');
    }

    async getProducts(): Promise<ZenTaoProduct[]> {
        const raw = await this.httpClient.get('/products', {
            params: { browseType: 'noclosed' },
        });
        const products = parseProductListData(parseEnvelope(raw));
        log.info(`Fetched ${products.length} products`);
        return products;
    }
}
