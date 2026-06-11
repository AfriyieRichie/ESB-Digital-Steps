// Pure tap-progress logic, separated from the React component so the completion
// threshold can be unit-tested without a DOM. The activity is complete only
// when the child has tapped every target.

export interface TapState {
  total: number;
  tapped: number;
}

export function initTapState(total: number): TapState {
  if (!Number.isInteger(total) || total <= 0) {
    throw new Error(`Tap activity needs a positive whole count, got: ${total}`);
  }
  return { total, tapped: 0 };
}

/** Register one tap. Never counts past total (defensive against double-fire). */
export function registerTap(state: TapState): TapState {
  if (state.tapped >= state.total) return state;
  return { ...state, tapped: state.tapped + 1 };
}

export function isTapComplete(state: TapState): boolean {
  return state.tapped >= state.total;
}

/** Progress as 0..1, for the progress indicator. */
export function tapProgress(state: TapState): number {
  return state.total === 0 ? 1 : state.tapped / state.total;
}
