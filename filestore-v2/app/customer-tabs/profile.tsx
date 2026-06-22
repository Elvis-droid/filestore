import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getCurrentUser, getProfile, getProfileStats, signOut } from '../../lib/firebase';
import { Colors, Spacing, FontSize, Radius, Shadow } from '../../constants/theme';

export default function ProfileScreen() {
  const [profile, setProfile] = useState<any>(null);
  const [stats, setStats] = useState({ downloads: 0, pending: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const user = getCurrentUser();
      if (!user) return;
      const [p, s] = await Promise.all([getProfile(user.uid), getProfileStats(user.uid)]);
      setProfile(p);
      setStats(s);
      setLoading(false);
    };
    load();
  }, []);

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: async () => { await signOut(); } },
    ]);
  };

  if (loading) return <View style={styles.centered}><ActivityIndicator size="large" color={Colors.primary} /></View>;

  const initials = profile?.full_name
    ? profile.full_name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
    : '?';

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scroll}>
      <View style={styles.header}>
        <View style={styles.avatar}><Text style={styles.avatarText}>{initials}</Text></View>
        <Text style={styles.name}>{profile?.full_name ?? 'Loading...'}</Text>
        <Text style={styles.email}>{profile?.email}</Text>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statNum}>{stats.downloads}</Text>
          <Text style={styles.statLabel}>Files Unlocked</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statCard}>
          <Text style={[styles.statNum, { color: Colors.warning }]}>{stats.pending}</Text>
          <Text style={styles.statLabel}>Pending Requests</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account Info</Text>
        {[
          { icon: 'person-outline', label: 'Full Name', value: profile?.full_name },
          { icon: 'mail-outline', label: 'Email', value: profile?.email },
          { icon: 'call-outline', label: 'Phone', value: profile?.phone },
          { icon: 'shield-outline', label: 'Account Type', value: 'Customer' },
        ].map(item => (
          <View key={item.label} style={styles.infoRow}>
            <Ionicons name={item.icon as any} size={20} color={Colors.primary} />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>{item.label}</Text>
              <Text style={styles.infoValue}>{item.value ?? '—'}</Text>
            </View>
          </View>
        ))}
      </View>

      <TouchableOpacity style={styles.signOutBtn} onPress={handleSignOut}>
        <Ionicons name="log-out-outline" size={20} color={Colors.danger} />
        <Text style={styles.signOutText}>Sign Out</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scroll: { paddingBottom: 100 },
  header: { backgroundColor: Colors.primary, paddingTop: 56, paddingBottom: Spacing.xl, alignItems: 'center' },
  avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: Colors.accent, alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.md },
  avatarText: { fontSize: FontSize.xxl, fontWeight: '800', color: Colors.white },
  name: { fontSize: FontSize.xl, fontWeight: '800', color: Colors.white },
  email: { fontSize: FontSize.sm, color: 'rgba(255,255,255,0.75)', marginTop: 4 },
  statsRow: { flexDirection: 'row', backgroundColor: Colors.card, margin: Spacing.md, borderRadius: Radius.md, ...Shadow.sm },
  statCard: { flex: 1, alignItems: 'center', paddingVertical: Spacing.lg },
  statNum: { fontSize: FontSize.xxxl, fontWeight: '800', color: Colors.primary },
  statLabel: { fontSize: FontSize.sm, color: Colors.textSecondary, marginTop: 4 },
  statDivider: { width: 1, backgroundColor: Colors.border },
  section: { backgroundColor: Colors.card, margin: Spacing.md, borderRadius: Radius.md, padding: Spacing.md, ...Shadow.sm },
  sectionTitle: { fontSize: FontSize.lg, fontWeight: '700', color: Colors.textPrimary, marginBottom: Spacing.md },
  infoRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: Spacing.sm, borderBottomWidth: 1, borderBottomColor: Colors.border },
  infoContent: { marginLeft: Spacing.md },
  infoLabel: { fontSize: FontSize.xs, color: Colors.textMuted, fontWeight: '600', textTransform: 'uppercase' },
  infoValue: { fontSize: FontSize.md, color: Colors.textPrimary, fontWeight: '600', marginTop: 1 },
  signOutBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    margin: Spacing.md, padding: Spacing.md, backgroundColor: Colors.card,
    borderRadius: Radius.md, borderWidth: 1.5, borderColor: Colors.danger, gap: Spacing.sm,
  },
  signOutText: { fontSize: FontSize.md, color: Colors.danger, fontWeight: '700' },
});
