'use strict';

import { PERCY_BASELINE_BRANCH, PERCY_COMPARE_BRANCH } from './golive-percy-env.js';

/** @typedef {'baseline' | 'compare'} GolivePercyPhase */

export const DEFAULT_BASELINE_ORIGIN = 'https://www.rahulshettyacademy.com';
export const DEFAULT_COMPARE_ORIGIN = 'https://prod.rahulshettyacademy.com';
export const DEFAULT_PERCY_BASELINE_BRANCH = 'go-live_baseline_0.1';
export const DEFAULT_PERCY_COMPARE_BRANCH = 'go-live_destination_0.1';

/**
 * @returns {GolivePercyPhase}
 */
export function resolveGolivePhase() {
  const raw = (process.env.GOLIVE_PERCY_PHASE || 'baseline').trim().toLowerCase();
  if (raw === 'baseline' || raw === 'source' || raw === 'www') return 'baseline';
  if (raw === 'compare' || raw === 'destination' || raw === 'prod') return 'compare';
  throw new Error(
    `GOLIVE_PERCY_PHASE must be baseline|compare (got "${process.env.GOLIVE_PERCY_PHASE}")`,
  );
}

/**
 * @param {GolivePercyPhase} expected
 */
export function assertGolivePhase(expected) {
  const actual = resolveGolivePhase();
  if (actual !== expected) {
    throw new Error(
      `Wrong go-live phase: expected "${expected}" (set GOLIVE_PERCY_PHASE / npm script). Got "${actual}".`,
    );
  }
}

function stripTrailingSlash(url) {
  return String(url || '').replace(/\/$/, '');
}

/**
 * Active origin for navigation (baseline = www, compare = prod).
 * @param {GolivePercyPhase} [phase]
 */
export function goliveBaseOrigin(phase = resolveGolivePhase()) {
  if (phase === 'baseline') {
    return stripTrailingSlash(process.env.GOLIVE_BASELINE_URL || DEFAULT_BASELINE_ORIGIN);
  }
  return stripTrailingSlash(process.env.GOLIVE_COMPARE_URL || DEFAULT_COMPARE_ORIGIN);
}

/**
 * @param {string} pathname e.g. `/angularpractice`
 * @param {GolivePercyPhase} [phase]
 */
export function golivePageUrl(pathname, phase = resolveGolivePhase()) {
  const path = pathname.startsWith('/') ? pathname : `/${pathname}`;
  return `${goliveBaseOrigin(phase)}${path}`;
}

export function percyBranchNames() {
  return {
    baselineBranch: PERCY_BASELINE_BRANCH,
    compareBranch: PERCY_COMPARE_BRANCH,
  };
}