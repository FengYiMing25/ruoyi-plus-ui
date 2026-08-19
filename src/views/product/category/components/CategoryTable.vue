<script setup lang="ts">
import type { CategoryVO } from '@/api/product/category/types';
import auth from '@/plugins/auth';

defineProps<{
  data: CategoryVO[];
  loading: boolean;
  expandAll: boolean;
}>();

const emit = defineEmits<{
  add: [row?: CategoryVO];
  edit: [row: CategoryVO];
  remove: [row: CategoryVO];
  statusChange: [row: CategoryVO, status: string];
}>();

const tableRef = useTemplateRef<ElTableInstance>('tableRef');
const canEdit = auth.hasPermi('product:category:edit');

const toggleAll = (rows: CategoryVO[], expanded: boolean) => {
  rows.forEach((row) => {
    tableRef.value?.toggleRowExpansion(row, expanded);
    if (row.children?.length) toggleAll(row.children, expanded);
  });
};

defineExpose({ toggleAll });
</script>

<template>
  <el-table
    ref="tableRef"
    v-loading="loading"
    :data="data"
    row-key="categoryId"
    border
    :default-expand-all="expandAll"
    :tree-props="{ children: 'children' }"
  >
    <el-table-column label="分类名称" prop="categoryName" min-width="220" show-overflow-tooltip />
    <el-table-column label="分类编码" prop="categoryCode" min-width="170" show-overflow-tooltip />
    <el-table-column label="图片" align="center" width="90">
      <template #default="{ row }">
        <el-image v-if="row.imageUrl" class="category-image" :src="row.imageUrl" :preview-src-list="[row.imageUrl]" preview-teleported fit="cover" />
        <span v-else class="text-gray-400">暂无</span>
      </template>
    </el-table-column>
    <el-table-column label="层级" align="center" prop="categoryLevel" width="80" />
    <el-table-column label="排序" align="center" prop="sortNum" width="80" />
    <el-table-column label="状态" align="center" width="100">
      <template #default="{ row }">
        <el-switch v-if="canEdit" :model-value="row.status" active-value="0" inactive-value="1" @change="emit('statusChange', row, String($event))" />
        <el-tag v-else-if="row.status === '0'" type="success">正常</el-tag>
        <el-tag v-else type="danger">停用</el-tag>
      </template>
    </el-table-column>
    <el-table-column label="创建时间" align="center" prop="createTime" width="165" />
    <el-table-column label="操作" align="center" width="150" fixed="right">
      <template #default="{ row }">
        <el-tooltip content="新增子分类" placement="top">
          <el-button
            v-hasPermi="['product:category:add']"
            link
            type="primary"
            icon="Plus"
            :disabled="row.categoryLevel >= 3 || row.status !== '0'"
            @click="emit('add', row)"
          />
        </el-tooltip>
        <el-tooltip content="修改" placement="top">
          <el-button v-hasPermi="['product:category:edit']" link type="primary" icon="Edit" @click="emit('edit', row)" />
        </el-tooltip>
        <el-tooltip content="删除" placement="top">
          <el-button v-hasPermi="['product:category:remove']" link type="danger" icon="Delete" @click="emit('remove', row)" />
        </el-tooltip>
      </template>
    </el-table-column>
  </el-table>
</template>

<style scoped>
.category-image {
  width: 48px;
  height: 48px;
  border-radius: 6px;
}
</style>
