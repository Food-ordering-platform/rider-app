import { useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { authService } from '../services/auth/auth';

/*
|--------------------------------------------------------------------------
| Notification Behavior (App Foreground)
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

/*
|--------------------------------------------------------------------------
| Hook
|--------------------------------------------------------------------------
*/
export const usePushNotification = () => {
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);
  const [notification, setNotification] =
    useState<Notifications.Notification | null>(null);

  const notificationListener =
    useRef<Notifications.EventSubscription | null>(null);

  const responseListener =
    useRef<Notifications.EventSubscription | null>(null);

  useEffect(() => {
    registerForPushNotificationsAsync().then(async (token) => {
      if (!token) return;

      setExpoPushToken(token);

      // Send token to backend
      try {
        await authService.updateProfile({ pushToken: token });
      } catch (error) {
        console.error('Failed to save push token:', error);
      }
    });

    /*
    |--------------------------------------------------------------------------
    | Foreground Notification Listener
    |--------------------------------------------------------------------------
    */
    notificationListener.current =
      Notifications.addNotificationReceivedListener((notification) => {
        setNotification(notification);
      });

    /*
    |--------------------------------------------------------------------------
    | Notification Tap Listener
    |--------------------------------------------------------------------------
    */
    responseListener.current =
      Notifications.addNotificationResponseReceivedListener((response) => {
        console.log('Notification tapped:', response);
      });

    /*
    |--------------------------------------------------------------------------
    | Cleanup (NEW Expo Way)
    |--------------------------------------------------------------------------
    */
    return () => {
      notificationListener.current?.remove();
      responseListener.current?.remove();
    };
  }, []);

  return {
    expoPushToken,
    notification,
  };
};

/*
|--------------------------------------------------------------------------
| Register Device For Push Notifications
|--------------------------------------------------------------------------
*/
async function registerForPushNotificationsAsync(): Promise<string | null> {
  let token: string | null = null;

  /*
  |--------------------------------------------------------------------------
  | Android Channel Setup
  |--------------------------------------------------------------------------
  */
if (Platform.OS === 'android') {
    // 🔔 Create a distinct "Delivery Alerts" channel
    // We changed the ID from 'default' to 'delivery-alerts' to force a fresh setup
    await Notifications.setNotificationChannelAsync('delivery-alerts', {
      name: 'Urgent Delivery Alerts',
      importance: Notifications.AndroidImportance.MAX, // pop up on screen
      vibrationPattern: [0, 500, 200, 500], // 📳 Long-Short-Long Vibration (Aggressive)
      lightColor: '#FF231F7C',
      lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC, // Show content on lock screen
      sound: 'default', // Uses system default notification sound (loud)
      enableVibrate: true,
      enableLights: true,
    });
  }
  /*
  |--------------------------------------------------------------------------
  | Must Be Physical Device
  |--------------------------------------------------------------------------
  */
  if (!Device.isDevice) {
    console.warn('Push notifications require a physical device');
    return null;
  }

  /*
  |--------------------------------------------------------------------------
  | Permission Handling
  |--------------------------------------------------------------------------
  */
  const { status: existingStatus } =
    await Notifications.getPermissionsAsync();

  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } =
      await Notifications.requestPermissionsAsync();

    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.warn('Push notification permission denied');
    return null;
  }

  /*
  |--------------------------------------------------------------------------
  | Get Expo Push Token
  |--------------------------------------------------------------------------
  */
  try {
    const projectId =
      Constants.expoConfig?.extra?.eas?.projectId ??
      Constants.easConfig?.projectId;

    token = (
      await Notifications.getExpoPushTokenAsync({
        projectId,
      })
    ).data;
  } catch (error) {
    console.warn('Falling back to default token retrieval', error);

    token = (await Notifications.getExpoPushTokenAsync()).data;
  }

  return token;
}
