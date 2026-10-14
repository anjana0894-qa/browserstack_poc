#!/usr/bin/env node
import { spawnSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.join(__dirname, '../..');

const phase = (process.argv[2] || '').trim().toLowerCase();
if (phase !== 'baseline' && phase !== 'compare') {
  console.error('Usage: node scripts/visual-validation/run-workflow.js baseline|compare');
  process.exit(1);
}

const host = process.env.VV_HOST || 'https://rahulshettyacademy.com/angularpractice/';
const scope = process.env.VV_SCOPE || 'full';

const env = {
  ...process.env,
  BASE_URL: host,
  VV_SMOKE: scope === 'smoke' ? '1' : '0',
};

console.log(`[angular-practice-workflow] phase=${phase} scope=${scope} target=${host}`);

// Let Percy wrap the execution directly; BrowserStack SDK handles cloud hooks via browserstack.yml
const runScriptPath = path.join(__dirname, 'run.js');
const command = `npx percy exec -- node "${runScriptPath}" percy ${phase}`;

const r = spawnSync(command, {
  cwd: root,
  stdio: 'inherit',
  env,
  shell: true,
});

process.exit(typeof r.status === 'number' ? r.status : 1);