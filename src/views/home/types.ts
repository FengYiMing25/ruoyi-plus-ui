// 汽车配置器只暴露稳定的颜色标识，避免组件之间传递 Three.js 材质实例。
export type CarPaintId = 'aurora' | 'carmine' | 'glacier' | 'graphite' | 'cobalt' | 'carbon' | 'shiny';

// 预设镜头由父组件统一维护，3D 舞台只负责响应镜头状态。
export type CarCameraView = 'hero' | 'front' | 'side' | 'rear';

// 单个车漆同时包含界面显示值和 Three.js PBR 材质参数。
export interface CarPaintOption {
  /** 稳定标识用于 Vue key、当前选中状态和材质更新查找。 */
  id: CarPaintId;
  /** 面向用户展示的中文车漆名称。 */
  name: string;
  /** 控制面板使用的短代码。 */
  code: string;
  /** Three.js Color 使用的数值型十六进制颜色。 */
  hex: number;
  /** 色样按钮使用的 CSS 颜色字符串。 */
  cssColor: string;
  /** 涂装工艺说明，例如 Aurora pearl metallic。 */
  finish: string;
  /** PBR 金属度，范围为 0—1。 */
  metalness: number;
  /** PBR 粗糙度，范围为 0—1。 */
  roughness: number;
}

// 镜头预设只保存界面元数据，真实坐标集中定义在 useCarScene 中。
export interface CameraPreset {
  /** 与 CAMERA_POSES 对应的镜头标识。 */
  id: CarCameraView;
  /** 控制按钮显示的英文名称。 */
  label: string;
  /** 控制按钮显示的排序编号。 */
  index: string;
}
