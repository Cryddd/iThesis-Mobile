import React, { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Check, ChevronDown } from 'lucide-react-native';

import { colors, fonts, radius, shadows, spacing, typography } from '@/theme';

export interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps {
  label?: string;
  placeholder: string;
  value: string;
  /** Optional pre-resolved label (when the display text differs from value). */
  display?: string;
  options: SelectOption[];
  onChange: (value: string) => void;
}

/**
 * Tap-to-pick dropdown — a mobile-friendly stand-in for the web's `<select>`.
 * Opens a modal sheet listing the options.
 */
export function Select({ label, placeholder, value, display, options, onChange }: SelectProps) {
  const [open, setOpen] = useState(false);
  const selectedLabel = display || options.find((o) => o.value === value)?.label;

  return (
    <View style={styles.wrap}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <Pressable style={styles.field} onPress={() => setOpen(true)}>
        <Text style={[styles.value, !selectedLabel && styles.placeholder]} numberOfLines={1}>
          {selectedLabel || placeholder}
        </Text>
        <ChevronDown size={18} color={colors.textMuted} />
      </Pressable>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)}>
          <Pressable style={styles.card}>
            {label ? <Text style={styles.cardTitle}>{label}</Text> : null}
            <ScrollView showsVerticalScrollIndicator={false} style={styles.scroll}>
              {options.map((opt) => {
                const active = opt.value === value;
                return (
                  <Pressable
                    key={opt.value}
                    style={[styles.row, active && styles.rowActive]}
                    onPress={() => {
                      onChange(opt.value);
                      setOpen(false);
                    }}
                  >
                    <Text style={[styles.rowText, active && styles.rowTextActive]}>{opt.label}</Text>
                    {active ? <Check size={16} color={colors.primary} /> : null}
                  </Pressable>
                );
              })}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.xs, flex: 1 },
  label: { ...typography.label },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 50,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
  },
  value: { ...typography.body, flex: 1, marginRight: spacing.sm },
  placeholder: { color: colors.textMuted },
  backdrop: {
    flex: 1,
    backgroundColor: colors.overlay,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  card: {
    width: '100%',
    maxWidth: 420,
    maxHeight: '70%',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    ...shadows.soft,
  },
  cardTitle: {
    ...typography.label,
    color: colors.primaryDark,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
  },
  scroll: { flexGrow: 0 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.sm,
  },
  rowActive: { backgroundColor: colors.surfaceMuted },
  rowText: { ...typography.body, flex: 1, marginRight: spacing.sm },
  rowTextActive: { color: colors.primary, fontFamily: fonts.sansSemibold },
});
