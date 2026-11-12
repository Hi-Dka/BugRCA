export type ProductId = number & { readonly __brand: unique symbol };

export function toProductId(id: number): ProductId {
    return id as ProductId;
}

export interface ZenTaoProduct {
    id: ProductId;
    name: string;
}

export interface ZenTaoProductListData {
    products: ZenTaoProduct[];
}
