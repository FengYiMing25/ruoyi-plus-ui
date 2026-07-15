<script setup lang="ts">
import { useTemplateRef } from 'vue';
import { useLoginMotion } from '../composables/useLoginMotion';

export interface SocialLoginItem {
  type: string;
  icon: string;
  label: string;
}

defineProps<{
  items: SocialLoginItem[];
}>();

const emit = defineEmits<{
  select: [type: string];
}>();

const socialRoot = useTemplateRef<HTMLElement>('socialRoot');
const { animateHover, animatePress, animateRest } = useLoginMotion({ root: socialRoot, entry: false });
</script>

<template>
  <div ref="socialRoot" class="social-logins">
    <button
      v-for="item in items"
      :key="item.type"
      class="social-logins__button"
      type="button"
      :title="item.label"
      :aria-label="item.label"
      @mouseenter="animateHover"
      @mouseleave="animateRest"
      @focus="animateHover"
      @blur="animateRest"
      @mousedown="animatePress"
      @mouseup="animateHover"
      @click="emit('select', item.type)"
    >
      <svg-icon :icon-class="item.icon" />
    </button>
  </div>
</template>

<style scoped lang="scss">
.social-logins {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 10px;
}

.social-logins__button {
  display: grid;
  min-width: 0;
  height: 46px;
  padding: 0;
  border: 1px solid #d7ddd6;
  border-radius: 0;
  color: #173139;
  background: transparent;
  cursor: pointer;
  font-size: 18px;
  place-items: center;
  transform-origin: center;
}

.social-logins__button:hover,
.social-logins__button:focus-visible {
  border-color: #173139;
  color: #071c22;
  background: #eef4ed;
  outline: none;
}

@media (max-width: 420px) {
  .social-logins {
    gap: 7px;
  }
}
</style>
