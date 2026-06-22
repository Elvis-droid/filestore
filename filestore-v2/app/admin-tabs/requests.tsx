import React, { useEffect, useState } from 'react';
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity,
  RefreshControl, Alert, ActivityIndicator, TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getPendingRequests, approveRequest, rejectRequest } from '../../lib/firebase';
import { Colors, Spacing, FontSize, Radius, Shadow } from '../../constants/theme';

export default function RequestsScreen() {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const load = async () => {
    const data = await getPendingRequests();
    setRequests(data ?? []);
  };

  useEffect(() => { load().finally(() => setLoading(false)); }, []);
  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  const filtered = requests.filter(r => {
    if (!search) return true;
    const q = search.toLowerCase();
    return r.profiles?.full_name?.toLowerCase().includes(q) ||
      r.profiles?.phone?.includes(search) ||
      r.payment_reference?.toLowerCase().includes(q) ||
      r.files?.title?.toLowerCase().includes(q);
  });

  const handleApprove = (req: any) => {
    Alert.alert('Approve Payment', `Grant "${req.profiles?.full_name}" access to "${req.files?.title}"?\n\nRef: ${req.payment_reference}`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Approve', onPress: async () => {
        setProcessingId(req.id);
        await approveRequest(req.id, req.file_id, req.user_id);
        setRequests(prev => prev.filter(r => r.id !== req.id));
        setProcessingId(null);
      }},
    ]);
  };

  const handleReject = (req: any) => {
    Alert.alert('Reject Request', `Reject "${req.profiles?.full_name}"'s payment?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Reject', style: 'destructive', onPress: async () => {
        setProcessingId(req.id);
        await rejectRequest(req.id);
        setRequests(prev => prev.filter(r => r.id !== req.id));
        setProcessingId(null);
      }},
    ]);
  };

  if (loading) return <View style={styles.centered}><ActivityIndicator size="large" color={Colors.primary} /></View>;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Payment Requests</Text>
        <Text style={styles.headerSubtitle}>{requests.length} pending approval{requests.length !== 1 ? 's' : ''}</Text>
      </View>

      <View style={styles.searchBox}>
        <Ionicons name="search-outline" size={18} color={Colors.textMuted} />
        <TextInput style={styles.searchInput} placeholder="Search by name, ref, or file..." placeholderTextColor={Colors.textMuted} value={search} onChangeText={setSearch} />
        {search ? <TouchableOpacity onPress={() => setSearch('')}><Ionicons name="close-circle" size={18} color={Colors.textMuted} /></TouchableOpacity> : null}
      </View>

      <FlatList
        data={filtered}
        keyExtractor={item => item.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="checkmark-circle-outline" size={56} color={Colors.success} />
            <Text style={styles.emptyTitle}>All Clear!</Text>
            <Text style={styles.emptyDesc}>No pending payment requests right now.</Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.reqCard}>
            <View style={styles.reqHeader}>
              <View style={styles.avatar}><Text style={styles.avatarText}>{item.profiles?.full_name?.[0]?.toUpperCase() ?? '?'}</Text></View>
              <View style={styles.userInfo}>
                <Text style={styles.userName}>{item.profiles?.full_name}</Text>
                <Text style={styles.userContact}>{item.profiles?.email}</Text>
                <Text style={styles.userContact}>{item.profiles?.phone}</Text>
              </View>
              <Text style={styles.amount}>TZS {item.files?.price?.toLocaleString()}</Text>
            </View>
            <View style={styles.fileRow}>
              <Ionicons name="document-text-outline" size={14} color={Colors.primary} />
              <Text style={styles.fileName}>{item.files?.title}</Text>
            </View>
            <View style={styles.refRow}>
              <Ionicons name="receipt-outline" size={14} color={Colors.textMuted} />
              <Text style={styles.refText}>Ref: {item.payment_reference}</Text>
            </View>
            <Text style={styles.date}>{new Date(item.created_at).toLocaleString()}</Text>
            {processingId === item.id ? (
              <ActivityIndicator color={Colors.primary} style={{ marginTop: Spacing.md }} />
            ) : (
              <View style={styles.actions}>
                <TouchableOpacity style={styles.rejectBtn} onPress={() => handleReject(item)}>
                  <Ionicons name="close-circle-outline" size={16} color={Colors.danger} />
                  <Text style={styles.rejectBtnText}>Reject</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.approveBtn} onPress={() => handleApprove(item)}>
                  <Ionicons name="checkmark-circle-outline" size={16} color={Colors.white} />
                  <Text style={styles.approveBtnText}>Approve Access</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { backgroundColor: Colors.primary, paddingTop: 56, paddingBottom: Spacing.lg, paddingHorizontal: Spacing.lg },
  headerTitle: { fontSize: FontSize.xxl, fontWeight: '800', color: Colors.white },
  headerSubtitle: { fontSize: FontSize.sm, color: 'rgba(255,255,255,0.75)', marginTop: 2 },
  searchBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.card, margin: Spacing.md, paddingHorizontal: Spacing.md, borderRadius: Radius.md, borderWidth: 1.5, borderColor: Colors.border, gap: Spacing.sm },
  searchInput: { flex: 1, height: 46, fontSize: FontSize.md, color: Colors.textPrimary },
  list: { padding: Spacing.md, paddingBottom: 100 },
  empty: { alignItems: 'center', paddingTop: 60 },
  emptyTitle: { fontSize: FontSize.xl, fontWeight: '700', color: Colors.textPrimary, marginTop: Spacing.md },
  emptyDesc: { fontSize: FontSize.sm, color: Colors.textSecondary, marginTop: Spacing.sm },
  reqCard: { backgroundColor: Colors.card, borderRadius: Radius.md, padding: Spacing.md, marginBottom: Spacing.md, ...Shadow.sm },
  reqHeader: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: Spacing.sm },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center', marginRight: Spacing.md },
  avatarText: { color: Colors.white, fontSize: FontSize.lg, fontWeight: '800' },
  userInfo: { flex: 1 },
  userName: { fontSize: FontSize.md, fontWeight: '700', color: Colors.textPrimary },
  userContact: { fontSize: FontSize.sm, color: Colors.textSecondary },
  amount: { fontSize: FontSize.md, fontWeight: '800', color: Colors.accent },
  fileRow: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#EAF0FB', padding: Spacing.sm, borderRadius: Radius.sm, marginBottom: Spacing.xs },
  fileName: { fontSize: FontSize.sm, fontWeight: '600', color: Colors.primary },
  refRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  refText: { fontSize: FontSize.sm, color: Colors.textSecondary },
  date: { fontSize: FontSize.xs, color: Colors.textMuted, marginBottom: Spacing.md },
  actions: { flexDirection: 'row', gap: Spacing.sm },
  rejectBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 10, borderRadius: Radius.md, borderWidth: 1.5, borderColor: Colors.danger, gap: 4 },
  rejectBtnText: { color: Colors.danger, fontWeight: '700', fontSize: FontSize.sm },
  approveBtn: { flex: 2, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 10, borderRadius: Radius.md, backgroundColor: Colors.success, gap: 4 },
  approveBtnText: { color: Colors.white, fontWeight: '700', fontSize: FontSize.sm },
});
