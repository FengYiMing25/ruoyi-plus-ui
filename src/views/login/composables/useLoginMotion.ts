import { gsap } from 'gsap';
import { onBeforeUnmount, onMounted, watch, type Ref } from 'vue';

interface UseLoginMotionOptions {
  root?: Ref<HTMLElement | null>;
  loading?: Ref<boolean>;
  entry?: boolean;
}

const prefersReducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export function useLoginMotion(options: UseLoginMotionOptions = {}) {
  let media: gsap.MatchMedia | undefined;
  let spinnerTween: gsap.core.Tween | undefined;
  // 缓存 quickTo setter，避免 pointermove 高频触发时重复创建 Tween。
  const parallaxSetters = new WeakMap<HTMLElement, { x: gsap.QuickToFunc; y: gsap.QuickToFunc }>();
  const letterSetters = new WeakMap<HTMLElement, { y: gsap.QuickToFunc; rotation: gsap.QuickToFunc; scale: gsap.QuickToFunc }>();
  let spotlightSetters: { left: gsap.QuickToFunc; top: gsap.QuickToFunc } | undefined;

  const animateEntry = () => {
    const root = options.root?.value;
    if (!root) return;

    media = gsap.matchMedia();
    media.add(
      {
        reduceMotion: '(prefers-reduced-motion: reduce)',
        allowMotion: '(prefers-reduced-motion: no-preference)'
      },
      (context) => {
        const { reduceMotion } = context.conditions as { reduceMotion: boolean };
        if (reduceMotion) {
          gsap.set('[data-login-enter]', { autoAlpha: 1, y: 0, x: 0, scale: 1 });
          return;
        }

        const timeline = gsap.timeline({ defaults: { ease: 'power3.out' } });
        timeline
          .addLabel('showcase')
          .from('.login-showcase', { autoAlpha: 0, x: -42, duration: 0.85 }, 'showcase')
          .from('[data-showcase-enter]', { autoAlpha: 0, y: 28, duration: 0.65, stagger: 0.08 }, 'showcase+=0.4')
          // 主标题字符从遮罩下方随机错峰弹出，参考 GSAP 官网首屏的拆字节奏。
          .from(
            '.login-showcase__letter',
            {
              autoAlpha: 0,
              yPercent: 120,
              rotation: 10,
              duration: 0.72,
              stagger: { each: 0.032, from: 'random' },
              ease: 'back.out(1.7)'
            },
            'showcase+=0.48'
          )
          .addLabel('form', 'showcase+=0.2')
          .from('.login-panel', { autoAlpha: 0, x: 48, duration: 0.8 }, 'form')
          .from('[data-login-enter]', { autoAlpha: 0, y: 20, duration: 0.5, stagger: 0.055 }, 'form+=0.35')
          // 欢迎文字使用更轻快的回弹节奏，与左侧大标题形成主次层级。
          .from(
            '.welcome-letter',
            {
              autoAlpha: 0,
              yPercent: 110,
              rotation: (index) => (index % 2 === 0 ? -8 : 8),
              duration: 0.48,
              stagger: 0.045,
              ease: 'back.out(2.4)'
            },
            'form+=0.46'
          );

        gsap.to('.login-showcase__orbit', {
          rotation: 360,
          duration: 30,
          repeat: -1,
          ease: 'none',
          transformOrigin: 'center'
        });
        gsap.to('.login-showcase__pulse', {
          scale: 1.08,
          opacity: 0.45,
          duration: 2.4,
          repeat: -1,
          yoyo: true,
          ease: 'sine.inOut'
        });
        gsap.to('.login-showcase__scan', {
          x: () => (root.querySelector('.login-showcase')?.clientWidth ?? 900) * 1.7,
          y: 180,
          duration: 7,
          repeat: -1,
          repeatDelay: 1.5,
          ease: 'power1.inOut'
        });
      },
      root
    );
  };

  const animateFieldFocus = (event: FocusEvent) => {
    if (prefersReducedMotion()) return;
    const field = event.currentTarget as HTMLElement;
    gsap.to(field, { y: -2, duration: 0.22, ease: 'power2.out', overwrite: 'auto' });
    gsap.to(field.querySelector('.field-accent'), { scaleX: 1, duration: 0.3, ease: 'power2.out', overwrite: 'auto' });
    // 图标点头并弹出两颗星点，让输入反馈更亲和。
    gsap.fromTo(
      field.querySelector('.login-field__icon'),
      { rotation: -12, scale: 0.8 },
      { rotation: 0, scale: 1.12, duration: 0.42, ease: 'back.out(3)' }
    );
    gsap.fromTo(
      field.querySelectorAll('.field-spark'),
      { autoAlpha: 0, x: 0, y: 6, scale: 0 },
      {
        autoAlpha: 1,
        x: (index) => (index === 0 ? 13 : -8),
        y: (index) => (index === 0 ? -12 : -19),
        scale: 1,
        duration: 0.4,
        stagger: 0.05,
        ease: 'back.out(2.8)'
      }
    );
  };

  const animateFieldBlur = (event: FocusEvent) => {
    if (prefersReducedMotion()) return;
    const field = event.currentTarget as HTMLElement;
    if (field.contains(document.activeElement)) return;
    gsap.to(field, { y: 0, duration: 0.24, ease: 'power2.out', overwrite: 'auto' });
    gsap.to(field.querySelector('.field-accent'), { scaleX: 0, duration: 0.24, ease: 'power2.out', overwrite: 'auto' });
    gsap.to(field.querySelector('.login-field__icon'), { rotation: 0, scale: 1, duration: 0.25, overwrite: 'auto' });
    gsap.to(field.querySelectorAll('.field-spark'), { autoAlpha: 0, y: 0, scale: 0, duration: 0.2, stagger: 0.025, overwrite: 'auto' });
  };

  const animateHover = (event: MouseEvent | FocusEvent, distance = -3) => {
    if (prefersReducedMotion()) return;
    gsap.to(event.currentTarget, { y: distance, scale: 1.015, duration: 0.2, ease: 'power2.out', overwrite: 'auto' });
  };

  const animateRest = (event: MouseEvent | FocusEvent) => {
    if (prefersReducedMotion()) return;
    gsap.to(event.currentTarget, { y: 0, scale: 1, duration: 0.24, ease: 'power2.out', overwrite: 'auto' });
  };

  const animatePress = (event: MouseEvent) => {
    if (prefersReducedMotion()) return;
    gsap.to(event.currentTarget, { y: 1, scale: 0.975, duration: 0.1, ease: 'power2.out', overwrite: 'auto' });
  };

  // 登录与注册切换时只让新表单回弹入场，左侧展示区保持稳定。
  const animateAuthSwitch = () => {
    const card = options.root?.value?.querySelector('.login-card');
    if (!card || prefersReducedMotion()) return;
    const timeline = gsap.timeline({ defaults: { ease: 'back.out(1.8)' } });
    timeline
      .fromTo(card, { autoAlpha: 0, x: 34, scale: 0.985 }, { autoAlpha: 1, x: 0, scale: 1, duration: 0.48 })
      .fromTo(
        card.querySelectorAll('.welcome-letter'),
        { yPercent: 110, rotation: -7 },
        { yPercent: 0, rotation: 0, duration: 0.42, stagger: 0.04 },
        '<0.08'
      )
      .fromTo(card.querySelectorAll('.login-field'), { autoAlpha: 0, y: 14 }, { autoAlpha: 1, y: 0, duration: 0.35, stagger: 0.045 }, '<0.08');
  };

  // 登录按钮悬停时使用轻微果冻形变，并让箭头向前探出。
  const animateSubmitHover = (event: MouseEvent | FocusEvent) => {
    if (prefersReducedMotion()) return;
    const button = event.currentTarget as HTMLElement;
    gsap.to(button, { y: -3, scaleX: 1.012, scaleY: 0.988, duration: 0.28, ease: 'back.out(2)', overwrite: 'auto' });
    gsap.to(button.querySelector('.login-submit__action'), {
      x: -2,
      rotation: 5,
      scale: 1.06,
      duration: 0.3,
      ease: 'back.out(2.5)',
      overwrite: 'auto'
    });
  };

  // 离开按钮后恢复尺寸，避免 hover 与 press 动画残留。
  const animateSubmitLeave = (event: MouseEvent | FocusEvent) => {
    if (prefersReducedMotion()) return;
    const button = event.currentTarget as HTMLElement;
    gsap.to(button, { y: 0, scaleX: 1, scaleY: 1, duration: 0.34, ease: 'elastic.out(1, 0.5)', overwrite: 'auto' });
    gsap.to(button.querySelector('.login-submit__action'), { x: 0, rotation: 0, scale: 1, duration: 0.3, ease: 'power2.out', overwrite: 'auto' });
  };

  // 按下时先压扁按钮，制造柔软按键的触感。
  const animateSubmitPress = (event: MouseEvent) => {
    if (prefersReducedMotion()) return;
    gsap.to(event.currentTarget, { y: 1, scaleX: 1.025, scaleY: 0.92, duration: 0.1, ease: 'power2.in', overwrite: 'auto' });
  };

  // 点击位置生成扩散涟漪，同时让按钮文字逐字跳起再回落。
  const animateSubmitClick = (event: MouseEvent) => {
    if (prefersReducedMotion()) return;
    const button = event.currentTarget as HTMLElement;
    const bounds = button.getBoundingClientRect();
    const ripple = button.querySelector<HTMLElement>('.login-submit__ripple');
    if (ripple) {
      gsap.set(ripple, { left: event.clientX - bounds.left, top: event.clientY - bounds.top });
      gsap.fromTo(ripple, { autoAlpha: 0.38, scale: 0 }, { autoAlpha: 0, scale: 16, duration: 0.72, ease: 'power2.out' });
    }
    const letters = button.querySelectorAll('.login-submit__letter');
    gsap
      .timeline()
      .to(letters, { y: -7, rotation: (index) => (index % 2 === 0 ? -7 : 7), duration: 0.16, stagger: 0.035, ease: 'back.out(3)' })
      .to(letters, { y: 0, rotation: 0, duration: 0.32, stagger: 0.025, ease: 'bounce.out' }, '<0.08');
  };

  const getLetterSetters = (letter: HTMLElement) => {
    const cached = letterSetters.get(letter);
    if (cached) return cached;
    const setters = {
      y: gsap.quickTo(letter, 'y', { duration: 0.38, ease: 'power3.out' }),
      rotation: gsap.quickTo(letter, 'rotation', { duration: 0.42, ease: 'power3.out' }),
      scale: gsap.quickTo(letter, 'scale', { duration: 0.35, ease: 'power3.out' })
    };
    letterSetters.set(letter, setters);
    return setters;
  };

  // 根据鼠标与字符中心的距离计算影响范围，实现局部字符磁吸而非整行统一移动。
  const animateHeadlinePointer = (event: PointerEvent) => {
    if (event.pointerType !== 'mouse' || prefersReducedMotion()) return;
    const headline = event.currentTarget as HTMLElement;
    headline.querySelectorAll<HTMLElement>('.login-showcase__letter').forEach((letter) => {
      const bounds = letter.getBoundingClientRect();
      const distance = Math.hypot(event.clientX - (bounds.left + bounds.width / 2), event.clientY - (bounds.top + bounds.height / 2));
      const influence = Math.max(0, 1 - distance / 105);
      const direction = event.clientX < bounds.left + bounds.width / 2 ? -1 : 1;
      const setters = getLetterSetters(letter);
      setters.y(-13 * influence);
      setters.rotation(5 * influence * direction);
      setters.scale(1 + 0.08 * influence);
    });
  };

  // 鼠标离开标题后让每个字符平滑回到排版基线。
  const animateHeadlineLeave = (event: PointerEvent) => {
    if (prefersReducedMotion()) return;
    const headline = event.currentTarget as HTMLElement;
    headline.querySelectorAll<HTMLElement>('.login-showcase__letter').forEach((letter) => {
      const setters = getLetterSetters(letter);
      setters.y(0);
      setters.rotation(0);
      setters.scale(1);
    });
  };

  const animateDataEnter = (event: MouseEvent) => {
    if (prefersReducedMotion()) return;
    const card = event.currentTarget as HTMLElement;
    const otherCards = options.root?.value?.querySelectorAll<HTMLElement>('.data-card');
    gsap.to(card, { y: -7, scale: 1.025, duration: 0.35, ease: 'power3.out', overwrite: 'auto' });
    gsap.to(card.querySelectorAll('.data-card__trace span'), {
      scaleY: 1.35,
      duration: 0.32,
      stagger: 0.025,
      ease: 'back.out(2)',
      overwrite: 'auto'
    });
    gsap.to(card.querySelector('.data-card__edge'), { xPercent: 200, autoAlpha: 1, duration: 0.65, ease: 'power2.out', overwrite: 'auto' });
    if (otherCards) {
      gsap.to(
        [...otherCards].filter((item) => item !== card),
        { opacity: 0.48, duration: 0.25, overwrite: 'auto' }
      );
    }
  };

  const animateDataLeave = (event: MouseEvent) => {
    if (prefersReducedMotion()) return;
    const card = event.currentTarget as HTMLElement;
    gsap.to(card, { y: 0, scale: 1, duration: 0.4, ease: 'power3.out', overwrite: 'auto' });
    gsap.to(card.querySelectorAll('.data-card__trace span'), { scaleY: 1, duration: 0.3, stagger: 0.02, overwrite: 'auto' });
    gsap.set(card.querySelector('.data-card__edge'), { xPercent: 0, autoAlpha: 0 });
    const cards = options.root?.value?.querySelectorAll('.data-card');
    if (cards) gsap.to(cards, { opacity: 1, duration: 0.3, overwrite: 'auto' });
  };

  const getParallaxSetters = (element: HTMLElement) => {
    const cached = parallaxSetters.get(element);
    if (cached) return cached;
    const setters = {
      x: gsap.quickTo(element, 'x', { duration: 0.65, ease: 'power3.out' }),
      y: gsap.quickTo(element, 'y', { duration: 0.65, ease: 'power3.out' })
    };
    parallaxSetters.set(element, setters);
    return setters;
  };

  const animateShowcasePointer = (event: PointerEvent) => {
    const root = options.root?.value;
    if (!root || event.pointerType !== 'mouse' || prefersReducedMotion()) return;
    const bounds = root.getBoundingClientRect();
    const horizontal = (event.clientX - bounds.left) / bounds.width - 0.5;
    const vertical = (event.clientY - bounds.top) / bounds.height - 0.5;

    const spotlight = root.querySelector<HTMLElement>('.login-showcase__spotlight');
    if (spotlight) {
      spotlightSetters ??= {
        left: gsap.quickTo(spotlight, 'left', { duration: 0.8, ease: 'power3.out' }),
        top: gsap.quickTo(spotlight, 'top', { duration: 0.8, ease: 'power3.out' })
      };
      spotlightSetters.left(event.clientX - bounds.left);
      spotlightSetters.top(event.clientY - bounds.top);
    }

    root.querySelectorAll<HTMLElement>('[data-parallax]').forEach((element) => {
      const depth = Number(element.dataset.parallax ?? 0);
      const setters = getParallaxSetters(element);
      setters.x(horizontal * depth);
      setters.y(vertical * depth);
    });
  };

  const animateShowcaseLeave = () => {
    const root = options.root?.value;
    if (!root || prefersReducedMotion()) return;
    root.querySelectorAll<HTMLElement>('[data-parallax]').forEach((element) => {
      const setters = getParallaxSetters(element);
      setters.x(0);
      setters.y(0);
    });
    const spotlight = root.querySelector<HTMLElement>('.login-showcase__spotlight');
    if (spotlight && spotlightSetters) {
      spotlightSetters.left(root.clientWidth / 2);
      spotlightSetters.top(root.clientHeight / 2);
    }
  };

  const animateCaptcha = (target: HTMLElement) => {
    if (prefersReducedMotion()) return;
    gsap.fromTo(target, { rotation: -2, scale: 0.96 }, { rotation: 0, scale: 1, duration: 0.45, ease: 'back.out(2)' });
  };

  const animateError = () => {
    const card = options.root?.value?.querySelector('.login-card');
    if (!card || prefersReducedMotion()) return;
    // 校验失败采用轻微“摇头”加回弹，避免传统剧烈抖动显得生硬。
    gsap.fromTo(
      card,
      { x: 0, rotation: 0 },
      {
        x: 0,
        rotation: 0,
        duration: 0.55,
        ease: 'elastic.out(1, 0.35)',
        keyframes: [
          { x: -7, rotation: -0.6 },
          { x: 7, rotation: 0.6 },
          { x: 0, rotation: 0 }
        ]
      }
    );
  };

  const animateSuccess = async () => {
    const panel = options.root?.value?.querySelector('.login-card');
    if (!panel || prefersReducedMotion()) return;
    await gsap.to(panel, { autoAlpha: 0, y: -18, scale: 0.985, duration: 0.38, ease: 'power2.in' });
  };

  const syncLoadingAnimation = (loading: boolean) => {
    const spinner = options.root?.value?.querySelector('.submit-spinner');
    spinnerTween?.kill();
    spinnerTween = undefined;
    if (!spinner || !loading || prefersReducedMotion()) return;
    spinnerTween = gsap.to(spinner, { rotation: 360, duration: 0.8, repeat: -1, ease: 'none' });
  };

  if (options.entry !== false) {
    onMounted(animateEntry);
  }

  if (options.loading) {
    watch(options.loading, syncLoadingAnimation, { flush: 'post' });
  }

  onBeforeUnmount(() => {
    spinnerTween?.kill();
    media?.revert();
    const root = options.root?.value;
    if (root) gsap.killTweensOf(root.querySelectorAll('*'));
  });

  return {
    animateCaptcha,
    animateAuthSwitch,
    animateDataEnter,
    animateDataLeave,
    animateError,
    animateFieldBlur,
    animateFieldFocus,
    animateHeadlineLeave,
    animateHeadlinePointer,
    animateHover,
    animatePress,
    animateRest,
    animateShowcaseLeave,
    animateShowcasePointer,
    animateSubmitClick,
    animateSubmitHover,
    animateSubmitLeave,
    animateSubmitPress,
    animateSuccess
  };
}
