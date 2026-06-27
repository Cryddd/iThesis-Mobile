import * as SecureStore from 'expo-secure-store';

const DEVICE_ID_KEY = 'ithesis_device_id';

let cached: string | null = null;

function randomId(): string {
  // RFC4122-ish v4 — good enough for a stable per-install device fingerprint.
  const hex = '0123456789abcdef';
  let out = '';
  for (let i = 0; i < 32; i += 1) {
    out += hex[Math.floor(Math.random() * 16)];
  }
  return `${out.slice(0, 8)}-${out.slice(8, 12)}-4${out.slice(13, 16)}-${out.slice(16, 20)}-${out.slice(20)}`;
}

/**
 * Returns a stable device id used for single-device enforcement.
 * The backend ties an active session to this id; logging in elsewhere
 * invalidates the previous device.
 */
export async function getOrCreateDeviceId(): Promise<string> {
  if (cached) return cached;
  try {
    const existing = await SecureStore.getItemAsync(DEVICE_ID_KEY);
    if (existing) {
      cached = existing;
      return existing;
    }
    const fresh = randomId();
    await SecureStore.setItemAsync(DEVICE_ID_KEY, fresh);
    cached = fresh;
    return fresh;
  } catch {
    // SecureStore unavailable (e.g. web) — fall back to an in-memory id.
    if (!cached) cached = randomId();
    return cached;
  }
}
