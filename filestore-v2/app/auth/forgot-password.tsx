import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, Alert, ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { resetPassword } from '../../lib/firebase';
import { Colors, Spacing, FontSize, Radius, Shadow } from '../../constants/theme';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleReset = async () => {
    if (!email.trim()) { Alert.alert('Error', 'Please enter your email address.'); return; }
    try {
      setLoading(true);
      await resetPassword(email.trim());
      setSent(true);
    } catch (err: any) {
      Alert.alert('Error', 'Could not send reset email. Please check the address and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
        <Ionicons name="arrow-back" size={22} color={Colors.white} />
        <Text style={styles.backText}>Back to Login</Text>
      </TouchableOpacity>

      <View style={styles.iconBox}>
        <Ionicons name="lock-open-outline" size={40} color={Colors.white} />
      </View>
      <Text style={styles.title}>Forgot Password?</Text>
      <Text style={styles.subtitle}>Enter your email and we'll send you a reset link</Text>

      {sent ? (
        <View style={styles.card}>
          <View style={styles.successIcon}>
            <Ionicons name="checkmark-circle" size={52} color={Colors.success} />
          </View>
          <Text style={styles.successTitle}>Email Sent!</Text>
          <Text style={styles.successDesc}>
            Check your inbox at {email} for a password reset link. It may take a minute to arrive.
          </Text>
          <TouchableOpacity style={styles.backLoginBtn} onPress={() => router.replace('/auth/login')}>
            <Text style={styles.backLoginText}>Back to Login</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.card}>
          <Text style={styles.label}>Email Address</Text>
          <View style={styles.inputBox}>
            <Ionicons name="mail-outline" size={18} color={Colors.textMuted} />
            <TextInput
              style={styles.input}
              placeholder="you@example.com"
              placeholderTextColor={Colors.textMuted}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoFocus
            />
          </View>
          <TouchableOpacity style={styles.resetBtn} onPress={handleReset} disabled={loading}>
            {loading ? <ActivityIndicator color={Colors.white} /> : <Text style={styles.resetBtnText}>Send Reset Link</Text>}
          </TouchableOpacity>
          <TouchableOpacity style={styles.cancelBtn} onPress={() => router.back()}>
            <Text style={styles.cancelBtnText}>I remember my password</Text>
          </TouchableOpacity>
        </View>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.primary, padding: Spacing.lg },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingTop: 48, paddingBottom: Spacing.xl },
  backText: { color: Colors.white, fontSize: FontSize.md },
  iconBox: {
    width: 80, height: 80, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center', justifyContent: 'center',
    alignSelf: 'center', marginBottom: Spacing.md,
  },
  title: { fontSize: FontSize.xxl, fontWeight: '800', color: Colors.white, textAlign: 'center' },
  subtitle: { fontSize: FontSize.sm, color: 'rgba(255,255,255,0.7)', textAlign: 'center', marginTop: 6, marginBottom: Spacing.xl },
  card: { backgroundColor: Colors.card, borderRadius: Radius.lg, padding: Spacing.lg, ...Shadow.md },
  label: { fontSize: FontSize.sm, fontWeight: '600', color: Colors.textPrimary, marginBottom: 8 },
  inputBox: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    borderWidth: 1.5, borderColor: Colors.border, borderRadius: Radius.md,
    paddingHorizontal: Spacing.md, backgroundColor: Colors.background,
  },
  input: { flex: 1, height: 50, fontSize: FontSize.md, color: Colors.textPrimary },
  resetBtn: {
    backgroundColor: Colors.primary, paddingVertical: 15,
    borderRadius: Radius.md, alignItems: 'center', marginTop: Spacing.md,
  },
  resetBtnText: { color: Colors.white, fontSize: FontSize.md, fontWeight: '700' },
  cancelBtn: { alignItems: 'center', marginTop: Spacing.md },
  cancelBtnText: { color: Colors.textSecondary, fontSize: FontSize.sm },
  successIcon: { alignItems: 'center', marginBottom: Spacing.md },
  successTitle: { fontSize: FontSize.xl, fontWeight: '800', color: Colors.textPrimary, textAlign: 'center' },
  successDesc: { fontSize: FontSize.sm, color: Colors.textSecondary, textAlign: 'center', marginTop: Spacing.sm, lineHeight: 20 },
  backLoginBtn: {
    backgroundColor: Colors.primary, paddingVertical: 14,
    borderRadius: Radius.md, alignItems: 'center', marginTop: Spacing.lg,
  },
  backLoginText: { color: Colors.white, fontSize: FontSize.md, fontWeight: '700' },
});
