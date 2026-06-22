import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, Alert, ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { signUp } from '../../lib/firebase';
import { Colors, Spacing, FontSize, Radius, Shadow } from '../../constants/theme';
import ErrorMessage from '../../components/ErrorMessage';

const ERROR_MESSAGES: Record<string, string> = {
  'auth/email-already-in-use': 'An account with this email already exists.',
  'auth/invalid-email': 'Please enter a valid email address.',
  'auth/weak-password': 'Password is too weak. Use at least 6 characters.',
  'auth/network-request-failed': 'No internet connection. Please check your network.',
};

export default function RegisterScreen() {
  const router = useRouter();
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleRegister = async () => {
    setError('');
    if (!fullName || !phone || !email || !password || !confirmPass) {
      setError('Please fill in all fields.'); return;
    }
    if (password !== confirmPass) { setError('Passwords do not match.'); return; }
    if (password.length < 6) { setError('Password must be at least 6 characters.'); return; }
    try {
      setLoading(true);
      await signUp(email.trim(), password, fullName, phone);
      Alert.alert('Account Created!', 'Welcome to FileStore.', [
        { text: 'OK', onPress: () => router.replace('/customer-tabs/browse') },
      ]);
    } catch (err: any) {
      setError(ERROR_MESSAGES[err.code] ?? err.message ?? 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const Field = ({
    label, value, onChangeText, placeholder, icon, keyboardType, secure, extra
  }: any) => (
    <View style={styles.inputGroup}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.inputBox}>
        <Ionicons name={icon} size={18} color={Colors.textMuted} style={styles.inputIcon} />
        <TextInput
          style={styles.input}
          placeholder={placeholder}
          placeholderTextColor={Colors.textMuted}
          value={value}
          onChangeText={onChangeText}
          keyboardType={keyboardType ?? 'default'}
          autoCapitalize="none"
          secureTextEntry={secure}
        />
        {extra}
      </View>
    </View>
  );

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={Colors.white} />
        </TouchableOpacity>

        <View style={styles.header}>
          <View style={styles.logoBox}>
            <Ionicons name="person-add" size={36} color={Colors.white} />
          </View>
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>Join FileStore today</Text>
        </View>

        <View style={styles.card}>
          {error ? <ErrorMessage message={error} onDismiss={() => setError('')} /> : null}

          <Field label="Full Name" value={fullName} onChangeText={setFullName} placeholder="John Doe" icon="person-outline" />
          <Field label="Phone Number" value={phone} onChangeText={setPhone} placeholder="+255 7XX XXX XXX" icon="call-outline" keyboardType="phone-pad" />
          <Field label="Email Address" value={email} onChangeText={setEmail} placeholder="you@example.com" icon="mail-outline" keyboardType="email-address" />
          <Field
            label="Password" value={password} onChangeText={setPassword} placeholder="Min 6 characters"
            icon="lock-closed-outline" secure={!showPass}
            extra={
              <TouchableOpacity onPress={() => setShowPass(!showPass)} style={styles.eyeBtn}>
                <Ionicons name={showPass ? 'eye-off-outline' : 'eye-outline'} size={18} color={Colors.textMuted} />
              </TouchableOpacity>
            }
          />
          <Field label="Confirm Password" value={confirmPass} onChangeText={setConfirmPass} placeholder="Repeat password" icon="lock-closed-outline" secure={!showPass} />

          <TouchableOpacity style={styles.registerBtn} onPress={handleRegister} disabled={loading}>
            {loading ? <ActivityIndicator color={Colors.white} /> : <Text style={styles.registerBtnText}>Create Account</Text>}
          </TouchableOpacity>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Already have an account? </Text>
            <TouchableOpacity onPress={() => router.push('/auth/login')}>
              <Text style={styles.footerLink}>Sign In</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.primary },
  scroll: { flexGrow: 1, padding: Spacing.lg },
  backBtn: { paddingVertical: Spacing.md },
  header: { alignItems: 'center', marginBottom: Spacing.xl },
  logoBox: {
    width: 72, height: 72, borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.md,
  },
  title: { fontSize: FontSize.xxl, fontWeight: '800', color: Colors.white },
  subtitle: { fontSize: FontSize.md, color: 'rgba(255,255,255,0.75)', marginTop: 4 },
  card: { backgroundColor: Colors.card, borderRadius: Radius.lg, padding: Spacing.lg, ...Shadow.md },
  inputGroup: { marginBottom: Spacing.md },
  label: { fontSize: FontSize.sm, fontWeight: '600', color: Colors.textPrimary, marginBottom: 6 },
  inputBox: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1.5, borderColor: Colors.border,
    borderRadius: Radius.md, paddingHorizontal: Spacing.md,
    backgroundColor: Colors.background,
  },
  inputIcon: { marginRight: Spacing.sm },
  input: { flex: 1, height: 50, fontSize: FontSize.md, color: Colors.textPrimary },
  eyeBtn: { padding: Spacing.xs },
  registerBtn: {
    backgroundColor: Colors.primary, paddingVertical: 15,
    borderRadius: Radius.md, alignItems: 'center', marginTop: Spacing.sm, ...Shadow.sm,
  },
  registerBtnText: { color: Colors.white, fontSize: FontSize.md, fontWeight: '700' },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: Spacing.lg },
  footerText: { fontSize: FontSize.sm, color: Colors.textSecondary },
  footerLink: { fontSize: FontSize.sm, color: Colors.primary, fontWeight: '700' },
});
