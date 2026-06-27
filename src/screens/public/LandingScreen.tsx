import React from 'react';
import {
  ImageBackground,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import {
  BookOpen,
  GraduationCap,
  Search,
  ShieldCheck,
  Upload,
} from 'lucide-react-native';

import { Brand } from '@/components/Brand';
import { Button } from '@/components/ui/Button';
import { Screen } from '@/components/ui/Screen';
import { colors, fonts, radius, shadows, spacing, typography } from '@/theme';
import type { RootStackParamList } from '@/navigation/types';

const HERO = require('../../../assets/landing-hero.jpg');

type Nav = NativeStackNavigationProp<RootStackParamList>;

const FEATURES = [
  { icon: Search, title: 'Browse anywhere', desc: 'Search approved theses from your phone, on or off campus.' },
  { icon: Upload, title: 'Remote submission', desc: 'Submit your manuscript and get a tracking code instantly.' },
  { icon: ShieldCheck, title: 'Secure access', desc: 'Watermarked viewing with role-based, single-device sign-in.' },
];

export function LandingScreen() {
  const navigation = useNavigation<Nav>();
  const tabBarHeight = useBottomTabBarHeight();

  return (
    <Screen edges={['top']} background={colors.primaryDark}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: tabBarHeight + spacing.xl }}
      >
        <ImageBackground source={HERO} style={styles.hero} imageStyle={styles.heroImage}>
          <View style={styles.heroOverlay} />
          <View style={styles.heroContent}>
            <Brand inverse />
            <View style={styles.heroText}>
              <Text style={styles.kicker}>DIGITAL THESIS REPOSITORY</Text>
              <Text style={styles.heroTitle}>Discover and submit research, anytime.</Text>
              <Text style={styles.heroSubtitle}>
                The official thesis repository of TheNEU Lipa Campus Library — now in your pocket.
              </Text>
            </View>
            <View style={styles.heroActions}>
              <Button
                label="Browse theses"
                icon={<BookOpen size={18} color={colors.white} />}
                onPress={() => navigation.getParent()?.navigate('PublicTabs', { screen: 'Browse' })}
              />
              <Button
                label="Submit a thesis"
                variant="secondary"
                icon={<Upload size={18} color={colors.primaryDark} />}
                onPress={() => navigation.navigate('Upload')}
              />
            </View>
          </View>
        </ImageBackground>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Why iThesis Mobile</Text>
          <View style={styles.features}>
            {FEATURES.map(({ icon: Icon, title, desc }) => (
              <View key={title} style={styles.featureCard}>
                <View style={styles.featureIcon}>
                  <Icon size={22} color={colors.primary} />
                </View>
                <View style={styles.featureBody}>
                  <Text style={styles.featureTitle}>{title}</Text>
                  <Text style={styles.featureDesc}>{desc}</Text>
                </View>
              </View>
            ))}
          </View>

          <View style={styles.staffCard}>
            <GraduationCap size={24} color={colors.primary} />
            <View style={styles.staffText}>
              <Text style={styles.staffTitle}>Library staff?</Text>
              <Text style={styles.staffDesc}>
                Sign in to review submissions and manage the repository.
              </Text>
            </View>
            <Button
              label="Staff login"
              variant="outline"
              size="sm"
              fullWidth={false}
              onPress={() => navigation.navigate('Login')}
            />
          </View>
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: { minHeight: 460, justifyContent: 'flex-end' },
  heroImage: { resizeMode: 'cover' },
  heroOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(42,12,15,0.72)' },
  heroContent: { padding: spacing.xl, gap: spacing.xl },
  heroText: { gap: spacing.sm },
  kicker: { fontFamily: fonts.sansSemibold, fontSize: 12, letterSpacing: 1.5, color: colors.accent },
  heroTitle: { fontFamily: fonts.display, fontSize: 34, lineHeight: 40, color: colors.white },
  heroSubtitle: { ...typography.body, color: 'rgba(255,255,255,0.88)' },
  heroActions: { gap: spacing.md },
  section: {
    backgroundColor: colors.background,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    marginTop: -spacing.lg,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    gap: spacing.lg,
  },
  sectionTitle: { ...typography.h2, fontFamily: fonts.display, color: colors.primaryDark },
  features: { gap: spacing.md },
  featureCard: {
    flexDirection: 'row',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    ...shadows.card,
  },
  featureIcon: {
    width: 46,
    height: 46,
    borderRadius: radius.md,
    backgroundColor: colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureBody: { flex: 1, gap: 2 },
  featureTitle: { ...typography.h3 },
  featureDesc: { ...typography.bodyMuted, fontSize: 14 },
  staffCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
  },
  staffText: { flex: 1, gap: 2 },
  staffTitle: { ...typography.h3, fontSize: 15 },
  staffDesc: { ...typography.small },
});
