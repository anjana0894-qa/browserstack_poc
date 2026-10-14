'use strict';

/**
 * Percy branches for go-live visual validation.
 *
 * Baseline captures www.rahulshettyacademy.com on PERCY_BASELINE_BRANCH.
 * Compare captures prod.rahulshettyacademy.com on PERCY_COMPARE_BRANCH with
 * PERCY_TARGET_BRANCH = baseline branch.
 */

export const PERCY_DEFAULT_BASELINE_BRANCH = 'go-live_test_baseline_christian_123';
export const PERCY_DEFAULT_COMPARE_BRANCH = 'go-live_destination_christian';

export const PERCY_BASELINE_BRANCH =
  process.env.PERCY_BASELINE_BRANCH?.trim() ||
  process.env.PERCY_WWW_BRANCH?.trim() ||
  PERCY_DEFAULT_BASELINE_BRANCH;

export const PERCY_COMPARE_BRANCH =
  process.env.PERCY_COMPARE_BRANCH?.trim() ||
  process.env.PERCY_PROD_BRANCH?.trim() ||
  PERCY_DEFAULT_COMPARE_BRANCH;

const PERCY_ENV_STRIP_KEYS = [
  'PERCY_PARALLEL_TOTAL',
  'PERCY_PARALLEL_NONCE',
  'PERCY_PARTIAL_BUILD',
  'PERCY_PULL_REQUEST',
  'PERCY_TARGET_COMMIT',
];

/**
 * @param {'baseline' | 'compare'} phase
 * @param {NodeJS.ProcessEnv} [baseEnv]
 */
export function envForGolivePercyPhase(phase, baseEnv = process.env) {
  const env = { ...baseEnv };

  for (const k of PERCY_ENV_STRIP_KEYS) {
    delete env[k];
  }

  env.PERCY_COMPARE_STRATEGY = (env.PERCY_COMPARE_STRATEGY || 'target').trim().toLowerCase();

  if (phase === 'baseline') {
    env.GOLIVE_PERCY_PHASE = 'baseline';
    env.PERCY_BRANCH = PERCY_BASELINE_BRANCH;
    delete env.PERCY_TARGET_BRANCH;
    return env;
  }

  if (phase === 'compare') {
    env.GOLIVE_PERCY_PHASE = 'compare';
    env.PERCY_BRANCH = PERCY_COMPARE_BRANCH;
    env.PERCY_TARGET_BRANCH = PERCY_BASELINE_BRANCH;
    return env;
  }

  throw new Error(`envForGolivePercyPhase: phase must be baseline|compare, got ${phase}`);
}