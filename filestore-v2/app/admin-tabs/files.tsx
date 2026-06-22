import React, { useEffect, useState } from 'react';
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity,
  Alert, RefreshControl, ActivityIndicator, TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { getFiles, deleteFileSoft } from '../../lib/firebase';
import { Colors, Spacing, FontSize, Radius, Shadow } from '../../constants/theme';

export default function AdminFilesScreen() {
  const router = useRouter();
  const [files, setFiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');

  const load = async () => { const data = await getFiles(); setFiles(data ?? []); };
  useEffect(() => { load().finally(() => setLoading(false)); }, []);
  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  const filtered = files.filter(f => !search || f.title.toLowerCase().includes(search.toLowerCase()) || f.category.toLowerCase().includes(search.toLowerCase()));

  const handleDelete = (file: any) => {
    Alert.alert('Delete File', `Delete "${file.title}"? This cannot be undone.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        await deleteFileSoft(file.id);
        setFiles(prev => prev.filter(f => f.id !== file.id));
      }},
    ]);
  };

  if (loading) return <View style={styles.centered}><ActivityIndicator size="large" color={Colors.primary} /></View>;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Manage Files</Text>
        <Text style={styles.headerSubtitle}>{files.length} active file{files.length !== 1 ? 's' : ''}</Text>
      </View>

      <View style={styles.searchBox}>
        <Ionicons name="search-outline" size={18} color={Colors.textMuted} />
        <TextInput style={styles.searchInput} placeholder="Search files..." placeholderTextColor={Colors.textMuted} value={search} onChangeText={setSearch} />
        {search ? <TouchableOpacity onPress={() => setSearch('')}><Ionicons name="close-circle" size={18} color={Colors.textMuted} /></TouchableOpacity> : null}
      </View>

      <FlatList
        data={filtered}
        keyExtractor={item => item.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
        contentContainerStyle={styles.list}
        ListEmptyComponent={<View style={styles.empty}><Ionicons name="folder-open-outline" size={56} color={Colors.textMuted} /><Text style={styles.emptyText}>No files found</Text></View>}
        renderItem={({ item }) => (
          <View style={styles.fileCard}>
            <View style={styles.fileIcon}>
              <Ionicons name="document-text" size={22} color={Colors.primary} />
            </View>
            <View style={styles.fileInfo}>
              <Text style={styles.fileName} numberOfLines={1}>{item.title}</Text>
              <Text style={styles.fileCategory}>{item.category}</Text>
              <Text style={styles.filePrice}>TZS {item.price?.toLocaleString()}</Text>
            </View>
            <TouchableOpacity style={styles.editBtn} onPress={() => router.push({ pathname: '/admin-tabs/edit-file', params: { fileId: item.id } })}>
              <Ionicons name="create-outline" size={18} color={Colors.primary} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDelete(item)}>
              <Ionicons name="trash-outline" size={18} color={Colors.danger} />
            </TouchableOpacity>
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
  emptyText: { fontSize: FontSize.md, color: Colors.textMuted, marginTop: Spacing.md },
  fileCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.card, borderRadius: Radius.md, padding: Spacing.md, marginBottom: Spacing.sm, ...Shadow.sm },
  fileIcon: { width: 44, height: 44, borderRadius: Radius.sm, backgroundColor: '#EAF0FB', alignItems: 'center', justifyContent: 'center', marginRight: Spacing.md },
  fileInfo: { flex: 1 },
  fileName: { fontSize: FontSize.md, fontWeight: '700', color: Colors.textPrimary },
  fileCategory: { fontSize: FontSize.sm, color: Colors.textSecondary, textTransform: 'capitalize' },
  filePrice: { fontSize: FontSize.sm, fontWeight: '700', color: Colors.accent, marginTop: 2 },
  editBtn: { padding: Spacing.sm },
  deleteBtn: { padding: Spacing.sm },
});
