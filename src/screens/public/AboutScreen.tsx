import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { ArrowLeft, BookOpen, ShieldCheck, Upload, Users } from 'lucide-react-native';

import { Brand } from '@/components/Brand';
import { Screen } from '@/components/ui/Screen';
import { colors, fonts, radius, shadows, spacing, typography } from '@/theme';
import type { IconType } from '@/types/icon';

const POINTS: { icon: IconType; title: string; body: string }[] = [
  {
    icon: BookOpen,
    title: 'Digital repository',
    body: 'A searchable archive of approved undergraduate and graduate theses from TheNEU Lipa.',
  },
  {
    icon: Upload,
    title: 'Controlled submission',
    body: 'Students submit manuscripts with an access code; librarians review before publishing.',
  },
  {
    icon: Users,
    title: 'For everyone',
    body: 'Students, faculty, library visitors, librarians, and administrators — each with the right access.',
  },
  {
    icon: ShieldCheck,
    title: 'Secure by design',
    body: 'Role-based access, watermarked viewing, and single-device sign-in protect every record.',
  },
];

export function AboutScreen() {
  const navigation = useNavigation<any>();
  return (
    <Screen edges={['top']}>
      <View style={styles.topBar}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={10} style={styles.back}>
          <ArrowLeft size={20} color={colors.primary} />
          <Text style={styles.backText}>Back</Text>
        </Pressable>
      </View>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Brand />
        <Text style={styles.title}>About iThesis</Text>
        <Text style={styles.lead}>
          iThesis is the digital thesis repository and workflow system for the Batangas State
          University TheNEU Lipa Campus Library. This mobile app extends the library's system beyond
          its on-site workstations so you can browse, submit, and track thesis records from anywhere.
        </Text>

        {POINTS.map(({ icon: Icon, title, body }) => (
          <View key={title} style={styles.card}>
            <View style={styles.icon}>
              <Icon size={20} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardTitle}>{title}</Text>
              <Text style={styles.cardBody}>{body}</Text>
            </View>
          </View>
        ))}

        <Text style={styles.footer}>Batangas State University · TheNEU Lipa Campus Library</Text>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  topBar: { paddingHorizontal: spacing.lg, paddingTop: spacing.xs },
  back: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  backText: { ...typography.label, color: colors.primary },
  scroll: { padding: spacing.lg, gap: spacing.lg, paddingBottom: spacing.xxxl },
  title: { ...typography.h1, fontFamily: fonts.display, color: colors.primaryDark },
  lead: { ...typography.body, color: colors.textSecondary, lineHeight: 23 },
  card: {
    flexDirection: 'row',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    ...shadows.card,
  },
  icon: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: { ...typography.h3 },
  cardBody: { ...typography.small, color: colors.textSecondary, marginTop: 2 },
  footer: { ...typography.caption, textAlign: 'center', marginTop: spacing.sm },
});
