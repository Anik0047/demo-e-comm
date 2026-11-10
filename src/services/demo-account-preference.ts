export const DEMO_ACCOUNT_PREFERENCE_KEY = "kenakata:demo-account-id";

function getSessionStorage(): Storage | null {
  if (typeof window === "undefined") return null;
  try {
    return window.sessionStorage;
  } catch {
    return null;
  }
}

/** Stores only a demo account ID in this tab's session; never stores domain data or credentials. */
export function readDemoAccountPreference(): string | null {
  try {
    return getSessionStorage()?.getItem(DEMO_ACCOUNT_PREFERENCE_KEY) ?? null;
  } catch {
    return null;
  }
}

export function writeDemoAccountPreference(accountId: string): boolean {
  try {
    const storage = getSessionStorage();
    if (!storage) return false;
    storage.setItem(DEMO_ACCOUNT_PREFERENCE_KEY, accountId);
    return true;
  } catch {
    return false;
  }
}

export function clearDemoAccountPreference(): void {
  try {
    getSessionStorage()?.removeItem(DEMO_ACCOUNT_PREFERENCE_KEY);
  } catch {
    // Session preferences are optional; the store falls back to the seeded customer.
  }
}
