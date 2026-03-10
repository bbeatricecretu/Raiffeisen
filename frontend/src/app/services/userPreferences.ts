const STORAGE_KEY = 'app-settings';

export const SMALL_AMOUNT_THRESHOLD_RON = 10;

type StoredSettings = {
  hideSmallAmounts?: boolean;
};

export function getHideSmallAmountsPreference(): boolean {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return false;
    const parsed = JSON.parse(raw) as StoredSettings;
    return !!parsed.hideSmallAmounts;
  } catch {
    return false;
  }
}

export function shouldHideAmount(amount: number, hideSmallAmounts: boolean): boolean {
  return hideSmallAmounts && Math.abs(amount) < SMALL_AMOUNT_THRESHOLD_RON;
}
