export default {
  // 路由国际化
  route: {
    dashboard: '首页',
    document: '项目文档'
  },
  // 登录页面国际化
  login: {
    username: '用户名',
    password: '密码',
    login: '登 录',
    logging: '登 录 中...',
    code: '验证码',
    usernamePlaceholder: '输入管理账号',
    passwordPlaceholder: '输入账户密码',
    codePlaceholder: '输入验证码',
    welcomeEyebrow: 'Secure workspace / 安全工作台',
    welcome: '欢迎回来',
    welcomeDescription: '登录后继续管理你的业务、流程与系统资源。',
    rememberPassword: '记住我',
    securityNote: '加密连接已启用',
    socialLabel: '使用其他方式继续',
    noAccount: '还没有账号？',
    refreshCode: '刷新验证码',
    refresh: '刷新',
    switchRegisterPage: '立即注册',
    showcase: {
      eyebrow: 'Built for focused operations',
      headline: '让复杂系统，保持清晰有序。',
      description: '统一管理权限、流程与数据，让团队专注于真正重要的决策。',
      pointOne: '细粒度权限与组织管理',
      pointTwo: '可追踪的业务流程',
      pointThree: '实时系统运行状态'
    },
    rule: {
      username: {
        required: '请输入您的账号'
      },
      password: {
        required: '请输入您的密码'
      },
      code: {
        required: '请输入验证码'
      }
    },
    social: {
      wechat: '微信登录',
      maxkey: 'MaxKey登录',
      topiam: 'TopIam登录',
      gitee: 'Gitee登录',
      github: 'Github登录'
    }
  },
  // 注册页面国际化
  register: {
    welcomeEyebrow: 'Create your workspace',
    welcome: '创建账号',
    welcomeDescription: '填写账户信息，开启清晰、高效的管理体验。',
    username: '用户名',
    usernamePlaceholder: '请输入用户名',
    password: '密码',
    passwordPlaceholder: '请输入密码',
    confirmPassword: '确认密码',
    confirmPasswordPlaceholder: '请再次输入密码',
    register: '注 册',
    registering: '注 册 中...',
    registerSuccess: '恭喜你，您的账号 {username} 注册成功！',
    code: '验证码',
    codePlaceholder: '请输入验证码',
    refreshCode: '刷新验证码',
    refresh: '刷新',
    hasAccount: '已经有账号？',
    systemPrompt: '系统提示',
    switchLoginPage: '使用已有账户登录',
    rule: {
      username: {
        required: '请输入您的账号',
        length: '用户账号长度必须介于 {min} 和 {max} 之间'
      },
      password: {
        required: '请输入您的密码',
        length: '用户密码长度必须介于 {min} 和 {max} 之间',
        pattern: '不能包含非法字符：{strings}'
      },
      code: {
        required: '请输入验证码'
      },
      confirmPassword: {
        required: '请再次输入您的密码',
        equalToPassword: '两次输入的密码不一致'
      }
    }
  },
  // 导航栏国际化
  navbar: {
    full: '全屏',
    language: '语言',
    dashboard: '首页',
    document: '项目文档',
    message: '消息',
    layoutSize: '布局大小',
    layoutSetting: '布局设置',
    personalCenter: '个人中心',
    logout: '退出登录'
  }
};
