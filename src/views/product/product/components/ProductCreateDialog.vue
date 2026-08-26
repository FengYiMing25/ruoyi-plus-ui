<script setup lang="ts">
import { addProduct } from '@/api/product/product';
import type { ProductCreateForm, ProductSkuForm, ProductSpecForm } from '@/api/product/product/types';
import { categoryTree } from '@/api/product/category';
import type { CategoryTreeOption, CategoryVO } from '@/api/product/category/types';
import ProductSpecEditor from './ProductSpecEditor.vue';

const emit = defineEmits<{
  success: [];
}>();

const visible = defineModel<boolean>({ required: true });
const { proxy } = getCurrentInstance() as ComponentInternalInstance;
const formRef = useTemplateRef<ElFormInstance>('formRef');
const submitting = shallowRef(false);
const categoryLoading = shallowRef(false);
const categoryOptions = ref<CategoryTreeOption[]>([]);

const defaultSku = (): ProductSkuForm => ({
  skuImageId: undefined,
  salePrice: undefined,
  marketPrice: undefined,
  stock: undefined,
  warningStock: 0,
  sortNum: 0,
  specValueKeys: []
});

const initialForm = (): ProductCreateForm => ({
  productName: '',
  categoryId: undefined,
  sellingPoint: '',
  detailContent: '',
  mainImageId: undefined,
  unit: '件',
  sortNum: 0,
  remark: '',
  specs: [],
  skus: [defaultSku()]
});

const form = ref<ProductCreateForm>(initialForm());

const validateSpecs = (_rule: unknown, value: ProductSpecForm[], callback: (error?: Error) => void) => {
  if (value.length > 3) return callback(new Error('商品最多支持3个规格'));
  const names = value.map((spec) => spec.specName.trim());
  if (names.some((name) => !name)) return callback(new Error('规格名称不能为空'));
  if (new Set(names).size !== names.length) return callback(new Error('规格名称不能重复'));

  for (const spec of value) {
    if (!spec.values.length) return callback(new Error(`规格“${spec.specName}”至少需要一个规格值`));
    const valueNames = spec.values.map((item) => item.specValue.trim());
    if (valueNames.some((name) => !name)) return callback(new Error(`规格“${spec.specName}”存在空规格值`));
    if (new Set(valueNames).size !== valueNames.length) return callback(new Error(`规格“${spec.specName}”的规格值不能重复`));
  }
  callback();
};

const validateSkus = (_rule: unknown, value: ProductSkuForm[], callback: (error?: Error) => void) => {
  if (!value.length) return callback(new Error('请先完善规格值，至少生成一个SKU'));
  if (value.length > 100) return callback(new Error('商品最多支持100个SKU'));
  for (const sku of value) {
    if (sku.salePrice === undefined || sku.salePrice === null) return callback(new Error('请填写全部SKU的销售价'));
    if (sku.stock === undefined || sku.stock === null) return callback(new Error('请填写全部SKU的库存'));
    if (sku.marketPrice !== undefined && sku.marketPrice !== null && sku.marketPrice < sku.salePrice) {
      return callback(new Error('SKU市场价不能低于销售价'));
    }
  }
  callback();
};

const rules: ElFormRules = {
  productName: [
    { required: true, message: '请输入商品名称', trigger: 'blur' },
    { max: 200, message: '商品名称不能超过200个字符', trigger: 'blur' }
  ],
  categoryId: [{ required: true, message: '请选择商品分类', trigger: 'change' }],
  sellingPoint: [{ max: 255, message: '商品卖点不能超过255个字符', trigger: 'blur' }],
  unit: [{ max: 32, message: '商品单位不能超过32个字符', trigger: 'blur' }],
  sortNum: [{ required: true, message: '请输入显示顺序', trigger: 'blur' }],
  remark: [{ max: 500, message: '备注不能超过500个字符', trigger: 'blur' }],
  specs: [{ validator: validateSpecs, trigger: 'change' }],
  skus: [{ required: true, validator: validateSkus, trigger: 'change' }]
};

const toProductCategoryOptions = (nodes: CategoryVO[]): CategoryTreeOption[] => {
  return nodes.map((node) => ({
    categoryId: node.categoryId,
    categoryName: node.categoryName,
    categoryLevel: node.categoryLevel,
    status: node.status,
    disabled: node.status !== '0' || Boolean(node.children?.length),
    children: node.children?.length ? toProductCategoryOptions(node.children) : undefined
  }));
};

const loadCategories = async () => {
  categoryLoading.value = true;
  try {
    const response = await categoryTree();
    categoryOptions.value = toProductCategoryOptions(response.data);
  } finally {
    categoryLoading.value = false;
  }
};

watch(visible, (isVisible) => {
  if (!isVisible) return;
  form.value = initialForm();
  formRef.value?.clearValidate();
  void loadCategories();
});

const close = () => {
  visible.value = false;
};

const submit = async () => {
  const valid = await formRef.value?.validate().catch(() => false);
  if (!valid) return;

  submitting.value = true;
  try {
    await addProduct(form.value);
    proxy?.$modal.msgSuccess('商品创建成功，已进入草稿状态');
    visible.value = false;
    emit('success');
  } finally {
    submitting.value = false;
  }
};
</script>

<template>
  <el-dialog v-model="visible" title="新增商品" width="1180px" top="4vh" append-to-body destroy-on-close>
    <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
      <el-divider content-position="left">基础信息</el-divider>
      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="商品名称" prop="productName">
            <el-input v-model="form.productName" maxlength="200" show-word-limit placeholder="请输入商品名称" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="商品分类" prop="categoryId">
            <el-tree-select
              v-model="form.categoryId"
              v-loading="categoryLoading"
              class="w-full"
              :data="categoryOptions"
              :props="{ value: 'categoryId', label: 'categoryName', children: 'children', disabled: 'disabled' } as any"
              value-key="categoryId"
              check-strictly
              default-expand-all
              placeholder="请选择正常状态的末级分类"
            />
          </el-form-item>
        </el-col>
      </el-row>
      <el-form-item label="商品卖点" prop="sellingPoint">
        <el-input v-model="form.sellingPoint" maxlength="255" show-word-limit placeholder="请输入商品卖点" />
      </el-form-item>
      <el-row :gutter="20">
        <el-col :span="8">
          <el-form-item label="商品单位" prop="unit">
            <el-input v-model="form.unit" maxlength="32" placeholder="例如：件、盒、台" />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="显示顺序" prop="sortNum">
            <el-input-number v-model="form.sortNum" class="w-full" :min="0" :max="9999" controls-position="right" />
          </el-form-item>
        </el-col>
      </el-row>
      <el-form-item label="商品主图" prop="mainImageId">
        <image-upload v-model="form.mainImageId" :limit="1" :file-size="5" />
      </el-form-item>
      <el-form-item label="备注" prop="remark">
        <el-input v-model="form.remark" type="textarea" :rows="2" maxlength="500" show-word-limit placeholder="请输入备注" />
      </el-form-item>

      <el-divider content-position="left">商品详情</el-divider>
      <el-form-item label="详情内容" prop="detailContent">
        <editor v-model="form.detailContent" :height="260" :min-height="260" />
      </el-form-item>

      <el-divider content-position="left">规格与库存</el-divider>
      <el-form-item prop="specs" label-width="0">
        <ProductSpecEditor v-model:specs="form.specs" v-model:skus="form.skus" />
      </el-form-item>
      <el-form-item prop="skus" label-width="0" class="sku-validation-anchor" />
    </el-form>
    <template #footer>
      <el-button :loading="submitting" type="primary" @click="submit">创建商品</el-button>
      <el-button @click="close">取 消</el-button>
    </template>
  </el-dialog>
</template>

<style scoped>
.sku-validation-anchor {
  margin-top: -14px;
}
</style>
