import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.pabloscarlattoentrenamientos.app',
  appName: 'GymRat by Pablo Scarlatto',
  webDir: 'out',
  server: {
    url: 'https://pabloscarlattoentrenamientos.com',
    cleartext: false,
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#09090b',
      showSpinner: false,
    },
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert'],
    },
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#09090b',
    },
  },
  android: {
    backgroundColor: '#09090b',
    allowMixedContent: false,
    captureInput: true,
    webContentsDebuggingEnabled: false,
  },
  ios: {
    backgroundColor: '#09090b',
    contentInset: 'automatic',
    scheme: 'Pablo Scarlatto',
  },
};

export default config;
