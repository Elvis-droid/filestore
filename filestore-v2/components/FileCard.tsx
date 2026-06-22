import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, FontSize, Radius, Shadow } from '../constants/theme';

interface FileCardProps {
  file: {
    id: string;
    title: string;
    description: string;
    price: number;
    category: string;
    file_name: string;
  };
  hasAccess?: boolean;
  onPress: () => void;
}

const categoryIcons: Record<string, string> = {
  document: 'document-text',
  video: 'videocam',
  audio: 'musical-notes',
  image: 'image',
  archive: 'archive',
  software: 'code-slash',
  other: 'folder',
};

export default function FileCard({ file, hasAccess, onPress }: FileCardProps) {
  const icon = categoryIcons[file.category] ?? 'folder';

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.85}>
      {/* Icon */}
      <View style={styles.iconBox}>
        <Ionicons name={icon as any} size={28} color={Colors.primary} />
      </View>

      {/* Info */}
      <View style={styles.info}>
        <Text style={styles.title} numberOfLines={1}>{file.title}</Text>
        <Text style={styles.description} numberOfLines={2}>{file.description}</Text>
        <View style={styles.meta}>
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryText}>{file.category}</Text>
          </View>
          <Text style={styles.price}>TZS {file.price.toLocaleString()}</Text>
        </View>
      </View>

      {/* Access indicator */}
      <View style={styles.right}>
        {hasAccess ? (
          <View style={styles.accessBadge}>
            <Ionicons name="checkmark-circle" size={22} color={Colors.success} />
          </View>
        ) : (
          <View style={styles.lockedBadge}>
            <Ionicons name="lock-closed" size={18} color={Colors.textMuted} />
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: Colors.card,
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.sm,
    alignItems: 'center',
    ...Shadow.sm,
  },
  iconBox: {
    width: 52,
    height: 52,
    borderRadius: Radius.sm,
    backgroundColor: '#EAF0FB',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  info: {
    flex: 1,
    marginRight: Spacing.sm,
  },
  title: {
    fontSize: FontSize.md,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  description: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
    lineHeight: 18,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  categoryBadge: {
    backgroundColor: '#EAF0FB',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: Radius.full,
  },
  categoryText: {
    fontSize: FontSize.xs,
    color: Colors.primary,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  price: {
    fontSize: FontSize.sm,
    fontWeight: '700',
    color: Colors.accent,
  },
  right: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  accessBadge: {},
  lockedBadge: {
    width: 32,
    height: 32,
    borderRadius: Radius.full,
    backgroundColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
