export default {
  // 路由国际化
  route: {
    dashboard: 'Dashboard',
    document: 'Document'
  },
  // 登录页面国际化
  login: {
    username: 'Username',
    password: 'Password',
    login: 'Login',
    logging: 'Logging...',
    code: 'Verification Code',
    usernamePlaceholder: 'Enter administrator account',
    passwordPlaceholder: 'Enter your password',
    codePlaceholder: 'Enter verification code',
    welcomeEyebrow: 'Secure workspace',
    welcome: 'Welcome back',
    welcomeDescription: 'Sign in to manage your operations, workflows, and system resources.',
    rememberPassword: 'Remember me',
    securityNote: 'Encrypted connection enabled',
    socialLabel: 'Or continue with',
    noAccount: 'New to the platform?',
    refreshCode: 'Refresh verification code',
    refresh: 'Refresh',
    switchRegisterPage: 'Sign up now',
    showcase: {
      eyebrow: 'Built for focused operations',
      headline: 'Keep complex systems clear and composed.',
      description: 'Bring permissions, workflows, and data into one operational workspace built for decisive teams.',
      pointOne: 'Granular access and organization',
      pointTwo: 'Traceable business workflows',
      pointThree: 'Live system visibility'
    },
    rule: {
      username: {
        required: 'Please enter your account'
      },
      password: {
        required: 'Please enter your password'
      },
      code: {
        required: 'Please enter a verification code'
      }
    },
    social: {
      wechat: 'Wechat Login',
      maxkey: 'MaxKey Login',
      topiam: 'TopIam Login',
      gitee: 'Gitee Login',
      github: 'Github Login'
    }
  },
  // 注册页面国际化
  register: {
    welcomeEyebrow: 'Create your workspace',
    welcome: 'Create account',
    welcomeDescription: 'Set up your account and begin a clear, focused management experience.',
    username: 'Username',
    usernamePlaceholder: 'Enter your username',
    password: 'Password',
    passwordPlaceholder: 'Enter your password',
    confirmPassword: 'Confirm Password',
    confirmPasswordPlaceholder: 'Enter your password again',
    register: 'Register',
    registering: 'Registering...',
    registerSuccess: 'Congratulations, your {username} account has been registered!',
    code: 'Verification Code',
    codePlaceholder: 'Enter verification code',
    refreshCode: 'Refresh verification code',
    refresh: 'Refresh',
    hasAccount: 'Already have an account?',
    systemPrompt: 'System prompt',
    switchLoginPage: 'Log in with an existing account',
    rule: {
      username: {
        required: 'Please enter your account',
        length: 'The length of the user account must be between {min} and {max}'
      },
      password: {
        required: 'Please enter your password',
        length: 'The user password must be between {min} and {max} in length',
        pattern: "Can't contain illegal characters: {strings}"
      },
      code: {
        required: 'Please enter a verification code'
      },
      confirmPassword: {
        required: 'Please enter your password again',
        equalToPassword: 'The password entered twice is inconsistent'
      }
    }
  },
  // 导航栏国际化
  navbar: {
    full: 'Full Screen',
    language: 'Language',
    dashboard: 'Dashboard',
    document: 'Document',
    message: 'Message',
    layoutSize: 'Layout Size',
    layoutSetting: 'Layout Setting',
    personalCenter: 'Personal Center',
    logout: 'Logout'
  }
};
