import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ChevronRight } from 'lucide-react-native';

import { colors, spacing, typography } from '@/theme';
import type { IconType } from '@/types/icon';

interface RowLinkProps {
  icon: IconType;
  label: string;
  value?: string;
  onPress?: () => void;
  last?: boolean;
  danger?: boolean;
}

export function RowLink({ icon: Icon, label, value, onPress, last, danger }: RowLinkProps) {
  const tint = danger ? colors.rejected : colors.primary;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={({ pressed }) => [styles.row, !last && styles.divider, pressed && styles.pressed]}
    >
      <View style={styles.iconWrap}>
        <Icon size={19} color={tint} />
      </View>
      <Text style={[styles.label, danger && { color: colors.rejected }]}>{label}</Text>
      {value ? <Text style={styles.value}>{value}</Text> : null}
      <ChevronRight size={18} color={colors.textMuted} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg - 2,
  },
  divider: { borderBottomWidth: 1, borderBottomColor: colors.border },
  pressed: { backgroundColor: colors.surfaceMuted },
  iconWrap: { width: 24, alignItems: 'center' },
  label: { ...typography.body, flex: 1, fontFamily: 'Inter_500Medium' },
  value: { ...typography.small, color: colors.textMuted },
});
