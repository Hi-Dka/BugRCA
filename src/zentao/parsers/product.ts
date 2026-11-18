import { parseArray, parseId, parseShape, parseString } from '../../utils';
import { toProductId, type ZenTaoProduct, type ZenTaoProductListData } from '../types';

const parseProduct = parseShape<ZenTaoProduct>({
    id: parseId(toProductId),
    name: parseString,
});

const parseProductListPayload = parseShape<ZenTaoProductListData>({
    products: parseArray(parseProduct),
});

export function parseProductListData(body: Record<string, unknown>): ZenTaoProduct[] {
    return parseProductListPayload(body, 'response').products;
}
