import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ArrowLeft, Lock, Mail } from 'lucide-react-native';

import { Brand } from '@/components/Brand';
import { Button } from '@/components/ui/Button';
import { TextField } from '@/components/ui/TextField';
import { Screen } from '@/components/ui/Screen';
import { DeviceConflictError, useAuth } from '@/store/AuthContext';
import { describeApiError } from '@/api/client';
import { colors, fonts, radius, spacing, typography } from '@/theme';
import type { RootStackParamList } from '@/navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export function LoginScreen() {
  const navigation = useNavigation<Nav>();
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const canSubmit = email.trim() !== '' && password.trim() !== '' && !submitting;

  const onSubmit = async () => {
    if (!canSubmit) return;
    setError('');
    setSubmitting(true);
    try {
      // Role-based routing is handled by the root navigator reacting to auth state.
      await signIn(email, password);
    } catch (err) {
      if (err instanceof DeviceConflictError) {
        setError(err.message);
      } else {
        setError(describeApiError(err, 'Login failed. Please verify your credentials.'));
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Screen edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Pressable
            onPress={() => navigation.goBack()}
            hitSlop={10}
            style={styles.back}
            accessibilityRole="button"
          >
            <ArrowLeft size={20} color={colors.primary} />
            <Text style={styles.backText}>Back</Text>
          </Pressable>

          <View style={styles.header}>
            <Brand />
          </View>

          <View style={styles.intro}>
            <Text style={styles.welcome}>Welcome back</Text>
            <Text style={styles.subtitle}>Sign in to the librarian and admin console.</Text>
          </View>

          {error ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <View style={styles.form}>
            <TextField
              label="Email or username"
              placeholder="you@g.batstate-u.edu.ph"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              leftIcon={<Mail size={18} color={colors.textMuted} />}
            />
            <TextField
              label="Password"
              placeholder="Enter your password"
              value={password}
              onChangeText={setPassword}
              secureToggle
              secureTextEntry
              leftIcon={<Lock size={18} color={colors.textMuted} />}
              onSubmitEditing={onSubmit}
              returnKeyType="go"
            />

            <Pressable
              onPress={() => navigation.navigate('ForgotPassword')}
              style={styles.forgot}
              hitSlop={8}
            >
              <Text style={styles.forgotText}>Forgot password?</Text>
            </Pressable>

            <Button label="Sign in" loading={submitting} disabled={!canSubmit} onPress={onSubmit} />
          </View>

          <Text style={styles.footer}>
            Guests don't need to sign in — browse and submit theses from the home tab.
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: spacing.lg, paddingTop: spacing.md, gap: spacing.lg, flexGrow: 1 },
  back: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  backText: { ...typography.label, color: colors.primary },
  header: { marginTop: spacing.sm },
  intro: { gap: spacing.xs, marginTop: spacing.md },
  welcome: { ...typography.hero, fontFamily: fonts.display, fontSize: 30 },
  subtitle: { ...typography.bodyMuted },
  errorBox: {
    backgroundColor: colors.rejectedBg,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.rejected,
    padding: spacing.md,
  },
  errorText: { ...typography.small, color: colors.rejected },
  form: { gap: spacing.lg },
  forgot: { alignSelf: 'flex-end', marginTop: -spacing.sm },
  forgotText: { ...typography.small, color: colors.primary, fontFamily: fonts.sansSemibold },
  footer: { ...typography.small, color: colors.textMuted, textAlign: 'center', marginTop: 'auto' },
});
