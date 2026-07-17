import { gsap } from 'gsap';
import { onBeforeUnmount, onMounted, type Ref } from 'vue';

const prefersReducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// 组件内只管理模型揭示和操作反馈，页面级滚动动画仍由首页 composable 统一编排。
export function useCarShowcaseFeedback(rootRef: Readonly<Ref<HTMLElement | null>>) {
  // 保存 Tween 引用后可在重复操作和组件卸载时主动终止旧动画。
  let revealTween: gsap.core.Tween | undefined;
  let selectionTween: gsap.core.Tween | undefined;

  // 模型加载完成后让 Canvas 从轻微缩小和透明状态恢复到正常展示状态。
  const revealModel = () => {
    const canvas = rootRef.value?.querySelector<HTMLElement>('.car-stage__canvas');
    if (!canvas) return;
    revealTween?.kill();
    revealTween = gsap.to(canvas, {
      autoAlpha: 1,
      scale: 1,
      duration: prefersReducedMotion() ? 0 : 1.2,
      ease: 'power4.out',
      clearProps: 'visibility'
    });
  };

  // 任意配置操作触发一次扫描环扩散，为状态变化提供统一的即时反馈。
  const pulseSelection = () => {
    const pulse = rootRef.value?.querySelector<HTMLElement>('[data-car-selection-pulse]');
    if (!pulse || prefersReducedMotion()) return;
    selectionTween?.kill();
    selectionTween = gsap.fromTo(
      pulse,
      { scale: 0.2, autoAlpha: 0.55 },
      { scale: 1.8, autoAlpha: 0, duration: 0.85, ease: 'power2.out', overwrite: true }
    );
  };

  // 只有挂载后 Three.js Canvas 才可能存在，因此初始可见性也在生命周期内设置。
  onMounted(() => {
    const canvas = rootRef.value?.querySelector<HTMLElement>('.car-stage__canvas');
    if (!canvas) return;
    // 首次装载先隐藏 Canvas，防止展台或半成品模型在加载层下闪现。
    gsap.set(canvas, { autoAlpha: prefersReducedMotion() ? 1 : 0, scale: prefersReducedMotion() ? 1 : 0.94, transformOrigin: '50% 60%' });
  });

  // 清理独立 Tween，防止动画继续写入已经销毁的 Canvas 或反馈环。
  onBeforeUnmount(() => {
    revealTween?.kill();
    selectionTween?.kill();
  });

  // 只暴露两个语义化动作，调用方无需了解内部 DOM 选择器和 GSAP 配置。
  return { revealModel, pulseSelection };
}
