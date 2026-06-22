import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, FlatList, StyleSheet,
  RefreshControl, ActivityIndicator, TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { getCurrentUser, getMyPaymentRequests } from '../../lib/firebase';
import { Colors, Spacing, FontSize, Radius, Shadow } from '../../constants/theme';

const statusConfig = {
  pending:  { label: 'Pending Review', color: Colors.warning, bg: '#FEF3C7', icon: 'hourglass-outline' },
  approved: { label: 'Approved',       color: Colors.success, bg: '#D1FAE5', icon: 'checkmark-circle-outline' },
  rejected: { label: 'Rejected',       color: Colors.danger,  bg: '#FEE2E2', icon: 'close-circle-outline' },
};

export default function PaymentStatusScreen() {
  const router = useRouter();
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const user = getCurrentUser();
    if (!user) return;
    const data = await getMyPaymentRequests(user.uid);
    setRequests(data ?? []);
  }, []);

  useEffect(() => { load().finally(() => setLoading(false)); }, []);
  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  if (loading) return <View style={styles.centered}><ActivityIndicator size="large" color={Colors.primary} /></View>;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Payment Status</Text>
        <Text style={styles.headerSubtitle}>Track all your payment requests</Text>
      </View>

      <View style={styles.legend}>
        {Object.entries(statusConfig).map(([key, val]) => (
          <View key={key} style={styles.legendItem}>
            <Ionicons name={val.icon as any} size={14} color={val.color} />
            <Text style={[styles.legendText, { color: val.color }]}>{val.label}</Text>
          </View>
        ))}
      </View>

      <FlatList
        data={requests}
        keyExtractor={item => item.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="receipt-outline" size={56} color={Colors.textMuted} />
            <Text style={styles.emptyTitle}>No Requests Yet</Text>
            <Text style={styles.emptyDesc}>Browse files and submit a payment to see your status here.</Text>
            <TouchableOpacity style={styles.browseBtn} onPress={() => router.push('/customer-tabs/browse')}>
              <Text style={styles.browseBtnText}>Browse Files</Text>
            </TouchableOpacity>
          </View>
        }
        renderItem={({ item }) => {
          const sc = statusConfig[item.status as keyof typeof statusConfig] ?? statusConfig.pending;
          return (
            <View style={styles.card}>
              <View style={styles.cardTop}>
                <View style={styles.fileIcon}>
                  <Ionicons name="document-text" size={22} color={Colors.primary} />
                </View>
                <View style={styles.cardInfo}>
                  <Text style={styles.cardTitle} numberOfLines={1}>{item.files?.title}</Text>
                  <Text style={styles.cardRef}>Ref: {item.payment_reference}</Text>
                  <Text style={styles.cardDate}>{new Date(item.created_at).toLocaleString()}</Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: sc.bg }]}>
                  <Ionicons name={sc.icon as any} size={14} color={sc.color} />
                  <Text style={[styles.statusText, { color: sc.color }]}>{sc.label}</Text>
                </View>
              </View>

              <View style={styles.cardBottom}>
                <Text style={styles.amountLabel}>Amount paid</Text>
                <Text style={styles.amountValue}>TZS {item.amount?.toLocaleString()}</Text>
              </View>

              {item.status === 'approved' && (
                <TouchableOpacity style={styles.downloadNowBtn} onPress={() => router.push('/customer-tabs/downloads')}>
                  <Ionicons name="download-outline" size={16} color={Colors.white} />
                  <Text style={styles.downloadNowText}>Download Now</Text>
                </TouchableOpacity>
              )}

              {item.status === 'rejected' && (
                <View style={styles.rejectedNote}>
                  <Ionicons name="information-circle-outline" size={14} color={Colors.danger} />
                  <Text style={styles.rejectedNoteText}>Your payment could not be verified. Please contact admin with proof of payment.</Text>
                </View>
              )}

              {item.status === 'pending' && (
                <View style={styles.pendingNote}>
                  <Ionicons name="time-outline" size={14} color={Colors.warning} />
                  <Text style={styles.pendingNoteText}>Admin is reviewing your payment. This usually takes a few hours.</Text>
                </View>
              )}
            </View>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { backgroundColor: Colors.primary, paddingTop: 56, paddingBottom: Spacing.lg, paddingHorizontal: Spacing.lg },
  headerTitle: { fontSize: FontSize.xxl, fontWeight: '800', color: Colors.white },
  headerSubtitle: { fontSize: FontSize.sm, color: 'rgba(255,255,255,0.7)', marginTop: 2 },
  legend: { flexDirection: 'row', justifyContent: 'space-around', padding: Spacing.md, backgroundColor: Colors.card, borderBottomWidth: 0.5, borderBottomColor: Colors.border },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  legendText: { fontSize: FontSize.xs, fontWeight: '600' },
  list: { padding: Spacing.md, paddingBottom: 80 },
  empty: { alignItems: 'center', paddingTop: 60 },
  emptyTitle: { fontSize: FontSize.xl, fontWeight: '700', color: Colors.textPrimary, marginTop: Spacing.md },
  emptyDesc: { fontSize: FontSize.sm, color: Colors.textSecondary, textAlign: 'center', marginTop: Spacing.sm, lineHeight: 20, paddingHorizontal: Spacing.lg },
  browseBtn: { backgroundColor: Colors.primary, paddingHorizontal: 24, paddingVertical: 10, borderRadius: Radius.full, marginTop: Spacing.lg },
  browseBtnText: { color: Colors.white, fontWeight: '700', fontSize: FontSize.sm },
  card: { backgroundColor: Colors.card, borderRadius: Radius.md, padding: Spacing.md, marginBottom: Spacing.sm, ...Shadow.sm },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: Spacing.sm },
  fileIcon: { width: 40, height: 40, borderRadius: Radius.sm, backgroundColor: '#EAF0FB', alignItems: 'center', justifyContent: 'center', marginRight: Spacing.sm },
  cardInfo: { flex: 1 },
  cardTitle: { fontSize: FontSize.md, fontWeight: '700', color: Colors.textPrimary },
  cardRef: { fontSize: FontSize.sm, color: Colors.textSecondary, marginTop: 1 },
  cardDate: { fontSize: FontSize.xs, color: Colors.textMuted, marginTop: 1 },
  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: 8, paddingVertical: 4, borderRadius: Radius.full },
  statusText: { fontSize: FontSize.xs, fontWeight: '700' },
  cardBottom: { flexDirection: 'row', justifyContent: 'space-between', paddingTop: Spacing.sm, borderTopWidth: 0.5, borderTopColor: Colors.border },
  amountLabel: { fontSize: FontSize.sm, color: Colors.textSecondary },
  amountValue: { fontSize: FontSize.md, fontWeight: '800', color: Colors.accent },
  downloadNowBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: Colors.success, paddingVertical: 10, borderRadius: Radius.md, marginTop: Spacing.sm },
  downloadNowText: { color: Colors.white, fontWeight: '700', fontSize: FontSize.sm },
  rejectedNote: { flexDirection: 'row', gap: 6, backgroundColor: '#FEE2E2', padding: Spacing.sm, borderRadius: Radius.sm, marginTop: Spacing.sm },
  rejectedNoteText: { flex: 1, fontSize: FontSize.xs, color: Colors.danger, lineHeight: 16 },
  pendingNote: { flexDirection: 'row', gap: 6, backgroundColor: '#FEF3C7', padding: Spacing.sm, borderRadius: Radius.sm, marginTop: Spacing.sm },
  pendingNoteText: { flex: 1, fontSize: FontSize.xs, color: Colors.warning, lineHeight: 16 },
});
