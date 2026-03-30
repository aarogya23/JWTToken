import React, { useState } from 'react';
import { Linking, StyleSheet, Text, View } from 'react-native';
import { AppButton, AppCard, AppInput, Screen, SectionTitle } from '../components/ui';
import { useAuth } from '../context/AuthContext';
import { colors, spacing } from '../theme';
import { googleAuthUrl } from '../api/client';

const AuthShell = ({ title, description, children, footer }) => (
  <Screen contentContainerStyle={styles.shell}>
    <SectionTitle
      eyebrow="C2C market"
      title={title}
      description={description}
    />
    <AppCard style={styles.card}>{children}</AppCard>
    {footer}
  </Screen>
);

export function LoginScreen() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async () => {
    setLoading(true);
    setError('');
    const result = await login(email, password);
    if (!result.success) setError(result.message);
    setLoading(false);
  };

  return (
    <AuthShell
      title="Welcome back"
      description="Sign in with your JWT-backed account. The Expo version keeps the same auth flow and market entry points as the web app."
      footer={<Text style={styles.footer}>Google sign-in opens the backend OAuth page in the browser.</Text>}
    >
      <View style={styles.form}>
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <AppButton
          title="Continue with Google"
          variant="outline"
          icon="logo-google"
          onPress={() => Linking.openURL(googleAuthUrl)}
        />
        <AppInput label="Email" value={email} onChangeText={setEmail} autoCapitalize="none" />
        <AppInput
          label="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />
        <AppButton title="Sign In" loading={loading} onPress={handleLogin} />
      </View>
    </AuthShell>
  );
}

export function RegisterScreen() {
  const { register, login } = useAuth();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleRegister = async () => {
    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    setLoading(true);
    setError('');
    const result = await register(email, password, fullName);
    if (!result.success) {
      setError(result.message);
      setLoading(false);
      return;
    }
    await login(email, password);
    setLoading(false);
  };

  return (
    <AuthShell
      title="Create account"
      description="Join the same marketplace community from a native Expo app with forms, profile editing, products, services, and group spaces."
    >
      <View style={styles.form}>
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <AppButton
          title="Sign up with Google"
          variant="outline"
          icon="logo-google"
          onPress={() => Linking.openURL(googleAuthUrl)}
        />
        <AppInput label="Full name" value={fullName} onChangeText={setFullName} />
        <AppInput label="Email" value={email} onChangeText={setEmail} autoCapitalize="none" />
        <AppInput
          label="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />
        <AppButton title="Create Account" loading={loading} onPress={handleRegister} />
      </View>
    </AuthShell>
  );
}

const styles = StyleSheet.create({
  shell: { justifyContent: 'center', flexGrow: 1, paddingTop: 40 },
  card: { gap: spacing.md },
  form: { gap: spacing.md },
  error: {
    color: colors.danger,
    backgroundColor: '#fdecec',
    padding: 12,
    borderRadius: 12
  },
  footer: {
    textAlign: 'center',
    color: colors.textMuted,
    marginTop: spacing.sm,
    lineHeight: 20
  }
});
