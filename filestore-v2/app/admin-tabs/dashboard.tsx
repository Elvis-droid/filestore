import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { getAdminStats, getPendingRequests, signOut } from '../../lib/firebase';
import { Colors, Spacing, FontSize, Radius, Shadow } from '../../constants/theme';

export default function AdminDashboard() {
  const router = useRouter();
  const [stats, setStats] = useState({ totalFiles: 0, totalUsers: 0, pendingRequests: 0, totalDownloads: 0, totalRevenue: 0 });
  const [recentRequests, setRecentRequests] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    const [s, pending] = await Promise.all([getAdminStats(), getPendingRequests()]);
    setStats(s);
    setRecentRequests((pending ?? []).slice(0, 5));
  };

  useEffect(() => { load(); }, []);
  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  return (
    <ScrollView style={styles.container} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.accent} />}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Admin Panel</Text>
          <Text style={styles.headerSubtitle}>FileStore Management</Text>
        </View>
        <TouchableOpacity style={styles.signOutBtn} onPress={() => signOut()}>
          <Ionicons name="log-out-outline" size={22} color={Colors.white} />
        </TouchableOpacity>
      </View>

      <View style={styles.revenueBanner}>
        <View>
          <Text style={styles.revenueLabel}>Total Revenue</Text>
          <Text style={styles.revenueValue}>TZS {stats.totalRevenue.toLocaleString()}</Text>
          <Text style={styles.revenueNote}>From approved payments</Text>
        </View>
        <Ionicons name="trending-up" size={40} color="rgba(255,255,255,0.3)" />
      </View>

      <View style={styles.statsGrid}>
        {[
          { icon: 'folder', label: 'Files', value: stats.totalFiles, color: Colors.primary },
          { icon: 'people', label: 'Customers', value: stats.totalUsers, color: Colors.success },
          { icon: 'time', label: 'Pending', value: stats.pendingRequests, color: Colors.warning },
          { icon: 'download', label: 'Downloads', value: stats.totalDownloads, color: Colors.accent },
        ].map(s => (
          <View key={s.label} style={[styles.statCard, { borderLeftColor: s.color }]}>
            <View style={[styles.statIcon, { backgroundColor: s.color + '20' }]}>
              <Ionicons name={s.icon as any} size={22} color={s.color} />
            </View>
            <Text style={styles.statValue}>{s.value}</Text>
            <Text style={styles.statLabel}>{s.label}</Text>
          </View>
        ))}
      </View>

      <Text style={styles.sectionTitle}>Quick Actions</Text>
      <View style={styles.actionsRow}>
        {[
          { icon: 'cloud-upload', label: 'Upload', screen: '/admin-tabs/upload', color: Colors.primary },
          { icon: 'notifications', label: 'Requests', screen: '/admin-tabs/requests', color: Colors.warning, badge: stats.pendingRequests },
          { icon: 'people', label: 'Customers', screen: '/admin-tabs/users', color: Colors.success },
          { icon: 'folder', label: 'Files', screen: '/admin-tabs/files', color: Colors.accent },
        ].map(a => (
          <TouchableOpacity key={a.label} style={styles.actionBtn} onPress={() => router.push(a.screen as any)}>
            <View style={[styles.actionIcon, { backgroundColor: a.color }]}>
              <Ionicons name={a.icon as any} size={22} color={Colors.white} />
              {a.badge ? <View style={styles.badge}><Text style={styles.badgeText}>{a.badge}</Text></View> : null}
            </View>
            <Text style={styles.actionLabel}>{a.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {recentRequests.length > 0 && (
        <>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Pending Approvals</Text>
            <TouchableOpacity onPress={() => router.push('/admin-tabs/requests')}>
              <Text style={styles.seeAll}>See All</Text>
            </TouchableOpacity>
          </View>
          {recentRequests.map(req => (
            <View key={req.id} style={styles.reqCard}>
              <View style={styles.reqAvatar}>
                <Text style={styles.reqAvatarText}>{req.profiles?.full_name?.[0]?.toUpperCase() ?? '?'}</Text>
              </View>
              <View style={styles.reqInfo}>
                <Text style={styles.reqName}>{req.profiles?.full_name}</Text>
                <Text style={styles.reqFile}>{req.files?.title}</Text>
                <Text style={styles.reqRef}>Ref: {req.payment_reference}</Text>
              </View>
              <Text style={styles.reqAmount}>TZS {req.files?.price?.toLocaleString()}</Text>
            </View>
          ))}
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { backgroundColor: Colors.primary, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 56, paddingBottom: Spacing.lg, paddingHorizontal: Spacing.lg },
  headerTitle: { fontSize: FontSize.xxl, fontWeight: '800', color: Colors.white },
  headerSubtitle: { fontSize: FontSize.sm, color: 'rgba(255,255,255,0.75)', marginTop: 2 },
  signOutBtn: { padding: Spacing.sm },
  revenueBanner: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: Colors.accent, margin: Spacing.md, borderRadius: Radius.md, padding: Spacing.lg },
  revenueLabel: { color: 'rgba(255,255,255,0.8)', fontSize: FontSize.sm, marginBottom: 4 },
  revenueValue: { color: Colors.white, fontSize: FontSize.xxxl, fontWeight: '800' },
  revenueNote: { color: 'rgba(255,255,255,0.7)', fontSize: FontSize.xs, marginTop: 2 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: Spacing.md, gap: Spacing.sm },
  statCard: { flex: 1, minWidth: '45%', backgroundColor: Colors.card, borderRadius: Radius.md, padding: Spacing.md, borderLeftWidth: 4, ...Shadow.sm },
  statIcon: { width: 40, height: 40, borderRadius: Radius.sm, alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.sm },
  statValue: { fontSize: FontSize.xxl, fontWeight: '800', color: Colors.textPrimary },
  statLabel: { fontSize: FontSize.sm, color: Colors.textSecondary, marginTop: 2 },
  sectionTitle: { fontSize: FontSize.lg, fontWeight: '700', color: Colors.textPrimary, marginLeft: Spacing.md, marginTop: Spacing.md, marginBottom: Spacing.sm },
  actionsRow: { flexDirection: 'row', gap: Spacing.sm, paddingHorizontal: Spacing.md, marginBottom: Spacing.sm },
  actionBtn: { flex: 1, alignItems: 'center' },
  actionIcon: { width: 56, height: 56, borderRadius: Radius.md, alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.xs, position: 'relative' },
  badge: { position: 'absolute', top: -4, right: -4, backgroundColor: Colors.danger, borderRadius: Radius.full, width: 18, height: 18, alignItems: 'center', justifyContent: 'center' },
  badgeText: { color: Colors.white, fontSize: 10, fontWeight: '800' },
  actionLabel: { fontSize: FontSize.xs, fontWeight: '600', color: Colors.textSecondary },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingRight: Spacing.md },
  seeAll: { fontSize: FontSize.sm, color: Colors.primary, fontWeight: '700' },
  reqCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.card, marginHorizontal: Spacing.md, marginBottom: Spacing.sm, borderRadius: Radius.md, padding: Spacing.md, ...Shadow.sm },
  reqAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center', marginRight: Spacing.md },
  reqAvatarText: { color: Colors.white, fontSize: FontSize.lg, fontWeight: '800' },
  reqInfo: { flex: 1 },
  reqName: { fontSize: FontSize.md, fontWeight: '700', color: Colors.textPrimary },
  reqFile: { fontSize: FontSize.sm, color: Colors.textSecondary },
  reqRef: { fontSize: FontSize.xs, color: Colors.textMuted, marginTop: 1 },
  reqAmount: { fontSize: FontSize.sm, fontWeight: '700', color: Colors.accent },
});
