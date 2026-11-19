import { logger } from '../../utils/logger';
import { HttpClient } from './HttpClient';
import { AuthApi } from '../modules/AuthApi';
import { ProductApi } from '../modules/ProductApi';
import { BugApi } from '../modules/BugApi';
import type {
    BugId,
    ProductId,
    ZenTaoConfig,
    ZenTaoProduct,
    ZenTaoBugListItem,
    ZenTaoBugDetailData,
} from '../types';

const log = logger.tag('ZenTaoClient');

export class ZenTaoClient {
    private token: string | undefined = undefined;

    private readonly httpClient: HttpClient;
    private readonly authApi: AuthApi;
    private readonly productApi: ProductApi;
    private readonly bugApi: BugApi;

    constructor(config: ZenTaoConfig) {
        this.httpClient = new HttpClient({
            baseUrl: `${config.baseUrl}/api.php/v2`,
            timeout: undefined,
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

    async getBugsByProductId(productId: ProductId): Promise<ZenTaoBugListItem[]> {
        return this.bugApi.getBugsByProductId(productId);
    }

    async getAllBugs(): Promise<ZenTaoBugListItem[]> {
        const products = await this.getProducts();
        const bugLists = await Promise.all(
            products.map((product) => this.bugApi.getBugsByProductId(product.id)),
        );
        return bugLists.flat();
    }

    async getBugDetail(bugId: BugId): Promise<ZenTaoBugDetailData> {
        return this.bugApi.getBugDetail(bugId);
    }
}
