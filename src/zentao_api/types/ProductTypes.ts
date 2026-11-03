export interface ZenTaoProduct {
  id: number;
  name: string;
}

export interface ProductListData {
  products: ZenTaoProduct[];
}

/**
 * Backward compatibility alias
 */
export type ProductData = ProductListData;
