import { logger } from '../../utils/logger';
import { type ZenTaoConfig } from '../types/ZenTaoConfig';
import { type ZenTaoProduct } from '../types/ProductTypes';
import { type ZenTaoBugListItem, type ZenTaoBugDetailData } from '../types/BugTypes';
import { HttpClient } from './HttpClient';
import { AuthApi } from '../modules/AuthApi';
import { ProductApi } from '../modules/ProductApi';
import { BugApi } from '../modules/BugApi';

const log = logger.tag('ZenTaoClient');

export class ZenTaoClient {
  private token?: string;

  private readonly httpClient: HttpClient;
  private readonly authApi: AuthApi;
  private readonly productApi: ProductApi;
  private readonly bugApi: BugApi;

  constructor(config: ZenTaoConfig) {
    this.httpClient = new HttpClient({
      baseUrl: `${config.baseUrl}/api.php/v2`,
      getToken: () => this.token,
    });

    this.authApi = new AuthApi(this.httpClient);
    this.productApi = new ProductApi(this.httpClient);
    this.bugApi = new BugApi(this.httpClient);

    log.info('ZenTaoClient initialized');
  }

  async login(account: string, password: string): Promise<void> {
    const response = await this.authApi.login(account, password);
    this.token = response;
  }

  async getProducts(): Promise<ZenTaoProduct[]> {
    return this.productApi.getProducts();
  }

  async getBugsByProductId(productId: number): Promise<ZenTaoBugListItem[]> {
    return this.bugApi.getBugsByProductId(productId);
  }

  async getAllBugs(): Promise<ZenTaoBugListItem[]> {
    const products = await this.getProducts();
    const bugLists = await Promise.all(
      products.map((product) => this.bugApi.getBugsByProductId(product.id)),
    );
    return bugLists.flat();
  }

  async getBugDetail(bugId: number): Promise<ZenTaoBugDetailData> {
    return this.bugApi.getBugDetail(bugId);
  }
}
