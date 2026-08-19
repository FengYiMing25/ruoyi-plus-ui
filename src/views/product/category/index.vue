<script setup name="ProductCategory" lang="ts">
import { categoryTree, delCategory, updateCategory } from '@/api/product/category';
import type { CategoryForm, CategoryQuery, CategoryVO } from '@/api/product/category/types';
import CategoryFormDialog from './components/CategoryFormDialog.vue';
import CategoryTable from './components/CategoryTable.vue';

const { proxy } = getCurrentInstance() as ComponentInternalInstance;
const queryFormRef = useTemplateRef<ElFormInstance>('queryFormRef');
const tableRef = useTemplateRef<InstanceType<typeof CategoryTable>>('tableRef');
const categoryList = ref<CategoryVO[]>([]);
const loading = shallowRef(false);
const showSearch = shallowRef(true);
const expandAll = shallowRef(true);
const dialogVisible = shallowRef(false);
const editingId = shallowRef<string | number>();
const parentId = shallowRef<string | number>(0);
const queryParams = reactive<CategoryQuery>({
  categoryCode: undefined,
  categoryName: undefined,
  status: undefined
});

const getList = async () => {
  loading.value = true;
  try {
    const response = await categoryTree(queryParams);
    categoryList.value = response.data;
  } finally {
    loading.value = false;
  }
};

const handleQuery = () => void getList();

const resetQuery = () => {
  queryFormRef.value?.resetFields();
  void getList();
};

const handleAdd = (row?: CategoryVO) => {
  editingId.value = undefined;
  parentId.value = row?.categoryId ?? 0;
  dialogVisible.value = true;
};

const handleEdit = (row: CategoryVO) => {
  editingId.value = row.categoryId;
  parentId.value = row.parentId;
  dialogVisible.value = true;
};

const handleRemove = async (row: CategoryVO) => {
  await proxy?.$modal.confirm(`是否确认删除分类“${row.categoryName}”？`);
  await delCategory(row.categoryId);
  proxy?.$modal.msgSuccess('删除成功');
  await getList();
};

const handleStatusChange = async (row: CategoryVO, status: string) => {
  const statusText = status === '0' ? '启用' : '停用';
  await proxy?.$modal.confirm(`是否确认${statusText}分类“${row.categoryName}”？`);
  const payload: CategoryForm = {
    categoryId: row.categoryId,
    categoryCode: row.categoryCode,
    categoryName: row.categoryName,
    parentId: row.parentId,
    imageId: row.imageId === undefined ? undefined : String(row.imageId),
    sortNum: row.sortNum,
    status,
    remark: row.remark
  };
  await updateCategory(payload);
  proxy?.$modal.msgSuccess(`${statusText}成功`);
  await getList();
};

const handleToggleExpandAll = () => {
  expandAll.value = !expandAll.value;
  tableRef.value?.toggleAll(categoryList.value, expandAll.value);
};

onMounted(() => void getList());
</script>

<template>
  <div class="p-2">
    <transition :enter-active-class="proxy?.animate.searchAnimate.enter" :leave-active-class="proxy?.animate.searchAnimate.leave">
      <div v-show="showSearch" class="mb-[10px]">
        <el-card shadow="hover">
          <el-form ref="queryFormRef" :model="queryParams" :inline="true">
            <el-form-item label="分类编码" prop="categoryCode">
              <el-input v-model="queryParams.categoryCode" clearable placeholder="请输入分类编码" @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="分类名称" prop="categoryName">
              <el-input v-model="queryParams.categoryName" clearable placeholder="请输入分类名称" @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="状态" prop="status">
              <el-select v-model="queryParams.status" clearable placeholder="全部" style="width: 120px">
                <el-option label="正常" value="0" />
                <el-option label="停用" value="1" />
              </el-select>
            </el-form-item>
            <el-form-item>
              <el-button type="primary" icon="Search" @click="handleQuery">搜索</el-button>
              <el-button icon="Refresh" @click="resetQuery">重置</el-button>
            </el-form-item>
          </el-form>
        </el-card>
      </div>
    </transition>

    <el-card shadow="hover">
      <template #header>
        <el-row :gutter="10">
          <el-col :span="1.5">
            <el-button v-hasPermi="['product:category:add']" type="primary" plain icon="Plus" @click="handleAdd()">新增</el-button>
          </el-col>
          <el-col :span="1.5">
            <el-button type="info" plain icon="Sort" @click="handleToggleExpandAll">展开/折叠</el-button>
          </el-col>
          <right-toolbar v-model:show-search="showSearch" @query-table="getList" />
        </el-row>
      </template>

      <CategoryTable
        ref="tableRef"
        :data="categoryList"
        :loading="loading"
        :expand-all="expandAll"
        @add="handleAdd"
        @edit="handleEdit"
        @remove="handleRemove"
        @status-change="handleStatusChange"
      />
    </el-card>

    <CategoryFormDialog v-model="dialogVisible" :category-id="editingId" :parent-id="parentId" @success="getList" />
  </div>
</template>
