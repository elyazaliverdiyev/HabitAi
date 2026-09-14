
import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.habitai.tracker',
  appName: 'HabitAi',
  webDir: 'dist',
  server: {
    androidScheme: 'https', // Changed to https for production domain
    hostname: 'tryhabitai.com', // Updated to new domain
    allowNavigation: [
      "*"
    ]
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: "#ffffff",
      showSpinner: false,
    },
    GoogleAuth: {
      scopes: ['profile', 'email'],
      serverClientId: '176216214870-8tmdotpr9ga1u1f4hq4oc65ucos6vhio.apps.googleusercontent.com',
      forceCodeForRefreshToken: true,
    },
  },
};

export default config;
