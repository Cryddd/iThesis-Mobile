import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import {
  BadgeCheck,
  BarChart3,
  FileBarChart,
  LogOut,
  Mail,
  ShieldCheck,
  Smartphone,
} from 'lucide-react-native';

import { Button } from '@/components/ui/Button';
import { Screen } from '@/components/ui/Screen';
import { RowLink } from '@/components/RowLink';
import { useAuth } from '@/store/AuthContext';
import { initials } from '@/utils/format';
import { colors, fonts, radius, shadows, spacing, typography } from '@/theme';

export function AdminProfileScreen() {
  const { user, signOut } = useAuth();
  const navigation = useNavigation<any>();
  const [signingOut, setSigningOut] = useState(false);

  const confirmSignOut = () => {
    Alert.alert('Sign out', 'Sign out of the admin console?', [
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
        <View style={styles.card}>
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
          <Text style={styles.groupLabel}>System</Text>
          <View style={styles.menu}>
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
          <View style={styles.menu}>
            <RowLink icon={Smartphone} label="This device" value="Active" />
            <RowLink icon={ShieldCheck} label="Single-device enforcement" value="On" last />
          </View>
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
  card: {
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
    backgroundColor: colors.primaryDark,
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
  menu: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
});
