<script setup lang="ts">
import { computed, nextTick, ref, shallowRef, useTemplateRef } from 'vue';
import { useI18n } from 'vue-i18n';
import { to } from 'await-to-js';
import type { FormInstance, FormRules } from 'element-plus';
import { getCodeImg, register } from '@/api/login';
import type { RegisterForm } from '@/api/types';
import LoginShowcase from './login/components/LoginShowcase.vue';
import { useLoginMotion } from './login/composables/useLoginMotion';

const title = import.meta.env.VITE_APP_TITLE;
const router = useRouter();
const { t } = useI18n();
const registerRoot = useTemplateRef<HTMLElement>('registerRoot');
const registerRef = useTemplateRef<FormInstance>('registerRef');
const captchaRef = useTemplateRef<HTMLElement>('captchaRef');

// 保留后端注册契约，无租户版本不附加任何租户字段。
const registerForm = ref<RegisterForm>({ username: '', password: '', confirmPassword: '', code: '', uuid: '', userType: 'sys_user' });

// 确认密码继续使用原业务规则，视觉重构不改变表单校验含义。
const equalToPassword = (_rule: unknown, value: string, callback: (error?: Error) => void) => {
  if (registerForm.value.password !== value) {
    callback(new Error(t('register.rule.confirmPassword.equalToPassword')));
    return;
  }
  callback();
};

const registerRules: FormRules<RegisterForm> = {
  username: [
    { required: true, trigger: 'blur', message: t('register.rule.username.required') },
    { min: 2, max: 20, trigger: 'blur', message: t('register.rule.username.length', { min: 2, max: 20 }) }
  ],
  password: [
    { required: true, trigger: 'blur', message: t('register.rule.password.required') },
    { min: 5, max: 20, trigger: 'blur', message: t('register.rule.password.length', { min: 5, max: 20 }) },
    { pattern: /^[^<>"'|\\]+$/, trigger: 'blur', message: t('register.rule.password.pattern', { strings: '< > " \' \\ |' }) }
  ],
  confirmPassword: [
    { required: true, trigger: 'blur', message: t('register.rule.confirmPassword.required') },
    { required: true, trigger: 'blur', validator: equalToPassword }
  ],
  code: [{ required: true, trigger: 'change', message: t('register.rule.code.required') }]
};

const codeUrl = shallowRef('');
const loading = shallowRef(false);
const captchaEnabled = shallowRef(true);
// 注册与登录共用相同左侧章节内容和逐字按钮结构。
const showcasePoints = computed(() => [t('login.showcase.pointOne'), t('login.showcase.pointTwo'), t('login.showcase.pointThree')]);
const welcomeCharacters = computed(() => [...t('register.welcome')]);
const submitLabel = computed(() => (loading.value ? t('register.registering') : t('register.register')));
const submitCharacters = computed(() => [...submitLabel.value]);

const {
  animateCaptcha,
  animateError,
  animateFieldBlur,
  animateFieldFocus,
  animateHover,
  animateRest,
  animateSubmitClick,
  animateSubmitHover,
  animateSubmitLeave,
  animateSubmitPress,
  animateSuccess
} = useLoginMotion({ root: registerRoot, loading });

// 注册成功后播放离场动画，再显示原有成功提示并返回登录页。
const handleRegister = async () => {
  if (loading.value) return;
  const valid = await registerRef.value?.validate().catch(() => false);
  if (!valid) {
    animateError();
    return;
  }
  loading.value = true;
  const [err] = await to(register(registerForm.value));
  if (err) {
    loading.value = false;
    animateError();
    if (captchaEnabled.value) await getCode();
    return;
  }
  await animateSuccess();
  await ElMessageBox.alert(
    `<span style="color:red">${t('register.registerSuccess', { username: registerForm.value.username })}</span>`,
    t('register.systemPrompt'),
    { dangerouslyUseHTMLString: true, type: 'success' }
  );
  await router.push('/login');
};

// 每次刷新验证码都清空旧值，并播放和登录页相同的回弹反馈。
const getCode = async () => {
  const { data } = await getCodeImg();
  captchaEnabled.value = data.captchaEnabled ?? true;
  if (!captchaEnabled.value) return;
  registerForm.value.code = '';
  registerForm.value.uuid = data.uuid;
  codeUrl.value = `data:image/gif;base64,${data.img}`;
  await nextTick();
  if (captchaRef.value) animateCaptcha(captchaRef.value);
};

onMounted(getCode);
</script>

<template>
  <main ref="registerRoot" class="auth-shell">
    <LoginShowcase
      :eyebrow="t('login.showcase.eyebrow')"
      :headline="t('login.showcase.headline')"
      :description="t('login.showcase.description')"
      :points="showcasePoints"
    />

    <section class="auth-panel">
      <div class="auth-topbar" data-login-enter>
        <span>RUOYI / PLUS 5.X</span>
        <div class="auth-language" @mouseenter="animateHover" @mouseleave="animateRest"><lang-select /></div>
      </div>

      <el-form ref="registerRef" :model="registerForm" :rules="registerRules" class="login-card auth-card" @submit.prevent="handleRegister">
        <header class="auth-header" data-login-enter>
          <p>{{ t('register.welcomeEyebrow') }}</p>
          <!-- 字符遮罩用于复用登录页的欢迎文字回弹时间线。 -->
          <h1 :aria-label="t('register.welcome')">
            <span v-for="(character, index) in welcomeCharacters" :key="`${character}-${index}`" class="welcome-letter-mask" aria-hidden="true">
              <span class="welcome-letter">{{ character }}</span>
            </span>
          </h1>
          <span>{{ t('register.welcomeDescription') }}</span>
        </header>

        <div class="auth-fields">
          <el-form-item class="login-field" prop="username" data-login-enter @focusin="animateFieldFocus" @focusout="animateFieldBlur">
            <label>{{ t('register.username') }}</label>
            <el-input v-model="registerForm.username" size="large" autocomplete="username" :placeholder="t('register.usernamePlaceholder')">
              <template #prefix><svg-icon icon-class="user" class="login-field__icon" /></template>
            </el-input>
            <span class="field-accent"></span><span class="field-spark field-spark--one">✦</span><span class="field-spark field-spark--two">•</span>
          </el-form-item>

          <el-form-item class="login-field" prop="password" data-login-enter @focusin="animateFieldFocus" @focusout="animateFieldBlur">
            <label>{{ t('register.password') }}</label>
            <el-input
              v-model="registerForm.password"
              type="password"
              show-password
              size="large"
              autocomplete="new-password"
              :placeholder="t('register.passwordPlaceholder')"
            >
              <template #prefix><svg-icon icon-class="password" class="login-field__icon" /></template>
            </el-input>
            <span class="field-accent"></span><span class="field-spark field-spark--one">✦</span><span class="field-spark field-spark--two">•</span>
          </el-form-item>

          <el-form-item class="login-field" prop="confirmPassword" data-login-enter @focusin="animateFieldFocus" @focusout="animateFieldBlur">
            <label>{{ t('register.confirmPassword') }}</label>
            <el-input
              v-model="registerForm.confirmPassword"
              type="password"
              show-password
              size="large"
              autocomplete="new-password"
              :placeholder="t('register.confirmPasswordPlaceholder')"
            >
              <template #prefix><svg-icon icon-class="password" class="login-field__icon" /></template>
            </el-input>
            <span class="field-accent"></span><span class="field-spark field-spark--one">✦</span><span class="field-spark field-spark--two">•</span>
          </el-form-item>

          <el-form-item
            v-if="captchaEnabled"
            class="login-field"
            prop="code"
            data-login-enter
            @focusin="animateFieldFocus"
            @focusout="animateFieldBlur"
          >
            <label>{{ t('register.code') }}</label>
            <div class="auth-code-row">
              <el-input v-model="registerForm.code" size="large" autocomplete="off" :placeholder="t('register.codePlaceholder')">
                <template #prefix><svg-icon icon-class="validCode" class="login-field__icon" /></template>
              </el-input>
              <button ref="captchaRef" class="auth-code" type="button" :aria-label="t('register.refreshCode')" @click="getCode">
                <img :src="codeUrl" alt="" /><span>{{ t('register.refresh') }}</span>
              </button>
            </div>
            <span class="field-accent"></span><span class="field-spark field-spark--one">✦</span><span class="field-spark field-spark--two">•</span>
          </el-form-item>
        </div>

        <button
          class="login-submit auth-submit"
          type="submit"
          :disabled="loading"
          :aria-label="submitLabel"
          data-login-enter
          @mouseenter="animateSubmitHover"
          @mouseleave="animateSubmitLeave"
          @focus="animateSubmitHover"
          @blur="animateSubmitLeave"
          @mousedown="animateSubmitPress"
          @mouseup="animateSubmitHover"
          @click="animateSubmitClick"
        >
          <!-- 固定节点承载点击涟漪和按钮文字的逐字跳跃。 -->
          <span class="login-submit__ripple"></span>
          <span class="login-submit__label" aria-hidden="true">
            <span v-for="(character, index) in submitCharacters" :key="`${character}-${index}`" class="login-submit__letter">{{ character }}</span>
          </span>
          <span class="login-submit__action"><i v-if="loading" class="submit-spinner"></i><svg-icon v-else icon-class="caret-forward" /></span>
        </button>

        <div class="auth-switch" data-login-enter>
          <span>{{ t('register.hasAccount') }}</span
          ><router-link to="/login">{{ t('register.switchLoginPage') }}</router-link>
        </div>
      </el-form>

      <footer class="auth-footer" data-login-enter>
        <span>© 2018—2026 RUOYI-VUE-PLUS</span><span>{{ title }}</span>
      </footer>
    </section>
  </main>
</template>

<style scoped lang="scss">
/* 注册页复用登录页的双栏比例，并针对四个字段压缩纵向间距。 */
.auth-shell {
  display: grid;
  min-height: 100%;
  color: #132e35;
  background: #f3f1e9;
  grid-template-columns: minmax(0, 1.18fr) minmax(470px, 0.82fr);
}
.auth-panel {
  display: flex;
  min-width: 0;
  min-height: 100%;
  flex-direction: column;
  justify-content: space-between;
  padding: 26px clamp(34px, 5vw, 76px) 22px;
}
.auth-topbar,
.auth-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  color: #65736f;
  font:
    10px 'SFMono-Regular',
    Consolas,
    monospace;
  letter-spacing: 0.1em;
}
.auth-language {
  display: grid;
  width: 38px;
  height: 38px;
  border: 1px solid #ccd3cc;
  cursor: pointer;
  place-items: center;
}
.auth-language :deep(.lang-select--style) {
  display: grid;
  width: 36px;
  height: 36px;
  color: #173139;
  line-height: 1;
  place-items: center;
}
.auth-card {
  width: min(100%, 500px);
  margin: 24px auto;
}
.auth-header {
  margin-bottom: 22px;
}
.auth-header p,
.login-field label {
  color: #369a73;
  font:
    10px 'SFMono-Regular',
    Consolas,
    monospace;
  letter-spacing: 0.15em;
  text-transform: uppercase;
}
.auth-header p {
  margin: 0 0 9px;
}
.auth-header h1 {
  margin: 0;
  color: #071c22;
  font:
    400 clamp(34px, 4vw, 50px)/1 Georgia,
    'Noto Serif SC',
    serif;
  letter-spacing: -0.05em;
}
.auth-header > span {
  display: block;
  margin-top: 9px;
  color: #687873;
  font-size: 13px;
  line-height: 1.5;
}
.welcome-letter-mask,
.welcome-letter {
  display: inline-block;
}
.welcome-letter-mask {
  overflow: hidden;
  margin: -0.1em -0.02em;
  padding: 0.1em 0.02em;
  vertical-align: top;
}
.welcome-letter {
  transform-origin: 50% 100%;
  will-change: transform;
}
.auth-fields {
  display: grid;
  gap: 10px;
}
.login-field {
  position: relative;
  display: block;
  margin: 0;
  will-change: transform;
}
.login-field :deep(.el-form-item__content) {
  display: block;
  line-height: normal;
}
.login-field label {
  display: block;
  margin-bottom: 5px;
  color: #52635f;
}
.login-field :deep(.el-input__wrapper) {
  height: 45px;
  padding: 0 14px;
  border: 1px solid #d0d7d0;
  border-radius: 0;
  background: rgba(255, 255, 255, 0.38);
  box-shadow: none;
}
.login-field :deep(.el-input__wrapper.is-focus),
.login-field :deep(.el-input__wrapper:hover) {
  border-color: #173139;
}
.login-field__icon {
  width: 16px;
  height: 16px;
  margin-right: 7px;
  color: #5f716c;
}
.field-accent {
  position: absolute;
  z-index: 2;
  right: 0;
  bottom: 0;
  left: 0;
  height: 2px;
  background: #36a77a;
  transform: scaleX(0);
  transform-origin: left;
}
/* 星点默认隐藏，只由输入框聚焦时间线控制。 */
.field-spark {
  position: absolute;
  z-index: 3;
  right: 12px;
  top: 27px;
  color: #36a77a;
  opacity: 0;
  pointer-events: none;
  transform: scale(0);
}
.field-spark--two {
  color: #e99754;
  font-size: 18px;
}
.auth-code-row {
  display: grid;
  gap: 9px;
  grid-template-columns: minmax(0, 1fr) 122px;
}
.auth-code {
  position: relative;
  height: 47px;
  overflow: hidden;
  padding: 0;
  border: 1px solid #d0d7d0;
  background: #fff;
  cursor: pointer;
}
.auth-code img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.auth-code span {
  position: absolute;
  right: 4px;
  bottom: 3px;
  padding: 2px 4px;
  color: #fff;
  background: rgba(7, 28, 34, 0.74);
  font-size: 8px;
}
.auth-submit {
  position: relative;
  display: flex;
  width: 100%;
  height: 53px;
  overflow: hidden;
  align-items: center;
  justify-content: space-between;
  margin-top: 18px;
  padding: 0 7px 0 22px;
  border: 0;
  color: #f4f8f2;
  background: #071c22;
  cursor: pointer;
  letter-spacing: 0.08em;
  will-change: transform;
}
.login-submit__label,
.login-submit__letter {
  position: relative;
  z-index: 1;
  display: inline-block;
}
.login-submit__letter {
  transform-origin: 50% 100%;
}
.login-submit__ripple {
  position: absolute;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  opacity: 0;
  background: #a8ffdb;
  pointer-events: none;
  transform: translate(-50%, -50%) scale(0);
}
.login-submit__action {
  position: relative;
  z-index: 1;
  display: grid;
  width: 39px;
  height: 39px;
  color: #071c22;
  background: #a8ffdb;
  place-items: center;
}
.submit-spinner {
  width: 14px;
  height: 14px;
  border: 2px solid rgba(7, 28, 34, 0.25);
  border-top-color: #071c22;
  border-radius: 50%;
}
.auth-switch {
  display: flex;
  justify-content: center;
  margin-top: 16px;
  color: #75837f;
  font-size: 12px;
  gap: 7px;
}
.auth-switch a {
  color: #173139;
  font-weight: 700;
  text-decoration: none;
}
.auth-footer {
  padding-top: 15px;
  border-top: 1px solid #d7ddd6;
}
@media (max-width: 960px) {
  .auth-shell {
    display: block;
    overflow: auto;
  }
  .auth-panel {
    min-height: auto;
    padding: 28px clamp(24px, 7vw, 60px);
  }
  .auth-card {
    margin: 42px auto;
  }
}
@media (max-width: 560px) {
  .auth-panel {
    padding: 22px 20px;
  }
  .auth-topbar > span,
  .auth-footer span:last-child {
    display: none;
  }
  .auth-topbar {
    justify-content: flex-end;
  }
  .auth-code-row {
    grid-template-columns: minmax(0, 1fr) 104px;
  }
}
@media (prefers-reduced-motion: reduce) {
  .login-field,
  .auth-submit,
  .welcome-letter {
    will-change: auto;
  }
}
</style>
