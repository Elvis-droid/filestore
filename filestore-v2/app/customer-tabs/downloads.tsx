import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, FlatList, StyleSheet,
  RefreshControl, ActivityIndicator, TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getCurrentUser, getMyDownloads } from '../../lib/firebase';
import DownloadButton from '../../components/DownloadProgress';
import { Colors, Spacing, FontSize, Radius, Shadow } from '../../constants/theme';

export default function DownloadsScreen() {
  const [downloads, setDownloads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userId, setUserId] = useState('');
  const [expanded, setExpanded] = useState<string | null>(null);

  const load = useCallback(async () => {
    const user = getCurrentUser();
    if (!user) return;
    setUserId(user.uid);
    const data = await getMyDownloads(user.uid);
    setDownloads(data ?? []);
  }, []);

  useEffect(() => { load().finally(() => setLoading(false)); }, []);
  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  if (loading) return <View style={styles.centered}><ActivityIndicator size="large" color={Colors.primary} /></View>;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Downloads</Text>
        <Text style={styles.headerSubtitle}>{downloads.length} file{downloads.length !== 1 ? 's' : ''} available</Text>
      </View>

      <FlatList
        data={downloads}
        keyExtractor={item => item.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="cloud-download-outline" size={64} color={Colors.textMuted} />
            <Text style={styles.emptyTitle}>No Downloads Yet</Text>
            <Text style={styles.emptyDesc}>Browse files and complete payment to unlock your downloads here.</Text>
          </View>
        }
        renderItem={({ item }) => {
          const file = item.files;
          const isExpanded = expanded === item.id;
          return (
            <View style={styles.card}>
              <TouchableOpacity style={styles.cardHeader} onPress={() => setExpanded(isExpanded ? null : item.id)} activeOpacity={0.8}>
                <View style={styles.fileIcon}>
                  <Ionicons name="document-text" size={24} color={Colors.primary} />
                </View>
                <View style={styles.cardInfo}>
                  <Text style={styles.cardTitle} numberOfLines={1}>{file?.title}</Text>
                  <Text style={styles.cardDate}>Unlocked {new Date(item.created_at).toLocaleDateString()}</Text>
                </View>
                <Ionicons name={isExpanded ? 'chevron-up' : 'chevron-down'} size={20} color={Colors.textMuted} />
              </TouchableOpacity>

              {isExpanded && (
                <View style={styles.cardBody}>
                  <Text style={styles.cardDesc}>{file?.description}</Text>
                  <View style={styles.divider} />
                  <DownloadButton fileUrl={file?.file_url} fileName={file?.file_name} fileId={file?.id} userId={userId} />
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
  headerSubtitle: { fontSize: FontSize.sm, color: 'rgba(255,255,255,0.75)', marginTop: 2 },
  list: { padding: Spacing.md, paddingBottom: 100 },
  empty: { alignItems: 'center', paddingTop: 80, paddingHorizontal: Spacing.xl },
  emptyTitle: { fontSize: FontSize.xl, fontWeight: '700', color: Colors.textPrimary, marginTop: Spacing.md },
  emptyDesc: { fontSize: FontSize.sm, color: Colors.textSecondary, textAlign: 'center', marginTop: Spacing.sm, lineHeight: 20 },
  card: { backgroundColor: Colors.card, borderRadius: Radius.md, marginBottom: Spacing.sm, overflow: 'hidden', ...Shadow.sm },
  cardHeader: { flexDirection: 'row', alignItems: 'center', padding: Spacing.md },
  fileIcon: { width: 44, height: 44, borderRadius: Radius.sm, backgroundColor: '#EAF0FB', alignItems: 'center', justifyContent: 'center', marginRight: Spacing.md },
  cardInfo: { flex: 1 },
  cardTitle: { fontSize: FontSize.md, fontWeight: '700', color: Colors.textPrimary },
  cardDate: { fontSize: FontSize.sm, color: Colors.textMuted, marginTop: 2 },
  cardBody: { paddingHorizontal: Spacing.md, paddingBottom: Spacing.md },
  cardDesc: { fontSize: FontSize.sm, color: Colors.textSecondary, lineHeight: 20, marginBottom: Spacing.md },
  divider: { height: 1, backgroundColor: Colors.border, marginBottom: Spacing.md },
});
