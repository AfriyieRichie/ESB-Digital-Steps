import { describe, expect, it } from 'vitest';
import {
  initTapState,
  isTapComplete,
  registerTap,
  tapProgress,
} from '../src/activities/Tap/tapLogic';

describe('tap completion threshold', () => {
  it('is not complete until every target has been tapped', () => {
    let state = initTapState(3);
    expect(isTapComplete(state)).toBe(false);

    state = registerTap(state);
    expect(isTapComplete(state)).toBe(false);

    state = registerTap(state);
    expect(isTapComplete(state)).toBe(false);

    state = registerTap(state);
    expect(isTapComplete(state)).toBe(true);
  });

  it('never counts past the total, even on extra taps (double-fire safety)', () => {
    let state = initTapState(2);
    state = registerTap(state);
    state = registerTap(state);
    state = registerTap(state); // extra tap should be ignored

    expect(state.tapped).toBe(2);
    expect(isTapComplete(state)).toBe(true);
    expect(tapProgress(state)).toBe(1);
  });

  it('reports fractional progress', () => {
    let state = initTapState(4);
    state = registerTap(state);
    expect(tapProgress(state)).toBe(0.25);
  });

  it('rejects a non-positive target count', () => {
    expect(() => initTapState(0)).toThrow();
    expect(() => initTapState(-1)).toThrow();
    expect(() => initTapState(2.5)).toThrow();
  });
});
