import request from '@/utils/request';
import type { AxiosPromise } from 'axios';
import type { CategoryForm, CategoryQuery, CategoryVO } from './types';

export const listCategory = (query?: CategoryQuery): AxiosPromise<CategoryVO[]> => {
  return request({
    url: '/product/category/list',
    method: 'get',
    params: query
  });
};

export const categoryTree = (query?: CategoryQuery): AxiosPromise<CategoryVO[]> => {
  return request({
    url: '/product/category/tree',
    method: 'get',
    params: query
  });
};

export const getCategory = (categoryId: string | number): AxiosPromise<CategoryVO> => {
  return request({
    url: `/product/category/${categoryId}`,
    method: 'get'
  });
};

export const addCategory = (data: CategoryForm) => {
  return request({
    url: '/product/category',
    method: 'post',
    data
  });
};

export const updateCategory = (data: CategoryForm) => {
  return request({
    url: '/product/category',
    method: 'put',
    data
  });
};

export const delCategory = (categoryId: string | number) => {
  return request({
    url: `/product/category/${categoryId}`,
    method: 'delete'
  });
};
