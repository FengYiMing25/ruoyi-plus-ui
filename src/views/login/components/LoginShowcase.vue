<script setup lang="ts">
import { computed, useTemplateRef } from 'vue';
import { useLoginMotion } from '../composables/useLoginMotion';

interface Props {
  eyebrow: string;
  headline: string;
  description: string;
  points: string[];
}

interface HeadlineToken {
  key: string;
  space: boolean;
  characters: Array<{ character: string; index: number }>;
}

const props = defineProps<Props>();

// 将英文按单词、中文按单字拆分：既能实现逐字动画，也避免英文单词被错误断行。
const headlineTokens = computed<HeadlineToken[]>(() => {
  let characterIndex = 0;
  const tokens = props.headline.match(/[A-Za-z0-9]+|\s+|[^A-Za-z0-9\s]/gu) ?? [];
  return tokens.map((token, tokenIndex): HeadlineToken => {
    // 使用字符串迭代器保留完整 Unicode 字符，避免中文或 emoji 被拆成无效编码。
    const characters = [...token].map((character) => ({ character, index: characterIndex++ }));
    return {
      key: `${token}-${tokenIndex}`,
      space: /^\s+$/u.test(token),
      characters
    };
  });
});

// 单独强调标点，让逐字弹出后的停顿位置更有视觉节奏。
const isAccentCharacter = (character: string) => /[，。,.]/u.test(character);

// 登录页展示用的实时运营指标，配合 GSAP 悬停动画营造数据中枢氛围。
const metrics = [
  { label: 'ACTIVE NODES', value: '128', delta: '+12.4%', trace: [28, 42, 36, 58, 48, 74, 86] },
  { label: 'AVG LATENCY', value: '18ms', delta: '-08.2%', trace: [78, 64, 70, 52, 58, 38, 30] },
  { label: 'AVAILABILITY', value: '99.98', delta: 'STABLE', trace: [58, 62, 60, 72, 68, 82, 88] }
];

const showcaseRef = useTemplateRef<HTMLElement>('showcaseRef');
const {
  animateDataEnter,
  animateDataLeave,
  animateHeadlineLeave,
  animateHeadlinePointer,
  animateHover,
  animateRest,
  animateShowcaseLeave,
  animateShowcasePointer
} = useLoginMotion({ root: showcaseRef, entry: false });
</script>

<template>
  <aside ref="showcaseRef" class="login-showcase" aria-hidden="true" @pointermove="animateShowcasePointer" @pointerleave="animateShowcaseLeave">
    <div class="login-showcase__grid" data-parallax="-7"></div>
    <div class="login-showcase__spotlight"></div>
    <div class="login-showcase__scan"></div>
    <div class="login-showcase__monogram" data-parallax="18">RY</div>

    <div class="login-showcase__brand" data-showcase-enter>
      <span class="login-showcase__brand-mark" @mouseenter="animateHover" @mouseleave="animateRest">R+</span>
      <span>RUOYI / OPERATIONS</span>
    </div>

    <div class="login-showcase__copy" data-parallax="7">
      <p class="login-showcase__eyebrow" data-showcase-enter>{{ eyebrow }}</p>
      <!-- 标题使用双层 span 裁切字符，形成类似 GSAP 官网的逐字弹出效果。 -->
      <h1 class="login-showcase__headline" :aria-label="headline" @pointermove="animateHeadlinePointer" @pointerleave="animateHeadlineLeave">
        <span
          v-for="token in headlineTokens"
          :key="token.key"
          class="login-showcase__headline-token"
          :class="{ 'is-space': token.space }"
          aria-hidden="true"
        >
          <span v-for="item in token.characters" :key="item.index" class="login-showcase__letter-mask">
            <span class="login-showcase__letter" :class="{ 'is-accent': isAccentCharacter(item.character) }">{{ item.character }}</span>
          </span>
        </span>
      </h1>
      <p class="login-showcase__description" data-showcase-enter>{{ description }}</p>

      <!-- 指标卡通过鼠标悬停联动柱状图、能量扫描线及相邻卡片透明度。 -->
      <div class="login-showcase__metrics" data-showcase-enter data-parallax="10">
        <article v-for="metric in metrics" :key="metric.label" class="data-card" @mouseenter="animateDataEnter" @mouseleave="animateDataLeave">
          <div class="data-card__header">
            <span>{{ metric.label }}</span>
            <i></i>
          </div>
          <strong>{{ metric.value }}</strong>
          <div class="data-card__footer">
            <div class="data-card__trace">
              <span v-for="(height, index) in metric.trace" :key="index" :style="{ height: `${height}%` }"></span>
            </div>
            <em>{{ metric.delta }}</em>
          </div>
          <span class="data-card__edge"></span>
        </article>
      </div>
    </div>

    <div class="login-showcase__system" data-showcase-enter>
      <div class="login-showcase__radar" data-parallax="14" @mouseenter="animateHover" @mouseleave="animateRest">
        <div class="login-showcase__pulse"></div>
        <div class="login-showcase__orbit">
          <span class="login-showcase__satellite login-showcase__satellite--one"></span>
          <span class="login-showcase__satellite login-showcase__satellite--two"></span>
          <span class="login-showcase__satellite login-showcase__satellite--three"></span>
        </div>
        <span class="login-showcase__core">05</span>
      </div>

      <ul class="login-showcase__points" data-parallax="5">
        <li v-for="(point, index) in points" :key="point" @mouseenter="animateHover" @mouseleave="animateRest">
          <span>0{{ index + 1 }}</span>
          {{ point }}
        </li>
      </ul>
    </div>

    <div class="login-showcase__status" data-showcase-enter>
      <span class="login-showcase__status-dot"></span>
      SYSTEM ONLINE
      <span>CN / 2026</span>
    </div>
  </aside>
</template>

<style lang="scss" scoped>
.login-showcase {
  position: relative;
  display: flex;
  min-height: 100%;
  overflow: hidden;
  flex-direction: column;
  justify-content: space-between;
  padding: clamp(32px, 5vw, 72px);
  color: #f2f5ed;
  background: #071c22;
  isolation: isolate;
  perspective: 900px;
}

.login-showcase__grid {
  position: absolute;
  z-index: -3;
  inset: 0;
  opacity: 0.28;
  background-image:
    linear-gradient(rgba(175, 255, 225, 0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(175, 255, 225, 0.08) 1px, transparent 1px);
  background-size: 48px 48px;
  mask-image: linear-gradient(to bottom right, #000 18%, transparent 82%);
  will-change: transform;
}

.login-showcase__spotlight {
  position: absolute;
  z-index: -2;
  width: 420px;
  height: 420px;
  border-radius: 50%;
  opacity: 0.72;
  background: radial-gradient(circle, rgba(69, 255, 185, 0.13), rgba(18, 91, 81, 0.04) 42%, transparent 70%);
  filter: blur(8px);
  left: 50%;
  pointer-events: none;
  top: 50%;
  transform: translate(-50%, -50%);
  will-change: left, top;
}

.login-showcase__scan {
  position: absolute;
  z-index: -1;
  width: 28%;
  height: 1px;
  opacity: 0.4;
  background: linear-gradient(90deg, transparent, #a8ffdb, transparent);
  box-shadow: 0 0 18px rgba(168, 255, 219, 0.7);
  left: -32%;
  pointer-events: none;
  top: 22%;
  transform: rotate(-18deg);
}

.login-showcase::before {
  position: absolute;
  z-index: -2;
  width: min(56vw, 680px);
  aspect-ratio: 1;
  border: 1px solid rgba(168, 255, 219, 0.15);
  border-radius: 50%;
  content: '';
  right: -24%;
  bottom: -32%;
  box-shadow:
    0 0 0 80px rgba(168, 255, 219, 0.025),
    0 0 0 160px rgba(168, 255, 219, 0.02);
}

.login-showcase__monogram {
  position: absolute;
  z-index: -1;
  right: -0.08em;
  top: 46%;
  color: rgba(215, 255, 236, 0.035);
  font-family: 'Arial Black', sans-serif;
  font-size: clamp(180px, 29vw, 440px);
  font-weight: 900;
  letter-spacing: -0.16em;
  line-height: 0.72;
  transform: translateY(-50%);
  user-select: none;
  will-change: transform;
}

.login-showcase__brand,
.login-showcase__status {
  display: flex;
  align-items: center;
  gap: 12px;
  font-family: 'SFMono-Regular', Consolas, monospace;
  font-size: 11px;
  letter-spacing: 0.18em;
}

.login-showcase__brand-mark {
  display: grid;
  width: 36px;
  height: 36px;
  border: 1px solid rgba(175, 255, 225, 0.42);
  color: #a8ffdb;
  font-family: Georgia, serif;
  font-size: 15px;
  letter-spacing: 0;
  place-items: center;
  will-change: transform;
}

.login-showcase__copy {
  max-width: 680px;
  margin: auto 0;
  will-change: transform;
}

.login-showcase__eyebrow {
  margin: 0 0 22px;
  color: #a8ffdb;
  font-family: 'SFMono-Regular', Consolas, monospace;
  font-size: 12px;
  letter-spacing: 0.2em;
  text-transform: uppercase;
}

.login-showcase__headline {
  max-width: 660px;
  margin: 0;
  font-family: Georgia, 'Noto Serif SC', serif;
  font-size: clamp(44px, 6vw, 88px);
  font-weight: 400;
  letter-spacing: -0.055em;
  line-height: 0.98;
  text-wrap: balance;
}

.login-showcase__headline-token,
.login-showcase__letter-mask,
.login-showcase__letter {
  display: inline-block;
}

.login-showcase__headline-token {
  white-space: nowrap;
}

.login-showcase__headline-token.is-space {
  width: 0.25em;
}

.login-showcase__letter-mask {
  overflow: hidden;
  margin: -0.08em -0.015em;
  padding: 0.08em 0.015em;
  vertical-align: top;
}

.login-showcase__letter {
  cursor: default;
  transform-origin: 50% 100%;
  will-change: transform;
}

.login-showcase__letter.is-accent {
  color: #a8ffdb;
  font-style: italic;
}

.login-showcase__description {
  max-width: 510px;
  margin: 28px 0 0;
  color: rgba(230, 242, 235, 0.62);
  font-size: 15px;
  letter-spacing: 0.02em;
  line-height: 1.8;
}

.login-showcase__metrics {
  display: grid;
  max-width: 650px;
  margin-top: 34px;
  gap: 10px;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  will-change: transform;
}

.data-card {
  position: relative;
  min-width: 0;
  overflow: hidden;
  padding: 14px 15px 12px;
  border: 1px solid rgba(168, 255, 219, 0.13);
  background: linear-gradient(145deg, rgba(152, 255, 211, 0.065), rgba(2, 25, 31, 0.2));
  backdrop-filter: blur(8px);
  cursor: crosshair;
  will-change: transform;
}

.data-card__header,
.data-card__footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.data-card__header {
  color: rgba(226, 243, 234, 0.45);
  font-family: 'SFMono-Regular', Consolas, monospace;
  font-size: 8px;
  letter-spacing: 0.13em;
}

.data-card__header i {
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background: #a8ffdb;
  box-shadow: 0 0 8px #a8ffdb;
}

.data-card strong {
  display: block;
  margin: 10px 0 11px;
  color: #effff7;
  font-family: Georgia, serif;
  font-size: clamp(20px, 2vw, 29px);
  font-weight: 400;
  letter-spacing: -0.04em;
}

.data-card__trace {
  display: flex;
  width: 68px;
  height: 22px;
  align-items: flex-end;
  gap: 3px;
}

.data-card__trace span {
  width: 100%;
  min-height: 2px;
  background: rgba(168, 255, 219, 0.48);
  transform-origin: bottom;
}

.data-card__footer em {
  color: #a8ffdb;
  font-family: 'SFMono-Regular', Consolas, monospace;
  font-size: 8px;
  font-style: normal;
  letter-spacing: 0.08em;
}

.data-card__edge {
  position: absolute;
  width: 100%;
  height: 1px;
  background: linear-gradient(90deg, transparent, #a8ffdb, transparent);
  bottom: 0;
  left: -100%;
  opacity: 0;
}

.login-showcase__system {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 40px;
  margin-top: 36px;
}

.login-showcase__radar {
  position: relative;
  display: grid;
  width: 112px;
  height: 112px;
  flex: 0 0 112px;
  border: 1px solid rgba(168, 255, 219, 0.22);
  border-radius: 50%;
  place-items: center;
  will-change: transform;
}

.login-showcase__pulse {
  position: absolute;
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: rgba(168, 255, 219, 0.25);
}

.login-showcase__orbit {
  position: absolute;
  inset: 10px;
  border: 1px dashed rgba(168, 255, 219, 0.28);
  border-radius: 50%;
}

.login-showcase__satellite {
  position: absolute;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #a8ffdb;
  box-shadow: 0 0 12px rgba(168, 255, 219, 0.8);
}

.login-showcase__satellite--one {
  left: 6px;
  top: 18px;
}

.login-showcase__satellite--two {
  right: 2px;
  top: 44px;
}

.login-showcase__satellite--three {
  bottom: 3px;
  left: 43px;
}

.login-showcase__core {
  z-index: 1;
  color: #a8ffdb;
  font-family: Georgia, serif;
  font-size: 24px;
}

.login-showcase__points {
  display: grid;
  width: min(360px, 100%);
  margin: 0;
  padding: 0;
  gap: 12px;
  list-style: none;
}

.login-showcase__points li {
  display: flex;
  padding-bottom: 10px;
  border-bottom: 1px solid rgba(214, 240, 225, 0.12);
  color: rgba(235, 244, 239, 0.75);
  font-size: 13px;
  gap: 20px;
  will-change: transform;
}

.login-showcase__points span {
  color: #a8ffdb;
  font-family: 'SFMono-Regular', Consolas, monospace;
  font-size: 10px;
}

.login-showcase__status {
  margin-top: 40px;
  color: rgba(233, 245, 238, 0.5);
}

.login-showcase__status span:last-child {
  margin-left: auto;
}

.login-showcase__status-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #a8ffdb;
  box-shadow: 0 0 10px #a8ffdb;
}

@media (max-width: 960px) {
  .login-showcase {
    min-height: 330px;
    padding: 28px clamp(24px, 7vw, 56px);
  }

  .login-showcase__copy {
    margin: 58px 0 24px;
  }

  .login-showcase__headline {
    max-width: 560px;
    font-size: clamp(38px, 10vw, 64px);
  }

  .login-showcase__description,
  .login-showcase__metrics,
  .login-showcase__system {
    display: none;
  }

  .login-showcase__status {
    margin-top: 20px;
  }
}

@media (max-width: 560px) {
  .login-showcase {
    min-height: 250px;
  }

  .login-showcase__copy {
    margin-top: 42px;
  }

  .login-showcase__description,
  .login-showcase__status {
    display: none;
  }
}
</style>
