export interface CategoryVO extends BaseEntity {
  categoryId: string | number;
  categoryCode: string;
  categoryName: string;
  parentId: string | number;
  ancestors: string;
  categoryLevel: number;
  imageId?: string | number;
  imageUrl?: string;
  sortNum: number;
  status: string;
  remark?: string;
  children?: CategoryVO[];
}

export interface CategoryForm {
  categoryId?: string | number;
  categoryCode?: string;
  categoryName?: string;
  parentId: string | number;
  imageId?: string;
  sortNum: number;
  status?: string;
  remark?: string;
}

export interface CategoryQuery {
  categoryId?: string | number;
  categoryCode?: string;
  categoryName?: string;
  parentId?: string | number;
  status?: string;
}

export interface CategoryTreeOption {
  categoryId: string | number;
  categoryName: string;
  categoryLevel: number;
  status: string;
  disabled?: boolean;
  children?: CategoryTreeOption[];
}
