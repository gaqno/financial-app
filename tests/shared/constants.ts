export interface TestUser {
  email: string;
  password: string;
}

export const TEST_USER: TestUser = {
  email: 'demo@financeapp.com',
  password: 'demo123',
};

export const TEST_CONFIG = {
  SELECTORS: {
    EMAIL_INPUT: 'input[type="email"]',
    PASSWORD_INPUT: 'input[type="password"]',
    SUBMIT_BUTTON: 'button[type="submit"]',
    APP_TITLE: 'h1:has-text("por.quinho")',
  },
  AUTH_TIMEOUT: 10000,
  LOGIN_TIMEOUT: 10000,
  FORM_VALIDATION_DELAY: 1000,
  SHEET_ANIMATION_DELAY: 1000,
} as const;