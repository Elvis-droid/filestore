import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import { Ionicons } from '@expo/vector-icons';
import { FontSize } from '../constants/theme';

export default function NetworkBanner() {
  const [isOffline, setIsOffline] = useState(false);
  const [showBack, setShowBack] = useState(false);
  const slideAnim = new Animated.Value(-60);

  useEffect(() => {
    const unsub = NetInfo.addEventListener(state => {
      const offline = !(state.isConnected && state.isInternetReachable);
      if (offline) {
        setIsOffline(true);
        setShowBack(false);
        Animated.timing(slideAnim, { toValue: 0, duration: 300, useNativeDriver: true }).start();
      } else if (isOffline) {
        setShowBack(true);
        setTimeout(() => { setIsOffline(false); setShowBack(false); }, 2500);
      }
    });
    return () => unsub();
  }, [isOffline]);

  if (!isOffline && !showBack) return null;

  return (
    <Animated.View style={[styles.banner, showBack && styles.backBanner, { transform: [{ translateY: slideAnim }] }]}>
      <Ionicons
        name={showBack ? 'wifi' : 'wifi-outline'}
        size={16}
        color="#fff"
      />
      <Text style={styles.text}>
        {showBack ? 'Back online!' : 'No internet connection'}
      </Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  banner: {
    position: 'absolute', top: 0, left: 0, right: 0, zIndex: 999,
    backgroundColor: '#E74C3C', flexDirection: 'row',
    alignItems: 'center', justifyContent: 'center',
    paddingTop: 44, paddingBottom: 10, gap: 8,
  },
  backBanner: { backgroundColor: '#27AE60' },
  text: { color: '#fff', fontSize: FontSize.sm, fontWeight: '700' },
});
