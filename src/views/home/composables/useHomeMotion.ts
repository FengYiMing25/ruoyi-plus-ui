import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { onBeforeUnmount, onMounted, type Ref } from 'vue';

// ScrollTrigger 必须在创建任何滚动时间线前完成注册。
gsap.registerPlugin(ScrollTrigger);

const prefersReducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export function useHomeMotion(rootRef: Ref<HTMLElement | null>) {
  let context: gsap.Context | undefined;
  let orbSetters: { left: gsap.QuickToFunc; top: gsap.QuickToFunc } | undefined;

  // 鼠标光球只在首屏范围内跟随，使用 quickTo 避免高频 pointermove 反复创建 Tween。
  const handleHeroPointer = (event: PointerEvent) => {
    if (event.pointerType !== 'mouse' || prefersReducedMotion()) return;
    const root = rootRef.value;
    const hero = (event.target as HTMLElement).closest<HTMLElement>('.hero-section');
    const orb = root?.querySelector<HTMLElement>('.hero-section__cursor-orb');
    if (!hero || !orb) return;

    const bounds = hero.getBoundingClientRect();
    orbSetters ??= {
      left: gsap.quickTo(orb, 'left', { duration: 0.9, ease: 'power3.out' }),
      top: gsap.quickTo(orb, 'top', { duration: 0.9, ease: 'power3.out' })
    };
    orbSetters.left(event.clientX - bounds.left);
    orbSetters.top(event.clientY - bounds.top);
  };

  // 鼠标离开页面后让光球平滑回到首屏中心。
  const resetHeroPointer = () => {
    const root = rootRef.value;
    const orb = root?.querySelector<HTMLElement>('.hero-section__cursor-orb');
    const hero = root?.querySelector<HTMLElement>('.hero-section');
    if (!orb || !hero || !orbSetters || prefersReducedMotion()) return;
    orbSetters.left(hero.clientWidth / 2);
    orbSetters.top(hero.clientHeight / 2);
  };

  // 导航按钮定位到横向五章节的起点，原生平滑滚动也兼容无动画模式。
  const scrollToChapters = () => {
    rootRef.value?.querySelector('#system-chapters')?.scrollIntoView({ behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
  };

  onMounted(() => {
    const root = rootRef.value;
    if (!root) return;

    context = gsap.context(() => {
      const media = gsap.matchMedia();
      media.add(
        {
          reduceMotion: '(prefers-reduced-motion: reduce)',
          allowMotion: '(prefers-reduced-motion: no-preference)'
        },
        (matchContext) => {
          const { reduceMotion } = matchContext.conditions as { reduceMotion: boolean };
          if (reduceMotion) {
            // 减少动态效果时显示所有内容，并跳过固定和横向滚动转换。
            gsap.set(root.querySelectorAll('[data-hero-enter], .hero-letter, [data-manifesto-word], [data-architecture-row], [data-footer-title]'), {
              clearProps: 'all'
            });
            return;
          }

          // 首屏字符从遮罩下方错峰进入，背景轨道随后展开。
          gsap
            .timeline({ defaults: { ease: 'power4.out' } })
            .from('.hero-letter', { yPercent: 120, rotation: 8, autoAlpha: 0, duration: 0.9, stagger: 0.045 })
            .from('[data-hero-enter]', { y: 24, autoAlpha: 0, duration: 0.55, stagger: 0.09 }, '-=0.45')
            .from('.hero-section__orbit', { scale: 0.4, autoAlpha: 0, duration: 1.2, stagger: 0.12 }, '-=0.72');

          // 轨道与卫星的持续运动仅使用 transform，降低合成开销。
          gsap.to('.hero-section__orbit--inner', { rotation: 360, duration: 34, repeat: -1, ease: 'none' });
          gsap.to('.hero-section__satellite', {
            rotation: 360,
            // 以首屏圆环半径作为旋转原点，窗口变化后由函数重新计算。
            transformOrigin: () => `${Math.min(root.clientWidth * 0.36, 490)}px center`,
            duration: 18,
            repeat: -1,
            ease: 'none'
          });

          // 首屏元素随页面滚动产生不同速度的纵向视差。
          gsap.to('.hero-section__center', {
            yPercent: 34,
            autoAlpha: 0.12,
            ease: 'none',
            scrollTrigger: { trigger: '.hero-section', start: 'top top', end: 'bottom top', scrub: 0.8 }
          });
          gsap.to('.hero-section__orbit--outer', {
            scale: 1.25,
            rotation: 42,
            ease: 'none',
            scrollTrigger: { trigger: '.hero-section', start: 'top top', end: 'bottom top', scrub: 1 }
          });

          // 宣言文字逐行向上揭示，反向滚动时恢复初始状态。
          gsap.utils.toArray<HTMLElement>('[data-manifesto-word]').forEach((word) => {
            gsap.from(word, {
              y: 90,
              autoAlpha: 0,
              duration: 0.9,
              ease: 'power4.out',
              scrollTrigger: { trigger: word, start: 'top 88%', end: 'top 52%', scrub: 0.7 }
            });
          });

          const chaptersSection = root.querySelector<HTMLElement>('.chapters-section');
          const track = root.querySelector<HTMLElement>('.chapters-track');
          if (chaptersSection && track) {
            // 纵向滚动距离映射到轨道横移距离，固定元素本身不参与 transform。
            const horizontalTween = gsap.to(track, {
              x: () => -Math.max(0, track.scrollWidth - root.clientWidth),
              ease: 'none',
              scrollTrigger: {
                id: 'home-horizontal-chapters',
                trigger: chaptersSection,
                start: 'top top+=84',
                end: () => `+=${Math.max(root.clientWidth * 2.6, track.scrollWidth - root.clientWidth)}`,
                pin: true,
                scrub: 0.8,
                invalidateOnRefresh: true
              }
            });

            // 每个章节的圆环在横向经过视口时产生反向旋转，增强空间纵深。
            gsap.utils.toArray<HTMLElement>('.chapter-card__visual').forEach((visual) => {
              gsap.to(visual, {
                rotation: 120,
                ease: 'none',
                scrollTrigger: {
                  trigger: visual,
                  containerAnimation: horizontalTween,
                  start: 'left right',
                  end: 'right left',
                  scrub: true
                }
              });
            });
          }

          // 架构条目按进入视口的顺序批量揭示，避免为相同动画创建复杂时间线。
          ScrollTrigger.batch('[data-architecture-row]', {
            start: 'top 86%',
            once: true,
            onEnter: (rows) => gsap.fromTo(rows, { y: 54, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.7, stagger: 0.09, ease: 'power3.out' })
          });

          // 跑马灯使用无限 transform 循环，与滚动触发动画相互独立。
          gsap.to('.marquee-track', { xPercent: -50, duration: 28, repeat: -1, ease: 'none' });

          gsap.from('[data-footer-title]', {
            y: 100,
            autoAlpha: 0,
            duration: 1,
            ease: 'power4.out',
            scrollTrigger: { trigger: '[data-footer-title]', start: 'top 88%', toggleActions: 'play none none reverse' }
          });

          // 字体和布局稳定后刷新所有触发点，确保固定区间与横向距离准确。
          requestAnimationFrame(() => ScrollTrigger.refresh());
        }
      );
    }, root);
  });

  onBeforeUnmount(() => {
    // context.revert 会同时清理内部 Tween、Timeline 与 ScrollTrigger，避免路由切换后残留。
    context?.revert();
    ScrollTrigger.getById('home-horizontal-chapters')?.kill();
  });

  return { handleHeroPointer, resetHeroPointer, scrollToChapters };
}
