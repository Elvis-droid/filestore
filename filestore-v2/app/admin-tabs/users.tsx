import React, { useEffect, useState } from 'react';
import {
  View, Text, FlatList, StyleSheet, RefreshControl,
  ActivityIndicator, TextInput, TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { getAllCustomers } from '../../lib/firebase';
import { Colors, Spacing, FontSize, Radius, Shadow } from '../../constants/theme';

export default function UsersScreen() {
  const router = useRouter();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');

  const load = async () => { const data = await getAllCustomers(); setUsers(data ?? []); };
  useEffect(() => { load().finally(() => setLoading(false)); }, []);
  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  const filtered = users.filter(u =>
    !search ||
    u.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase()) ||
    u.phone?.includes(search)
  );

  if (loading) return <View style={styles.centered}><ActivityIndicator size="large" color={Colors.primary} /></View>;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Customers</Text>
        <Text style={styles.headerSubtitle}>{users.length} registered customer{users.length !== 1 ? 's' : ''}</Text>
      </View>

      <View style={styles.searchBox}>
        <Ionicons name="search-outline" size={18} color={Colors.textMuted} />
        <TextInput style={styles.searchInput} placeholder="Search by name, email or phone..." placeholderTextColor={Colors.textMuted} value={search} onChangeText={setSearch} />
        {search ? <TouchableOpacity onPress={() => setSearch('')}><Ionicons name="close-circle" size={18} color={Colors.textMuted} /></TouchableOpacity> : null}
      </View>

      <FlatList
        data={filtered}
        keyExtractor={item => item.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
        contentContainerStyle={styles.list}
        ListEmptyComponent={<View style={styles.empty}><Ionicons name="people-outline" size={56} color={Colors.textMuted} /><Text style={styles.emptyText}>No customers found</Text></View>}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.userCard} onPress={() => router.push({ pathname: '/admin-tabs/customer-detail', params: { userId: item.id } })} activeOpacity={0.8}>
            <View style={styles.avatar}><Text style={styles.avatarText}>{item.full_name?.[0]?.toUpperCase() ?? '?'}</Text></View>
            <View style={styles.userInfo}>
              <Text style={styles.userName}>{item.full_name}</Text>
              <Text style={styles.userEmail}>{item.email}</Text>
              <Text style={styles.userPhone}>{item.phone}</Text>
              <Text style={styles.userJoined}>Joined {new Date(item.created_at).toLocaleDateString()}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
          </TouchableOpacity>
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
  list: { paddingHorizontal: Spacing.md, paddingBottom: 100 },
  empty: { alignItems: 'center', paddingTop: 60 },
  emptyText: { fontSize: FontSize.md, color: Colors.textMuted, marginTop: Spacing.md },
  userCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.card, borderRadius: Radius.md, padding: Spacing.md, marginBottom: Spacing.sm, ...Shadow.sm },
  avatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center', marginRight: Spacing.md },
  avatarText: { color: Colors.white, fontSize: FontSize.xl, fontWeight: '800' },
  userInfo: { flex: 1 },
  userName: { fontSize: FontSize.md, fontWeight: '700', color: Colors.textPrimary },
  userEmail: { fontSize: FontSize.sm, color: Colors.textSecondary },
  userPhone: { fontSize: FontSize.sm, color: Colors.textMuted },
  userJoined: { fontSize: FontSize.xs, color: Colors.textMuted, marginTop: 2 },
});
