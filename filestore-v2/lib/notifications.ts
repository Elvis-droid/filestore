import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { savePushToken } from './firebase';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export async function registerForPushNotifications(userId: string) {
  const { status: existing } = await Notifications.getPermissionsAsync();
  let finalStatus = existing;
  if (existing !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  if (finalStatus !== 'granted') return null;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'FileStore',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#1E3A5F',
    });
  }

  try {
    const token = (await Notifications.getExpoPushTokenAsync()).data;
    await savePushToken(userId, token);
    return token;
  } catch {
    return null;
  }
}

export async function sendLocalNotification(title: string, body: string) {
  await Notifications.scheduleNotificationAsync({
    content: { title, body, sound: true },
    trigger: null,
  });
}

export async function notifyCustomerAccessGranted(fileTitle: string) {
  await sendLocalNotification(
    'Access Granted!',
    `You now have access to "${fileTitle}". Go to My Downloads to get your file.`
  );
}
