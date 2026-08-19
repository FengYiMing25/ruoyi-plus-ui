<script setup name="ProductProduct" lang="ts">
import { getProduct, listProduct } from '@/api/product/product';
import type { ProductQuery, ProductVO } from '@/api/product/product/types';
import { categoryTree } from '@/api/product/category';
import type { CategoryTreeOption, CategoryVO } from '@/api/product/category/types';
import ProductCreateDialog from './components/ProductCreateDialog.vue';
import ProductTable from './components/ProductTable.vue';

const { proxy } = getCurrentInstance() as ComponentInternalInstance;
const queryFormRef = useTemplateRef<ElFormInstance>('queryFormRef');
const productList = ref<ProductVO[]>([]);
const categoryOptions = ref<CategoryTreeOption[]>([]);
const detail = shallowRef<ProductVO>();
const loading = shallowRef(false);
const detailLoading = shallowRef(false);
const showSearch = shallowRef(true);
const createVisible = shallowRef(false);
const detailVisible = shallowRef(false);
const total = shallowRef(0);
const queryParams = reactive<ProductQuery>({
  pageNum: 1,
  pageSize: 10,
  productId: undefined,
  productCode: undefined,
  productName: undefined,
  categoryId: undefined,
  status: undefined
});

const toCategoryOptions = (nodes: CategoryVO[]): CategoryTreeOption[] => {
  return nodes.map((node) => ({
    categoryId: node.categoryId,
    categoryName: node.categoryName,
    categoryLevel: node.categoryLevel,
    status: node.status,
    children: node.children?.length ? toCategoryOptions(node.children) : undefined
  }));
};

const loadCategories = async () => {
  const response = await categoryTree();
  categoryOptions.value = toCategoryOptions(response.data);
};

const getList = async () => {
  loading.value = true;
  try {
    const response = await listProduct(queryParams);
    productList.value = response.rows;
    total.value = response.total;
  } finally {
    loading.value = false;
  }
};

const handleQuery = () => {
  queryParams.pageNum = 1;
  void getList();
};

const resetQuery = () => {
  queryFormRef.value?.resetFields();
  handleQuery();
};

const handleView = async (row: ProductVO) => {
  detailVisible.value = true;
  detailLoading.value = true;
  detail.value = undefined;
  try {
    const response = await getProduct(row.productId);
    detail.value = response.data;
  } finally {
    detailLoading.value = false;
  }
};

const statusText = (status?: string) => ({ '0': '草稿', '1': '上架', '2': '下架' })[status ?? ''] ?? '-';

const priceText = computed(() => {
  if (!detail.value) return '-';
  const minimum = Number(detail.value.minPrice ?? 0).toFixed(2);
  const maximum = Number(detail.value.maxPrice ?? 0).toFixed(2);
  return minimum === maximum ? `¥${minimum}` : `¥${minimum} - ¥${maximum}`;
});

onMounted(() => {
  void Promise.all([getList(), loadCategories()]);
});
</script>

<template>
  <div class="p-2">
    <transition :enter-active-class="proxy?.animate.searchAnimate.enter" :leave-active-class="proxy?.animate.searchAnimate.leave">
      <div v-show="showSearch" class="mb-[10px]">
        <el-card shadow="hover">
          <el-form ref="queryFormRef" :model="queryParams" :inline="true">
            <el-form-item label="商品编码" prop="productCode">
              <el-input v-model="queryParams.productCode" clearable placeholder="请输入商品编码" @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="商品名称" prop="productName">
              <el-input v-model="queryParams.productName" clearable placeholder="请输入商品名称" @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="商品分类" prop="categoryId">
              <el-tree-select
                v-model="queryParams.categoryId"
                :data="categoryOptions"
                :props="{ value: 'categoryId', label: 'categoryName', children: 'children' } as any"
                value-key="categoryId"
                check-strictly
                clearable
                placeholder="全部分类"
                style="width: 180px"
              />
            </el-form-item>
            <el-form-item label="状态" prop="status">
              <el-select v-model="queryParams.status" clearable placeholder="全部" style="width: 110px">
                <el-option label="草稿" value="0" />
                <el-option label="上架" value="1" />
                <el-option label="下架" value="2" />
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
            <el-button v-hasPermi="['product:product:add']" type="primary" plain icon="Plus" @click="createVisible = true">新增商品</el-button>
          </el-col>
          <right-toolbar v-model:show-search="showSearch" @query-table="getList" />
        </el-row>
      </template>

      <ProductTable :data="productList" :loading="loading" @view="handleView" />
      <pagination v-show="total > 0" v-model:page="queryParams.pageNum" v-model:limit="queryParams.pageSize" :total="total" @pagination="getList" />
    </el-card>

    <ProductCreateDialog v-model="createVisible" @success="getList" />

    <el-dialog v-model="detailVisible" title="商品详情" width="760px" append-to-body>
      <div v-loading="detailLoading" class="detail-body">
        <el-descriptions v-if="detail" :column="2" border>
          <el-descriptions-item label="商品主图" :span="2">
            <el-image v-if="detail.mainImageUrl" class="detail-image" :src="detail.mainImageUrl" :preview-src-list="[detail.mainImageUrl]" />
            <span v-else>暂无图片</span>
          </el-descriptions-item>
          <el-descriptions-item label="商品名称">{{ detail.productName }}</el-descriptions-item>
          <el-descriptions-item label="商品编码">{{ detail.productCode }}</el-descriptions-item>
          <el-descriptions-item label="商品分类">{{ detail.categoryName }}</el-descriptions-item>
          <el-descriptions-item label="状态">{{ statusText(detail.status) }}</el-descriptions-item>
          <el-descriptions-item label="价格区间">{{ priceText }}</el-descriptions-item>
          <el-descriptions-item label="总库存">{{ detail.totalStock }} {{ detail.unit }}</el-descriptions-item>
          <el-descriptions-item label="显示顺序">{{ detail.sortNum }}</el-descriptions-item>
          <el-descriptions-item label="创建时间">{{ detail.createTime }}</el-descriptions-item>
          <el-descriptions-item label="商品卖点" :span="2">{{ detail.sellingPoint || '-' }}</el-descriptions-item>
          <el-descriptions-item label="备注" :span="2">{{ detail.remark || '-' }}</el-descriptions-item>
        </el-descriptions>
      </div>
      <template #footer>
        <el-button @click="detailVisible = false">关 闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.detail-body {
  min-height: 180px;
}

.detail-image {
  width: 96px;
  height: 96px;
  border-radius: 8px;
}
</style>
