import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';

import { colors, fonts, spacing } from '@/theme';

const LOGO = require('../../assets/BSU_LOGO.png');

/**
 * University brand lockup used on auth + landing headers — logo beside the
 * "Batangas State University / TheNEU Lipa – Library" wordmark, matching the web.
 */
export function Brand({ size = 'md', inverse = false }: { size?: 'sm' | 'md'; inverse?: boolean }) {
  const dim = size === 'sm' ? 40 : 52;
  const titleColor = inverse ? colors.white : colors.primaryDark;
  const subColor = inverse ? 'rgba(255,255,255,0.85)' : colors.textSecondary;
  return (
    <View style={styles.row}>
      <Image source={LOGO} style={{ width: dim, height: dim, borderRadius: dim / 2 }} />
      <View style={styles.text}>
        <Text style={[styles.title, { color: titleColor }]}>Batangas State University</Text>
        <Text style={[styles.sub, { color: subColor }]}>TheNEU Lipa – Library</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  text: { flexShrink: 1 },
  title: { fontFamily: fonts.sansBold, fontSize: 17, lineHeight: 20 },
  sub: { fontFamily: fonts.sansMedium, fontSize: 12.5, marginTop: 1 },
});
