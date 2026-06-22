import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, FontSize, Radius } from '../constants/theme';

interface Props {
  message: string;
  type?: 'error' | 'warning' | 'success' | 'info';
  onDismiss?: () => void;
}

const config = {
  error:   { bg: '#FEE2E2', border: '#FCA5A5', icon: 'alert-circle-outline',    color: '#991B1B' },
  warning: { bg: '#FEF3C7', border: '#FCD34D', icon: 'warning-outline',          color: '#92400E' },
  success: { bg: '#D1FAE5', border: '#6EE7B7', icon: 'checkmark-circle-outline', color: '#065F46' },
  info:    { bg: '#DBEAFE', border: '#93C5FD', icon: 'information-circle-outline',color: '#1E3A8A' },
};

export default function ErrorMessage({ message, type = 'error', onDismiss }: Props) {
  const c = config[type];
  return (
    <View style={[styles.container, { backgroundColor: c.bg, borderColor: c.border }]}>
      <Ionicons name={c.icon as any} size={18} color={c.color} style={styles.icon} />
      <Text style={[styles.text, { color: c.color }]}>{message}</Text>
      {onDismiss && (
        <TouchableOpacity onPress={onDismiss} style={styles.dismiss}>
          <Ionicons name="close" size={16} color={c.color} />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1, borderRadius: Radius.md,
    padding: Spacing.sm, marginBottom: Spacing.md,
  },
  icon: { marginRight: Spacing.sm, flexShrink: 0 },
  text: { flex: 1, fontSize: FontSize.sm, lineHeight: 18 },
  dismiss: { padding: 2, marginLeft: Spacing.xs },
});
