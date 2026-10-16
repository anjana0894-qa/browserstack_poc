#!/usr/bin/env node
import { spawn, spawnSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import 'dotenv/config';

import {
  PERCY_BASELINE_BRANCH,
  PERCY_COMPARE_BRANCH,
  envForGolivePercyPhase,
} from '../../functional/helpers/golive-percy-env.js';
import {
  DEFAULT_BASELINE_ORIGIN,
  DEFAULT_COMPARE_ORIGIN,
} from '../../functional/helpers/golive-env.js';
import {
  INCLUDE_MOBILE,
  INCLUDE_SUITES,
  SMOKE_INCLUDE_SUITES,
  RUN_PHASES,
} from './visual-validation.config.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const WWW_ORIGIN = DEFAULT_BASELINE_ORIGIN;
const PROD_ORIGIN = DEFAULT_COMPARE_ORIGIN;

function isSmokeRun() {
  return /^1|true|yes$/i.test((process.env.VV_SMOKE ?? '').trim());
}

const root = path.join(__dirname, '../..');
const VV_ROOT = path.join(root, 'functional/visual-validation');
const PROJECT = 'visual-validation';

function hasSpecFiles(dir) {
  if (!fs.existsSync(dir)) return false;
  return fs
    .readdirSync(dir, { withFileTypes: true })
    .some((e) => e.isFile() && e.name.endsWith('.spec.js'));
}

const PHASE_HOST = {
  baseline: 'https://rahulshettyacademy.com/angularpractice/',
  compare: 'https://rahulshettyacademy.com/angularpractice/',
};

const PERCY_FILTERS = ['baseline', 'compare', 'compare-www', 'both'];

const mode = (process.argv[2] || 'percy').trim().toLowerCase();
const filter = (process.argv[3] || '').trim().toLowerCase();
const forwarded = process.argv.slice(filter && PERCY_FILTERS.includes(filter) ? 4 : 3);

/**
 * @param {'baseline' | 'compare'} phase
 * @returns {string}
 */
function resolveCaptureHost(phase) {
  const raw = (process.env.VV_HOST || '').trim();
  if (raw.startsWith('http://') || raw.startsWith('https://')) {
    return raw.replace(/\/$/, '');
  }
  
  if (phase === 'baseline') {
    return (process.env.GOLIVE_BASELINE_URL || DEFAULT_BASELINE_ORIGIN).trim().replace(/\/$/, '');
  } else {
    return (process.env.GOLIVE_COMPARE_URL || DEFAULT_COMPARE_ORIGIN).trim().replace(/\/$/, '');
  }
}

function captureHostLabel(phase) {
  try {
    return new URL(resolveCaptureHost(phase)).hostname;
  } catch {
    return resolveCaptureHost(phase);
  }
}

function activeSuites() {
  if (isSmokeRun()) return SMOKE_INCLUDE_SUITES;
  const fromEnv = (process.env.VV_INCLUDE_SUITES || '').trim();
  if (fromEnv) {
    return fromEnv
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
  }
  return INCLUDE_SUITES;
}

function buildPlan() {
  const steps = [];

  for (const suite of activeSuites()) {
    const suiteRoot = path.join(VV_ROOT, suite);
    if (!hasSpecFiles(suiteRoot)) continue;

    const rel = path.relative(root, suiteRoot).split(path.sep).join('/');

    for (const phase of RUN_PHASES) {
      if (phase !== 'baseline' && phase !== 'compare') continue;
      steps.push({
        id: `${suite}.${phase}`,
        label: `${rel} · ${captureHostLabel(phase)} · ${phase}`,
        phase,
        path: rel,
        percyGroup: phase,
      });
    }
  }

  return steps;
}

let PLAN = buildPlan();

function stepsForRun(runMode, percyFilter) {
  let steps = PLAN;

  if (runMode === 'local' || runMode === 'bstack') {
    steps = steps.filter((s) => s.phase === 'compare');
  } else if (runMode === 'percy') {
    if (percyFilter === 'baseline') steps = steps.filter((s) => s.percyGroup === 'baseline');
    else if (percyFilter === 'compare' || percyFilter === 'compare-www') {
      steps = steps.filter((s) => s.percyGroup === 'compare');
      if (percyFilter === 'compare-www' || resolveCaptureHost('compare') === WWW_ORIGIN) {
        steps = steps.map((s) => ({
          ...s,
          label: s.label.replace(PHASE_HOST.compare, captureHostLabel('compare')),
        }));
      }
    }
  }

  if (steps.length === 0) {
    console.error(`[visual-validation] No steps for mode=${runMode} filter=${percyFilter || '(all)'}`);
    console.error(`  suites=${activeSuites().join(', ')}`);
    process.exit(1);
  }
  return steps;
}

function baseEnv(phase) {
  const channel = (process.env.PLAYWRIGHT_CHROME_CHANNEL ?? '').trim();
  const env = {
    ...process.env,
    GOLIVE_PERCY_PHASE: phase,
    VV_INCLUDE_MOBILE: INCLUDE_MOBILE ? '1' : '0',
    ...(isSmokeRun() ? { VV_PAGE_SMOKE: '1', VV_SMOKE: '1' } : {}),
    NODE_TLS_REJECT_UNAUTHORIZED: process.env.NODE_TLS_REJECT_UNAUTHORIZED ?? '0',
  };

  if (channel && channel !== '0' && channel.toLowerCase() !== 'bundled') {
    env.PLAYWRIGHT_CHROME_CHANNEL = channel;
  } else if (!process.env.CI && !channel) {
    env.PLAYWRIGHT_CHROME_CHANNEL = 'chrome';
  } else {
    delete env.PLAYWRIGHT_CHROME_CHANNEL;
  }

  const captureUrl = resolveCaptureHost(phase);
  if (phase === 'baseline') {
    env.GOLIVE_BASELINE_URL = (process.env.GOLIVE_BASELINE_URL || captureUrl).trim();
  } else {
    env.GOLIVE_COMPARE_URL = (process.env.GOLIVE_COMPARE_URL || captureUrl).trim();
  }

  return env;
}

function runPlaywright(testPaths, phase, usePercy) {

const scopeArgs = isSmokeRun() ? ['--grep', '@smoke'] : [];

const pwArgs = [
  'playwright',
  'test',
  `--project=${PROJECT}`,
  ...testPaths,
  ...scopeArgs,
  ...forwarded,
];
  const env = usePercy ? envForGolivePercyPhase(phase, baseEnv(phase)) : baseEnv(phase);
  
  // Do NOT nest percy exec here since run-workflow.js already wraps the outer execution
  const cmd = pwArgs;

  console.log(
    `[visual-validation] playwright phase=${phase} mobile=${INCLUDE_MOBILE}` +
      ` host=${captureHostLabel(phase)}` +
      ` paths=${testPaths.join(', ')}` +
      (usePercy ? ` PERCY_BRANCH=${env.PERCY_BRANCH}` : '') +
      (env.PERCY_TARGET_BRANCH ? ` PERCY_TARGET_BRANCH=${env.PERCY_TARGET_BRANCH}` : ''),
  );

  const r = spawnSync('npx', cmd, {
    cwd: root,
    encoding: 'utf8',
    env,
    shell: process.platform === 'win32',
    stdio: ['inherit', 'inherit', 'inherit'],
  });

  const stdout = r.stdout || '';
  if (stdout) process.stdout.write(stdout);
  if (r.error) {
    console.error(r.error);
    return { code: 1 };
  }

  const code = typeof r.status === 'number' ? r.status : 1;
  let buildId;
  // If running under an outer percy exec wrapper, build IDs are managed by the CLI.
  return { code, buildId };
}

function waitForPercyBuild(buildId) {
  console.log(`[visual-validation] Waiting for baseline build ${buildId}…`);
  const r = spawnSync('npx', ['percy', 'build:wait', '--build', buildId], {
    cwd: root,
    stdio: 'inherit',
    env: envForGolivePercyPhase('baseline', baseEnv('baseline')),
    shell: process.platform === 'win32',
  });
  return typeof r.status === 'number' ? r.status : 1;
}

function approveBaselineBuild(buildId) {
  if (!buildId) return 0;
  if (/^1|true|yes$/i.test((process.env.VV_SKIP_BASELINE_APPROVE ?? '').trim())) {
    console.log('[visual-validation] Skipping build:approve (VV_SKIP_BASELINE_APPROVE)');
    return 0;
  }

  console.log(
    `[visual-validation] Approving baseline build ${buildId} on ${PERCY_BASELINE_BRANCH} ` +
      '(so compare shows www on the left)…',
  );
  const r = spawnSync('npx', ['percy', 'build:approve', buildId], {
    cwd: root,
    stdio: 'inherit',
    env: envForGolivePercyPhase('baseline', baseEnv('baseline')),
    shell: process.platform === 'win32',
  });
  const code = typeof r.status === 'number' ? r.status : 1;
  if (code !== 0) {
    console.warn(
      `[visual-validation] build:approve exited ${code}. ` +
        `Open build ${buildId} in Percy → Approve. Then re-run compare.`,
    );
  }
  return code;
}

function groupStepsForPercy(steps, percyFilter) {
  function batchForGroup(percyGroup) {
    const groupSteps = steps.filter((s) => s.percyGroup === percyGroup);
    if (!groupSteps.length) return null;
    const paths = [...new Set(groupSteps.map((s) => s.path))];
    return {
      phase: percyGroup,
      percyGroup,
      paths,
      labels: groupSteps.map((s) => s.label),
    };
  }

  if (percyFilter === 'baseline') {
    const batch = batchForGroup('baseline');
    return batch ? [batch] : [];
  }
  if (percyFilter === 'compare' || percyFilter === 'compare-www') {
    const batch = batchForGroup('compare');
    return batch ? [batch] : [];
  }

  const batches = [];
  const baseline = batchForGroup('baseline');
  const compare = batchForGroup('compare');
  if (baseline) batches.push(baseline);
  if (compare) batches.push(compare);
  return batches;
}

function runPercy() {
  if (!process.env.PERCY_TOKEN?.trim()) {
    console.error('[visual-validation] PERCY_TOKEN is required');
    process.exit(1);
  }

  const percyFilter = PERCY_FILTERS.includes(filter) ? filter : 'both';
  const steps = stepsForRun('percy', percyFilter === 'both' ? undefined : percyFilter);
  const batches = groupStepsForPercy(steps, percyFilter);

  console.log(
    `[visual-validation] suites=${activeSuites().join(', ')}${isSmokeRun() ? ' (smoke)' : ''} filter=${percyFilter}` +
      ` strategy=target branches baseline="${PERCY_BASELINE_BRANCH}" compare="${PERCY_COMPARE_BRANCH}"` +
      ` percy_builds=${batches.length}`,
  );

  for (const batch of batches) {
    console.log(`  · Percy build (${batch.percyGroup}): ${batch.paths.join(', ')}`);
    batch.labels.forEach((label) => console.log(`      ${label}`));
  }

  for (let i = 0; i < batches.length; i++) {
    const batch = batches[i];
    const r = runPlaywright(batch.paths, batch.phase, true);
    if (r.code !== 0) process.exit(r.code);

    if (batch.percyGroup === 'baseline' && r.buildId) {
      const w = waitForPercyBuild(r.buildId);
      if (w !== 0) {
        console.warn(
          `[visual-validation] build:wait failed (${w}); continuing. ` +
            `Wait for build ${r.buildId} to finish, approve it, then run compare.`,
        );
      }
      approveBaselineBuild(r.buildId);

      const hasCompare = batches.slice(i + 1).some((b) => b.percyGroup === 'compare');
      if (hasCompare && w !== 0) {
        const pause = Number.parseInt(process.env.GOLIVE_PAUSE_BEFORE_COMPARE_MS ?? '45000', 10);
        console.log(`[visual-validation] sleeping ${pause}ms before compare…`);
        const end = Date.now() + pause;
        while (Date.now() < end) {
          /* sync */
        }
      }
    }
  }
  process.exit(0);
}

function runLocalOrBstack(runMode) {
  const steps = stepsForRun(runMode);
  const paths = steps.map((s) => s.path);
  console.log(`[visual-validation] ${runMode} · ${steps.length} step(s) mobile=${INCLUDE_MOBILE}`);
  steps.forEach((s) => console.log(`  · ${s.label}`));

  if (runMode === 'bstack') {
    const secretsCheck = spawnSync(process.execPath, [path.join(root, 'scripts', 'validate-browserstack-secrets.js')], {
      cwd: root,
      stdio: 'inherit',
      env: process.env,
    });
    if ((secretsCheck.status ?? 1) !== 0) process.exit(secretsCheck.status ?? 1);

    const configFile = (process.env.BROWSERSTACK_CONFIG_FILE || 'browserstack.cloud-golive.yml').trim();
    const envPath = path.join(root, '.env');
    const nodeOpts = (process.env.NODE_OPTIONS || '').split(/\s+/).filter(Boolean);
    if (!nodeOpts.includes('--use-openssl-ca')) nodeOpts.push('--use-openssl-ca');
    const runner = path.join(root, 'node_modules', 'browserstack-node-sdk', 'src', 'bin', 'runner.js');

    const child = spawn(
      process.execPath,
      ['-r', 'dotenv/config', runner, 'playwright', 'test', `--project=${PROJECT}`, ...paths, ...forwarded],
      {
        cwd: root,
        stdio: 'inherit',
        env: {
          ...baseEnv('compare'),
          BROWSERSTACK_CONFIG_FILE: configFile,
          DOTENV_CONFIG_PATH: envPath,
          NODE_OPTIONS: nodeOpts.join(' ').trim(),
        },
      },
    );
    child.on('exit', (code, signal) => {
      if (signal) process.kill(process.pid, signal);
      process.exit(code == null ? 1 : code);
    });
    return;
  }

  const r = runPlaywright(paths, 'compare', false);
  process.exit(r.code);
}

function printUsage() {
  console.error(`
Usage:
  node scripts/visual-validation/run.js percy [baseline|compare|compare-www|both] [playwright args…]
  node scripts/visual-validation/run.js local [playwright args…]
  node scripts/visual-validation/run.js bstack [playwright args…]
`);
}

if (!['local', 'percy', 'bstack'].includes(mode)) {
  printUsage();
  process.exit(1);
}

if (mode === 'percy' && filter && !PERCY_FILTERS.includes(filter)) {
  printUsage();
  process.exit(1);
}

if (PLAN.length === 0) {
  console.error('[visual-validation] No spec files found for INCLUDE_SUITES');
  process.exit(1);
}

if (mode === 'percy') runPercy();
else runLocalOrBstack(mode);