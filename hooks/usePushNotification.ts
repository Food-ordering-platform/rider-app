import { useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { authService } from '../services/auth/auth';
// 1. Import useAuth
import { useAuth } from '../context/authContext';

/*
|--------------------------------------------------------------------------
| Notification Behavior
|--------------------------------------------------------------------------
*/
Notifications.setNotificationHandler({
  handleNotification: async (): Promise<Notifications.NotificationBehavior> => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export const usePushNotification = () => {
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);
  const [notification, setNotification] = useState<Notifications.Notification | null>(null);
  const notificationListener = useRef<Notifications.EventSubscription | null>(null);
  const responseListener = useRef<Notifications.EventSubscription | null>(null);

  // 2. Get Auth State
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    let isMounted = true;

    registerForPushNotificationsAsync().then(async (token) => {
      if (!token || !isMounted) return;

      setExpoPushToken(token);

      // 3. 🛑 ONLY SAVE TO DB IF LOGGED IN
      if (isAuthenticated) {
        try {
          console.log("🔄 Syncing Push Token to Backend...", token.slice(0, 10) + "...");
          await authService.updateProfile({ pushToken: token });
          console.log("✅ Push Token Synced Successfully!");
        } catch (error) {
          console.error('❌ Failed to save push token:', error);
        }
      } else {
        console.log("⏳ Token generated, waiting for login to sync...");
      }
    });

    notificationListener.current = Notifications.addNotificationReceivedListener((notification) => {
      setNotification(notification);
    });

    responseListener.current = Notifications.addNotificationResponseReceivedListener((response) => {
      console.log('Notification tapped:', response);
    });

    return () => {
      isMounted = false;
      notificationListener.current?.remove();
      responseListener.current?.remove();
    };
    
    // 4. 🔄 Add 'isAuthenticated' to dependencies
    // This makes the code Run Again immediately after you login!
  }, [isAuthenticated]); 

  return { expoPushToken, notification };
};

/*
|--------------------------------------------------------------------------
| Register Function (Your Nuclear Setup - Kept Same)
|--------------------------------------------------------------------------
*/
async function registerForPushNotificationsAsync(): Promise<string | null> {
  let token: string | null = null;

  if (Platform.OS === 'android') {
    await Notifications.deleteNotificationChannelAsync('delivery-alerts');
    await Notifications.setNotificationChannelAsync('chow-nuclear-v1', {
      name: 'IMMEDIATE Delivery Orders',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 2000, 500, 2000], 
      lightColor: '#FF231F7C',
      lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
      sound: 'default',
      audioAttributes: {
        usage: Notifications.AndroidAudioUsage.ALARM,
        contentType: Notifications.AndroidAudioContentType.SONIFICATION,
      },
      enableVibrate: true,
      enableLights: true,
      bypassDnd: true, 
    });
  }

  if (!Device.isDevice) return null;

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') return null;

  try {
    const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
    token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
  } catch (error) {
    token = (await Notifications.getExpoPushTokenAsync()).data;
  }

  return token;
}