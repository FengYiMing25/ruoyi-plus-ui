<script setup lang="ts">
import type { CameraPreset, CarCameraView, CarPaintId, CarPaintOption } from '../types';

// 控制面板仅接收可展示状态，保持为无 Three.js 依赖的纯 Vue 组件。
interface Props {
  /** 车漆色样和工艺说明列表。 */
  paints: readonly CarPaintOption[];
  /** 可点击的镜头预设元数据列表。 */
  cameraPresets: readonly CameraPreset[];
  /** 当前选中的车漆，用于色样高亮和详情展示。 */
  activePaint: CarPaintId;
  /** 当前选中的镜头，用于预设按钮高亮。 */
  activeView: CarCameraView;
  /** 自动旋转开关状态。 */
  autoRotate: boolean;
  /** 当前镜头缩放比例，用于按钮边界和百分比显示。 */
  zoomScale: number;
}

// 所有操作都向上发出语义化事件，由父组件决定如何更新业务状态。
interface Emits {
  /** 用户选择车漆，参数为目标车漆标识。 */
  selectPaint: [paintId: CarPaintId];
  /** 用户选择预设镜头，参数为目标视角标识。 */
  selectView: [view: CarCameraView];
  /** 用户切换自动旋转状态。 */
  toggleRotation: [];
  /** 用户请求拉近相机。 */
  zoomIn: [];
  /** 用户请求拉远相机。 */
  zoomOut: [];
}

defineProps<Props>();
const emit = defineEmits<Emits>();
</script>

<template>
  <div class="car-controls">
    <!-- 车漆面板使用真实色样作为主要点击目标，并公开当前选中状态给辅助技术。 -->
    <aside class="paint-panel" aria-label="选择车漆颜色">
      <header class="paint-panel__head">
        <span>EXTERIOR / PAINT</span>
        <strong>05 COLORS</strong>
      </header>

      <div class="paint-panel__colors">
        <!-- aria-pressed 与视觉选中态同步，键盘和读屏用户都能识别当前颜色。 -->
        <button
          v-for="paint in paints"
          :key="paint.id"
          class="paint-swatch"
          :class="{ 'is-active': paint.id === activePaint }"
          type="button"
          :aria-label="`选择${paint.name}`"
          :aria-pressed="paint.id === activePaint"
          @click="emit('selectPaint', paint.id)"
        >
          <i :style="{ backgroundColor: paint.cssColor }"></i>
          <span>{{ paint.code }}</span>
        </button>
      </div>

      <!-- 颜色切换频繁，v-show 保留节点并只控制可见性，aria-live 朗读最新选择。 -->
      <div v-for="paint in paints" v-show="paint.id === activePaint" :key="paint.id" class="paint-panel__active" aria-live="polite">
        <span>SELECTED FINISH</span>
        <strong>{{ paint.name }}</strong>
        <small>{{ paint.finish }}</small>
      </div>
    </aside>

    <!-- 镜头控制使用状态驱动而非直接操作子组件，保持 Props Down / Events Up。 -->
    <nav class="camera-dock" aria-label="3D 车型视角">
      <!-- 自动旋转开关与预设视角共用选中态语言，状态由父组件维护。 -->
      <button
        v-for="preset in cameraPresets"
        :key="preset.id"
        type="button"
        :class="{ 'is-active': preset.id === activeView }"
        :aria-pressed="preset.id === activeView"
        @click="emit('selectView', preset.id)"
      >
        <span>{{ preset.index }}</span>
        <strong>{{ preset.label }}</strong>
      </button>
      <i class="camera-dock__divider" aria-hidden="true"></i>
      <button
        class="camera-dock__rotation"
        type="button"
        :class="{ 'is-active': autoRotate }"
        :aria-pressed="autoRotate"
        @click="emit('toggleRotation')"
      >
        <span class="camera-dock__rotation-icon">↻</span>
        <strong>{{ autoRotate ? 'AUTO ON' : 'AUTO OFF' }}</strong>
      </button>
      <i class="camera-dock__divider" aria-hidden="true"></i>
      <!-- 缩放改用显式按钮，避免滚轮缩放阻断长页面的自然滚动。 -->
      <div class="camera-dock__zoom-group" role="group" aria-label="缩放 3D 车型">
        <button class="camera-dock__zoom" type="button" aria-label="放大车型" title="放大车型" :disabled="zoomScale <= 0.72" @click="emit('zoomIn')">
          ＋
        </button>
        <span class="camera-dock__zoom-value" aria-live="polite">{{ Math.round(100 / zoomScale) }}%</span>
        <button class="camera-dock__zoom" type="button" aria-label="缩小车型" title="缩小车型" :disabled="zoomScale >= 1.28" @click="emit('zoomOut')">
          −
        </button>
      </div>
    </nav>
  </div>
</template>

<style lang="scss" scoped>
/* 外层不截获 Canvas 手势，只让真正可操作的两个面板响应指针。 */
.car-controls {
  pointer-events: none;
}

.paint-panel,
.camera-dock {
  pointer-events: auto;
}

/* 车漆面板悬浮在车型右侧，玻璃背景保留后方车身轮廓。 */
.paint-panel {
  position: absolute;
  z-index: 8;
  top: 50%;
  right: clamp(22px, 3.1vw, 54px);
  width: 188px;
  padding: 18px;
  border: 1px solid rgb(255 255 255 / 10%);
  background: linear-gradient(150deg, rgb(18 23 31 / 76%), rgb(7 10 15 / 52%));
  box-shadow: 0 24px 80px rgb(0 0 0 / 28%);
  backdrop-filter: blur(18px);
  transform: translateY(-50%);
}

.paint-panel__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-bottom: 14px;
  border-bottom: 1px solid rgb(255 255 255 / 8%);
  color: rgb(235 242 247 / 46%);
  font-size: 8px;
  letter-spacing: 0.13em;

  strong {
    color: #d5ff4b;
    font-size: 8px;
    font-weight: 600;
  }
}

/* 色样根据数据数量自动排布，按钮本身保持无背景的紧凑圆点形态。 */
.paint-panel__colors {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 8px;
  margin: 18px 0;
}

/* 色样的放大、外环和焦点样式同时覆盖鼠标与键盘操作。 */
.paint-swatch {
  display: grid;
  justify-items: center;
  gap: 7px;
  padding: 0;
  border: 0;
  color: rgb(235 242 247 / 34%);
  background: transparent;
  cursor: pointer;

  i {
    position: relative;
    display: block;
    width: 22px;
    height: 22px;
    border: 1px solid rgb(255 255 255 / 20%);
    border-radius: 50%;
    box-shadow: inset 0 0 0 3px rgb(255 255 255 / 8%);
    transition:
      transform 220ms ease,
      box-shadow 220ms ease;

    &::after {
      position: absolute;
      inset: -5px;
      border: 1px solid transparent;
      border-radius: 50%;
      content: '';
      transition: border-color 220ms ease;
    }
  }

  span {
    font-size: 7px;
    letter-spacing: 0.06em;
  }

  &:hover i,
  &:focus-visible i {
    transform: scale(1.14);
  }

  &:focus-visible {
    outline: 1px solid #d5ff4b;
    outline-offset: 5px;
  }

  &.is-active {
    color: #f3f6f8;

    i {
      box-shadow:
        inset 0 0 0 3px rgb(255 255 255 / 18%),
        0 0 22px color-mix(in srgb, currentColor 18%, transparent);

      &::after {
        border-color: rgb(255 255 255 / 66%);
      }
    }
  }
}

/* 当前涂装信息预留固定高度，切换颜色时面板不会上下跳动。 */
.paint-panel__active {
  display: grid;
  gap: 5px;
  min-height: 58px;

  span {
    color: rgb(235 242 247 / 34%);
    font-size: 8px;
    letter-spacing: 0.13em;
  }

  strong {
    color: #f3f6f8;
    font-family: 'Avenir Next Condensed', 'DIN Condensed', 'PingFang SC', sans-serif;
    font-size: 18px;
    font-weight: 500;
    letter-spacing: 0.04em;
  }

  small {
    color: rgb(235 242 247 / 42%);
    font-size: 9px;
  }
}

/* 底部镜头坞集中视角、旋转和缩放操作，宽屏时保持水平居中。 */
.camera-dock {
  position: absolute;
  z-index: 9;
  bottom: 30px;
  left: 50%;
  display: flex;
  align-items: stretch;
  min-height: 54px;
  padding: 6px;
  border: 1px solid rgb(255 255 255 / 11%);
  background: rgb(7 10 15 / 76%);
  box-shadow: 0 18px 60px rgb(0 0 0 / 38%);
  backdrop-filter: blur(20px);
  transform: translateX(-50%);

  button {
    display: grid;
    grid-template-columns: auto auto;
    align-items: center;
    gap: 8px;
    min-width: 88px;
    padding: 0 13px;
    border: 0;
    color: rgb(235 242 247 / 40%);
    background: transparent;
    cursor: pointer;
    transition:
      color 220ms ease,
      background-color 220ms ease,
      transform 220ms ease;

    span {
      font-size: 8px;
      letter-spacing: 0.08em;
    }

    strong {
      font-size: 9px;
      font-weight: 500;
      letter-spacing: 0.12em;
      white-space: nowrap;
    }

    &:hover,
    &:focus-visible {
      color: #ffffff;
      background: rgb(255 255 255 / 5%);
    }

    &:active {
      transform: scale(0.96);
    }

    &:focus-visible {
      outline: 1px solid #d5ff4b;
      outline-offset: -2px;
    }

    &.is-active {
      color: #071008;
      background: #d5ff4b;
    }
  }
}

/* 分隔线只建立功能分组，不参与辅助技术的导航顺序。 */
.camera-dock__divider {
  width: 1px;
  margin: 7px 5px;
  background: rgb(255 255 255 / 10%);
}

.camera-dock .camera-dock__rotation {
  min-width: 100px;
}

.camera-dock__rotation-icon {
  font-size: 16px !important;
}

/* 缩放组由两个按钮和只读百分比组成，三列宽度固定以避免数值抖动。 */
.camera-dock__zoom-group {
  display: grid;
  grid-template-columns: 38px 44px 38px;
  align-items: stretch;
}

/* 覆盖镜头预设按钮的通用宽度，让缩放控件在桌面与移动端都保持紧凑。 */
.camera-dock .camera-dock__zoom {
  display: grid;
  min-width: 38px;
  padding: 0;
  place-items: center;
  color: rgb(235 242 247 / 72%);
  font-size: 19px;
  line-height: 1;

  &:disabled {
    color: rgb(235 242 247 / 18%);
    cursor: not-allowed;
    transform: none;
  }
}

.camera-dock__zoom-value {
  display: grid;
  place-items: center;
  color: rgb(235 242 247 / 46%);
  font-size: 8px;
  letter-spacing: 0.06em;
  pointer-events: none;
}

/* 中等屏幕把色板移到右上角，避开车型主体的视觉中心。 */
@media (max-width: 1100px) {
  .paint-panel {
    top: 112px;
    right: 20px;
    transform: none;
  }
}

/* 手机端将色板和镜头坞贴近底部，并允许镜头按钮横向滚动。 */
@media (max-width: 760px) {
  .paint-panel {
    top: auto;
    right: 16px;
    bottom: 98px;
    left: 16px;
    width: auto;
    padding: 12px 14px;
  }

  .paint-panel__head,
  .paint-panel__active small {
    display: none;
  }

  .paint-panel__colors {
    float: right;
    width: 184px;
    margin: 5px 0 0 12px;
  }

  .paint-panel__active {
    min-height: 42px;
  }

  .camera-dock {
    right: 16px;
    bottom: 26px;
    left: 16px;
    overflow-x: auto;
    transform: none;

    button {
      min-width: 76px;
      padding: 0 10px;
    }

    /* 移动端仍覆盖通用按钮尺寸，避免缩放按钮被媒体查询再次撑宽。 */
    .camera-dock__zoom {
      min-width: 38px;
      padding: 0;
    }
  }
}

/* 减少动态效果时移除按钮与色样的 CSS 过渡。 */
@media (prefers-reduced-motion: reduce) {
  .paint-swatch i,
  .paint-swatch i::after,
  .camera-dock button {
    transition: none;
  }
}
</style>
