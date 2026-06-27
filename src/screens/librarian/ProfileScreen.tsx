import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import {
  Award,
  BadgeCheck,
  BarChart3,
  FileBarChart,
  KeyRound,
  LogOut,
  Mail,
  ShieldCheck,
  Smartphone,
  Trash2,
} from 'lucide-react-native';

import { Button } from '@/components/ui/Button';
import { Screen } from '@/components/ui/Screen';
import { RowLink } from '@/components/RowLink';
import { useAuth } from '@/store/AuthContext';
import { initials } from '@/utils/format';
import { colors, fonts, radius, shadows, spacing, typography } from '@/theme';

export function ProfileScreen() {
  const { user, signOut } = useAuth();
  const navigation = useNavigation<any>();
  const [signingOut, setSigningOut] = useState(false);

  const confirmSignOut = () => {
    Alert.alert('Sign out', 'Are you sure you want to sign out of iThesis?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign out',
        style: 'destructive',
        onPress: async () => {
          setSigningOut(true);
          try {
            await signOut();
          } finally {
            setSigningOut(false);
          }
        },
      },
    ]);
  };

  return (
    <Screen edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials(user?.fullName)}</Text>
          </View>
          <Text style={styles.name}>{user?.fullName}</Text>
          <View style={styles.rolePill}>
            <BadgeCheck size={14} color={colors.primary} />
            <Text style={styles.roleText}>{user?.role?.toUpperCase()}</Text>
          </View>
          <View style={styles.emailRow}>
            <Mail size={14} color={colors.textMuted} />
            <Text style={styles.email}>{user?.email}</Text>
          </View>
        </View>

        <View style={styles.group}>
          <Text style={styles.groupLabel}>Console</Text>
          <View style={styles.card}>
            <RowLink
              icon={KeyRound}
              label="Access codes"
              onPress={() => navigation.navigate('AccessCodes')}
            />
            <RowLink
              icon={Award}
              label="Certifications & forms"
              onPress={() => navigation.navigate('Certifications')}
            />
            <RowLink
              icon={Trash2}
              label="Deleted theses"
              onPress={() => navigation.navigate('DeletedTheses')}
            />
            <RowLink
              icon={BarChart3}
              label="Usage analytics"
              onPress={() => navigation.navigate('LibrarianAnalytics')}
            />
            <RowLink
              icon={FileBarChart}
              label="Reports & exports"
              onPress={() => navigation.navigate('Reports')}
              last
            />
          </View>
        </View>

        <View style={styles.group}>
          <Text style={styles.groupLabel}>Security</Text>
          <View style={styles.card}>
            <RowLink icon={Smartphone} label="This device" value="Active session" />
            <RowLink icon={ShieldCheck} label="Single-device enforcement" value="On" last />
          </View>
          <Text style={styles.note}>
            Signing in on another device will automatically end this session.
          </Text>
        </View>

        <Button
          label="Sign out"
          variant="danger"
          icon={<LogOut size={18} color={colors.white} />}
          onPress={confirmSignOut}
          loading={signingOut}
        />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: spacing.lg, gap: spacing.lg, paddingBottom: spacing.xxxl },
  profileCard: {
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.xl,
    ...shadows.card,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { ...typography.h1, color: colors.white, fontFamily: fonts.sansBold },
  name: { ...typography.h2, fontFamily: fonts.display },
  rolePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.accentSoft,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
  },
  roleText: { ...typography.caption, fontSize: 11, color: colors.primary, letterSpacing: 1 },
  emailRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  email: { ...typography.small, color: colors.textSecondary },
  group: { gap: spacing.sm },
  groupLabel: { ...typography.caption, textTransform: 'uppercase', letterSpacing: 0.8, marginLeft: spacing.xs },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  note: { ...typography.caption, marginLeft: spacing.xs },
});
