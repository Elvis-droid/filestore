import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput,
  TouchableOpacity, Alert, ActivityIndicator, Clipboard,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { getCurrentUser, getFileById, getPaymentRequestForUserFile, submitPaymentRequest } from '../../../lib/firebase';
import { Colors, Spacing, FontSize, Radius, Shadow } from '../../../constants/theme';

const ADMIN_PHONE = process.env.EXPO_PUBLIC_ADMIN_PHONE ?? '+255 712 XXX XXX';
const PAYMENT_NAME = process.env.EXPO_PUBLIC_PAYMENT_NAME ?? 'FileStore Admin';

export default function PaymentScreen() {
  const { fileId } = useLocalSearchParams<{ fileId: string }>();
  const router = useRouter();
  const [file, setFile] = useState<any>(null);
  const [paymentRef, setPaymentRef] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [userId, setUserId] = useState('');

  useEffect(() => {
    const load = async () => {
      const user = getCurrentUser();
      if (user) setUserId(user.uid);

      const fileData = await getFileById(fileId);
      setFile(fileData);

      if (user) {
        const existing = await getPaymentRequestForUserFile(user.uid, fileId);
        if (existing) setSubmitted(true);
      }
      setLoading(false);
    };
    load();
  }, [fileId]);

  const copyToClipboard = () => {
    Clipboard.setString(ADMIN_PHONE);
    Alert.alert('Copied!', 'Phone number copied to clipboard.');
  };

  const handleSubmit = async () => {
    if (!paymentRef.trim()) { Alert.alert('Error', 'Please enter your payment reference number.'); return; }
    try {
      setSubmitting(true);
      await submitPaymentRequest(fileId, userId, paymentRef.trim(), file.price);
      setSubmitted(true);
      Alert.alert('✅ Request Submitted!', 'Your payment request has been sent. The admin will review and grant you access shortly.', [{ text: 'OK' }]);
    } catch (err: any) {
      Alert.alert('Error', err.message ?? 'Failed to submit. Try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <View style={styles.centered}><ActivityIndicator size="large" color={Colors.primary} /></View>;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scroll}>
      <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
        <Ionicons name="arrow-back" size={22} color={Colors.textPrimary} />
        <Text style={styles.backText}>Back</Text>
      </TouchableOpacity>

      <View style={styles.fileCard}>
        <View style={styles.fileIcon}>
          <Ionicons name="document-text" size={32} color={Colors.primary} />
        </View>
        <View style={styles.fileInfo}>
          <Text style={styles.fileTitle}>{file?.title}</Text>
          <Text style={styles.fileDesc} numberOfLines={2}>{file?.description}</Text>
          <Text style={styles.filePrice}>TZS {file?.price?.toLocaleString()}</Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>How to Pay</Text>

      {[
        { step: '1', title: 'Open M-Pesa / Airtel Money / Tigo Pesa', desc: 'Use any mobile money service available to you.', icon: 'phone-portrait-outline' },
        { step: '2', title: 'Send Payment', desc: `Send exactly TZS ${file?.price?.toLocaleString()} to the number below.`, icon: 'cash-outline' },
        { step: '3', title: 'Copy the Reference', desc: 'Save the transaction reference/confirmation number you receive.', icon: 'copy-outline' },
        { step: '4', title: 'Submit Your Reference', desc: 'Enter it below so admin can verify and grant you access.', icon: 'checkmark-circle-outline' },
      ].map((item) => (
        <View key={item.step} style={styles.stepCard}>
          <View style={styles.stepCircle}><Text style={styles.stepNumber}>{item.step}</Text></View>
          <View style={styles.stepContent}>
            <Ionicons name={item.icon as any} size={20} color={Colors.primary} style={styles.stepIcon} />
            <View style={{ flex: 1 }}>
              <Text style={styles.stepTitle}>{item.title}</Text>
              <Text style={styles.stepDesc}>{item.desc}</Text>
            </View>
          </View>
        </View>
      ))}

      <View style={styles.paymentBox}>
        <Text style={styles.paymentBoxLabel}>Send Payment To</Text>
        <View style={styles.paymentRow}>
          <View>
            <Text style={styles.paymentName}>{PAYMENT_NAME}</Text>
            <Text style={styles.paymentPhone}>{ADMIN_PHONE}</Text>
          </View>
          <TouchableOpacity style={styles.copyBtn} onPress={copyToClipboard}>
            <Ionicons name="copy-outline" size={18} color={Colors.primary} />
            <Text style={styles.copyBtnText}>Copy</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.amountRow}>
          <Text style={styles.amountLabel}>Amount:</Text>
          <Text style={styles.amountValue}>TZS {file?.price?.toLocaleString()}</Text>
        </View>
      </View>

      {submitted ? (
        <View style={styles.submittedBox}>
          <Ionicons name="hourglass-outline" size={32} color={Colors.accent} />
          <Text style={styles.submittedTitle}>Request Pending</Text>
          <Text style={styles.submittedDesc}>
            Your payment request has been submitted. The admin will verify and grant you access soon. Check your Status tab.
          </Text>
        </View>
      ) : (
        <View style={styles.refSection}>
          <Text style={styles.sectionTitle}>Enter Your Payment Reference</Text>
          <View style={styles.inputBox}>
            <Ionicons name="receipt-outline" size={18} color={Colors.textMuted} />
            <TextInput
              style={styles.input}
              placeholder="e.g. SBO2JXXX123"
              placeholderTextColor={Colors.textMuted}
              value={paymentRef}
              onChangeText={setPaymentRef}
              autoCapitalize="characters"
            />
          </View>
          <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit} disabled={submitting}>
            {submitting ? <ActivityIndicator color={Colors.white} /> : <Text style={styles.submitBtnText}>Submit Payment Reference</Text>}
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scroll: { padding: Spacing.lg, paddingBottom: 60 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: Spacing.lg, paddingTop: 40 },
  backText: { fontSize: FontSize.md, color: Colors.textPrimary, fontWeight: '600' },
  fileCard: { flexDirection: 'row', backgroundColor: Colors.card, borderRadius: Radius.md, padding: Spacing.md, marginBottom: Spacing.lg, alignItems: 'center', ...Shadow.sm },
  fileIcon: { width: 60, height: 60, borderRadius: Radius.sm, backgroundColor: '#EAF0FB', alignItems: 'center', justifyContent: 'center', marginRight: Spacing.md },
  fileInfo: { flex: 1 },
  fileTitle: { fontSize: FontSize.lg, fontWeight: '700', color: Colors.textPrimary },
  fileDesc: { fontSize: FontSize.sm, color: Colors.textSecondary, marginTop: 2 },
  filePrice: { fontSize: FontSize.lg, fontWeight: '800', color: Colors.accent, marginTop: 4 },
  sectionTitle: { fontSize: FontSize.lg, fontWeight: '700', color: Colors.textPrimary, marginBottom: Spacing.md },
  stepCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.card, borderRadius: Radius.md, padding: Spacing.md, marginBottom: Spacing.sm, ...Shadow.sm },
  stepCircle: { width: 32, height: 32, borderRadius: 16, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center', marginRight: Spacing.md },
  stepNumber: { color: Colors.white, fontWeight: '800', fontSize: FontSize.md },
  stepContent: { flex: 1, flexDirection: 'row', alignItems: 'flex-start' },
  stepIcon: { marginRight: Spacing.sm, marginTop: 1 },
  stepTitle: { fontSize: FontSize.md, fontWeight: '700', color: Colors.textPrimary },
  stepDesc: { fontSize: FontSize.sm, color: Colors.textSecondary, marginTop: 2 },
  paymentBox: { backgroundColor: Colors.primary, borderRadius: Radius.md, padding: Spacing.lg, marginVertical: Spacing.lg },
  paymentBoxLabel: { color: 'rgba(255,255,255,0.7)', fontSize: FontSize.sm, marginBottom: Spacing.sm },
  paymentRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  paymentName: { color: Colors.white, fontSize: FontSize.md, fontWeight: '700' },
  paymentPhone: { color: Colors.accent, fontSize: FontSize.xxl, fontWeight: '800', marginTop: 2 },
  copyBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: Colors.white, paddingHorizontal: 12, paddingVertical: 8, borderRadius: Radius.full },
  copyBtnText: { color: Colors.primary, fontWeight: '700', fontSize: FontSize.sm },
  amountRow: { flexDirection: 'row', alignItems: 'center', marginTop: Spacing.md, paddingTop: Spacing.md, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.2)' },
  amountLabel: { color: 'rgba(255,255,255,0.7)', fontSize: FontSize.md, marginRight: Spacing.sm },
  amountValue: { color: Colors.white, fontSize: FontSize.lg, fontWeight: '800' },
  refSection: { marginTop: Spacing.sm },
  inputBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.card, borderRadius: Radius.md, borderWidth: 1.5, borderColor: Colors.border, paddingHorizontal: Spacing.md, marginBottom: Spacing.md, gap: Spacing.sm },
  input: { flex: 1, height: 50, fontSize: FontSize.md, color: Colors.textPrimary },
  submitBtn: { backgroundColor: Colors.accent, paddingVertical: 15, borderRadius: Radius.md, alignItems: 'center', ...Shadow.sm },
  submitBtnText: { color: Colors.white, fontSize: FontSize.md, fontWeight: '800' },
  submittedBox: { backgroundColor: Colors.card, borderRadius: Radius.md, padding: Spacing.xl, alignItems: 'center', ...Shadow.sm, marginTop: Spacing.sm },
  submittedTitle: { fontSize: FontSize.xl, fontWeight: '800', color: Colors.textPrimary, marginTop: Spacing.md },
  submittedDesc: { fontSize: FontSize.sm, color: Colors.textSecondary, textAlign: 'center', marginTop: Spacing.sm, lineHeight: 20 },
});
