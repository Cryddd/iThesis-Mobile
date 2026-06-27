import React, { useState } from 'react';
import {
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Plus, Search, UserPlus } from 'lucide-react-native';

import { Button } from '@/components/ui/Button';
import { TextField } from '@/components/ui/TextField';
import { Screen } from '@/components/ui/Screen';
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/states';
import { useStaffActions, useStaffList } from '@/hooks/queries';
import { useDebounced } from '@/hooks/useDebounced';
import { describeApiError } from '@/api/client';
import { initials } from '@/utils/format';
import { colors, fonts, radius, shadows, spacing, typography } from '@/theme';
import type { CreateStaffInput, StaffUser } from '@/types';

const ROLES: { key: 'librarian' | 'admin'; label: string }[] = [
  { key: 'librarian', label: 'Librarians' },
  { key: 'admin', label: 'Admins' },
];

export function ManageStaffScreen() {
  const [role, setRole] = useState<'librarian' | 'admin'>('librarian');
  const [search, setSearch] = useState('');
  const debounced = useDebounced(search, 350);
  const query = useStaffList(role, debounced);
  const { create, setActive } = useStaffActions(role);
  const [showCreate, setShowCreate] = useState(false);

  const items = query.data ?? [];

  const toggleActive = (user: StaffUser) => {
    const next = !user.isActive;
    Alert.alert(
      next ? 'Activate account' : 'Deactivate account',
      `${next ? 'Re-activate' : 'Deactivate'} ${user.fullName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: next ? 'Activate' : 'Deactivate',
          style: next ? 'default' : 'destructive',
          onPress: () =>
            setActive.mutate(
              { id: user.id, isActive: next },
              { onError: (e) => Alert.alert('Failed', describeApiError(e)) },
            ),
        },
      ],
    );
  };

  return (
    <Screen edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Staff accounts</Text>
        <View style={styles.segment}>
          {ROLES.map((r) => (
            <Pressable
              key={r.key}
              onPress={() => setRole(r.key)}
              style={[styles.segBtn, role === r.key && styles.segBtnActive]}
            >
              <Text style={[styles.segText, role === r.key && styles.segTextActive]}>{r.label}</Text>
            </Pressable>
          ))}
        </View>
        <TextField
          placeholder={`Search ${role}s…`}
          value={search}
          onChangeText={setSearch}
          leftIcon={<Search size={18} color={colors.textMuted} />}
          autoCorrect={false}
          autoCapitalize="none"
        />
        <Button
          label={`Add ${role}`}
          size="sm"
          icon={<Plus size={16} color={colors.white} />}
          onPress={() => setShowCreate(true)}
        />
      </View>

      {query.isLoading ? (
        <LoadingState />
      ) : query.isError ? (
        <ErrorState message={describeApiError(query.error)} onRetry={() => query.refetch()} />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(i) => String(i.id)}
          contentContainerStyle={styles.list}
          ItemSeparatorComponent={() => <View style={{ height: spacing.sm }} />}
          refreshControl={
            <RefreshControl refreshing={query.isRefetching} onRefresh={query.refetch} tintColor={colors.primary} />
          }
          ListEmptyComponent={
            <EmptyState
              icon={<UserPlus size={36} color={colors.primaryLight} />}
              title={`No ${role}s`}
              message={`Add a ${role} account to get started.`}
            />
          }
          renderItem={({ item }) => (
            <View style={styles.row}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{initials(item.fullName)}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.rowName}>{item.fullName}</Text>
                <Text style={styles.rowMeta} numberOfLines={1}>
                  {item.email || item.username}
                </Text>
                <Text style={styles.rowSub}>Last login: {item.lastLogin ?? 'Never'}</Text>
              </View>
              <Pressable
                onPress={() => toggleActive(item)}
                style={[styles.statusPill, item.isActive ? styles.activePill : styles.inactivePill]}
              >
                <Text style={[styles.statusText, { color: item.isActive ? colors.approved : colors.rejected }]}>
                  {item.isActive ? 'Active' : 'Inactive'}
                </Text>
              </Pressable>
            </View>
          )}
        />
      )}

      <CreateStaffModal
        visible={showCreate}
        role={role}
        submitting={create.isPending}
        onClose={() => setShowCreate(false)}
        onCreate={(input) =>
          create.mutate(input, {
            onSuccess: () => setShowCreate(false),
            onError: (e) => Alert.alert('Failed', describeApiError(e)),
          })
        }
      />
    </Screen>
  );
}

function CreateStaffModal({
  visible,
  role,
  submitting,
  onClose,
  onCreate,
}: {
  visible: boolean;
  role: 'librarian' | 'admin';
  submitting: boolean;
  onClose: () => void;
  onCreate: (input: CreateStaffInput) => void;
}) {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const reset = () => {
    setFirstName('');
    setLastName('');
    setEmail('');
    setUsername('');
    setPassword('');
  };

  const canSubmit = email.trim() && username.trim() && password.trim() && !submitting;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable
        style={styles.backdrop}
        onPress={() => {
          reset();
          onClose();
        }}
      >
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
            <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
              <Text style={styles.sheetTitle}>New {role}</Text>
              <View style={{ gap: spacing.md, marginTop: spacing.md }}>
                <TextField label="First name" value={firstName} onChangeText={setFirstName} />
                <TextField label="Last name" value={lastName} onChangeText={setLastName} />
                <TextField
                  label="Email"
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                />
                <TextField label="Username" value={username} onChangeText={setUsername} autoCapitalize="none" />
                <TextField label="Password" value={password} onChangeText={setPassword} secureToggle secureTextEntry />
                <Button
                  label={`Create ${role}`}
                  onPress={() =>
                    onCreate({
                      firstName: firstName.trim(),
                      lastName: lastName.trim(),
                      email: email.trim(),
                      username: username.trim(),
                      password: password.trim(),
                    })
                  }
                  loading={submitting}
                  disabled={!canSubmit}
                />
                <Button label="Cancel" variant="ghost" onPress={onClose} />
              </View>
            </ScrollView>
          </Pressable>
        </KeyboardAvoidingView>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: spacing.lg, paddingTop: spacing.sm, gap: spacing.md },
  title: { ...typography.h1, fontFamily: fonts.display, color: colors.primaryDark },
  segment: { flexDirection: 'row', backgroundColor: colors.surfaceMuted, borderRadius: radius.md, padding: 3 },
  segBtn: { flex: 1, paddingVertical: 8, borderRadius: radius.sm, alignItems: 'center' },
  segBtnActive: { backgroundColor: colors.surface, ...shadows.card },
  segText: { ...typography.small, color: colors.textSecondary },
  segTextActive: { color: colors.primary, fontFamily: fonts.sansSemibold },
  list: { padding: spacing.lg, paddingBottom: spacing.xxxl },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { ...typography.label, color: colors.primary, fontFamily: fonts.sansBold },
  rowName: { ...typography.h3, fontSize: 15 },
  rowMeta: { ...typography.small, color: colors.textSecondary },
  rowSub: { ...typography.caption },
  statusPill: { paddingHorizontal: spacing.md, paddingVertical: 6, borderRadius: radius.pill },
  activePill: { backgroundColor: colors.approvedBg },
  inactivePill: { backgroundColor: colors.rejectedBg },
  statusText: { ...typography.caption, fontSize: 12, fontFamily: fonts.sansSemibold },
  backdrop: { flex: 1, backgroundColor: colors.overlay, justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    padding: spacing.xl,
    maxHeight: '88%',
  },
  sheetTitle: { ...typography.h2, fontFamily: fonts.display, textTransform: 'capitalize' },
});
