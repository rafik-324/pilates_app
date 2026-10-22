import Constants, { ExecutionEnvironment } from 'expo-constants';
import * as Crypto from 'expo-crypto';
import * as SecureStore from 'expo-secure-store';

const KEY_NAME = 'pilates_db_key';

/** Verschlüsselung der DB (/S040/) ist in der App-Konfiguration vorbereitet (expo-sqlite Plugin mit SQLCipher). */
export const ENCRYPTION_REQUESTED = true;

export function isExpoGo(): boolean {
  return Constants.executionEnvironment === ExecutionEnvironment.StoreClient;
}

function randomHex(bytes: number): string {
  return Array.from(Crypto.getRandomBytes(bytes), (b) => b.toString(16).padStart(2, '0')).join('');
}

/** Liest den DB-Schlüssel aus dem Secure Store oder erzeugt einen neuen. */
export async function getOrCreateDbKey(): Promise<string> {
  const existing = await SecureStore.getItemAsync(KEY_NAME);
  if (existing) return existing;
  const key = randomHex(32);
  await SecureStore.setItemAsync(KEY_NAME, key);
  return key;
}

export async function deleteDbKey(): Promise<void> {
  await SecureStore.deleteItemAsync(KEY_NAME);
}
