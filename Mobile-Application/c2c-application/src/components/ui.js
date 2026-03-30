import React from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, shadow, spacing } from '../theme';
import { getInitials } from '../utils/format';

export const Screen = ({ children, scroll = true, style, contentContainerStyle }) => {
  const body = scroll ? (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={[styles.content, contentContainerStyle, style]}
      showsVerticalScrollIndicator={false}
    >
      {children}
    </ScrollView>
  ) : (
    <View style={[styles.screen, styles.content, contentContainerStyle, style]}>{children}</View>
  );

  return <SafeAreaView style={styles.safe}>{body}</SafeAreaView>;
};

export const AppCard = ({ children, style }) => <View style={[styles.card, style]}>{children}</View>;

export const AppButton = ({
  title,
  onPress,
  icon,
  variant = 'primary',
  loading,
  disabled,
  style,
  textStyle
}) => {
  const isMuted = variant === 'outline' || variant === 'ghost';
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.button,
        variant === 'outline' && styles.buttonOutline,
        variant === 'ghost' && styles.buttonGhost,
        (disabled || loading) && styles.buttonDisabled,
        pressed && !(disabled || loading) && styles.buttonPressed,
        style
      ]}
    >
      {loading ? (
        <ActivityIndicator color={isMuted ? colors.primary : '#fff'} />
      ) : (
        <>
          {icon ? <Ionicons name={icon} size={18} color={isMuted ? colors.primary : '#fff'} /> : null}
          <Text style={[styles.buttonText, isMuted && styles.buttonTextOutline, textStyle]}>
            {title}
          </Text>
        </>
      )}
    </Pressable>
  );
};

export const AppInput = ({ label, multiline, style, ...props }) => (
  <View style={styles.field}>
    {label ? <Text style={styles.label}>{label}</Text> : null}
    <TextInput
      placeholderTextColor={colors.textMuted}
      multiline={multiline}
      textAlignVertical={multiline ? 'top' : 'center'}
      style={[styles.input, multiline && styles.inputArea, style]}
      {...props}
    />
  </View>
);

export const SectionTitle = ({ eyebrow, title, description, right }) => (
  <View style={styles.sectionHeader}>
    <View style={styles.sectionHeaderText}>
      {eyebrow ? <Text style={styles.eyebrow}>{eyebrow}</Text> : null}
      <Text style={styles.title}>{title}</Text>
      {description ? <Text style={styles.description}>{description}</Text> : null}
    </View>
    {right}
  </View>
);

export const GradientHero = ({ title, description, actions }) => (
  <LinearGradient colors={['#fff6ea', '#efe2cf']} style={styles.hero}>
    <Text style={styles.heroEyebrow}>Social marketplace</Text>
    <Text style={styles.heroTitle}>{title}</Text>
    <Text style={styles.heroDescription}>{description}</Text>
    {actions ? <View style={styles.heroActions}>{actions}</View> : null}
  </LinearGradient>
);

export const Pill = ({ children, tone = 'neutral', style }) => (
  <View
    style={[
      styles.pill,
      tone === 'primary' && styles.pillPrimary,
      tone === 'success' && styles.pillSuccess,
      tone === 'danger' && styles.pillDanger,
      style
    ]}
  >
    <Text
      style={[
        styles.pillText,
        tone === 'primary' && styles.pillTextDark,
        tone === 'success' && styles.pillTextDark,
        tone === 'danger' && styles.pillTextLight
      ]}
    >
      {children}
    </Text>
  </View>
);

export const Avatar = ({ source, label, size = 48 }) => {
  if (source) {
    return <Image source={{ uri: source }} style={{ width: size, height: size, borderRadius: size / 2 }} />;
  }

  return (
    <View
      style={[
        styles.avatarFallback,
        { width: size, height: size, borderRadius: size / 2 }
      ]}
    >
      <Text style={styles.avatarText}>{getInitials(label)}</Text>
    </View>
  );
};

export const StatTile = ({ label, value }) => (
  <View style={styles.statTile}>
    <Text style={styles.statLabel}>{label}</Text>
    <Text style={styles.statValue}>{value}</Text>
  </View>
);

export const EmptyState = ({ icon = 'sparkles-outline', title, description }) => (
  <AppCard style={styles.emptyCard}>
    <Ionicons name={icon} size={38} color={colors.textMuted} />
    <Text style={styles.emptyTitle}>{title}</Text>
    <Text style={styles.emptyDescription}>{description}</Text>
  </AppCard>
);

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md, paddingBottom: 120, gap: spacing.md },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    ...shadow
  },
  button: {
    minHeight: 48,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 18
  },
  buttonOutline: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.primary
  },
  buttonGhost: {
    backgroundColor: colors.surfaceMuted
  },
  buttonDisabled: { opacity: 0.6 },
  buttonPressed: { transform: [{ scale: 0.99 }] },
  buttonText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  buttonTextOutline: { color: colors.primary },
  field: { gap: 8 },
  label: { color: colors.text, fontWeight: '700', fontSize: 14 },
  input: {
    minHeight: 48,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingHorizontal: 14,
    color: colors.text,
    fontSize: 15
  },
  inputArea: {
    minHeight: 110,
    paddingTop: 14
  },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', gap: 12, alignItems: 'flex-start' },
  sectionHeaderText: { flex: 1, gap: 4 },
  eyebrow: { color: colors.secondary, fontWeight: '700', textTransform: 'uppercase', fontSize: 12 },
  title: { color: colors.text, fontSize: 26, fontWeight: '800' },
  description: { color: colors.textMuted, fontSize: 15, lineHeight: 22 },
  hero: {
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 10
  },
  heroEyebrow: { fontSize: 12, fontWeight: '700', color: colors.secondary, textTransform: 'uppercase' },
  heroTitle: { fontSize: 30, lineHeight: 36, fontWeight: '800', color: colors.text },
  heroDescription: { fontSize: 16, lineHeight: 24, color: colors.textMuted },
  heroActions: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 6 },
  pill: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceMuted
  },
  pillPrimary: { backgroundColor: '#ffd9bf' },
  pillSuccess: { backgroundColor: '#dff4e6' },
  pillDanger: { backgroundColor: colors.danger },
  pillText: { color: colors.textMuted, fontWeight: '700', fontSize: 12 },
  pillTextDark: { color: colors.text },
  pillTextLight: { color: '#fff' },
  avatarFallback: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f2c8a3'
  },
  avatarText: { color: colors.text, fontWeight: '800' },
  statTile: {
    flex: 1,
    minWidth: 120,
    borderRadius: radius.md,
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border
  },
  statLabel: { color: colors.textMuted, fontSize: 12, marginBottom: 4 },
  statValue: { color: colors.text, fontSize: 22, fontWeight: '800' },
  emptyCard: {
    alignItems: 'center',
    gap: 8,
    paddingVertical: spacing.xl
  },
  emptyTitle: { fontSize: 20, fontWeight: '800', color: colors.text },
  emptyDescription: { fontSize: 14, color: colors.textMuted, textAlign: 'center', lineHeight: 21 }
});
