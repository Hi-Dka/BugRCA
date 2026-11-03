import { logger } from '../../utils/logger';
import { ZenTaoError } from '../errors/ZenTaoError';
import { HttpClient } from '../client/HttpClient';
import { type Response } from '../types/HttpTypes';
import { type BugListData, type ZenTaoBugListItem, type BugDetailData } from '../types/BugTypes';

const log = logger.tag('BugApi');

export class BugApi {
  constructor(private readonly httpClient: HttpClient) {
    log.info('BugApi initialized');
  }

  //TODO: Add parameter for filtering bugs by status, severity, etc.
  async getBugsByProductId(productId: number): Promise<ZenTaoBugListItem[]> {
    const response = await this.httpClient.get<Response<BugListData>>(
      `/products/${productId}/bugs`,
      { params: { browseType: 'assigntome' } },
    );

    if (response.status !== 'success') {
      log.error(`Failed to fetch bugs for product with ID ${productId}: ${response.status}`);
      throw new ZenTaoError('Failed to fetch bugs');
    }

    log.info(`Fetched ${response.bugs.length} bugs for product with ID ${productId}`);
    for (const bug of response.bugs) {
      log.info(`Bug ID: ${bug.id}, Title: ${bug.title}`);
    }

    return response.bugs.map((bug) => ({ id: bug.id, title: bug.title }));
  }

  async getBugDetail(bugId: number): Promise<BugDetailData> {
    const response = await this.httpClient.get<Response<BugDetailData>>(`/bugs/${bugId}`);

    if (response.status !== 'success') {
      log.error(`Failed to fetch bug detail for bug with ID ${bugId}: ${response.status}`);
      throw new ZenTaoError('Failed to fetch bug detail');
    }

    log.info(`Fetched bug detail for bug with ID ${bugId}`);
    return {
      bug: response.bug,
      actions: response.actions,
    };
  }
}
