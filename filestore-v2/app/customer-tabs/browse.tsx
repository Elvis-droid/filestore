import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, FlatList, StyleSheet, TextInput,
  RefreshControl, TouchableOpacity, ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { getCurrentUser, getFiles, getMyDownloads } from '../../lib/firebase';
import FileCard from '../../components/FileCard';
import { Colors, Spacing, FontSize, Radius } from '../../constants/theme';

const CATEGORIES = ['All', 'document', 'video', 'audio', 'image', 'archive', 'software', 'other'];

export default function BrowseScreen() {
  const router = useRouter();
  const [files, setFiles] = useState<any[]>([]);
  const [myAccessIds, setMyAccessIds] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    const user = getCurrentUser();
    const [allFiles, myAccess] = await Promise.all([
      getFiles(),
      user ? getMyDownloads(user.uid) : Promise.resolve([]),
    ]);
    setFiles(allFiles ?? []);
    setMyAccessIds(new Set((myAccess ?? []).map((a: any) => a.file_id)));
  }, []);

  useEffect(() => { loadData().finally(() => setLoading(false)); }, []);

  const onRefresh = async () => { setRefreshing(true); await loadData(); setRefreshing(false); };

  const filtered = files.filter(f => {
    const matchSearch = f.title.toLowerCase().includes(search.toLowerCase()) ||
      f.description.toLowerCase().includes(search.toLowerCase());
    const matchCategory = category === 'All' || f.category === category;
    return matchSearch && matchCategory;
  });

  if (loading) return <View style={styles.centered}><ActivityIndicator size="large" color={Colors.primary} /></View>;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>FileStore</Text>
        <Text style={styles.headerSubtitle}>Browse available files</Text>
      </View>

      <View style={styles.searchBox}>
        <Ionicons name="search-outline" size={18} color={Colors.textMuted} />
        <TextInput style={styles.searchInput} placeholder="Search files..." placeholderTextColor={Colors.textMuted} value={search} onChangeText={setSearch} />
      </View>

      <FlatList
        horizontal
        data={CATEGORIES}
        keyExtractor={item => item}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categoryList}
        renderItem={({ item }) => (
          <TouchableOpacity style={[styles.categoryChip, category === item && styles.categoryChipActive]} onPress={() => setCategory(item)}>
            <Text style={[styles.categoryChipText, category === item && styles.categoryChipTextActive]}>
              {item === 'All' ? 'All' : item.charAt(0).toUpperCase() + item.slice(1)}
            </Text>
          </TouchableOpacity>
        )}
      />

      <FlatList
        data={filtered}
        keyExtractor={item => item.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="folder-open-outline" size={48} color={Colors.textMuted} />
            <Text style={styles.emptyText}>No files found</Text>
          </View>
        }
        renderItem={({ item }) => (
          <FileCard
            file={item}
            hasAccess={myAccessIds.has(item.id)}
            onPress={() => router.push({ pathname: '/customer-tabs/file/detail', params: { fileId: item.id } })}
          />
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
  searchBox: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.card,
    margin: Spacing.md, paddingHorizontal: Spacing.md, borderRadius: Radius.md,
    borderWidth: 1.5, borderColor: Colors.border, gap: Spacing.sm,
  },
  searchInput: { flex: 1, height: 46, fontSize: FontSize.md, color: Colors.textPrimary },
  categoryList: { paddingHorizontal: Spacing.md, paddingBottom: Spacing.sm, gap: Spacing.xs },
  categoryChip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: Radius.full, backgroundColor: Colors.card, borderWidth: 1.5, borderColor: Colors.border, marginRight: 6 },
  categoryChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  categoryChipText: { fontSize: FontSize.sm, fontWeight: '600', color: Colors.textSecondary },
  categoryChipTextActive: { color: Colors.white },
  list: { paddingTop: Spacing.sm, paddingBottom: 100 },
  empty: { alignItems: 'center', paddingVertical: Spacing.xxl },
  emptyText: { fontSize: FontSize.md, color: Colors.textMuted, marginTop: Spacing.sm },
});
