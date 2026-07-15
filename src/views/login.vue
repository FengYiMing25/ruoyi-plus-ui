<script setup lang="ts">
import { computed, nextTick, onMounted, ref, shallowRef, useTemplateRef, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { to } from 'await-to-js';
import type { FormInstance, FormRules } from 'element-plus';
import { getCodeImg, register as registerUser } from '@/api/login';
import { authRouterUrl } from '@/api/system/social/auth';
import type { LoginData, RegisterForm } from '@/api/types';
import { HttpStatus } from '@/enums/RespEnum';
import { useUserStore } from '@/store/modules/user';
import LoginShowcase from './login/components/LoginShowcase.vue';
import SocialLoginButtons, { type SocialLoginItem } from './login/components/SocialLoginButtons.vue';
import { useLoginMotion } from './login/composables/useLoginMotion';

const title = import.meta.env.VITE_APP_TITLE;
const userStore = useUserStore();
const router = useRouter();
const { t } = useI18n();

const loginRoot = useTemplateRef<HTMLElement>('loginRoot');
const loginRef = useTemplateRef<FormInstance>('loginRef');
const registerRef = useTemplateRef<FormInstance>('registerRef');
const captchaRef = useTemplateRef<HTMLElement>('captchaRef');

const loginForm = ref<LoginData>({
  username: 'admin',
  password: 'admin123',
  rememberMe: false,
  code: '',
  uuid: '',
  clientId: import.meta.env.VITE_APP_CLIENT_ID,
  grantType: 'password'
});

const loginRules: FormRules<LoginData> = {
  username: [{ required: true, trigger: 'blur', message: t('login.rule.username.required') }],
  password: [{ required: true, trigger: 'blur', message: t('login.rule.password.required') }],
  code: [{ required: true, trigger: 'change', message: t('login.rule.code.required') }]
};

// 注册表单直接内嵌到登录页右侧，避免维护第二套认证页面。
const registerForm = ref<RegisterForm>({
  username: '',
  password: '',
  confirmPassword: '',
  code: '',
  uuid: '',
  userType: 'sys_user'
});

// 保留原注册页的两次密码一致性校验。
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
    { min: 2, max: 20, message: t('register.rule.username.length', { min: 2, max: 20 }), trigger: 'blur' }
  ],
  password: [
    { required: true, trigger: 'blur', message: t('register.rule.password.required') },
    { min: 5, max: 20, message: t('register.rule.password.length', { min: 5, max: 20 }), trigger: 'blur' },
    { pattern: /^[^<>"'|\\]+$/, message: t('register.rule.password.pattern', { strings: '< > " \' \\ |' }), trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, trigger: 'blur', message: t('register.rule.confirmPassword.required') },
    { required: true, validator: equalToPassword, trigger: 'blur' }
  ],
  code: [{ required: true, trigger: 'change', message: t('register.rule.code.required') }]
};

const codeUrl = shallowRef('');
const loading = shallowRef(false);
const captchaEnabled = shallowRef(true);
const redirect = shallowRef('/');
const authMode = shallowRef<'login' | 'register'>('login');

const showcasePoints = computed(() => [t('login.showcase.pointOne'), t('login.showcase.pointTwo'), t('login.showcase.pointThree')]);
// 将右侧欢迎标题拆成单字，供 GSAP 执行轻快的错峰弹出动画。
const welcomeCharacters = computed(() => [...t(authMode.value === 'login' ? 'login.welcome' : 'register.welcome')]);
// 登录状态变化时同步更新按钮字符，便于逐字执行果冻跳跃反馈。
const submitLabel = computed(() => {
  if (authMode.value === 'register') return loading.value ? t('register.registering') : t('register.register');
  return loading.value ? t('login.logging') : t('login.login');
});
const submitCharacters = computed(() => [...submitLabel.value]);
const socialLoginItems = computed<SocialLoginItem[]>(() => [
  { type: 'wechat', icon: 'wechat', label: t('login.social.wechat') },
  { type: 'maxkey', icon: 'maxkey', label: t('login.social.maxkey') },
  { type: 'topiam', icon: 'topiam', label: t('login.social.topiam') },
  { type: 'gitee', icon: 'gitee', label: t('login.social.gitee') },
  { type: 'github', icon: 'github', label: t('login.social.github') }
]);

const {
  animateCaptcha,
  animateAuthSwitch,
  animateError,
  animateFieldBlur,
  animateFieldFocus,
  animateHover,
  animatePress,
  animateRest,
  animateSubmitClick,
  animateSubmitHover,
  animateSubmitLeave,
  animateSubmitPress,
  animateSuccess
} = useLoginMotion({ root: loginRoot, loading });

watch(
  () => router.currentRoute.value,
  (newRoute) => {
    redirect.value = newRoute.query?.redirect ? decodeURIComponent(String(newRoute.query.redirect)) : '/';
    // 兼容直接访问 /login?mode=register 的场景。
    authMode.value = newRoute.query?.mode === 'register' ? 'register' : 'login';
  },
  { immediate: true }
);

// 登录/注册只替换右侧表单，左侧展示区保持原位且页面不刷新。
const switchAuthMode = async (mode: 'login' | 'register') => {
  if (loading.value || authMode.value === mode) return;
  authMode.value = mode;
  await router.replace({
    path: '/login',
    query: { ...router.currentRoute.value.query, mode: mode === 'register' ? 'register' : undefined }
  });
  await nextTick();
  animateAuthSwitch();
  await getCode();
};

const persistLoginData = () => {
  if (loginForm.value.rememberMe) {
    localStorage.setItem('username', String(loginForm.value.username));
    localStorage.setItem('password', String(loginForm.value.password));
    localStorage.setItem('rememberMe', 'true');
    return;
  }

  localStorage.removeItem('username');
  localStorage.removeItem('password');
  localStorage.removeItem('rememberMe');
};

const handleLogin = async () => {
  if (loading.value) return;

  const valid = await loginRef.value?.validate().catch(() => false);
  if (!valid) {
    animateError();
    return;
  }

  loading.value = true;
  persistLoginData();
  const [err] = await to(userStore.login(loginForm.value));

  if (!err) {
    await animateSuccess();
    await router.push(redirect.value || '/');
    loading.value = false;
    return;
  }

  loading.value = false;
  animateError();
  if (captchaEnabled.value) await getCode();
};

// 注册成功后继续沿用原流程：展示成功提示并切回登录状态。
const handleRegister = async () => {
  if (loading.value) return;
  const valid = await registerRef.value?.validate().catch(() => false);
  if (!valid) {
    animateError();
    return;
  }

  loading.value = true;
  const [err] = await to(registerUser(registerForm.value));
  if (err) {
    loading.value = false;
    animateError();
    if (captchaEnabled.value) await getCode();
    return;
  }

  const username = registerForm.value.username;
  await ElMessageBox.alert(`<span style="color: red;">${t('register.registerSuccess', { username })}</span>`, t('register.systemPrompt'), {
    dangerouslyUseHTMLString: true,
    type: 'success'
  });
  loading.value = false;
  await switchAuthMode('login');
};

const getCode = async () => {
  const res = await getCodeImg();
  const { data } = res;
  captchaEnabled.value = data.captchaEnabled ?? true;
  if (!captchaEnabled.value) return;

  // 验证码写入当前可见表单，登录与注册互不覆盖 uuid。
  if (authMode.value === 'register') {
    registerForm.value = { ...registerForm.value, code: '', uuid: data.uuid };
  } else {
    loginForm.value = { ...loginForm.value, code: '', uuid: data.uuid };
  }
  codeUrl.value = 'data:image/gif;base64,' + data.img;
  await nextTick();
  if (captchaRef.value) animateCaptcha(captchaRef.value);
};

const getLoginData = () => {
  const username = localStorage.getItem('username');
  const password = localStorage.getItem('password');
  const rememberMe = localStorage.getItem('rememberMe') === 'true';

  loginForm.value = {
    ...loginForm.value,
    username: username ?? loginForm.value.username,
    password: password ?? loginForm.value.password,
    rememberMe
  };
};

const doSocialLogin = async (type: string) => {
  const res = await authRouterUrl(type);
  if (res.code === HttpStatus.SUCCESS) {
    window.location.href = res.data;
    return;
  }
  ElMessage.error(res.msg);
  animateError();
};

onMounted(() => {
  getLoginData();
  getCode();
});
</script>

<template>
  <main ref="loginRoot" class="login-shell">
    <LoginShowcase
      :eyebrow="t('login.showcase.eyebrow')"
      :headline="t('login.showcase.headline')"
      :description="t('login.showcase.description')"
      :points="showcasePoints"
    />

    <section class="login-panel">
      <div class="login-panel__topbar" data-login-enter>
        <span class="login-panel__edition">RuoYi / Plus 5.X</span>
        <div class="login-panel__language" @mouseenter="animateHover" @mouseleave="animateRest" @mousedown="animatePress" @mouseup="animateHover">
          <lang-select />
        </div>
      </div>

      <el-form v-if="authMode === 'login'" ref="loginRef" :model="loginForm" :rules="loginRules" class="login-card" @submit.prevent="handleLogin">
        <header class="login-card__header" data-login-enter>
          <p>{{ t('login.welcomeEyebrow') }}</p>
          <!-- 双层字符容器用于裁切欢迎文字，让每个字独立弹出。 -->
          <h2 :aria-label="t('login.welcome')">
            <span v-for="(character, index) in welcomeCharacters" :key="`${character}-${index}`" class="welcome-letter-mask" aria-hidden="true">
              <span class="welcome-letter">{{ character }}</span>
            </span>
          </h2>
          <span>{{ t('login.welcomeDescription') }}</span>
        </header>

        <div class="login-card__fields">
          <el-form-item class="login-field" prop="username" data-login-enter @focusin="animateFieldFocus" @focusout="animateFieldBlur">
            <label class="login-field__label">{{ t('login.username') }}</label>
            <el-input v-model="loginForm.username" type="text" size="large" autocomplete="username" :placeholder="t('login.usernamePlaceholder')">
              <template #prefix><svg-icon icon-class="user" class="login-field__icon" /></template>
            </el-input>
            <span class="field-accent"></span>
            <!-- 聚焦输入框时由 GSAP 弹出的装饰星点。 -->
            <span class="field-spark field-spark--one">✦</span>
            <span class="field-spark field-spark--two">•</span>
          </el-form-item>

          <el-form-item class="login-field" prop="password" data-login-enter @focusin="animateFieldFocus" @focusout="animateFieldBlur">
            <label class="login-field__label">{{ t('login.password') }}</label>
            <el-input
              v-model="loginForm.password"
              type="password"
              size="large"
              autocomplete="current-password"
              show-password
              :placeholder="t('login.passwordPlaceholder')"
              @keyup.enter="handleLogin"
            >
              <template #prefix><svg-icon icon-class="password" class="login-field__icon" /></template>
            </el-input>
            <span class="field-accent"></span>
            <span class="field-spark field-spark--one">✦</span>
            <span class="field-spark field-spark--two">•</span>
          </el-form-item>

          <el-form-item
            v-if="captchaEnabled"
            class="login-field"
            prop="code"
            data-login-enter
            @focusin="animateFieldFocus"
            @focusout="animateFieldBlur"
          >
            <label class="login-field__label">{{ t('login.code') }}</label>
            <div class="login-code-row">
              <el-input v-model="loginForm.code" size="large" autocomplete="off" :placeholder="t('login.codePlaceholder')" @keyup.enter="handleLogin">
                <template #prefix><svg-icon icon-class="validCode" class="login-field__icon" /></template>
              </el-input>
              <button
                ref="captchaRef"
                class="login-code"
                type="button"
                :aria-label="t('login.refreshCode')"
                @mouseenter="animateHover"
                @mouseleave="animateRest"
                @mousedown="animatePress"
                @mouseup="animateHover"
                @click="getCode"
              >
                <img :src="codeUrl" alt="" />
                <span>{{ t('login.refresh') }}</span>
              </button>
            </div>
            <span class="field-accent"></span>
            <span class="field-spark field-spark--one">✦</span>
            <span class="field-spark field-spark--two">•</span>
          </el-form-item>
        </div>

        <div class="login-card__remember" data-login-enter>
          <div class="login-card__checkbox" @mouseenter="animateHover" @mouseleave="animateRest" @mousedown="animatePress" @mouseup="animateHover">
            <el-checkbox v-model="loginForm.rememberMe">{{ t('login.rememberPassword') }}</el-checkbox>
          </div>
          <span>{{ t('login.securityNote') }}</span>
        </div>

        <button
          class="login-submit"
          type="submit"
          :disabled="loading"
          data-login-enter
          :aria-label="submitLabel"
          @mouseenter="animateSubmitHover"
          @mouseleave="animateSubmitLeave"
          @focus="animateSubmitHover"
          @blur="animateSubmitLeave"
          @mousedown="animateSubmitPress"
          @mouseup="animateSubmitHover"
          @click="animateSubmitClick"
        >
          <!-- 固定涟漪节点避免点击时动态创建 DOM，字符节点用于错峰果冻跳跃。 -->
          <span class="login-submit__ripple"></span>
          <span class="login-submit__label" aria-hidden="true">
            <span v-for="(character, index) in submitCharacters" :key="`${character}-${index}`" class="login-submit__letter">{{ character }}</span>
          </span>
          <span class="login-submit__action">
            <i v-if="loading" class="submit-spinner"></i>
            <svg-icon v-else icon-class="caret-forward" />
          </span>
        </button>

        <div class="login-card__divider" data-login-enter>
          <span>{{ t('login.socialLabel') }}</span>
        </div>

        <SocialLoginButtons :items="socialLoginItems" data-login-enter @select="doSocialLogin" />

        <div class="login-card__register" data-login-enter>
          <span>{{ t('login.noAccount') }}</span>
          <button class="auth-switch-button" type="button" @mouseenter="animateHover" @mouseleave="animateRest" @click="switchAuthMode('register')">
            {{ t('login.switchRegisterPage') }}
          </button>
        </div>
      </el-form>

      <!-- 注册表单与登录表单共享同一右侧容器，通过状态切换而非页面跳转。 -->
      <el-form
        v-else
        ref="registerRef"
        :model="registerForm"
        :rules="registerRules"
        class="login-card register-card"
        @submit.prevent="handleRegister"
      >
        <header class="login-card__header">
          <p>{{ t('register.welcomeEyebrow') }}</p>
          <h2 :aria-label="t('register.welcome')">
            <span v-for="(character, index) in welcomeCharacters" :key="`${character}-${index}`" class="welcome-letter-mask" aria-hidden="true">
              <span class="welcome-letter">{{ character }}</span>
            </span>
          </h2>
          <span>{{ t('register.welcomeDescription') }}</span>
        </header>

        <div class="login-card__fields register-card__fields">
          <el-form-item class="login-field" prop="username" @focusin="animateFieldFocus" @focusout="animateFieldBlur">
            <label class="login-field__label">{{ t('register.username') }}</label>
            <el-input v-model="registerForm.username" size="large" autocomplete="username" :placeholder="t('register.usernamePlaceholder')">
              <template #prefix><svg-icon icon-class="user" class="login-field__icon" /></template>
            </el-input>
            <span class="field-accent"></span>
            <span class="field-spark field-spark--one">✦</span><span class="field-spark field-spark--two">•</span>
          </el-form-item>

          <el-form-item class="login-field" prop="password" @focusin="animateFieldFocus" @focusout="animateFieldBlur">
            <label class="login-field__label">{{ t('register.password') }}</label>
            <el-input
              v-model="registerForm.password"
              type="password"
              size="large"
              autocomplete="new-password"
              show-password
              :placeholder="t('register.passwordPlaceholder')"
            >
              <template #prefix><svg-icon icon-class="password" class="login-field__icon" /></template>
            </el-input>
            <span class="field-accent"></span>
            <span class="field-spark field-spark--one">✦</span><span class="field-spark field-spark--two">•</span>
          </el-form-item>

          <el-form-item class="login-field" prop="confirmPassword" @focusin="animateFieldFocus" @focusout="animateFieldBlur">
            <label class="login-field__label">{{ t('register.confirmPassword') }}</label>
            <el-input
              v-model="registerForm.confirmPassword"
              type="password"
              size="large"
              autocomplete="new-password"
              show-password
              :placeholder="t('register.confirmPasswordPlaceholder')"
              @keyup.enter="handleRegister"
            >
              <template #prefix><svg-icon icon-class="password" class="login-field__icon" /></template>
            </el-input>
            <span class="field-accent"></span>
            <span class="field-spark field-spark--one">✦</span><span class="field-spark field-spark--two">•</span>
          </el-form-item>

          <el-form-item v-if="captchaEnabled" class="login-field" prop="code" @focusin="animateFieldFocus" @focusout="animateFieldBlur">
            <label class="login-field__label">{{ t('register.code') }}</label>
            <div class="login-code-row">
              <el-input
                v-model="registerForm.code"
                size="large"
                autocomplete="off"
                :placeholder="t('register.codePlaceholder')"
                @keyup.enter="handleRegister"
              >
                <template #prefix><svg-icon icon-class="validCode" class="login-field__icon" /></template>
              </el-input>
              <button ref="captchaRef" class="login-code" type="button" :aria-label="t('register.refreshCode')" @click="getCode">
                <img :src="codeUrl" alt="" /><span>{{ t('register.refresh') }}</span>
              </button>
            </div>
            <span class="field-accent"></span>
            <span class="field-spark field-spark--one">✦</span><span class="field-spark field-spark--two">•</span>
          </el-form-item>
        </div>

        <button
          class="login-submit register-submit"
          type="submit"
          :disabled="loading"
          :aria-label="submitLabel"
          @mouseenter="animateSubmitHover"
          @mouseleave="animateSubmitLeave"
          @focus="animateSubmitHover"
          @blur="animateSubmitLeave"
          @mousedown="animateSubmitPress"
          @mouseup="animateSubmitHover"
          @click="animateSubmitClick"
        >
          <span class="login-submit__ripple"></span>
          <span class="login-submit__label" aria-hidden="true">
            <span v-for="(character, index) in submitCharacters" :key="`${character}-${index}`" class="login-submit__letter">{{ character }}</span>
          </span>
          <span class="login-submit__action"><i v-if="loading" class="submit-spinner"></i><svg-icon v-else icon-class="caret-forward" /></span>
        </button>

        <div class="login-card__register">
          <span>{{ t('register.hasAccount') }}</span>
          <button class="auth-switch-button" type="button" @mouseenter="animateHover" @mouseleave="animateRest" @click="switchAuthMode('login')">
            {{ t('register.switchLoginPage') }}
          </button>
        </div>
      </el-form>

      <footer class="login-panel__footer" data-login-enter>
        <span>© 2018—2026 RuoYi-Vue-Plus</span>
        <span>{{ title }}</span>
      </footer>
    </section>
  </main>
</template>

<style lang="scss" scoped>
.login-shell {
  display: grid;
  min-height: 100%;
  color: #132e35;
  background: #f3f1e9;
  grid-template-columns: minmax(0, 1.18fr) minmax(470px, 0.82fr);
}

.login-panel {
  display: flex;
  min-width: 0;
  min-height: 100%;
  flex-direction: column;
  justify-content: space-between;
  padding: 34px clamp(34px, 6vw, 92px) 26px;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.42), transparent 45%), #f3f1e9;
}

.login-panel__topbar,
.login-panel__footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  color: #65736f;
  font-family: 'SFMono-Regular', Consolas, monospace;
  font-size: 10px;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.login-panel__edition::before {
  display: inline-block;
  width: 7px;
  height: 7px;
  margin-right: 10px;
  border-radius: 50%;
  background: #36a77a;
  content: '';
}

.login-panel__language {
  display: grid;
  width: 38px;
  height: 38px;
  border: 1px solid #ccd3cc;
  cursor: pointer;
  place-items: center;
}

.login-panel__language :deep(.lang-select--style) {
  display: grid;
  width: 36px;
  height: 36px;
  color: #173139;
  line-height: 1;
  place-items: center;
}

.login-card {
  width: min(100%, 500px);
  margin: 52px auto;
}

.login-card__header {
  margin-bottom: 38px;
}

.login-card__header p {
  margin: 0 0 13px;
  color: #369a73;
  font-family: 'SFMono-Regular', Consolas, monospace;
  font-size: 11px;
  letter-spacing: 0.18em;
  text-transform: uppercase;
}

.login-card__header h2 {
  margin: 0;
  color: #071c22;
  font-family: Georgia, 'Noto Serif SC', serif;
  font-size: clamp(38px, 4.4vw, 58px);
  font-weight: 400;
  letter-spacing: -0.055em;
  line-height: 1;
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

.login-card__header > span {
  display: block;
  margin-top: 15px;
  color: #687873;
  font-size: 14px;
  line-height: 1.7;
}

.login-card__fields {
  display: grid;
  gap: 15px;
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

.login-field__label {
  display: block;
  margin-bottom: 8px;
  color: #52635f;
  font-family: 'SFMono-Regular', Consolas, monospace;
  font-size: 10px;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}

.login-field :deep(.el-input__wrapper) {
  height: 50px;
  padding: 0 15px;
  border: 1px solid #d0d7d0;
  border-radius: 0;
  background: rgba(255, 255, 255, 0.36);
  box-shadow: none;
}

.login-field :deep(.el-input__wrapper:hover),
.login-field :deep(.el-input__wrapper.is-focus) {
  border-color: #173139;
  box-shadow: none;
}

.login-field :deep(.el-input__inner) {
  height: 48px;
  color: #0a242b;
  font-size: 15px;
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
  transform-origin: left center;
}

.field-spark {
  position: absolute;
  z-index: 3;
  color: #36a77a;
  opacity: 0;
  pointer-events: none;
  right: 12px;
  top: 29px;
  transform: scale(0);
}

.field-spark--one {
  font-size: 12px;
}

.field-spark--two {
  color: #e99754;
  font-size: 18px;
}

.login-code-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 128px;
  gap: 10px;
}

.login-code {
  position: relative;
  height: 52px;
  overflow: hidden;
  padding: 0;
  border: 1px solid #d0d7d0;
  border-radius: 0;
  background: #fff;
  cursor: pointer;
  transform-origin: center;
}

.login-code img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.login-code span {
  position: absolute;
  right: 5px;
  bottom: 4px;
  padding: 2px 4px;
  color: #fff;
  background: rgba(7, 28, 34, 0.75);
  font-family: 'SFMono-Regular', Consolas, monospace;
  font-size: 8px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.login-card__remember {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin: 20px 0;
  color: #7a8984;
  font-size: 11px;
}

.login-card__checkbox {
  transform-origin: left center;
}

.login-card__checkbox :deep(.el-checkbox__label) {
  color: #304b51;
  font-size: 12px;
}

.login-card__checkbox :deep(.el-checkbox__inner) {
  border-radius: 0;
}

.login-submit {
  position: relative;
  display: flex;
  width: 100%;
  height: 56px;
  align-items: center;
  justify-content: space-between;
  padding: 0 7px 0 22px;
  border: 0;
  border-radius: 0;
  color: #f4f8f2;
  background: #071c22;
  cursor: pointer;
  font-family: inherit;
  font-size: 14px;
  letter-spacing: 0.08em;
  will-change: transform;
  overflow: hidden;
}

.login-submit__label,
.login-submit__letter {
  position: relative;
  z-index: 1;
  display: inline-block;
}

.login-submit__letter {
  transform-origin: 50% 100%;
  will-change: transform;
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

.login-submit:focus-visible {
  outline: 2px solid #36a77a;
  outline-offset: 3px;
}

.login-submit:disabled {
  cursor: wait;
  opacity: 0.75;
}

.login-submit__action {
  position: relative;
  z-index: 1;
  display: grid;
  width: 42px;
  height: 42px;
  color: #071c22;
  background: #a8ffdb;
  font-size: 17px;
  place-items: center;
}

.submit-spinner {
  display: block;
  width: 14px;
  height: 14px;
  border: 2px solid rgba(7, 28, 34, 0.25);
  border-top-color: #071c22;
  border-radius: 50%;
}

.login-card__divider {
  display: flex;
  align-items: center;
  margin: 27px 0 17px;
  color: #82908b;
  font-family: 'SFMono-Regular', Consolas, monospace;
  font-size: 9px;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  gap: 12px;
}

.login-card__divider::before,
.login-card__divider::after {
  height: 1px;
  flex: 1;
  background: #d4dad3;
  content: '';
}

.login-card__register {
  display: flex;
  justify-content: center;
  margin-top: 25px;
  color: #75837f;
  font-size: 12px;
  gap: 7px;
}

.login-card__register a,
.auth-switch-button {
  padding: 0;
  border: 0;
  color: #173139;
  background: transparent;
  cursor: pointer;
  font-weight: 700;
  font-family: inherit;
  font-size: inherit;
  text-decoration: none;
  transform-origin: center;
}

.login-card__register a::after,
.auth-switch-button::after {
  display: block;
  width: 100%;
  height: 1px;
  background: #36a77a;
  content: '';
}

/* 注册态字段更多，因此收紧垂直间距以适配常见笔记本高度。 */
.register-card {
  margin-top: 26px;
  margin-bottom: 26px;
}

.register-card .login-card__header {
  margin-bottom: 24px;
}

.register-card__fields {
  gap: 11px;
}

.register-card .login-card__header > span {
  margin-top: 10px;
}

.register-card .login-submit {
  margin-top: 20px;
}

.login-panel__footer {
  padding-top: 20px;
  border-top: 1px solid #d7ddd6;
  letter-spacing: 0.06em;
  text-transform: none;
}

@media (max-width: 960px) {
  .login-shell {
    display: block;
    overflow: auto;
  }

  .login-panel {
    min-height: auto;
    padding: 28px clamp(24px, 7vw, 60px);
  }

  .login-card {
    margin: 54px auto;
  }
}

@media (max-width: 560px) {
  .login-panel {
    padding: 22px 20px;
  }

  .login-panel__edition,
  .login-panel__footer span:last-child,
  .login-card__remember > span {
    display: none;
  }

  .login-panel__topbar {
    justify-content: flex-end;
  }

  .login-card {
    margin: 40px auto 52px;
  }

  .login-card__header h2 {
    font-size: 40px;
  }

  .login-code-row {
    grid-template-columns: minmax(0, 1fr) 108px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .login-field,
  .login-submit {
    will-change: auto;
  }
}
</style>
