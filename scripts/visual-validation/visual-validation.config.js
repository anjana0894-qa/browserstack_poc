export default {
  INCLUDE_MOBILE: true,
  INCLUDE_SUITES: ['angular-practice'],
  SMOKE_INCLUDE_SUITES: ['angular-practice'],
  RUN_PHASES: ['baseline', 'compare'],
  TARGET_URLS: {
    base: 'https://rahulshettyacademy.com/angularpractice/',
    shop: 'https://rahulshettyacademy.com/angularpractice/shop',
  },
};