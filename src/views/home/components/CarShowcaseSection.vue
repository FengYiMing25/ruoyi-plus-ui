<script setup name="CarShowcaseSection" lang="ts">
import { computed, nextTick, shallowRef, useTemplateRef } from 'vue';
import CarControlDock from './CarControlDock.vue';
import CarStage from './CarStage.vue';
import { useCarShowcaseFeedback } from '../composables/useCarShowcaseFeedback';
import type { CameraPreset, CarCameraView, CarPaintId, CarPaintOption } from '../types';

// 车漆参数会直接写入 Three.js PBR 材质，CSS 色值只用于色样按钮。
const carPaints: readonly CarPaintOption[] = [
  {
    id: 'aurora',
    name: '极光绿',
    code: 'AUR',
    hex: 0xd5ff4b,
    cssColor: '#d5ff4b',
    finish: 'Aurora pearl metallic',
    metalness: 0.72,
    roughness: 0.17
  },
  {
    id: 'carmine',
    name: '胭脂红',
    code: 'CRM',
    hex: 0xa60c24,
    cssColor: '#a60c24',
    finish: 'Carmine candy metallic',
    metalness: 0.78,
    roughness: 0.15
  },
  { id: 'glacier', name: '冰川白', code: 'GLC', hex: 0xdce7ec, cssColor: '#dce7ec', finish: 'Glacier satin pearl', metalness: 0.52, roughness: 0.2 },
  { id: 'graphite', name: '石墨黑', code: 'GRP', hex: 0x252a31, cssColor: '#252a31', finish: 'Torched graphite', metalness: 0.82, roughness: 0.13 },
  {
    id: 'cobalt',
    name: '钴晶蓝',
    code: 'CBT',
    hex: 0x1d4fba,
    cssColor: '#1d4fba',
    finish: 'Cobalt crystal metallic',
    metalness: 0.74,
    roughness: 0.16
  },
  { id: 'carbon', name: '碳黑', code: 'CAR', hex: 0x222222, cssColor: '#222222', finish: 'Torched carbon', metalness: 0.82, roughness: 0.13 },
  {
    id: 'shiny',
    name: '深紫',
    code: 'SHY',
    hex: 0x800080,
    cssColor: '#800080',
    finish: 'Torched shiny',
    metalness: 0.82,
    roughness: 0.13
  }
];

// 镜头按钮只维护语义化状态，具体摄像机坐标由 CarStage 内部统一管理。
const carCameraPresets: readonly CameraPreset[] = [
  { id: 'hero', label: 'HERO', index: '01' },
  { id: 'front', label: 'FRONT', index: '02' },
  { id: 'side', label: 'SIDE', index: '03' },
  { id: 'rear', label: 'REAR', index: '04' }
];

// 组件只保存可序列化的界面状态，不把 Three.js 场景、相机或材质实例放进 Vue 响应式系统。
const sectionRoot = useTemplateRef<HTMLElement>('sectionRoot');
const activeCarPaint = shallowRef<CarPaintId>('aurora');
const activeCarView = shallowRef<CarCameraView>('hero');
const carAutoRotate = shallowRef(true);
const carZoomScale = shallowRef(1);
const carModelReady = shallowRef(false);
const carModelError = shallowRef('');

// 标题字符和当前车漆均由基础状态派生，computed 保证模板只消费最终结果。
const carTitleCharacters = computed(() => [...'AURELIA']);
const selectedCarPaint = computed(() => carPaints.find((paint) => paint.id === activeCarPaint.value) ?? carPaints[0]);

// 局部反馈 composable 只接收章节根节点，所有 DOM 查询都会限制在当前车型组件内。
const { revealModel, pulseSelection } = useCarShowcaseFeedback(sectionRoot);

// 控制面板事件统一在容器组件中修改状态，再通过 Props 向下传给 3D 舞台。
const selectCarPaint = (paintId: CarPaintId) => {
  activeCarPaint.value = paintId;
  pulseSelection();
};

const selectCarView = (view: CarCameraView) => {
  activeCarView.value = view;
  pulseSelection();
};

const toggleCarRotation = () => {
  carAutoRotate.value = !carAutoRotate.value;
  pulseSelection();
};

// 缩放比例表示镜头距离：数值越小越靠近车型，并限制在不会穿模的安全范围内。
const zoomCarIn = () => {
  carZoomScale.value = Math.max(0.72, Number((carZoomScale.value - 0.12).toFixed(2)));
  pulseSelection();
};

// 拉远镜头时保留当前环绕角度，用户无需重新调整观察方向。
const zoomCarOut = () => {
  carZoomScale.value = Math.min(1.28, Number((carZoomScale.value + 0.12).toFixed(2)));
  pulseSelection();
};

// 等待 Vue 更新加载层后再揭示 Canvas，避免加载状态与模型动画短暂重叠。
const handleCarModelReady = async () => {
  carModelReady.value = true;
  await nextTick();
  revealModel();
};

// 保存可展示的错误文本，由模板状态栏和 CarStage 错误面板分别消费。
const handleCarModelError = (message: string) => {
  carModelError.value = message;
};

// 用户开始拖拽后关闭自动旋转，防止控制器与手势竞争方向。
const handleCarInteract = () => {
  if (carAutoRotate.value) carAutoRotate.value = false;
};
</script>

<template>
  <!-- 在原首页叙事中新增 3D 数字车型章节，不改变后续五能力横向滚动结构。 -->
  <section ref="sectionRoot" class="car-showcase" aria-labelledby="car-showcase-title">
    <!-- 网格和径向光晕位于最底层，只用于营造数字摄影棚空间。 -->
    <div class="car-showcase__grid" aria-hidden="true"></div>
    <div class="car-showcase__glow" aria-hidden="true"></div>

    <!-- 顶部信息条标明章节序号与渲染技术属性。 -->
    <header class="car-showcase__head" data-car-enter>
      <span>01½ — DIGITAL MOBILITY LAB</span>
      <strong>REALTIME / WEBGL / PBR</strong>
    </header>

    <!-- 车型名称位于 Canvas 后方，车身加载后会从文字上方形成前后景穿插。 -->
    <div class="car-showcase__title">
      <p data-car-enter>PURE ELECTRIC · DUAL MOTOR · CONCEPT 01</p>
      <h2 id="car-showcase-title" aria-label="AURELIA">
        <span v-for="(character, index) in carTitleCharacters" :key="`${character}-${index}`" class="car-showcase__title-mask" aria-hidden="true">
          <i class="car-showcase__title-letter">{{ character }}</i>
        </span>
      </h2>
      <div class="car-showcase__subtitle" data-car-enter>
        <span>THE SHAPE OF MOTION</span>
        <strong>拖拽旋转车身，选择属于你的车漆。</strong>
      </div>
    </div>

    <!-- 3D 舞台独立管理模型加载、摄像机交互与 GPU 资源释放。 -->
    <CarStage
      :active-paint="activeCarPaint"
      :active-view="activeCarView"
      :auto-rotate="carAutoRotate"
      :zoom-scale="carZoomScale"
      :paints="carPaints"
      @ready="handleCarModelReady"
      @error="handleCarModelError"
      @interact="handleCarInteract"
    />

    <!-- 左侧指标为演示文案，不参与 Three.js 模型配置。 -->
    <aside class="car-showcase__metrics" aria-label="概念车演示参数" data-car-enter>
      <header><span>CONCEPT DATA</span><i></i></header>
      <div>
        <strong>3.2<small>S</small></strong
        ><span>0—100 KM/H</span>
      </div>
      <div>
        <strong>620<small>KM</small></strong
        ><span>CLTC RANGE</span>
      </div>
      <div>
        <strong>800<small>V</small></strong
        ><span>EV PLATFORM</span>
      </div>
    </aside>

    <!-- 状态区同步展示当前车漆以及模型的加载、完成或失败状态。 -->
    <div class="car-showcase__status" data-car-enter>
      <span>ACTIVE FINISH</span>
      <strong>{{ selectedCarPaint.name }}</strong>
      <small>{{ selectedCarPaint.code }} / {{ carModelReady ? 'MODEL READY' : carModelError ? 'MODEL ERROR' : 'LOADING' }}</small>
    </div>

    <!-- 操作反馈扫描环通过 GSAP 只修改 transform 与 opacity。 -->
    <span class="car-showcase__selection-pulse" data-car-selection-pulse aria-hidden="true"></span>

    <!-- 控制面板通过事件上报操作，不直接访问 CarStage 或 Three.js 实例。 -->
    <CarControlDock
      :paints="carPaints"
      :camera-presets="carCameraPresets"
      :active-paint="activeCarPaint"
      :active-view="activeCarView"
      :auto-rotate="carAutoRotate"
      :zoom-scale="carZoomScale"
      @select-paint="selectCarPaint"
      @select-view="selectCarView"
      @toggle-rotation="toggleCarRotation"
      @zoom-in="zoomCarIn"
      @zoom-out="zoomCarOut"
    />

    <!-- 模型按 CC BY 4.0 使用，页面可见署名与本地 LICENSE 同时保留。 -->
    <a
      class="car-showcase__credit"
      href="https://github.com/KhronosGroup/glTF-Sample-Assets/tree/main/Models/CarConcept"
      target="_blank"
      rel="noopener noreferrer"
    >
      3D MODEL / ERIC CHADWICK · CC BY 4.0 ↗
    </a>
  </section>
</template>

<style lang="scss" scoped>
/* 新车型章节延续首页的强色块分章方式，并以深色数字摄影棚承接 3D Canvas。 */
.car-showcase {
  --car-electric: #d5ff4b;
  --car-paper: #eef4f7;
  position: relative;
  height: calc(100vh - 84px);
  min-height: 720px;
  overflow: hidden;
  color: var(--car-paper);
  background:
    radial-gradient(circle at 52% 57%, rgba(42, 74, 91, 0.48) 0, rgba(11, 15, 22, 0.15) 32%, transparent 54%),
    linear-gradient(145deg, #0b1017 0%, #05070b 48%, #0b0e14 100%);
  isolation: isolate;
}

/* 装饰背景关闭指针事件，保证拖拽始终落到上层 Canvas。 */
.car-showcase__grid,
.car-showcase__glow {
  position: absolute;
  pointer-events: none;
}

/* 双尺度网格模拟摄影棚坐标系，并通过径向遮罩淡化四周。 */
.car-showcase__grid {
  z-index: -2;
  inset: 0;
  opacity: 0.5;
  background-image:
    linear-gradient(rgba(188, 223, 242, 0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(188, 223, 242, 0.04) 1px, transparent 1px),
    linear-gradient(rgba(188, 223, 242, 0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(188, 223, 242, 0.02) 1px, transparent 1px);
  background-position: center;
  background-size:
    120px 120px,
    120px 120px,
    24px 24px,
    24px 24px;
  mask-image: radial-gradient(circle at center, #000 8%, rgba(0, 0, 0, 0.74) 48%, transparent 92%);
}

/* 模糊光晕位于车型中心附近，增强金属轮廓与背景的分离度。 */
.car-showcase__glow {
  z-index: -1;
  top: 42%;
  left: 52%;
  width: min(54vw, 760px);
  aspect-ratio: 1;
  border-radius: 50%;
  opacity: 0.22;
  background: radial-gradient(circle, rgba(136, 200, 235, 0.65), rgba(79, 143, 174, 0.16) 42%, transparent 70%);
  filter: blur(20px);
  transform: translate(-50%, -50%);
}

/* 顶部信息条跨越章节宽度，为主体舞台提供稳定的视觉基线。 */
.car-showcase__head {
  position: absolute;
  z-index: 10;
  top: 0;
  display: flex;
  width: 100%;
  justify-content: space-between;
  padding: 20px 24px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  color: rgba(232, 241, 246, 0.48);
  font-family: 'SFMono-Regular', Consolas, monospace;
  font-size: 8px;
  letter-spacing: 0.15em;
}

.car-showcase__head strong {
  color: var(--car-electric);
  font-weight: 500;
}

/* 巨型车型名称放在 Canvas 后方，形成文字被车身穿过的空间关系。 */
.car-showcase__title {
  position: absolute;
  z-index: 2;
  top: clamp(74px, 11vh, 118px);
  width: 100%;
  text-align: center;
  pointer-events: none;
  will-change: transform, opacity;
}

.car-showcase__title > p {
  margin: 0 0 7px;
  color: rgba(226, 237, 244, 0.42);
  font-family: 'SFMono-Regular', Consolas, monospace;
  font-size: 8px;
  letter-spacing: 0.3em;
}

.car-showcase__title h2 {
  display: flex;
  justify-content: center;
  margin: 0;
  color: rgba(239, 246, 249, 0.12);
  font-size: clamp(92px, 13.2vw, 220px);
  font-weight: 900;
  letter-spacing: -0.075em;
  line-height: 0.82;
  -webkit-text-stroke: 1px rgba(227, 240, 247, 0.17);
}

/* 单字遮罩裁切 GSAP 的 yPercent 位移，制造逐字向上弹出的效果。 */
.car-showcase__title-mask {
  display: inline-block;
  overflow: hidden;
}

.car-showcase__title-letter {
  display: inline-block;
  font-style: normal;
  will-change: transform, opacity;
}

.car-showcase__subtitle {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: 17px;
  font-size: 10px;
  gap: 18px;
  letter-spacing: 0.09em;
}

.car-showcase__subtitle span {
  color: var(--car-electric);
  font-family: 'SFMono-Regular', Consolas, monospace;
  font-size: 8px;
  letter-spacing: 0.18em;
}

.car-showcase__subtitle strong {
  color: rgba(236, 243, 247, 0.55);
  font-weight: 400;
}

/* 3D 舞台覆盖整个章节，但层级仍低于指标、状态和控制按钮。 */
.car-showcase > .car-stage {
  position: absolute;
  inset: 0;
  min-height: 100%;
}

/* 左侧数据面板使用半透明边框，不遮挡中心车型主体。 */
.car-showcase__metrics {
  position: absolute;
  z-index: 7;
  top: 50%;
  left: clamp(22px, 3.1vw, 54px);
  display: grid;
  width: 150px;
  font-family: 'SFMono-Regular', Consolas, monospace;
  gap: 18px;
  pointer-events: none;
  transform: translateY(-50%);
}

.car-showcase__metrics header {
  display: flex;
  align-items: center;
  color: var(--car-electric);
  font-size: 8px;
  gap: 9px;
  letter-spacing: 0.16em;
}

.car-showcase__metrics header i {
  flex: 1;
  height: 1px;
  background: linear-gradient(90deg, rgba(213, 255, 75, 0.6), transparent);
}

.car-showcase__metrics > div {
  display: grid;
  padding-left: 12px;
  border-left: 1px solid rgba(255, 255, 255, 0.12);
  gap: 2px;
}

.car-showcase__metrics strong {
  font-family: Arial, sans-serif;
  font-size: 26px;
  font-weight: 400;
  letter-spacing: -0.04em;
  line-height: 1;
}

.car-showcase__metrics small {
  margin-left: 3px;
  color: var(--car-electric);
  font-family: 'SFMono-Regular', Consolas, monospace;
  font-size: 8px;
}

.car-showcase__metrics div > span,
.car-showcase__status span,
.car-showcase__status small {
  color: rgba(224, 235, 242, 0.44);
  font-size: 7px;
  letter-spacing: 0.16em;
}

/* 当前车漆状态固定在左下，与右侧色板形成操作前后的视觉呼应。 */
.car-showcase__status {
  position: absolute;
  z-index: 7;
  top: 74px;
  left: clamp(22px, 3.1vw, 54px);
  display: grid;
  font-family: 'SFMono-Regular', Consolas, monospace;
  gap: 4px;
  pointer-events: none;
}

.car-showcase__status strong {
  color: var(--car-paper);
  font-family: Arial, 'PingFang SC', sans-serif;
  font-size: 17px;
  font-weight: 500;
  letter-spacing: 0.05em;
}

/* 选择反馈环默认隐藏，交互时由 GSAP 放大并淡出。 */
.car-showcase__selection-pulse {
  position: absolute;
  z-index: 6;
  top: 56%;
  left: 53%;
  width: 210px;
  height: 210px;
  border: 1px solid rgba(213, 255, 75, 0.44);
  border-radius: 50%;
  opacity: 0;
  box-shadow: 0 0 70px rgba(213, 255, 75, 0.1);
  pointer-events: none;
  transform: translate(-50%, -50%);
  will-change: transform, opacity;
}

/* 模型署名保持可见和可聚焦，满足 CC BY 4.0 的页面归属要求。 */
.car-showcase__credit {
  position: absolute;
  z-index: 10;
  bottom: 35px;
  left: clamp(22px, 3.1vw, 54px);
  color: rgba(226, 237, 244, 0.3);
  font-family: 'SFMono-Regular', Consolas, monospace;
  font-size: 7px;
  letter-spacing: 0.12em;
  text-decoration: none;
  transition: color 0.25s ease;
}

.car-showcase__credit:hover,
.car-showcase__credit:focus-visible {
  color: var(--car-electric);
  outline: none;
}

/* 中等屏幕压缩左右信息宽度，为车型保留足够的中心空间。 */
@media (max-width: 1100px) {
  .car-showcase__title h2 {
    font-size: clamp(90px, 16vw, 172px);
  }

  .car-showcase__metrics {
    top: auto;
    bottom: 94px;
    grid-template-columns: repeat(3, 1fr);
    width: 360px;
    transform: none;
  }

  .car-showcase__metrics header {
    display: none;
  }

  .car-showcase__metrics strong {
    font-size: 21px;
  }
}

/* 手机端重新排列标题、指标和署名，控制区由子组件在底部横向滚动。 */
@media (max-width: 760px) {
  .car-showcase {
    height: 820px;
    min-height: 820px;
  }

  .car-showcase__head {
    padding: 17px 16px;
  }

  .car-showcase__head strong {
    display: none;
  }

  .car-showcase__title {
    top: 72px;
  }

  .car-showcase__title > p {
    font-size: 7px;
    letter-spacing: 0.18em;
  }

  .car-showcase__title h2 {
    font-size: 20vw;
  }

  .car-showcase__subtitle {
    margin-top: 10px;
  }

  .car-showcase__subtitle span {
    display: none;
  }

  .car-showcase__subtitle strong {
    font-size: 9px;
  }

  .car-showcase__status {
    display: none;
  }

  .car-showcase__metrics {
    right: 16px;
    bottom: 205px;
    left: 16px;
    width: auto;
    gap: 7px;
  }

  .car-showcase__metrics > div {
    padding-left: 8px;
  }

  .car-showcase__credit {
    bottom: 184px;
    left: 16px;
  }
}

/* 减少动态效果时移除装饰层过渡，避免 CSS 与 GSAP 产生额外运动。 */
@media (prefers-reduced-motion: reduce) {
  .car-showcase__title,
  .car-showcase__title-letter,
  .car-showcase__selection-pulse {
    will-change: auto;
  }

  .car-showcase__credit {
    transition: none;
  }
}
</style>
