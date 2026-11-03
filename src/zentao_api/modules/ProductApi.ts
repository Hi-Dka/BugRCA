import { logger } from '../../utils/logger';
import { ZenTaoError } from '../errors/ZenTaoError';
import { HttpClient } from '../client/HttpClient';
import { type Response } from '../types/HttpTypes';
import { type ZenTaoProductListData, type ZenTaoProduct } from '../types/ProductTypes';

const log = logger.tag('ProductApi');

export class ProductApi {
  constructor(private readonly httpClient: HttpClient) {
    log.info('ProductApi initialized');
  }

  async getProducts(): Promise<ZenTaoProduct[]> {
    const response = await this.httpClient.get<Response<ZenTaoProductListData>>('/products', {
      params: { browseType: 'noclosed' },
    });

    if (response.status !== 'success') {
      log.error(`Failed to fetch products: ${response.status}`);
      throw new ZenTaoError('Failed to fetch products');
    }

    log.info(`Fetched ${response.products.length} products`);
    for (const product of response.products) {
      log.info(`Product ID: ${product.id}, Name: ${product.name}`);
    }

    return response.products.map((product) => ({ id: product.id, name: product.name }));
  }
}
