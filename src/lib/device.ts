import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Device from 'expo-device';

const DEVICE_FINGERPRINT_KEY = 'device_fingerprint';

/**
 * Generate a unique device fingerprint
 */
export async function getDeviceFingerprint(): Promise<string> {
  // Check if we already have a stored fingerprint
  const stored = await AsyncStorage.getItem(DEVICE_FINGERPRINT_KEY);
  if (stored) {
    console.log('[Device] Using stored fingerprint');
    return stored;
  }

  // Generate new fingerprint from device info
  const deviceInfo = {
    modelName: Device.modelName || 'unknown',
    osName: Device.osName || 'unknown',
    osVersion: Device.osVersion || 'unknown',
    deviceName: Device.deviceName || 'unknown',
    brand: Device.brand || 'unknown',
  };
  
  console.log('[Device] Device info:', deviceInfo);
  
  const fingerprint = [
    deviceInfo.modelName,
    deviceInfo.osName,
    deviceInfo.osVersion,
    deviceInfo.deviceName,
    deviceInfo.brand,
    Date.now().toString(), // Add timestamp for uniqueness
  ].join('-');
  
  console.log('[Device] Generated new fingerprint:', fingerprint);

  // Store for future use
  await AsyncStorage.setItem(DEVICE_FINGERPRINT_KEY, fingerprint);
  return fingerprint;
}

/**
 * Clear stored device fingerprint
 */
export async function clearDeviceFingerprint(): Promise<void> {
  await AsyncStorage.removeItem(DEVICE_FINGERPRINT_KEY);
}
