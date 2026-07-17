<script setup lang="ts">
import { computed, shallowRef, toRef, useTemplateRef } from 'vue';
import { useCarScene } from '../composables/useCarScene';
import type { CarCameraView, CarPaintId, CarPaintOption } from '../types';

// Props 是父容器维护的唯一配置来源，舞台组件不会反向修改这些值。
interface Props {
  /** 当前车漆标识，变化后由 useCarScene 更新 PBR 材质。 */
  activePaint: CarPaintId;
  /** 当前镜头预设，变化后触发相机与观察点的 GSAP 过渡。 */
  activeView: CarCameraView;
  /** 是否让 OrbitControls 持续自动环绕车型。 */
  autoRotate: boolean;
  /** 相对于预设镜头基础距离的缩放比例。 */
  zoomScale: number;
  /** 全部可选车漆参数，供 Three.js 查找颜色和材质属性。 */
  paints: readonly CarPaintOption[];
}

// 加载生命周期和首次用户交互通过类型化事件反馈给父容器。
interface Emits {
  /** 模型解析、归一化和首次材质应用全部完成。 */
  ready: [];
  /** 模型加载失败，并向父组件传递可展示的错误信息。 */
  error: [message: string];
  /** 用户开始拖拽 Canvas，父组件可据此停止自动旋转。 */
  interact: [];
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

// Canvas 挂载点与加载状态属于舞台内部实现，不需要暴露给控制面板。
const canvasHost = useTemplateRef<HTMLElement>('canvasHost');
const progress = shallowRef(0);
const isReady = shallowRef(false);
const errorMessage = shallowRef('');

// 加载条使用计算样式，模板只负责声明状态，不执行数值转换。
const progressStyle = computed(() => ({ transform: `scaleX(${Math.max(0.02, progress.value / 100)})` }));

// toRef 保留 Props 的响应性，useCarScene 可用 watch 将状态变化同步到 Three.js。
useCarScene({
  containerRef: canvasHost,
  activePaint: toRef(props, 'activePaint'),
  activeView: toRef(props, 'activeView'),
  autoRotate: toRef(props, 'autoRotate'),
  zoomScale: toRef(props, 'zoomScale'),
  paints: props.paints,
  onProgress: (value) => {
    progress.value = value;
  },
  onReady: () => {
    isReady.value = true;
    emit('ready');
  },
  onError: (message) => {
    errorMessage.value = message;
    emit('error', message);
  },
  onInteract: () => emit('interact')
});
</script>

<template>
  <section class="car-stage" aria-label="3D 汽车展示区">
    <!-- 三层轨道只承担视觉空间感，不参与鼠标命中和 Three.js 重绘。 -->
    <div class="car-stage__orbit car-stage__orbit--outer" aria-hidden="true"></div>
    <div class="car-stage__orbit car-stage__orbit--middle" aria-hidden="true"></div>
    <div class="car-stage__orbit car-stage__orbit--inner" aria-hidden="true"></div>

    <!-- Three.js 会在此容器内动态插入 renderer.domElement 对应的 Canvas。 -->
    <div ref="canvasHost" class="car-stage__viewport"></div>

    <!-- 模型加载期间保留明确进度，避免 11MB 素材首次访问时出现空白。 -->
    <div v-if="!isReady && !errorMessage" class="car-stage__loader" role="status" aria-live="polite">
      <div class="car-stage__loader-head">
        <span>ASSEMBLING DIGITAL TWIN</span>
        <strong>{{ progress.toString().padStart(2, '0') }}%</strong>
      </div>
      <div class="car-stage__loader-track"><i :style="progressStyle"></i></div>
      <p>加载车身几何、PBR 材质与驾驶舱细节</p>
    </div>

    <!-- 失败状态替换加载器，并通过 role=alert 主动通知辅助技术。 -->
    <div v-if="errorMessage" class="car-stage__error" role="alert">
      <strong>MODEL OFFLINE</strong>
      <span>{{ errorMessage }}</span>
    </div>

    <!-- 操作提示只在模型可交互后出现，不遮挡 Canvas 的拖拽区域。 -->
    <div v-if="isReady" class="car-stage__gesture" aria-hidden="true">
      <span class="car-stage__mouse"><i></i></span>
      <span>DRAG TO ORBIT · SCROLL PAGE</span>
    </div>
  </section>
</template>

<style lang="scss" scoped>
/* 舞台只负责可视区域和叠层裁切，外部定位由 CarShowcaseSection 控制。 */
.car-stage {
  position: relative;
  width: 100%;
  height: 100%;
  min-height: 520px;
  overflow: hidden;
}

/* viewport 铺满舞台并为桌面拖拽提供明确的 grab 光标反馈。 */
.car-stage__viewport {
  position: absolute;
  z-index: 3;
  inset: 0;
  cursor: grab;

  &:active {
    cursor: grabbing;
  }
}

/* Canvas 由 Three.js 动态插入，需要 deep 选择器才能应用 scoped 样式。 */
.car-stage__viewport :deep(.car-stage__canvas) {
  display: block;
  width: 100%;
  height: 100%;
  outline: 0;
  /* 纵向手势交给首页滚动，避免移动端进入车型区后无法继续下滑。 */
  touch-action: pan-y;
  will-change: transform, opacity;
}

/* 三层轨道是 DOM 装饰，不进入 WebGL 场景，因此可单独用 GSAP 低成本旋转。 */
.car-stage__orbit {
  position: absolute;
  z-index: 1;
  top: 50%;
  left: 50%;
  border: 1px solid rgb(180 220 255 / 11%);
  border-radius: 50%;
  transform: translate(-50%, -50%) rotateX(69deg);
  pointer-events: none;

  &::before,
  &::after {
    position: absolute;
    width: 7px;
    height: 7px;
    border: 1px solid rgb(210 240 255 / 70%);
    border-radius: 50%;
    background: #090c12;
    box-shadow: 0 0 18px rgb(151 208 255 / 55%);
    content: '';
  }

  &::before {
    top: 13%;
    left: 18%;
  }

  &::after {
    right: 12%;
    bottom: 20%;
  }
}

.car-stage__orbit--outer {
  width: min(76vw, 1050px);
  aspect-ratio: 1;
}

.car-stage__orbit--middle {
  width: min(60vw, 820px);
  aspect-ratio: 1;
  border-style: dashed;
}

.car-stage__orbit--inner {
  width: min(43vw, 590px);
  aspect-ratio: 1;
  border-color: rgb(213 255 75 / 18%);
}

/* 加载器和错误面板共享居中玻璃容器，确保模型未就绪时仍有明确反馈。 */
.car-stage__loader,
.car-stage__error {
  position: absolute;
  z-index: 6;
  top: 50%;
  left: 50%;
  width: min(360px, calc(100% - 48px));
  padding: 20px;
  border: 1px solid rgb(255 255 255 / 11%);
  background: rgb(7 10 15 / 82%);
  box-shadow: 0 24px 80px rgb(0 0 0 / 35%);
  backdrop-filter: blur(18px);
  transform: translate(-50%, -50%);
}

.car-stage__loader-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  color: rgb(226 237 244 / 68%);
  font-size: 10px;
  letter-spacing: 0.16em;

  strong {
    color: #d5ff4b;
    font-size: 12px;
  }
}

/* 进度条通过 scaleX 更新，避免频繁改变 width 触发布局计算。 */
.car-stage__loader-track {
  height: 2px;
  margin: 16px 0 12px;
  overflow: hidden;
  background: rgb(255 255 255 / 9%);

  i {
    display: block;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, #d5ff4b, #ffffff);
    box-shadow: 0 0 18px rgb(213 255 75 / 72%);
    transform-origin: left center;
    transition: transform 180ms ease-out;
  }
}

.car-stage__loader p {
  margin: 0;
  color: rgb(226 237 244 / 38%);
  font-size: 11px;
}

/* 错误状态以红色强调，但继续保留页面背景和后续滚动能力。 */
.car-stage__error {
  display: grid;
  gap: 8px;
  color: #ff8378;
  text-align: center;

  strong {
    font-size: 12px;
    letter-spacing: 0.18em;
  }

  span {
    color: rgb(255 255 255 / 58%);
    font-size: 12px;
  }
}

/* 操作提示位于 Canvas 上方但关闭指针事件，不会截获拖拽。 */
.car-stage__gesture {
  position: absolute;
  z-index: 5;
  bottom: 26px;
  left: 50%;
  display: flex;
  align-items: center;
  gap: 10px;
  color: rgb(230 239 245 / 44%);
  font-size: 9px;
  letter-spacing: 0.16em;
  pointer-events: none;
  transform: translateX(-50%);
}

/* 纯 CSS 鼠标图标说明拖拽操作，无需额外图片资源。 */
.car-stage__mouse {
  position: relative;
  width: 15px;
  height: 22px;
  border: 1px solid rgb(255 255 255 / 42%);
  border-radius: 8px;

  i {
    position: absolute;
    top: 4px;
    left: 50%;
    width: 2px;
    height: 4px;
    border-radius: 2px;
    background: #d5ff4b;
    transform: translateX(-50%);
  }
}

/* 窄屏缩小轨道和提示文案，避免遮挡底部车漆控制区。 */
@media (max-width: 900px) {
  .car-stage {
    min-height: 420px;
  }

  .car-stage__orbit--outer {
    width: 120vw;
  }

  .car-stage__orbit--middle {
    width: 94vw;
  }

  .car-stage__orbit--inner {
    width: 70vw;
  }
}

/* 减少动态效果时关闭提示图标的循环位移动画。 */
@media (prefers-reduced-motion: reduce) {
  .car-stage__loader-track i {
    transition: none;
  }
}
</style>
