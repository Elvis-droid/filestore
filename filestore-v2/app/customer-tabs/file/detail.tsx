import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { getCurrentUser, getFileById, hasAccess, getPaymentRequestForUserFile } from '../../../lib/firebase';
import { Colors, Spacing, FontSize, Radius, Shadow } from '../../../constants/theme';

const categoryIcons: Record<string, string> = {
  document: 'document-text', video: 'videocam', audio: 'musical-notes',
  image: 'image', archive: 'archive', software: 'code-slash', other: 'folder',
};

export default function FileDetailScreen() {
  const { fileId } = useLocalSearchParams<{ fileId: string }>();
  const router = useRouter();
  const [file, setFile] = useState<any>(null);
  const [hasFileAccess, setHasFileAccess] = useState(false);
  const [hasPending, setHasPending] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const user = getCurrentUser();
      if (!user) return;

      const [fileData, accessGranted, pendingReq] = await Promise.all([
        getFileById(fileId),
        hasAccess(user.uid, fileId),
        getPaymentRequestForUserFile(user.uid, fileId),
      ]);

      setFile(fileData);
      setHasFileAccess(accessGranted);
      setHasPending(!!pendingReq && pendingReq.status === 'pending');
      setLoading(false);
    };
    load();
  }, [fileId]);

  if (loading) return <View style={styles.centered}><ActivityIndicator size="large" color={Colors.primary} /></View>;

  const icon = categoryIcons[file?.category] ?? 'folder';

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={22} color={Colors.white} />
          </TouchableOpacity>
          <View style={styles.headerIcon}>
            <Ionicons name={icon as any} size={40} color={Colors.white} />
          </View>
          <Text style={styles.headerTitle}>{file?.title}</Text>
          <View style={styles.categoryPill}>
            <Text style={styles.categoryText}>{file?.category}</Text>
          </View>
        </View>

        <View style={styles.priceCard}>
          <View>
            <Text style={styles.priceLabel}>Price</Text>
            <Text style={styles.priceValue}>TZS {file?.price?.toLocaleString()}</Text>
          </View>
          {hasFileAccess
            ? <View style={styles.accessBadge}><Ionicons name="checkmark-circle" size={18} color={Colors.success} /><Text style={styles.accessText}>Unlocked</Text></View>
            : hasPending
              ? <View style={styles.pendingBadge}><Ionicons name="hourglass-outline" size={18} color={Colors.warning} /><Text style={styles.pendingText}>Pending</Text></View>
              : null
          }
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About this file</Text>
          <Text style={styles.description}>{file?.description}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>File details</Text>
          {[
            { icon: 'folder-outline', label: 'Category', value: file?.category },
            { icon: 'document-outline', label: 'File name', value: file?.file_name },
            { icon: 'calendar-outline', label: 'Added on', value: new Date(file?.created_at).toLocaleDateString() },
          ].map(row => (
            <View key={row.label} style={styles.detailRow}>
              <Ionicons name={row.icon as any} size={16} color={Colors.textMuted} />
              <Text style={styles.detailLabel}>{row.label}</Text>
              <Text style={styles.detailValue}>{row.value}</Text>
            </View>
          ))}
        </View>
      </ScrollView>

      <View style={styles.cta}>
        {hasFileAccess ? (
          <TouchableOpacity style={[styles.ctaBtn, { backgroundColor: Colors.success }]} onPress={() => router.push('/customer-tabs/downloads')}>
            <Ionicons name="download-outline" size={20} color={Colors.white} />
            <Text style={styles.ctaBtnText}>Go to My Downloads</Text>
          </TouchableOpacity>
        ) : hasPending ? (
          <TouchableOpacity style={[styles.ctaBtn, { backgroundColor: Colors.warning }]} onPress={() => router.push('/customer-tabs/payment-status')}>
            <Ionicons name="hourglass-outline" size={20} color={Colors.white} />
            <Text style={styles.ctaBtnText}>Check Payment Status</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.ctaBtn} onPress={() => router.push({ pathname: '/customer-tabs/payment/[fileId]', params: { fileId } })}>
            <Ionicons name="card-outline" size={20} color={Colors.white} />
            <Text style={styles.ctaBtnText}>Buy Now — TZS {file?.price?.toLocaleString()}</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scroll: { paddingBottom: 100 },
  header: { backgroundColor: Colors.primary, paddingTop: 56, paddingBottom: Spacing.xl, paddingHorizontal: Spacing.lg, alignItems: 'center' },
  backBtn: { position: 'absolute', top: 56, left: Spacing.lg, padding: 4 },
  headerIcon: { width: 80, height: 80, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.md },
  headerTitle: { fontSize: FontSize.xl, fontWeight: '800', color: Colors.white, textAlign: 'center' },
  categoryPill: { backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 12, paddingVertical: 4, borderRadius: Radius.full, marginTop: Spacing.sm },
  categoryText: { color: Colors.white, fontSize: FontSize.sm, textTransform: 'capitalize' },
  priceCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: Colors.card, margin: Spacing.md, borderRadius: Radius.md, padding: Spacing.md, ...Shadow.sm },
  priceLabel: { fontSize: FontSize.sm, color: Colors.textSecondary },
  priceValue: { fontSize: FontSize.xxl, fontWeight: '800', color: Colors.accent },
  accessBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#D1FAE5', paddingHorizontal: 10, paddingVertical: 6, borderRadius: Radius.full },
  accessText: { color: Colors.success, fontWeight: '700', fontSize: FontSize.sm },
  pendingBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#FEF3C7', paddingHorizontal: 10, paddingVertical: 6, borderRadius: Radius.full },
  pendingText: { color: Colors.warning, fontWeight: '700', fontSize: FontSize.sm },
  section: { backgroundColor: Colors.card, margin: Spacing.md, marginTop: 0, borderRadius: Radius.md, padding: Spacing.md, ...Shadow.sm },
  sectionTitle: { fontSize: FontSize.md, fontWeight: '700', color: Colors.textPrimary, marginBottom: Spacing.sm },
  description: { fontSize: FontSize.md, color: Colors.textSecondary, lineHeight: 22 },
  detailRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, paddingVertical: 8, borderBottomWidth: 0.5, borderBottomColor: Colors.border },
  detailLabel: { flex: 1, fontSize: FontSize.sm, color: Colors.textSecondary },
  detailValue: { fontSize: FontSize.sm, fontWeight: '600', color: Colors.textPrimary },
  cta: { padding: Spacing.md, backgroundColor: Colors.card, borderTopWidth: 0.5, borderTopColor: Colors.border },
  ctaBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.primary, paddingVertical: 15, borderRadius: Radius.md, gap: Spacing.sm, ...Shadow.sm },
  ctaBtnText: { color: Colors.white, fontSize: FontSize.md, fontWeight: '800' },
});
