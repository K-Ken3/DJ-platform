// Tiny external store so any screen can show the same connection indicator while
// the API layer waits on a cold server or an unusually slow request.
// Plain data + listeners only: safe to import from server and client code alike.

export type WakeState = {
  visible: boolean;
  // 'waking' = free instance is booting, secondsLeft counts down to the retry budget.
  // 'loading' = request has been in flight a while, elapsed counts up.
  mode: 'waking' | 'loading';
  secondsLeft: number;
  elapsed: number;
  attempt: number;
};

export const IDLE: WakeState = { visible: false, mode: 'loading', secondsLeft: 0, elapsed: 0, attempt: 0 };

let state: WakeState = IDLE;
const listeners = new Set<() => void>();

export function getWakeState(): WakeState {
  return state;
}

export function setWakeState(next: WakeState): void {
  state = next;
  listeners.forEach((listener) => listener());
}

export function subscribeWakeState(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
