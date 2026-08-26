export type ProductStatus = '0' | '1' | '2';

export interface ProductVO extends BaseEntity {
  productId: string | number;
  productCode: string;
  productName: string;
  categoryId: string | number;
  categoryName: string;
  sellingPoint?: string;
  mainImageId?: string | number;
  mainImageUrl?: string;
  unit: string;
  minPrice: number;
  maxPrice: number;
  totalStock: number;
  status: ProductStatus;
  sortNum: number;
  version: number;
  remark?: string;
}

export interface ProductSpecValueForm {
  valueKey: string;
  specValue: string;
  sortNum?: number;
}

export interface ProductSpecForm {
  specName: string;
  sortNum?: number;
  values: ProductSpecValueForm[];
}

export interface ProductSkuForm {
  skuImageId?: string;
  salePrice?: number;
  marketPrice?: number;
  stock?: number;
  warningStock?: number;
  sortNum?: number;
  specValueKeys: string[];
}

export interface ProductCreateForm {
  productName: string;
  categoryId?: string | number;
  sellingPoint?: string;
  detailContent?: string;
  mainImageId?: string;
  unit: string;
  sortNum: number;
  remark?: string;
  specs: ProductSpecForm[];
  skus: ProductSkuForm[];
}

export interface ProductQuery extends PageQuery {
  productId?: string | number;
  productCode?: string;
  productName?: string;
  categoryId?: string | number;
  status?: ProductStatus;
}
