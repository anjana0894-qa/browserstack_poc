#!/usr/bin/env node
/**
 * Fail fast when BrowserStack credentials are missing or empty.
 * Usage: import './validate-browserstack-secrets.js' (ESM side-effect import)
 */
const username = (process.env.BROWSERSTACK_USERNAME || '').trim();
const accessKey = (process.env.BROWSERSTACK_ACCESS_KEY || '').trim();

const missing = [];
if (!username) missing.push('BROWSERSTACK_USERNAME');
if (!accessKey) missing.push('BROWSERSTACK_ACCESS_KEY');

if (missing.length) {
  console.error(
    '::error::Missing or empty BrowserStack credentials: ' +
      missing.join(', ') +
      '. Set them as env vars locally, or as GitHub Actions repository secrets ' +
      '(Settings → Secrets and variables → Actions).',
  );
  process.exit(1);
}

console.log('BrowserStack credentials present (username length %d).', username.length);
