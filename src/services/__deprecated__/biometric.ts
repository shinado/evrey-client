import * as LocalAuthentication from 'expo-local-authentication';
import i18n from '../../i18n';
export const biometricAuth = async () => {
  try {
    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    const isEnrolled = await LocalAuthentication.isEnrolledAsync();
    
    if (hasHardware && isEnrolled) {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: i18n.t('auth.verify.prompt'),
        fallbackLabel: i18n.t('auth.verify.fallback'),
        cancelLabel: i18n.t('auth.verify.cancel'),
        disableDeviceFallback: false,
      });
      
      return result.success;
    }
    return false;
  } catch (error) {
    console.error('Biometric auth error:', error);
    return false;
  }
}; 