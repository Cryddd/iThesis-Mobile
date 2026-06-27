import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  ChevronRight,
  HelpCircle,
  Info,
  LogIn,
  Server,
  ShieldCheck,
  UserCircle2,
} from 'lucide-react-native';

import { Button } from '@/components/ui/Button';
import { Screen } from '@/components/ui/Screen';
import { RowLink } from '@/components/RowLink';
import { API_BASE_URL } from '@/config/env';
import { colors, fonts, radius, shadows, spacing, typography } from '@/theme';
import type { RootStackParamList } from '@/navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export function AccountScreen() {
  const navigation = useNavigation<Nav>();
  return (
    <Screen edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Account</Text>

        <View style={styles.guestCard}>
          <View style={styles.avatar}>
            <UserCircle2 size={34} color={colors.primary} />
          </View>
          <View style={styles.guestText}>
            <Text style={styles.guestName}>Browsing as guest</Text>
            <Text style={styles.guestDesc}>
              Browse and submit theses without an account. Library staff can sign in for the review
              console.
            </Text>
          </View>
        </View>

        <Button
          label="Staff login"
          icon={<LogIn size={18} color={colors.white} />}
          onPress={() => navigation.navigate('Login')}
        />

        <View style={styles.group}>
          <Text style={styles.groupLabel}>Information</Text>
          <View style={styles.card}>
            <RowLink icon={Info} label="About iThesis" onPress={() => navigation.navigate('About')} />
            <RowLink icon={HelpCircle} label="Help & FAQ" onPress={() => navigation.navigate('FAQ')} />
            <RowLink icon={ShieldCheck} label="Privacy & security" onPress={() => navigation.navigate('About')} last />
          </View>
        </View>

        <View style={styles.group}>
          <Text style={styles.groupLabel}>Connection</Text>
          <View style={styles.serverCard}>
            <Server size={18} color={colors.textSecondary} />
            <View style={{ flex: 1 }}>
              <Text style={styles.serverLabel}>API server</Text>
              <Text style={styles.serverValue} numberOfLines={1}>
                {API_BASE_URL}
              </Text>
            </View>
          </View>
        </View>

        <Text style={styles.version}>iThesis Mobile · v1.0.0</Text>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: spacing.lg, gap: spacing.lg, paddingBottom: spacing.xxxl },
  title: { ...typography.h1, fontFamily: fonts.display, color: colors.primaryDark },
  guestCard: {
    flexDirection: 'row',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    ...shadows.card,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  guestText: { flex: 1, gap: 2 },
  guestName: { ...typography.h3 },
  guestDesc: { ...typography.small },
  group: { gap: spacing.sm },
  groupLabel: {
    ...typography.caption,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginLeft: spacing.xs,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  serverCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
  },
  serverLabel: { ...typography.caption, textTransform: 'uppercase', letterSpacing: 0.5 },
  serverValue: { ...typography.small, color: colors.textPrimary },
  version: { ...typography.caption, textAlign: 'center', marginTop: spacing.sm },
});
