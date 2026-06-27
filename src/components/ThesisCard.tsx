import React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Calendar, Eye, FileText } from 'lucide-react-native';

import { StatusBadge } from './ui/StatusBadge';
import { colors, radius, shadows, spacing, typography } from '@/theme';
import type { Thesis } from '@/types';

function authorNames(thesis: Thesis): string {
  if (!thesis.authors?.length) return 'Unknown author';
  return thesis.authors.filter(Boolean).join(', ');
}

interface ThesisCardProps {
  thesis: Thesis;
  onPress: (thesis: Thesis) => void;
  /** Show the lifecycle status badge (repository / review contexts). */
  showStatus?: boolean;
}

export function ThesisCard({ thesis, onPress, showStatus }: ThesisCardProps) {
  const dept = thesis.department;
  return (
    <Pressable
      onPress={() => onPress(thesis)}
      accessibilityRole="button"
      accessibilityLabel={`Open thesis: ${thesis.title}`}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      <View style={styles.cover}>
        {thesis.thumbnailUrl ? (
          <Image source={{ uri: thesis.thumbnailUrl }} style={styles.thumb} resizeMode="cover" />
        ) : (
          <View style={styles.placeholder}>
            <FileText size={28} color={colors.primaryLight} />
          </View>
        )}
      </View>

      <View style={styles.body}>
        {showStatus && thesis.status ? (
          <View style={styles.badgeRow}>
            <StatusBadge status={thesis.status} />
          </View>
        ) : null}

        <Text style={styles.title} numberOfLines={2}>
          {thesis.title}
        </Text>
        <Text style={styles.authors} numberOfLines={1}>
          {authorNames(thesis)}
        </Text>

        {dept ? (
          <View style={styles.deptPill}>
            <Text style={styles.deptText} numberOfLines={1}>
              {dept}
            </Text>
          </View>
        ) : null}

        <View style={styles.metaRow}>
          {thesis.publicationYear ? (
            <View style={styles.meta}>
              <Calendar size={13} color={colors.textMuted} />
              <Text style={styles.metaText}>{thesis.publicationYear}</Text>
            </View>
          ) : null}
          {typeof thesis.viewCount === 'number' ? (
            <View style={styles.meta}>
              <Eye size={13} color={colors.textMuted} />
              <Text style={styles.metaText}>{thesis.viewCount}</Text>
            </View>
          ) : null}
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    ...shadows.card,
  },
  pressed: { opacity: 0.92, transform: [{ scale: 0.995 }] },
  cover: { width: 70, height: 92 },
  thumb: { width: 70, height: 92, borderRadius: radius.sm, backgroundColor: colors.surfaceMuted },
  placeholder: {
    width: 70,
    height: 92,
    borderRadius: radius.sm,
    backgroundColor: colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: { flex: 1, gap: 4 },
  badgeRow: { marginBottom: 2 },
  title: { ...typography.h3, fontSize: 15.5, lineHeight: 21 },
  authors: { ...typography.small, color: colors.textSecondary },
  deptPill: {
    alignSelf: 'flex-start',
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    marginTop: 2,
  },
  deptText: { ...typography.caption, color: colors.primary },
  metaRow: { flexDirection: 'row', gap: spacing.lg, marginTop: 4 },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { ...typography.caption, color: colors.textMuted },
});
