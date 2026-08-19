<script setup lang="ts">
import type { ProductVO } from '@/api/product/product/types';

defineProps<{
  data: ProductVO[];
  loading: boolean;
}>();

const emit = defineEmits<{
  view: [row: ProductVO];
}>();

const priceText = (row: ProductVO) => {
  const minimum = Number(row.minPrice ?? 0).toFixed(2);
  const maximum = Number(row.maxPrice ?? 0).toFixed(2);
  return minimum === maximum ? `¥${minimum}` : `¥${minimum} - ¥${maximum}`;
};

const statusType = (status: string) => {
  if (status === '1') return 'success';
  if (status === '2') return 'info';
  return 'warning';
};

const statusText = (status: string) => ({ '0': '草稿', '1': '上架', '2': '下架' })[status] ?? '未知';
</script>

<template>
  <el-table v-loading="loading" :data="data" border>
    <el-table-column label="商品" min-width="280">
      <template #default="{ row }">
        <div class="product-cell">
          <el-image v-if="row.mainImageUrl" class="product-image" :src="row.mainImageUrl" fit="cover" />
          <div v-else class="product-image product-image--empty">暂无图片</div>
          <div class="product-copy">
            <span class="product-name">{{ row.productName }}</span>
            <span v-if="row.sellingPoint" class="product-selling-point">{{ row.sellingPoint }}</span>
          </div>
        </div>
      </template>
    </el-table-column>
    <el-table-column label="商品编码" prop="productCode" min-width="180" show-overflow-tooltip />
    <el-table-column label="分类" prop="categoryName" min-width="130" show-overflow-tooltip />
    <el-table-column label="售价" align="center" width="160">
      <template #default="{ row }">
        <span class="product-price">{{ priceText(row) }}</span>
      </template>
    </el-table-column>
    <el-table-column label="库存" align="center" prop="totalStock" width="90" />
    <el-table-column label="单位" align="center" prop="unit" width="80" />
    <el-table-column label="状态" align="center" width="90">
      <template #default="{ row }">
        <el-tag :type="statusType(row.status)">{{ statusText(row.status) }}</el-tag>
      </template>
    </el-table-column>
    <el-table-column label="排序" align="center" prop="sortNum" width="80" />
    <el-table-column label="创建时间" align="center" prop="createTime" width="165" />
    <el-table-column label="操作" align="center" width="90" fixed="right">
      <template #default="{ row }">
        <el-tooltip content="查看" placement="top">
          <el-button v-hasPermi="['product:product:query']" link type="primary" icon="View" @click="emit('view', row)" />
        </el-tooltip>
      </template>
    </el-table-column>
  </el-table>
</template>

<style scoped>
.product-cell {
  display: flex;
  align-items: center;
  min-width: 0;
  gap: 12px;
}

.product-image {
  width: 56px;
  height: 56px;
  flex: 0 0 56px;
  border-radius: 8px;
}

.product-image--empty {
  display: grid;
  place-items: center;
  background: var(--el-fill-color-light);
  color: var(--el-text-color-placeholder);
  font-size: 11px;
}

.product-copy {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 4px;
}

.product-name,
.product-selling-point {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.product-name {
  color: var(--el-text-color-primary);
  font-weight: 600;
}

.product-selling-point {
  color: var(--el-text-color-secondary);
  font-size: 12px;
}

.product-price {
  color: var(--el-color-danger);
  font-weight: 600;
}
</style>
