import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Alert, ActivityIndicator, RefreshControl,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { getCustomerDetail, revokeAccess } from '../../lib/firebase';
import { Colors, Spacing, FontSize, Radius, Shadow } from '../../constants/theme';

export default function CustomerDetailScreen() {
  const { userId } = useLocalSearchParams<{ userId: string }>();
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [grants, setGrants] = useState<any[]>([]);
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    const { profile, grants, requests } = await getCustomerDetail(userId);
    setProfile(profile);
    setGrants(grants);
    setRequests(requests);
  };

  useEffect(() => { load().finally(() => setLoading(false)); }, []);
  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  const handleRevoke = (grant: any) => {
    Alert.alert('Revoke Access', `Remove "${profile?.full_name}"'s access to "${grant.files?.title}"? They will no longer be able to download it.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Revoke', style: 'destructive', onPress: async () => {
        await revokeAccess(grant.id);
        setGrants(prev => prev.filter(g => g.id !== grant.id));
      }},
    ]);
  };

  if (loading) return <View style={styles.centered}><ActivityIndicator size="large" color={Colors.primary} /></View>;

  const initials = profile?.full_name?.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2) ?? '?';
  const totalSpent = requests.filter(r => r.status === 'approved').reduce((sum: number, r: any) => sum + (r.amount ?? 0), 0);

  return (
    <View style={styles.container}>
      <ScrollView refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={22} color={Colors.white} />
          </TouchableOpacity>
          <View style={styles.avatar}><Text style={styles.avatarText}>{initials}</Text></View>
          <Text style={styles.name}>{profile?.full_name}</Text>
          <Text style={styles.email}>{profile?.email}</Text>
          <Text style={styles.phone}>{profile?.phone}</Text>
          <Text style={styles.joined}>Member since {new Date(profile?.created_at).toLocaleDateString()}</Text>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statVal}>{grants.length}</Text>
            <Text style={styles.statLbl}>Files Unlocked</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statCard}>
            <Text style={styles.statVal}>{requests.length}</Text>
            <Text style={styles.statLbl}>Total Requests</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statCard}>
            <Text style={[styles.statVal, { color: Colors.accent, fontSize: FontSize.lg }]}>{totalSpent.toLocaleString()}</Text>
            <Text style={styles.statLbl}>TZS Spent</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Files with Access ({grants.length})</Text>
          {grants.length === 0 ? (
            <Text style={styles.emptyText}>No files unlocked yet.</Text>
          ) : grants.map(grant => (
            <View key={grant.id} style={styles.grantRow}>
              <View style={styles.grantIcon}><Ionicons name="document-text" size={18} color={Colors.primary} /></View>
              <View style={styles.grantInfo}>
                <Text style={styles.grantTitle}>{grant.files?.title}</Text>
                <Text style={styles.grantDate}>Granted {new Date(grant.created_at).toLocaleDateString()}</Text>
              </View>
              <TouchableOpacity style={styles.revokeBtn} onPress={() => handleRevoke(grant)}>
                <Ionicons name="ban-outline" size={16} color={Colors.danger} />
                <Text style={styles.revokeBtnText}>Revoke</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Payment History ({requests.length})</Text>
          {requests.length === 0 ? (
            <Text style={styles.emptyText}>No payment requests yet.</Text>
          ) : requests.map(req => (
            <View key={req.id} style={styles.reqRow}>
              <View style={styles.reqInfo}>
                <Text style={styles.reqTitle}>{req.files?.title}</Text>
                <Text style={styles.reqRef}>Ref: {req.payment_reference}</Text>
                <Text style={styles.reqDate}>{new Date(req.created_at).toLocaleDateString()}</Text>
              </View>
              <View style={[styles.statusPill, { backgroundColor: req.status === 'approved' ? '#D1FAE5' : req.status === 'rejected' ? '#FEE2E2' : '#FEF3C7' }]}>
                <Text style={[styles.statusPillText, { color: req.status === 'approved' ? Colors.success : req.status === 'rejected' ? Colors.danger : Colors.warning }]}>{req.status}</Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { backgroundColor: Colors.primary, paddingTop: 56, paddingBottom: Spacing.xl, alignItems: 'center', paddingHorizontal: Spacing.lg },
  backBtn: { position: 'absolute', top: 56, left: Spacing.lg },
  avatar: { width: 72, height: 72, borderRadius: 36, backgroundColor: Colors.accent, alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.sm },
  avatarText: { color: Colors.white, fontSize: FontSize.xxl, fontWeight: '800' },
  name: { fontSize: FontSize.xl, fontWeight: '800', color: Colors.white },
  email: { fontSize: FontSize.sm, color: 'rgba(255,255,255,0.75)', marginTop: 2 },
  phone: { fontSize: FontSize.sm, color: 'rgba(255,255,255,0.75)', marginTop: 1 },
  joined: { fontSize: FontSize.xs, color: 'rgba(255,255,255,0.5)', marginTop: 4 },
  statsRow: { flexDirection: 'row', backgroundColor: Colors.card, margin: Spacing.md, borderRadius: Radius.md, ...Shadow.sm },
  statCard: { flex: 1, alignItems: 'center', paddingVertical: Spacing.lg },
  statVal: { fontSize: FontSize.xxl, fontWeight: '800', color: Colors.primary },
  statLbl: { fontSize: FontSize.xs, color: Colors.textSecondary, marginTop: 2 },
  statDivider: { width: 0.5, backgroundColor: Colors.border },
  section: { backgroundColor: Colors.card, margin: Spacing.md, marginTop: 0, borderRadius: Radius.md, padding: Spacing.md, ...Shadow.sm },
  sectionTitle: { fontSize: FontSize.md, fontWeight: '700', color: Colors.textPrimary, marginBottom: Spacing.sm },
  emptyText: { fontSize: FontSize.sm, color: Colors.textMuted, fontStyle: 'italic' },
  grantRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: Spacing.sm, borderBottomWidth: 0.5, borderBottomColor: Colors.border },
  grantIcon: { width: 36, height: 36, borderRadius: Radius.sm, backgroundColor: '#EAF0FB', alignItems: 'center', justifyContent: 'center', marginRight: Spacing.sm },
  grantInfo: { flex: 1 },
  grantTitle: { fontSize: FontSize.sm, fontWeight: '700', color: Colors.textPrimary },
  grantDate: { fontSize: FontSize.xs, color: Colors.textMuted, marginTop: 1 },
  revokeBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, borderWidth: 1, borderColor: Colors.danger, paddingHorizontal: 10, paddingVertical: 5, borderRadius: Radius.full },
  revokeBtnText: { color: Colors.danger, fontSize: FontSize.xs, fontWeight: '700' },
  reqRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: Spacing.sm, borderBottomWidth: 0.5, borderBottomColor: Colors.border },
  reqInfo: { flex: 1 },
  reqTitle: { fontSize: FontSize.sm, fontWeight: '700', color: Colors.textPrimary },
  reqRef: { fontSize: FontSize.xs, color: Colors.textSecondary },
  reqDate: { fontSize: FontSize.xs, color: Colors.textMuted },
  statusPill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: Radius.full },
  statusPillText: { fontSize: FontSize.xs, fontWeight: '700', textTransform: 'capitalize' },
});
