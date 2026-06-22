import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, Alert, ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { Ionicons } from '@expo/vector-icons';
import { uploadFile } from '../../lib/firebase';
import { Colors, Spacing, FontSize, Radius, Shadow } from '../../constants/theme';
import ErrorMessage from '../../components/ErrorMessage';

const CATEGORIES = ['document', 'video', 'audio', 'image', 'archive', 'software', 'other'];

export default function UploadScreen() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState('document');
  const [file, setFile] = useState<any>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const pickFile = async () => {
    const result = await DocumentPicker.getDocumentAsync({ copyToCacheDirectory: true });
    if (result.canceled) return;
    setFile(result.assets[0]);
  };

  const handleUpload = async () => {
    setError('');
    if (!title || !description || !price || !file) { setError('Please fill in all fields and select a file.'); return; }
    const priceNum = parseFloat(price);
    if (isNaN(priceNum) || priceNum <= 0) { setError('Please enter a valid price.'); return; }
    try {
      setUploading(true);
      await uploadFile(
        { uri: file.uri, name: file.name, type: file.mimeType ?? 'application/octet-stream' },
        { title, description, price: priceNum, category }
      );
      Alert.alert('✅ File Uploaded!', `"${title}" is now live and available for customers.`);
      setTitle(''); setDescription(''); setPrice(''); setFile(null); setCategory('document');
    } catch (err: any) {
      setError(err.message ?? 'Upload failed. Please check your connection and try again.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Upload File</Text>
        <Text style={styles.headerSubtitle}>Add a new file for customers</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        {error ? <ErrorMessage message={error} onDismiss={() => setError('')} /> : null}

        <TouchableOpacity style={[styles.filePicker, file && styles.filePickerActive]} onPress={pickFile}>
          {file ? (
            <>
              <Ionicons name="document-attach" size={36} color={Colors.primary} />
              <Text style={styles.filePickerName} numberOfLines={1}>{file.name}</Text>
              <Text style={styles.filePickerSize}>{file.size ? `${(file.size / 1024 / 1024).toFixed(2)} MB` : 'File selected'}</Text>
            </>
          ) : (
            <>
              <Ionicons name="cloud-upload-outline" size={48} color={Colors.textMuted} />
              <Text style={styles.filePickerLabel}>Tap to select a file</Text>
              <Text style={styles.filePickerSub}>Supports all file types (GB files supported)</Text>
            </>
          )}
        </TouchableOpacity>

        <View style={styles.field}>
          <Text style={styles.label}>File Title *</Text>
          <View style={styles.inputBox}>
            <Ionicons name="text-outline" size={18} color={Colors.textMuted} />
            <TextInput style={styles.input} placeholder="e.g. Complete Design Course 2025" placeholderTextColor={Colors.textMuted} value={title} onChangeText={setTitle} />
          </View>
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Description *</Text>
          <View style={[styles.inputBox, styles.textAreaBox]}>
            <TextInput
              style={[styles.input, styles.textArea]} placeholder="Describe what's included in this file..."
              placeholderTextColor={Colors.textMuted} value={description} onChangeText={setDescription}
              multiline numberOfLines={4} textAlignVertical="top"
            />
          </View>
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Price (TZS) *</Text>
          <View style={styles.inputBox}>
            <Text style={styles.currencyLabel}>TZS</Text>
            <TextInput style={styles.input} placeholder="e.g. 15000" placeholderTextColor={Colors.textMuted} value={price} onChangeText={setPrice} keyboardType="numeric" />
          </View>
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Category *</Text>
          <View style={styles.categoryGrid}>
            {CATEGORIES.map(cat => (
              <TouchableOpacity key={cat} style={[styles.categoryChip, category === cat && styles.categoryChipActive]} onPress={() => setCategory(cat)}>
                <Text style={[styles.categoryText, category === cat && styles.categoryTextActive]}>{cat.charAt(0).toUpperCase() + cat.slice(1)}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <TouchableOpacity style={[styles.uploadBtn, uploading && styles.uploadBtnDisabled]} onPress={handleUpload} disabled={uploading}>
          {uploading ? (
            <View style={styles.uploadingRow}>
              <ActivityIndicator color={Colors.white} />
              <Text style={styles.uploadBtnText}>Uploading... Please wait</Text>
            </View>
          ) : (
            <View style={styles.uploadingRow}>
              <Ionicons name="cloud-upload" size={20} color={Colors.white} />
              <Text style={styles.uploadBtnText}>Upload File</Text>
            </View>
          )}
        </TouchableOpacity>

        {uploading && <Text style={styles.uploadNote}>⚠️ Large files may take a few minutes. Keep the app open.</Text>}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { backgroundColor: Colors.primary, paddingTop: 56, paddingBottom: Spacing.lg, paddingHorizontal: Spacing.lg },
  headerTitle: { fontSize: FontSize.xxl, fontWeight: '800', color: Colors.white },
  headerSubtitle: { fontSize: FontSize.sm, color: 'rgba(255,255,255,0.75)', marginTop: 2 },
  scroll: { padding: Spacing.md, paddingBottom: 80 },
  filePicker: { borderWidth: 2, borderColor: Colors.border, borderStyle: 'dashed', borderRadius: Radius.lg, padding: Spacing.xl, alignItems: 'center', backgroundColor: Colors.card, marginBottom: Spacing.md },
  filePickerActive: { borderColor: Colors.primary, borderStyle: 'solid', backgroundColor: '#EAF0FB' },
  filePickerLabel: { fontSize: FontSize.md, fontWeight: '600', color: Colors.textSecondary, marginTop: Spacing.sm },
  filePickerSub: { fontSize: FontSize.sm, color: Colors.textMuted, marginTop: 4 },
  filePickerName: { fontSize: FontSize.md, fontWeight: '700', color: Colors.primary, marginTop: Spacing.sm, textAlign: 'center' },
  filePickerSize: { fontSize: FontSize.sm, color: Colors.textSecondary },
  field: { marginBottom: Spacing.md },
  label: { fontSize: FontSize.sm, fontWeight: '700', color: Colors.textPrimary, marginBottom: 6 },
  inputBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.card, borderWidth: 1.5, borderColor: Colors.border, borderRadius: Radius.md, paddingHorizontal: Spacing.md, gap: Spacing.sm },
  input: { flex: 1, height: 50, fontSize: FontSize.md, color: Colors.textPrimary },
  textAreaBox: { alignItems: 'flex-start', paddingTop: Spacing.sm },
  textArea: { height: 100, textAlignVertical: 'top', paddingTop: 4 },
  currencyLabel: { fontSize: FontSize.md, fontWeight: '800', color: Colors.primary },
  categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  categoryChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: Radius.full, borderWidth: 1.5, borderColor: Colors.border, backgroundColor: Colors.card },
  categoryChipActive: { borderColor: Colors.primary, backgroundColor: Colors.primary },
  categoryText: { fontSize: FontSize.sm, fontWeight: '600', color: Colors.textSecondary },
  categoryTextActive: { color: Colors.white },
  uploadBtn: { backgroundColor: Colors.primary, paddingVertical: 16, borderRadius: Radius.md, alignItems: 'center', marginTop: Spacing.md, ...Shadow.sm },
  uploadBtnDisabled: { backgroundColor: Colors.textMuted },
  uploadingRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  uploadBtnText: { color: Colors.white, fontSize: FontSize.md, fontWeight: '700' },
  uploadNote: { textAlign: 'center', color: Colors.warning, fontSize: FontSize.sm, marginTop: Spacing.sm },
});
