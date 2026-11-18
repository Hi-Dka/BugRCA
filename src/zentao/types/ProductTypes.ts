import { assertPositiveInteger } from '../../utils';

export type ProductId = number & { readonly __brand: unique symbol };

export function toProductId(id: number, path = 'ProductId'): ProductId {
    return assertPositiveInteger(id, path) as ProductId;
}

export interface ZenTaoProduct {
    id: ProductId;
    name: string;
}

export interface ZenTaoProductListData {
    products: ZenTaoProduct[];
}
