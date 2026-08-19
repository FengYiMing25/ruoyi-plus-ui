<script setup lang="ts">
import type { ProductSkuForm, ProductSpecForm, ProductSpecValueForm } from '@/api/product/product/types';
import { ElMessage } from 'element-plus';

const specs = defineModel<ProductSpecForm[]>('specs', { required: true });
const skus = defineModel<ProductSkuForm[]>('skus', { required: true });
let valueSequence = 0;
let previousSkus: ProductSkuForm[] = [];

const createValueKey = () => {
  valueSequence += 1;
  return `V_${Date.now().toString(36).toUpperCase()}_${valueSequence}`;
};

const emptySku = (keys: string[], source?: ProductSkuForm): ProductSkuForm => ({
  skuImageId: source?.skuImageId,
  salePrice: source?.salePrice,
  marketPrice: source?.marketPrice,
  stock: source?.stock,
  warningStock: source?.warningStock ?? 0,
  sortNum: source?.sortNum ?? 0,
  specValueKeys: keys
});

const combinationKey = (keys: string[]) => [...keys].sort().join('|');

const buildCombinations = (): ProductSpecValueForm[][] => {
  if (!specs.value.length) return [[]];
  if (specs.value.some((spec) => !spec.values.length)) return [];

  return specs.value.reduce<ProductSpecValueForm[][]>(
    (combinations, spec) => combinations.flatMap((combination) => spec.values.map((value) => [...combination, value])),
    [[]]
  );
};

const syncSkus = () => {
  const previous = skus.value.length ? skus.value : previousSkus;
  previousSkus = previous;
  const exactMap = new Map(previous.map((sku) => [combinationKey(sku.specValueKeys), sku]));
  skus.value = buildCombinations().map((combination, index) => {
    const keys = combination.map((value) => value.valueKey);
    const exact = exactMap.get(combinationKey(keys));
    const compatible = previous.find(
      (sku) => sku.specValueKeys.every((key) => keys.includes(key)) || keys.every((key) => sku.specValueKeys.includes(key))
    );
    return { ...emptySku(keys, exact ?? compatible), sortNum: exact?.sortNum ?? compatible?.sortNum ?? index };
  });
};

const addSpec = () => {
  if (specs.value.length >= 3) {
    ElMessage.warning('商品最多支持3个规格');
    return;
  }
  specs.value.push({ specName: '', sortNum: specs.value.length, values: [] });
  syncSkus();
};

const removeSpec = (index: number) => {
  specs.value.splice(index, 1);
  syncSkus();
};

const prospectiveSkuCount = (specIndex: number) => {
  return specs.value.reduce((count, spec, index) => count * (index === specIndex ? spec.values.length + 1 : Math.max(spec.values.length, 1)), 1);
};

const addValue = (specIndex: number) => {
  const spec = specs.value[specIndex];
  if (spec.values.length >= 20) {
    ElMessage.warning('每个规格最多支持20个规格值');
    return;
  }
  if (prospectiveSkuCount(specIndex) > 100) {
    ElMessage.warning('规格组合不能超过100个SKU');
    return;
  }
  spec.values.push({ valueKey: createValueKey(), specValue: '', sortNum: spec.values.length });
  syncSkus();
};

const removeValue = (specIndex: number, valueIndex: number) => {
  specs.value[specIndex].values.splice(valueIndex, 1);
  syncSkus();
};

const valueNameMap = computed(() => {
  return new Map(specs.value.flatMap((spec) => spec.values.map((value) => [value.valueKey, value.specValue || '未命名'])));
});

const skuName = (sku: ProductSkuForm) => {
  if (!sku.specValueKeys.length) return '默认规格';
  return sku.specValueKeys.map((key) => valueNameMap.value.get(key) ?? key).join(' / ');
};
</script>

<template>
  <div class="spec-editor">
    <div class="section-heading">
      <div>
        <div class="section-title">商品规格</div>
        <div class="section-tip">不添加规格时，将创建一个默认 SKU</div>
      </div>
      <el-button type="primary" plain icon="Plus" :disabled="specs.length >= 3" @click="addSpec">添加规格</el-button>
    </div>

    <el-empty v-if="!specs.length" :image-size="64" description="当前为普通商品" />
    <div v-for="(spec, specIndex) in specs" :key="specIndex" class="spec-card">
      <div class="spec-card__header">
        <el-input v-model="spec.specName" maxlength="64" placeholder="规格名称，如：颜色" />
        <el-input-number v-model="spec.sortNum" :min="0" controls-position="right" />
        <el-button type="danger" link icon="Delete" @click="removeSpec(specIndex)">删除规格</el-button>
      </div>
      <div class="spec-values">
        <div v-for="(value, valueIndex) in spec.values" :key="value.valueKey" class="spec-value">
          <el-input v-model="value.specValue" maxlength="100" placeholder="规格值，如：黑色" />
          <el-button type="danger" link icon="Close" @click="removeValue(specIndex, valueIndex)" />
        </div>
        <el-button class="add-value" plain icon="Plus" @click="addValue(specIndex)">添加规格值</el-button>
      </div>
    </div>

    <el-divider />
    <div class="section-heading">
      <div>
        <div class="section-title">SKU 信息</div>
        <div class="section-tip">共 {{ skus.length }} 个销售单元，售价与库存为必填项</div>
      </div>
    </div>

    <el-table :data="skus" border max-height="440">
      <el-table-column label="规格组合" min-width="160" fixed="left">
        <template #default="{ row }">
          <span class="sku-name">{{ skuName(row) }}</span>
        </template>
      </el-table-column>
      <el-table-column label="SKU图片" width="130" align="center">
        <template #default="{ row }">
          <image-upload v-model="row.skuImageId" :limit="1" :file-size="5" :is-show-tip="false" />
        </template>
      </el-table-column>
      <el-table-column label="销售价" width="145">
        <template #default="{ row }">
          <el-input-number v-model="row.salePrice" :min="0" :max="99999999.99" :precision="2" :step="1" controls-position="right" />
        </template>
      </el-table-column>
      <el-table-column label="市场价" width="145">
        <template #default="{ row }">
          <el-input-number v-model="row.marketPrice" :min="0" :max="99999999.99" :precision="2" :step="1" controls-position="right" />
        </template>
      </el-table-column>
      <el-table-column label="库存" width="130">
        <template #default="{ row }">
          <el-input-number v-model="row.stock" :min="0" :max="2147483647" :precision="0" controls-position="right" />
        </template>
      </el-table-column>
      <el-table-column label="预警库存" width="130">
        <template #default="{ row }">
          <el-input-number v-model="row.warningStock" :min="0" :max="2147483647" :precision="0" controls-position="right" />
        </template>
      </el-table-column>
      <el-table-column label="排序" width="110">
        <template #default="{ row }">
          <el-input-number v-model="row.sortNum" :min="0" :max="9999" :precision="0" controls-position="right" />
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>

<style scoped>
.spec-editor {
  width: 100%;
}

.section-heading,
.spec-card__header,
.spec-value {
  display: flex;
  align-items: center;
}

.section-heading {
  justify-content: space-between;
  margin-bottom: 14px;
}

.section-title {
  color: var(--el-text-color-primary);
  font-weight: 600;
}

.section-tip {
  margin-top: 3px;
  color: var(--el-text-color-secondary);
  font-size: 12px;
}

.spec-card {
  margin-bottom: 12px;
  padding: 14px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 8px;
  background: var(--el-fill-color-blank);
}

.spec-card__header {
  gap: 12px;
}

.spec-card__header :deep(.el-input) {
  max-width: 280px;
}

.spec-values {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 12px;
  padding-left: 12px;
}

.spec-value {
  width: 190px;
}

.add-value {
  align-self: stretch;
}

.sku-name {
  font-weight: 500;
}

:deep(.el-upload--picture-card),
:deep(.el-upload-list--picture-card .el-upload-list__item) {
  width: 64px;
  height: 64px;
}
</style>
