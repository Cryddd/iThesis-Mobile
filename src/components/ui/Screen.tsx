import React from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';

import { colors, spacing } from '@/theme';

interface ScreenProps {
  children: React.ReactNode;
  /** Apply default horizontal padding. */
  padded?: boolean;
  edges?: Edge[];
  style?: ViewStyle;
  background?: string;
}

/** Standard safe-area screen wrapper with the warm app background. */
export function Screen({
  children,
  padded = false,
  edges = ['top', 'left', 'right'],
  style,
  background = colors.background,
}: ScreenProps) {
  return (
    <SafeAreaView edges={edges} style={[styles.safe, { backgroundColor: background }]}>
      <View style={[styles.inner, padded && styles.padded, style]}>{children}</View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  inner: { flex: 1 },
  padded: { paddingHorizontal: spacing.lg },
});
