// SDK 54 made the object-oriented File API the default; the classic
// downloadAsync/cacheDirectory helpers live under the legacy entry point.
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { Linking, Platform } from 'react-native';

import { API_ORIGIN } from '@/config/env';
import { authState } from '@/api/authState';
import { getOrCreateDeviceId } from '@/utils/deviceId';

/**
 * Authenticated download of a server file (thesis PDF, executive summary,
 * generated certificate/form, analytics report export), then hand it to the OS
 * share/preview sheet.
 *
 * The web opens these via in-app fetch + blob; on mobile we replicate the auth
 * (X-User header fallback + session cookie + device id) with expo-file-system
 * so staff-only documents resolve correctly, then open with expo-sharing.
 */
export async function downloadAndOpen(
  pathOrUrl: string,
  filename: string,
): Promise<void> {
  const url = /^https?:\/\//i.test(pathOrUrl)
    ? pathOrUrl
    : `${API_ORIGIN}${pathOrUrl.startsWith('/') ? '' : '/'}${pathOrUrl}`;

  const headers: Record<string, string> = {
    'X-Device-Id': await getOrCreateDeviceId(),
  };
  const user = authState.get();
  if (user) {
    headers['X-User'] = user.fullName || user.username;
    headers['X-User-Role'] = user.role;
    headers['X-User-ID'] = String(user.id);
  }

  const safeName = filename.replace(/[^\w.\-]+/g, '_');
  const target = `${FileSystem.cacheDirectory}${safeName}`;

  const result = await FileSystem.downloadAsync(url, target, { headers });
  if (result.status >= 400) {
    throw new Error(`Download failed (${result.status}).`);
  }

  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(result.uri, { mimeType: 'application/pdf' });
  } else if (Platform.OS === 'web') {
    await Linking.openURL(url);
  }
}
