import { useEffect, useState } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { View, ActivityIndicator } from 'react-native';
import { User } from 'firebase/auth';
import { onAuthChange, getProfile } from '../lib/firebase';
import { registerForPushNotifications } from '../lib/notifications';
import NetworkBanner from '../components/NetworkBanner';
import { Colors } from '../constants/theme';

export default function RootLayout() {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    const unsub = onAuthChange(async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        const profile = await getProfile(firebaseUser.uid).catch(() => null);
        setRole(profile?.role ?? 'customer');
        registerForPushNotifications(firebaseUser.uid).catch(() => {});
      } else {
        setRole(null);
      }
      setLoading(false);
    });
    return unsub;
  }, []);

  useEffect(() => {
    if (loading) return;
    const inAuth = segments[0] === 'auth';
    const inSplash = segments[0] === 'splash';
    if (inSplash) return;
    if (!user && !inAuth) {
      router.replace('/auth/login');
    } else if (user && inAuth) {
      router.replace(role === 'admin' ? '/admin-tabs/dashboard' : '/customer-tabs/browse');
    }
  }, [user, loading, role, segments]);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.primary }}>
        <ActivityIndicator size="large" color={Colors.white} />
      </View>
    );
  }

  return (
    <>
      <NetworkBanner />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="splash" />
        <Stack.Screen name="auth" />
        <Stack.Screen name="customer-tabs" />
        <Stack.Screen name="admin-tabs" />
      </Stack>
    </>
  );
}
