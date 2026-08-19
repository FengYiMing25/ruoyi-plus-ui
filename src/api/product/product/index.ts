import request from '@/utils/request';
import type { AxiosPromise } from 'axios';
import type { ProductCreateForm, ProductQuery, ProductVO } from './types';

export const listProduct = (query: ProductQuery): AxiosPromise<ProductVO[]> => {
  return request({
    url: '/product/product/list',
    method: 'get',
    params: query
  });
};

export const getProduct = (productId: string | number): AxiosPromise<ProductVO> => {
  return request({
    url: `/product/product/${productId}`,
    method: 'get'
  });
};

export const addProduct = (data: ProductCreateForm) => {
  return request({
    url: '/product/product',
    method: 'post',
    data
  });
};
