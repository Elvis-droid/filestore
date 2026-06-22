import React, { useEffect, useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, Alert, ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { getFileById, updateFileDetails } from '../../lib/firebase';
import { Colors, Spacing, FontSize, Radius, Shadow } from '../../constants/theme';
import ErrorMessage from '../../components/ErrorMessage';

const CATEGORIES = ['document', 'video', 'audio', 'image', 'archive', 'software', 'other'];

export default function EditFileScreen() {
  const { fileId } = useLocalSearchParams<{ fileId: string }>();
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState('document');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    getFileById(fileId).then((data) => {
      if (data) {
        setTitle(data.title);
        setDescription(data.description ?? '');
        setPrice(String(data.price));
        setCategory(data.category ?? 'document');
      }
      setLoading(false);
    });
  }, [fileId]);

  const handleSave = async () => {
    setError('');
    if (!title.trim() || !description.trim() || !price) { setError('Please fill in all fields.'); return; }
    const priceNum = parseFloat(price);
    if (isNaN(priceNum) || priceNum <= 0) { setError('Please enter a valid price.'); return; }
    try {
      setSaving(true);
      await updateFileDetails(fileId, {
        title: title.trim(),
        description: description.trim(),
        price: priceNum,
        category,
      });
      Alert.alert('Saved!', 'File details updated successfully.', [{ text: 'OK', onPress: () => router.back() }]);
    } catch (err: any) {
      setError(err.message ?? 'Failed to save. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <View style={styles.centered}><ActivityIndicator size="large" color={Colors.primary} /></View>;

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={Colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit File</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        {error ? <ErrorMessage message={error} onDismiss={() => setError('')} /> : null}

        <View style={styles.field}>
          <Text style={styles.label}>File Title</Text>
          <View style={styles.inputBox}>
            <TextInput style={styles.input} value={title} onChangeText={setTitle} placeholder="File title" placeholderTextColor={Colors.textMuted} />
          </View>
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Description</Text>
          <View style={[styles.inputBox, { alignItems: 'flex-start', paddingTop: Spacing.sm }]}>
            <TextInput
              style={[styles.input, { height: 100, textAlignVertical: 'top' }]}
              value={description} onChangeText={setDescription}
              placeholder="Describe this file..." placeholderTextColor={Colors.textMuted}
              multiline numberOfLines={4}
            />
          </View>
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Price (TZS)</Text>
          <View style={styles.inputBox}>
            <Text style={styles.currencyLabel}>TZS</Text>
            <TextInput style={styles.input} value={price} onChangeText={setPrice} keyboardType="numeric" placeholder="e.g. 15000" placeholderTextColor={Colors.textMuted} />
          </View>
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Category</Text>
          <View style={styles.categoryGrid}>
            {CATEGORIES.map(cat => (
              <TouchableOpacity key={cat} style={[styles.categoryChip, category === cat && styles.categoryChipActive]} onPress={() => setCategory(cat)}>
                <Text style={[styles.categoryText, category === cat && styles.categoryTextActive]}>{cat.charAt(0).toUpperCase() + cat.slice(1)}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={saving}>
          {saving ? <ActivityIndicator color={Colors.white} /> : (
            <>
              <Ionicons name="checkmark-circle-outline" size={20} color={Colors.white} />
              <Text style={styles.saveBtnText}>Save Changes</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { backgroundColor: Colors.primary, paddingTop: 56, paddingBottom: Spacing.lg, paddingHorizontal: Spacing.lg, flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  backBtn: {},
  headerTitle: { fontSize: FontSize.xl, fontWeight: '800', color: Colors.white },
  scroll: { padding: Spacing.md, paddingBottom: 80 },
  field: { marginBottom: Spacing.md },
  label: { fontSize: FontSize.sm, fontWeight: '700', color: Colors.textPrimary, marginBottom: 6 },
  inputBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.card, borderWidth: 1.5, borderColor: Colors.border, borderRadius: Radius.md, paddingHorizontal: Spacing.md, gap: Spacing.sm },
  input: { flex: 1, height: 50, fontSize: FontSize.md, color: Colors.textPrimary },
  currencyLabel: { fontSize: FontSize.md, fontWeight: '800', color: Colors.primary },
  categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  categoryChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: Radius.full, borderWidth: 1.5, borderColor: Colors.border, backgroundColor: Colors.card },
  categoryChipActive: { borderColor: Colors.primary, backgroundColor: Colors.primary },
  categoryText: { fontSize: FontSize.sm, fontWeight: '600', color: Colors.textSecondary },
  categoryTextActive: { color: Colors.white },
  saveBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.primary, paddingVertical: 15, borderRadius: Radius.md, gap: Spacing.sm, marginTop: Spacing.md, ...Shadow.sm },
  saveBtnText: { color: Colors.white, fontSize: FontSize.md, fontWeight: '700' },
});
