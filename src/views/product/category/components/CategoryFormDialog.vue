<script setup lang="ts">
import { addCategory, categoryTree, getCategory, updateCategory } from '@/api/product/category';
import type { CategoryForm, CategoryTreeOption, CategoryVO } from '@/api/product/category/types';

const props = defineProps<{
  categoryId?: string | number;
  parentId?: string | number;
}>();

const emit = defineEmits<{
  success: [];
}>();

const visible = defineModel<boolean>({ required: true });
const { proxy } = getCurrentInstance() as ComponentInternalInstance;
const formRef = useTemplateRef<ElFormInstance>('formRef');
const submitting = shallowRef(false);
const loading = shallowRef(false);
const treeOptions = ref<CategoryTreeOption[]>([]);

const initialForm = (): CategoryForm => ({
  categoryId: undefined,
  categoryCode: '',
  categoryName: '',
  parentId: 0,
  imageId: undefined,
  sortNum: 0,
  status: '0',
  remark: ''
});

const form = ref<CategoryForm>(initialForm());
const rules: ElFormRules = {
  categoryCode: [
    { required: true, message: '请输入分类编码', trigger: 'blur' },
    { pattern: /^[A-Z][A-Z0-9_]*$/, message: '须以大写字母开头，仅支持大写字母、数字和下划线', trigger: 'blur' },
    { max: 64, message: '分类编码不能超过64个字符', trigger: 'blur' }
  ],
  categoryName: [
    { required: true, message: '请输入分类名称', trigger: 'blur' },
    { max: 100, message: '分类名称不能超过100个字符', trigger: 'blur' }
  ],
  parentId: [{ required: true, message: '请选择上级分类', trigger: 'change' }],
  sortNum: [{ required: true, message: '请输入显示顺序', trigger: 'blur' }],
  remark: [{ max: 500, message: '备注不能超过500个字符', trigger: 'blur' }]
};

const removeCurrentBranch = (nodes: CategoryVO[]): CategoryTreeOption[] => {
  return nodes
    .filter((node) => node.categoryId !== props.categoryId)
    .map((node) => ({
      categoryId: node.categoryId,
      categoryName: node.categoryName,
      categoryLevel: node.categoryLevel,
      status: node.status,
      disabled: node.status !== '0' || node.categoryLevel >= 3,
      children: node.children?.length ? removeCurrentBranch(node.children) : undefined
    }));
};

const loadTreeOptions = async () => {
  const response = await categoryTree();
  treeOptions.value = [
    {
      categoryId: 0,
      categoryName: '顶级分类',
      categoryLevel: 0,
      status: '0',
      children: removeCurrentBranch(response.data)
    }
  ];
};

const openDialog = async () => {
  loading.value = true;
  form.value = initialForm();
  form.value.parentId = props.parentId ?? 0;
  formRef.value?.clearValidate();
  try {
    await loadTreeOptions();
    if (props.categoryId !== undefined) {
      const response = await getCategory(props.categoryId);
      Object.assign(form.value, response.data);
    }
  } finally {
    loading.value = false;
  }
};

watch(visible, (isVisible) => {
  if (isVisible) void openDialog();
});

const close = () => {
  visible.value = false;
};

const submit = async () => {
  const valid = await formRef.value?.validate().catch(() => false);
  if (!valid) return;

  submitting.value = true;
  try {
    if (form.value.categoryId !== undefined) {
      await updateCategory(form.value);
    } else {
      await addCategory(form.value);
    }
    proxy?.$modal.msgSuccess('保存成功');
    visible.value = false;
    emit('success');
  } finally {
    submitting.value = false;
  }
};
</script>

<template>
  <el-dialog v-model="visible" :title="categoryId === undefined ? '新增商品分类' : '修改商品分类'" width="620px" append-to-body>
    <el-form ref="formRef" v-loading="loading" :model="form" :rules="rules" label-width="100px">
      <el-row :gutter="16">
        <el-col :span="12">
          <el-form-item label="上级分类" prop="parentId">
            <el-tree-select
              v-model="form.parentId"
              class="w-full"
              :data="treeOptions"
              :props="{ value: 'categoryId', label: 'categoryName', children: 'children', disabled: 'disabled' } as any"
              value-key="categoryId"
              check-strictly
              default-expand-all
              placeholder="请选择上级分类"
            />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="显示顺序" prop="sortNum">
            <el-input-number v-model="form.sortNum" class="w-full" :min="0" :max="9999" controls-position="right" />
          </el-form-item>
        </el-col>
      </el-row>
      <el-form-item label="分类名称" prop="categoryName">
        <el-input v-model="form.categoryName" maxlength="100" show-word-limit placeholder="请输入分类名称" />
      </el-form-item>
      <el-form-item label="分类编码" prop="categoryCode">
        <el-input
          v-model="form.categoryCode"
          maxlength="64"
          placeholder="例如：DIGITAL_PRODUCT"
          @input="form.categoryCode = String($event).toUpperCase()"
        />
      </el-form-item>
      <el-form-item label="分类图片" prop="imageId">
        <image-upload v-model="form.imageId" :limit="1" :file-size="5" />
      </el-form-item>
      <el-form-item v-if="categoryId !== undefined" label="状态" prop="status">
        <el-radio-group v-model="form.status">
          <el-radio value="0">正常</el-radio>
          <el-radio value="1">停用</el-radio>
        </el-radio-group>
      </el-form-item>
      <el-form-item label="备注" prop="remark">
        <el-input v-model="form.remark" type="textarea" :rows="3" maxlength="500" show-word-limit placeholder="请输入备注" />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button :loading="submitting" type="primary" @click="submit">确 定</el-button>
      <el-button @click="close">取 消</el-button>
    </template>
  </el-dialog>
</template>
