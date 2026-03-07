const ACCOUNT_STATE_KEY = 'account-state';

export interface StoredAccountState {
  status?: string;
  message?: string;
}

export const setStoredAccountState = (value: StoredAccountState) => {
  sessionStorage.setItem(ACCOUNT_STATE_KEY, JSON.stringify(value));
};

export const getStoredAccountState = (): StoredAccountState | null => {
  const raw = sessionStorage.getItem(ACCOUNT_STATE_KEY);
  if (!raw) return null;

  try {
    return JSON.parse(raw) as StoredAccountState;
  } catch {
    sessionStorage.removeItem(ACCOUNT_STATE_KEY);
    return null;
  }
};

export const clearStoredAccountState = () => {
  sessionStorage.removeItem(ACCOUNT_STATE_KEY);
};
