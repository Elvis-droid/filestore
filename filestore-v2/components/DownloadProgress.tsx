import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import * as FileSystem from 'expo-file-system';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, FontSize, Radius, Shadow } from '../constants/theme';
import { logDownload } from '../lib/firebase';

interface DownloadButtonProps {
  fileUrl: string;
  fileName: string;
  fileId: string;
  userId: string;
}

export default function DownloadButton({ fileUrl, fileName, fileId, userId }: DownloadButtonProps) {
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState<'idle' | 'downloading' | 'done' | 'error'>('idle');

  const startDownload = async () => {
    try {
      setStatus('downloading');
      setProgress(0);

      const downloadDir = FileSystem.documentDirectory + 'FileStore/';
      await FileSystem.makeDirectoryAsync(downloadDir, { intermediates: true });

      const fileUri = downloadDir + fileName;

      const downloadResumable = FileSystem.createDownloadResumable(
        fileUrl,
        fileUri,
        {},
        (downloadProgress) => {
          const percent = downloadProgress.totalBytesWritten / downloadProgress.totalBytesExpectedToWrite;
          setProgress(Math.round(percent * 100));
        }
      );

      const result = await downloadResumable.downloadAsync();
      if (result) {
        setStatus('done');
        await logDownload(userId, fileId);
        Alert.alert('✅ Download Complete', `"${fileName}" has been saved to your device.`, [{ text: 'OK' }]);
      }
    } catch (err) {
      setStatus('error');
      Alert.alert('Download Failed', 'Please check your connection and try again.');
    }
  };

  if (status === 'downloading') {
    return (
      <View style={styles.progressBox}>
        <Text style={styles.progressLabel}>Downloading... {progress}%</Text>
        <View style={styles.progressBarBg}>
          <View style={[styles.progressBarFill, { width: `${progress}%` }]} />
        </View>
        <Text style={styles.progressSub}>Please keep the app open</Text>
      </View>
    );
  }

  return (
    <TouchableOpacity style={[styles.button, status === 'done' && styles.buttonDone]} onPress={startDownload} activeOpacity={0.85}>
      <Ionicons name={status === 'done' ? 'checkmark-circle' : 'download-outline'} size={20} color={Colors.white} />
      <Text style={styles.buttonText}>{status === 'done' ? 'Downloaded' : 'Download File'}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.primary, paddingVertical: 14, borderRadius: Radius.md, gap: Spacing.sm, ...Shadow.sm },
  buttonDone: { backgroundColor: Colors.success },
  buttonText: { color: Colors.white, fontSize: FontSize.md, fontWeight: '700' },
  progressBox: { backgroundColor: Colors.card, padding: Spacing.md, borderRadius: Radius.md, ...Shadow.sm },
  progressLabel: { fontSize: FontSize.md, fontWeight: '700', color: Colors.primary, marginBottom: Spacing.sm },
  progressBarBg: { height: 10, backgroundColor: Colors.border, borderRadius: Radius.full, overflow: 'hidden', marginBottom: Spacing.xs },
  progressBarFill: { height: '100%', backgroundColor: Colors.primary, borderRadius: Radius.full },
  progressSub: { fontSize: FontSize.xs, color: Colors.textMuted, textAlign: 'center' },
});
