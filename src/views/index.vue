<script setup name="Index" lang="ts">
import { computed, useTemplateRef } from 'vue';
import CarShowcaseSection from './home/components/CarShowcaseSection.vue';
import { useHomeMotion } from './home/composables/useHomeMotion';

// 首页章节的数据结构同时服务于横向能力卡片和下方架构列表，避免两处文案失去同步。
interface SystemChapter {
  /** 两位章节序号，用于卡片、目录和视觉图形中的统一编号。 */
  number: string;
  /** 英文能力代码，用作章节眉题和架构列表标题。 */
  code: string;
  /** 中文能力名称，也是章节卡片的主标题。 */
  title: string;
  /** 主标题上方的简短叙事句。 */
  subtitle: string;
  /** 章节正文说明，在卡片与架构列表中复用。 */
  description: string;
  /** 当前能力对应的展示指标值。 */
  metric: string;
  /** 指标值下方的英文单位或含义。 */
  metricLabel: string;
  /** 章节主题色标识，对应 chapter-card 的 tone 修饰类。 */
  tone: 'lime' | 'violet' | 'paper' | 'orange' | 'blue';
  /** 与该能力关联的技术栈标签。 */
  tags: string[];
}

// 用五个系统能力章节替换参考站的五段品牌故事，保留其叙事结构而不复制品牌内容。
const chapters: SystemChapter[] = [
  {
    number: '01',
    code: 'ACCESS / CONTROL',
    title: '权限',
    subtitle: '让每一次访问都有边界',
    description: '从组织、角色到数据范围，建立清晰、可追踪的访问秩序。',
    metric: '128',
    metricLabel: 'ACTIVE POLICIES',
    tone: 'lime',
    tags: ['Sa-Token', 'RBAC', 'Data Scope']
  },
  {
    number: '02',
    code: 'FLOW / ENGINE',
    title: '流程',
    subtitle: '复杂协作，也能自然流动',
    description: '用可编排的节点、事件和审批轨迹，把业务推进变成可见的路径。',
    metric: '2.4K',
    metricLabel: 'RUNNING FLOWS',
    tone: 'violet',
    tags: ['Workflow', 'Task', 'Event']
  },
  {
    number: '03',
    code: 'DATA / FABRIC',
    title: '数据',
    subtitle: '从噪声中看见真实',
    description: '统一数据接入、缓存与查询体验，让业务信息保持鲜活而可靠。',
    metric: '18ms',
    metricLabel: 'AVG RESPONSE',
    tone: 'paper',
    tags: ['MySQL', 'Redis', 'MyBatis-Plus']
  },
  {
    number: '04',
    code: 'LIVE / OBSERVE',
    title: '监控',
    subtitle: '系统的呼吸，随时可见',
    description: '连接日志、任务、缓存和服务状态，在异常成为问题前发现它。',
    metric: '99.98',
    metricLabel: 'AVAILABILITY',
    tone: 'orange',
    tags: ['Metrics', 'Tracing', 'SnailJob']
  },
  {
    number: '05',
    code: 'OPEN / EXTEND',
    title: '扩展',
    subtitle: '为变化预留空间',
    description: '模块化能力与开放集成，让系统持续生长，却不失去结构。',
    metric: '∞',
    metricLabel: 'POSSIBILITIES',
    tone: 'blue',
    tags: ['Vue 3', 'Spring Boot', 'Open API']
  }
];

// 根节点既是 GSAP 选择器的作用域，也是首页内滚动定位和指针交互的边界。
const homeRoot = useTemplateRef<HTMLElement>('homeRoot');
const heroTitle = 'RUOYI PLUS';
// 拆分首屏标题，供 GSAP 执行逐字遮罩入场。
const heroCharacters = computed(() => [...heroTitle]);
// 页面组件只绑定事件，具体 Tween、Timeline 与 ScrollTrigger 生命周期统一由 composable 管理。
const { handleHeroPointer, resetHeroPointer, scrollToChapters } = useHomeMotion(homeRoot);

// 沿用原首页的外部项目入口，不改变链接目标。
const goTarget = (url: string) => window.open(url, '_blank', 'noopener,noreferrer');
</script>

<template>
  <!-- 首页根容器转发鼠标位置，离开区域时触发首屏光球复位。 -->
  <div ref="homeRoot" class="home-lab" @pointermove="handleHeroPointer" @pointerleave="resetHeroPointer">
    <!-- 页面内导航采用参考站的差值混合效果，滚动到不同底色时自动反转。 -->
    <nav class="home-lab__nav" aria-label="首页章节导航">
      <button type="button" @click="scrollToChapters">EXPLORE / 05</button>
      <span>RUOYI OPERATIONS LAB</span>
      <button type="button" @click="goTarget('https://plus-doc.dromara.org')">DOCS ↗</button>
    </nav>

    <!-- 首屏使用超大排版、轨道和数据刻度建立沉浸式系统实验室氛围。 -->
    <section class="hero-section">
      <!-- 噪点、光球和轨道均为装饰层，不承载业务文本。 -->
      <div class="hero-section__noise"></div>
      <div class="hero-section__cursor-orb"></div>
      <div class="hero-section__orbit hero-section__orbit--outer"></div>
      <div class="hero-section__orbit hero-section__orbit--inner"></div>
      <div class="hero-section__satellite"></div>

      <!-- 左右角标提供版本、坐标和状态信息，形成仪表界面的边缘层次。 -->
      <div class="hero-section__meta hero-section__meta--left">
        <span>VERSION 5.6.2</span>
        <span>35°41′N / 139°41′E</span>
      </div>
      <div class="hero-section__meta hero-section__meta--right">
        <span>STATUS / ONLINE</span>
        <span>SCROLL TO EXPLORE ↓</span>
      </div>

      <!-- 首屏中心内容拆成字符遮罩，GSAP 可分别控制每个字母的入场时序。 -->
      <div class="hero-section__center">
        <p class="hero-section__kicker" data-hero-enter>FIVE SYSTEM TALES OF BEING</p>
        <h1 :aria-label="heroTitle">
          <span v-for="(character, index) in heroCharacters" :key="`${character}-${index}`" class="hero-letter-mask" aria-hidden="true">
            <span class="hero-letter" :class="{ 'is-space': character === ' ' }">{{ character === ' ' ? '\u00A0' : character }}</span>
          </span>
        </h1>
        <div class="hero-section__abstract" data-hero-enter>
          <span>ONE PLATFORM</span>
          <p>权限、流程、数据、监控与扩展，在同一个清晰的运行空间中持续生长。</p>
          <span>FIVE FORCES</span>
        </div>
      </div>

      <!-- 首屏行动按钮直接滚动到五章节区域，同时兼容减少动态效果模式。 -->
      <button class="hero-section__scroll" type="button" data-hero-enter @click="scrollToChapters">
        <span>ENTER THE SYSTEM</span>
        <i>↓</i>
      </button>
    </section>

    <!-- 宣言段通过逐词滚动揭示，模拟参考站的大字号叙事停顿。 -->
    <section class="manifesto-section">
      <div class="manifesto-section__index">00 — INTRODUCTION</div>
      <!-- data-manifesto-word 作为独立 ScrollTrigger 的动画锚点。 -->
      <p class="manifesto-section__lead">
        <span data-manifesto-word>从五个维度，</span>
        <span data-manifesto-word>重新理解</span>
        <span data-manifesto-word>一个系统</span>
        <span data-manifesto-word>如何运行。</span>
      </p>
      <!-- 小字号说明承担章节收束，避免大标题后直接切入 3D 场景。 -->
      <div class="manifesto-section__foot">
        <span>BUILT FOR FOCUSED OPERATIONS</span>
        <p>我们不只是呈现功能，而是让每个模块在滚动中形成一段可以被感知的系统故事。</p>
      </div>
    </section>

    <!-- 3D 车型章节整体封装，首页只负责组合各叙事区块。 -->
    <CarShowcaseSection />

    <!-- 纵向滚动驱动横向章节轨道，是参考站最核心的滚动叙事关系。 -->
    <section id="system-chapters" class="chapters-section">
      <div class="chapters-section__head">
        <span>THE FIVE / 01—05</span>
        <span>DRAGGED BY VERTICAL SCROLL</span>
      </div>
      <div class="chapters-track">
        <!-- 同一份章节数据渲染五张全屏卡片，tone 映射各卡片的主题配色。 -->
        <article v-for="chapter in chapters" :key="chapter.number" class="chapter-card" :class="`chapter-card--${chapter.tone}`">
          <header class="chapter-card__header">
            <span>{{ chapter.number }}</span>
            <span>{{ chapter.code }}</span>
          </header>

          <!-- 卡片中央图形只负责视觉运动，隐藏于辅助技术以免产生无意义朗读。 -->
          <div class="chapter-card__visual" aria-hidden="true">
            <div class="chapter-card__grid"></div>
            <div class="chapter-card__ring chapter-card__ring--one"></div>
            <div class="chapter-card__ring chapter-card__ring--two"></div>
            <span class="chapter-card__pulse"></span>
            <strong>{{ chapter.number }}</strong>
          </div>

          <!-- 正文与指标分开布局，便于横向滚动时维持稳定的信息层级。 -->
          <div class="chapter-card__body">
            <p>{{ chapter.subtitle }}</p>
            <h2>{{ chapter.title }}</h2>
            <div class="chapter-card__description">{{ chapter.description }}</div>
          </div>

          <footer class="chapter-card__footer">
            <div class="chapter-card__tags">
              <span v-for="tag in chapter.tags" :key="tag">{{ tag }}</span>
            </div>
            <div class="chapter-card__metric">
              <strong>{{ chapter.metric }}</strong>
              <span>{{ chapter.metricLabel }}</span>
            </div>
          </footer>
        </article>
      </div>
    </section>

    <!-- 架构区使用粘性编号和逐条揭示，延续章节之后的纵向阅读节奏。 -->
    <section class="architecture-section">
      <aside class="architecture-section__aside">
        <span>ARCHITECTURE / MAP</span>
        <strong>05</strong>
        <p>一个内核<br />五种力量</p>
      </aside>

      <div class="architecture-section__list">
        <!-- 再次复用章节数据，以纵向目录形式总结前面的横向叙事。 -->
        <article v-for="chapter in chapters" :key="chapter.code" class="architecture-row" data-architecture-row>
          <span>{{ chapter.number }}</span>
          <h3>{{ chapter.code }}</h3>
          <p>{{ chapter.description }}</p>
          <i>↗</i>
        </article>
      </div>
    </section>

    <!-- 技术栈跑马灯作为章节间的持续运动层，速度较慢以避免抢夺内容焦点。 -->
    <section class="marquee-section" aria-label="核心技术栈">
      <div class="marquee-track">
        <span>VUE 3</span><i>✦</i><span>SPRING BOOT</span><i>✦</i><span>SA-TOKEN</span><i>✦</i><span>REDIS</span><i>✦</i> <span>MYBATIS-PLUS</span
        ><i>✦</i><span>WORKFLOW</span><i>✦</i><span>GSAP</span><i>✦</i><span>OPEN API</span><i>✦</i> <span>VUE 3</span><i>✦</i><span>SPRING BOOT</span
        ><i>✦</i><span>SA-TOKEN</span><i>✦</i><span>REDIS</span><i>✦</i> <span>MYBATIS-PLUS</span><i>✦</i><span>WORKFLOW</span><i>✦</i
        ><span>GSAP</span><i>✦</i><span>OPEN API</span><i>✦</i>
      </div>
    </section>

    <!-- 尾部使用巨型链接和反色悬停，复原参考站强烈的结束感。 -->
    <footer class="home-footer">
      <div class="home-footer__top">
        <span>FROM FIVE, EVERYTHING OPERATES.</span>
        <span>EST. 2018 / OPEN SOURCE</span>
      </div>
      <h2 data-footer-title>让系统，<br />保持清醒。</h2>
      <div class="home-footer__actions">
        <button type="button" @click="goTarget('https://gitee.com/dromara/RuoYi-Vue-Plus')">GITEE <span>↗</span></button>
        <button type="button" @click="goTarget('https://github.com/dromara/RuoYi-Vue-Plus')">GITHUB <span>↗</span></button>
        <button type="button" @click="goTarget('https://plus-doc.dromara.org')">DOCUMENTATION <span>↗</span></button>
      </div>
      <div class="home-footer__bottom">
        <span>© 2026 RUOYI-VUE-PLUS</span>
        <!-- 回到顶部使用根元素定位，避免依赖全局 window.scrollTo。 -->
        <button type="button" @click="homeRoot?.scrollIntoView({ behavior: 'smooth' })">BACK TO TOP ↑</button>
      </div>
    </footer>
  </div>
</template>

<style lang="scss" scoped>
/* 首页通过负空间、超大字号与高对比色块复现参考站的编辑式视觉语言。 */
.home-lab {
  /* 主题色集中为 CSS 变量，章节色块和交互态可共享同一套视觉语义。 */
  --ink: #090909;
  --paper: #eee9dc;
  --lime: #ccff33;
  --violet: #7757ff;
  --orange: #ff6534;
  position: relative;
  overflow: clip;
  color: var(--ink);
  background: var(--paper);
  font-family: Arial, 'PingFang SC', sans-serif;
}

/* 首页内部按钮统一清除浏览器默认外观，具体反馈由各区块样式定义。 */
button {
  padding: 0;
  border: 0;
  color: inherit;
  background: none;
  cursor: pointer;
  font: inherit;
}

/* 顶部导航使用 difference 混合模式，在深浅章节之间自动保持对比度。 */
.home-lab__nav {
  position: absolute;
  z-index: 20;
  top: 0;
  display: grid;
  width: 100%;
  padding: 18px 22px;
  color: #fff;
  font-size: 11px;
  grid-template-columns: 1fr auto 1fr;
  letter-spacing: 0.08em;
  mix-blend-mode: difference;
  pointer-events: none;
}

.home-lab__nav button {
  width: fit-content;
  pointer-events: auto;
}

.home-lab__nav button:last-child {
  justify-self: end;
}

/* 首屏建立全视口舞台，超出区域的轨道与光晕由容器裁切。 */
.hero-section {
  position: relative;
  display: grid;
  min-height: max(720px, calc(100vh - 84px));
  overflow: hidden;
  color: #fff;
  background: #090909;
  isolation: isolate;
  place-items: center;
}

/* 噪点纹理在首屏与章节卡片之间复用，保持整页材质一致。 */
.hero-section__noise,
.chapter-card__grid {
  position: absolute;
  inset: 0;
  opacity: 0.16;
  background-image:
    linear-gradient(rgba(255, 255, 255, 0.16) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.16) 1px, transparent 1px);
  background-size: 54px 54px;
  mask-image: radial-gradient(circle at center, #000, transparent 75%);
}

/* 指针光球由 GSAP quickTo 更新 left/top，模糊后形成柔和跟随光。 */
.hero-section__cursor-orb {
  position: absolute;
  z-index: -1;
  width: 44vw;
  max-width: 680px;
  aspect-ratio: 1;
  border-radius: 50%;
  opacity: 0.55;
  background: radial-gradient(circle, rgba(119, 87, 255, 0.65), rgba(45, 21, 117, 0.14) 48%, transparent 70%);
  filter: blur(8px);
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  will-change: left, top;
}

/* 两层轨道只使用 transform 做持续旋转，避免影响文档布局。 */
.hero-section__orbit {
  position: absolute;
  z-index: -1;
  border: 1px solid rgba(255, 255, 255, 0.24);
  border-radius: 50%;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
}

.hero-section__orbit--outer {
  width: min(72vw, 980px);
  aspect-ratio: 1;
}

.hero-section__orbit--inner {
  width: min(48vw, 620px);
  aspect-ratio: 1;
  border-style: dashed;
}

.hero-section__satellite {
  position: absolute;
  z-index: 1;
  width: 13px;
  height: 13px;
  border-radius: 50%;
  background: var(--lime);
  box-shadow: 0 0 24px var(--lime);
  left: calc(50% - min(36vw, 490px));
  top: 50%;
}

/* 首屏元数据固定在左右侧边，竖排文字模拟实验设备刻度。 */
.hero-section__meta {
  position: absolute;
  z-index: 2;
  display: flex;
  flex-direction: column;
  color: rgba(255, 255, 255, 0.58);
  font-family: 'SFMono-Regular', Consolas, monospace;
  font-size: 9px;
  gap: 7px;
  letter-spacing: 0.12em;
  top: 74px;
}

.hero-section__meta--left {
  left: 22px;
}

.hero-section__meta--right {
  right: 22px;
  text-align: right;
}

/* 中央内容覆盖在装饰轨道之上，并由滚动视差整体移动。 */
.hero-section__center {
  position: relative;
  z-index: 2;
  width: 100%;
  text-align: center;
}

.hero-section__kicker {
  margin-bottom: 24px;
  color: var(--lime);
  font-family: 'SFMono-Regular', Consolas, monospace;
  font-size: 11px;
  letter-spacing: 0.22em;
}

/* 主标题使用视口单位控制尺度，在常见桌面比例下保持满宽冲击力。 */
.hero-section h1 {
  margin: 0;
  font-size: clamp(78px, 13vw, 210px);
  font-weight: 900;
  letter-spacing: -0.09em;
  line-height: 0.76;
  text-transform: uppercase;
  white-space: nowrap;
}

/* 外层遮罩裁切字母位移，内层字母交给 GSAP 执行弹出动画。 */
.hero-letter-mask,
.hero-letter {
  display: inline-block;
}

.hero-letter-mask {
  overflow: hidden;
  margin: -0.08em -0.01em;
  padding: 0.08em 0.01em;
  vertical-align: top;
}

.hero-letter {
  transform-origin: 50% 100%;
  will-change: transform;
}

.hero-letter.is-space {
  width: 0.24em;
}

/* 标题下方摘要使用三列网格，把平台说明夹在两侧英文标签之间。 */
.hero-section__abstract {
  display: grid;
  width: min(680px, calc(100% - 44px));
  align-items: start;
  margin: 42px auto 0;
  color: rgba(255, 255, 255, 0.65);
  font-size: 12px;
  gap: 24px;
  grid-template-columns: auto 1fr auto;
}

.hero-section__abstract p {
  margin: 0;
  line-height: 1.7;
}

.hero-section__abstract span {
  color: #fff;
  font-family: 'SFMono-Regular', Consolas, monospace;
  font-size: 8px;
  letter-spacing: 0.12em;
}

/* 首屏滚动入口保持在安全底部区域，并通过圆形箭头强化可点击性。 */
.hero-section__scroll {
  position: absolute;
  z-index: 3;
  bottom: 26px;
  display: flex;
  align-items: center;
  color: rgba(255, 255, 255, 0.68);
  font-size: 10px;
  gap: 14px;
  letter-spacing: 0.14em;
}

.hero-section__scroll i {
  display: grid;
  width: 34px;
  height: 34px;
  border: 1px solid rgba(255, 255, 255, 0.32);
  border-radius: 50%;
  font-style: normal;
  place-items: center;
}

/* 宣言区用大面积留白承接首屏，并为逐句滚动揭示预留纵向距离。 */
.manifesto-section {
  position: relative;
  min-height: 115vh;
  padding: 72px 4vw 90px;
  background: var(--paper);
}

.manifesto-section__index,
.chapters-section__head,
.architecture-section__aside > span,
.home-footer__top {
  font-family: 'SFMono-Regular', Consolas, monospace;
  font-size: 10px;
  letter-spacing: 0.12em;
}

/* 关键句分行排布，每个 span 都是独立的滚动动画目标。 */
.manifesto-section__lead {
  max-width: 1240px;
  margin: 16vh 0 20vh;
  font-size: clamp(56px, 8.6vw, 140px);
  font-weight: 900;
  letter-spacing: -0.075em;
  line-height: 0.88;
}

.manifesto-section__lead span {
  display: block;
  will-change: transform, opacity;
}

.manifesto-section__lead span:nth-child(2) {
  margin-left: 12vw;
}

.manifesto-section__lead span:nth-child(3) {
  color: var(--violet);
  margin-left: 4vw;
}

.manifesto-section__lead span:nth-child(4) {
  text-align: right;
}

/* 章节脚注采用左右分栏，补充产品定位与设计说明。 */
.manifesto-section__foot {
  display: grid;
  align-items: start;
  border-top: 1px solid rgba(0, 0, 0, 0.35);
  padding-top: 18px;
  font-size: 11px;
  gap: 40px;
  grid-template-columns: 1fr minmax(280px, 0.5fr);
}

.manifesto-section__foot p {
  margin: 0;
  font-size: 16px;
  line-height: 1.6;
}

/* 五章节容器在 ScrollTrigger 激活时固定，内部轨道再执行横向位移。 */
.chapters-section {
  position: relative;
  height: calc(100vh - 84px);
  min-height: 680px;
  overflow: hidden;
  color: #fff;
  background: var(--ink);
}

.chapters-section__head {
  position: absolute;
  z-index: 3;
  top: 22px;
  display: flex;
  width: 100%;
  justify-content: space-between;
  padding: 0 24px;
  color: rgba(255, 255, 255, 0.55);
}

/* 轨道宽度由五张视口卡片自然撑开，GSAP 根据 scrollWidth 计算终点。 */
.chapters-track {
  display: flex;
  width: max-content;
  height: 100%;
  will-change: transform;
}

/* 每张能力卡片占满一个视口，并通过 tone 修饰类替换主题色。 */
.chapter-card {
  --chapter-bg: #ccff33;
  --chapter-ink: #090909;
  position: relative;
  display: grid;
  width: min(78vw, 1040px);
  min-width: 760px;
  height: 100%;
  overflow: hidden;
  padding: 72px 34px 30px;
  color: var(--chapter-ink);
  background: var(--chapter-bg);
  border-right: 1px solid rgba(0, 0, 0, 0.28);
  grid-template-rows: auto 1fr auto;
}

/* 章节主题色只覆盖变量和前景色，结构样式保持完全复用。 */
.chapter-card--violet {
  --chapter-bg: #7757ff;
  --chapter-ink: #fff;
}

.chapter-card--paper {
  --chapter-bg: #eee9dc;
}

.chapter-card--orange {
  --chapter-bg: #ff6534;
}

.chapter-card--blue {
  --chapter-bg: #1b50ff;
  --chapter-ink: #fff;
}

.chapter-card__header,
.chapter-card__footer {
  position: relative;
  z-index: 2;
  display: flex;
  justify-content: space-between;
  font-family: 'SFMono-Regular', Consolas, monospace;
  font-size: 10px;
  letter-spacing: 0.1em;
}

/* 中央抽象图形由网格、双环与脉冲点组成，跟随横向滚动产生旋转。 */
.chapter-card__visual {
  position: absolute;
  width: min(48vw, 650px);
  aspect-ratio: 1;
  border: 1px solid currentcolor;
  border-radius: 50%;
  opacity: 0.7;
  right: -10%;
  top: 50%;
  transform: translateY(-50%);
}

.chapter-card__ring {
  position: absolute;
  border: 1px dashed currentcolor;
  border-radius: 50%;
  inset: 14%;
}

.chapter-card__ring--two {
  border-style: solid;
  inset: 30%;
}

.chapter-card__pulse {
  position: absolute;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: currentcolor;
  left: 13%;
  top: 32%;
}

.chapter-card__visual > strong {
  position: absolute;
  font-size: clamp(100px, 16vw, 240px);
  font-weight: 900;
  left: 50%;
  letter-spacing: -0.1em;
  top: 50%;
  transform: translate(-50%, -50%);
}

/* 章节正文保持在左下视觉区域，与中央图形和右下指标形成三角构图。 */
.chapter-card__body {
  position: relative;
  z-index: 2;
  align-self: center;
}

.chapter-card__body > p {
  margin: 0 0 12px;
  font-size: 13px;
}

.chapter-card__body h2 {
  margin: 0;
  font-size: clamp(110px, 15vw, 220px);
  font-weight: 900;
  letter-spacing: -0.09em;
  line-height: 0.76;
}

.chapter-card__description {
  max-width: 350px;
  margin-top: 30px;
  font-size: 15px;
  line-height: 1.6;
}

/* 页脚分别承载技术标签和量化指标，使用自动列宽避免内容挤压。 */
.chapter-card__footer {
  align-items: flex-end;
}

.chapter-card__tags {
  display: flex;
  flex-wrap: wrap;
  gap: 7px;
}

.chapter-card__tags span {
  padding: 6px 9px;
  border: 1px solid currentcolor;
  border-radius: 999px;
}

.chapter-card__metric {
  display: flex;
  flex-direction: column;
  text-align: right;
}

.chapter-card__metric strong {
  font-family: Arial, sans-serif;
  font-size: 34px;
  letter-spacing: -0.05em;
}

/* 架构总览恢复纵向阅读，左侧粘性摘要与右侧条目并行。 */
.architecture-section {
  display: grid;
  min-height: 120vh;
  padding: 90px 4vw 130px;
  color: #fff;
  background: var(--violet);
  gap: 8vw;
  grid-template-columns: minmax(220px, 0.42fr) 1fr;
}

.architecture-section__aside {
  position: sticky;
  top: 120px;
  height: fit-content;
}

.architecture-section__aside strong {
  display: block;
  margin: 40px 0 14px;
  font-size: clamp(130px, 20vw, 290px);
  letter-spacing: -0.12em;
  line-height: 0.72;
}

.architecture-section__aside p {
  font-size: 18px;
  line-height: 1.4;
}

/* 每个架构条目复用章节文案，并作为 ScrollTrigger.batch 的进入目标。 */
.architecture-row {
  display: grid;
  min-height: 170px;
  align-items: center;
  border-top: 1px solid rgba(255, 255, 255, 0.45);
  gap: 22px;
  grid-template-columns: 50px minmax(160px, 0.7fr) 1fr 30px;
  will-change: transform, opacity;
}

.architecture-row:last-child {
  border-bottom: 1px solid rgba(255, 255, 255, 0.45);
}

.architecture-row h3 {
  margin: 0;
  font-size: clamp(24px, 3vw, 44px);
  letter-spacing: -0.05em;
}

.architecture-row p {
  margin: 0;
  color: rgba(255, 255, 255, 0.72);
  line-height: 1.6;
}

.architecture-row i {
  font-size: 22px;
  font-style: normal;
}

/* 跑马灯隐藏超出内容，轨道复制两组文本后平移 50% 实现无缝循环。 */
.marquee-section {
  overflow: hidden;
  padding: 30px 0 36px;
  color: var(--ink);
  background: var(--lime);
}

.marquee-track {
  display: flex;
  width: max-content;
  align-items: center;
  font-size: clamp(50px, 7vw, 110px);
  font-weight: 900;
  letter-spacing: -0.06em;
  white-space: nowrap;
  will-change: transform;
}

.marquee-track i {
  margin: 0 30px;
  font-size: 0.38em;
  font-style: normal;
}

/* 页脚切换为纯黑背景，用巨型标题和反色按钮形成明确的视觉终点。 */
.home-footer {
  min-height: 100vh;
  padding: 28px 3vw 24px;
  color: #fff;
  background: var(--ink);
}

.home-footer__top,
.home-footer__bottom {
  display: flex;
  justify-content: space-between;
}

.home-footer h2 {
  margin: 15vh 0 13vh;
  font-size: clamp(76px, 13vw, 190px);
  font-weight: 900;
  letter-spacing: -0.09em;
  line-height: 0.78;
  will-change: transform, opacity;
}

.home-footer__actions {
  border-top: 1px solid rgba(255, 255, 255, 0.35);
}

.home-footer__actions button {
  display: flex;
  width: 100%;
  align-items: center;
  justify-content: space-between;
  padding: 18px 4px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.35);
  font-size: clamp(34px, 5vw, 74px);
  font-weight: 900;
  letter-spacing: -0.06em;
  transition:
    padding 0.3s ease,
    color 0.3s ease,
    background 0.3s ease;
}

.home-footer__actions button:hover,
.home-footer__actions button:focus-visible {
  padding-right: 18px;
  padding-left: 18px;
  color: var(--ink);
  background: var(--lime);
  outline: none;
}

.home-footer__bottom {
  margin-top: 80px;
  font-family: 'SFMono-Regular', Consolas, monospace;
  font-size: 9px;
  letter-spacing: 0.1em;
}

/* 平板布局降低字号并收紧卡片内边距，仍保留横向章节叙事。 */
@media (max-width: 900px) {
  .hero-section {
    min-height: 680px;
  }

  .hero-section h1 {
    font-size: clamp(58px, 15vw, 118px);
  }

  .hero-section__abstract {
    grid-template-columns: 1fr;
  }

  .hero-section__abstract span {
    display: none;
  }

  .chapter-card {
    width: 88vw;
    min-width: 620px;
  }

  .architecture-section {
    grid-template-columns: 1fr;
  }

  .architecture-section__aside {
    position: relative;
    top: 0;
  }
}

/* 手机布局将多列信息改为单列，优先保证标题和操作目标可读。 */
@media (max-width: 600px) {
  .home-lab__nav {
    padding: 16px 14px;
  }

  .home-lab__nav > span,
  .hero-section__meta--right {
    display: none;
  }

  .home-lab__nav {
    grid-template-columns: 1fr 1fr;
  }

  .hero-section__meta--left {
    left: 14px;
  }

  .hero-section h1 {
    white-space: normal;
  }

  .manifesto-section {
    min-height: 90vh;
    padding-right: 18px;
    padding-left: 18px;
  }

  .manifesto-section__lead span:nth-child(n) {
    margin-left: 0;
    text-align: left;
  }

  .manifesto-section__foot {
    grid-template-columns: 1fr;
  }

  .chapters-section {
    height: 650px;
    min-height: 650px;
  }

  .chapter-card {
    width: 92vw;
    min-width: 340px;
    padding: 66px 20px 24px;
  }

  .chapter-card__body h2 {
    font-size: 108px;
  }

  .chapter-card__description {
    max-width: 250px;
  }

  .chapter-card__metric,
  .chapters-section__head span:last-child {
    display: none;
  }

  .architecture-section {
    padding-right: 18px;
    padding-left: 18px;
  }

  .architecture-row {
    min-height: 190px;
    grid-template-columns: 38px 1fr 24px;
  }

  .architecture-row p {
    grid-column: 2 / -1;
  }

  .home-footer {
    padding-right: 18px;
    padding-left: 18px;
  }
}

/* 系统要求减少动态效果时关闭平滑滚动，GSAP 同步跳过主要运动。 */
@media (prefers-reduced-motion: reduce) {
  .hero-letter,
  [data-manifesto-word],
  [data-architecture-row],
  [data-footer-title],
  .chapters-track,
  .marquee-track {
    will-change: auto;
  }
}
</style>
