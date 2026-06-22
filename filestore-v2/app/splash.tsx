import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/theme';

export default function SplashScreen() {
  const router = useRouter();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.7)).current;
  const textFade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true, easing: Easing.out(Easing.cubic) }),
        Animated.timing(scaleAnim, { toValue: 1, duration: 600, useNativeDriver: true, easing: Easing.out(Easing.back(1.5)) }),
      ]),
      Animated.timing(textFade, { toValue: 1, duration: 400, useNativeDriver: true, delay: 100 }),
    ]).start();

    const timer = setTimeout(() => router.replace('/auth/login'), 2200);
    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.logoBox, { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }]}>
        <Ionicons name="cloud-download" size={52} color={Colors.white} />
      </Animated.View>
      <Animated.View style={{ opacity: textFade, alignItems: 'center' }}>
        <Text style={styles.appName}>FileStore</Text>
        <Text style={styles.tagline}>Your digital downloads hub</Text>
      </Animated.View>
      <View style={styles.footer}>
        <Text style={styles.footerText}>Powered by FileStore</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1, backgroundColor: Colors.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  logoBox: {
    width: 100, height: 100, borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center', justifyContent: 'center', marginBottom: 24,
  },
  appName: { fontSize: 36, fontWeight: '800', color: Colors.white, letterSpacing: 0.5 },
  tagline: { fontSize: 15, color: 'rgba(255,255,255,0.7)', marginTop: 6 },
  footer: { position: 'absolute', bottom: 40 },
  footerText: { fontSize: 12, color: 'rgba(255,255,255,0.4)' },
});
