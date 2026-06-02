import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import { Button, Input } from '../components';

WebBrowser.maybeCompleteAuthSession();

const LoginScreen = ({ navigation }) => {
  const { theme } = useTheme();
  const { login, loginWithGoogle, loginWithDiscord, loading } = useAuth();
  const { t } = useTranslation();

  const [emailOrUsername, setEmailOrUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({});

  const validate = () => {
    const newErrors = {};

    if (!emailOrUsername.trim()) {
      newErrors.emailOrUsername = t('auth.emailRequired');
    }

    if (!password) {
      newErrors.password = t('auth.passwordRequired');
    } else if (password.length < 8) {
      newErrors.password = t('auth.passwordMinLength');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async () => {
    if (!validate()) return;

    const result = await login(emailOrUsername, password);

    if (result.success) {
      Alert.alert(t('common.success'), t('auth.loginSuccess'));
    } else {
      Alert.alert(t('common.error'), result.message || t('auth.invalidCredentials'));
    }
  };

  const handleGoogleLogin = async () => {
    try {
      // Google OAuth URL
      const googleClientId = '415341979795-ojrhagroh71legi68udluabik4tu87m4.apps.googleusercontent.com';
      const redirectUri = 'https://auth.expo.io/@your-username/mini-soundcloud-app';
      const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${googleClientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=token&scope=openid%20profile%20email`;

      const result = await WebBrowser.openAuthSessionAsync(
        googleAuthUrl,
        redirectUri
      );

      if (result.type === 'success' && result.url) {
        // Extract access token from URL fragment
        const url = result.url;
        const tokenMatch = url.match(/access_token=([^&]+)/);

        if (tokenMatch && tokenMatch[1]) {
          const accessToken = tokenMatch[1];
          const loginResult = await loginWithGoogle(accessToken);

          if (loginResult.success) {
            Alert.alert('✅ Thành công', 'Đăng nhập Google thành công!');
          } else {
            Alert.alert('❌ Lỗi', loginResult.message || 'Đăng nhập Google thất bại');
          }
        } else {
          Alert.alert('❌ Lỗi', 'Không lấy được access token từ Google');
        }
      }
    } catch (error) {
      console.error('Google login error:', error);
      Alert.alert('❌ Lỗi', 'Đăng nhập Google thất bại');
    }
  };

  const handleDiscordLogin = async () => {
    try {
      // Discord OAuth URL
      const discordClientId = '1510255464632549515';
      const redirectUri = 'https://auth.expo.io/@your-username/mini-soundcloud-app';
      const discordAuthUrl = `https://discord.com/api/oauth2/authorize?client_id=${discordClientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=token&scope=identify%20email`;

      const result = await WebBrowser.openAuthSessionAsync(
        discordAuthUrl,
        redirectUri
      );

      if (result.type === 'success' && result.url) {
        // Extract access token from URL fragment
        const url = result.url;
        const tokenMatch = url.match(/access_token=([^&]+)/);

        if (tokenMatch && tokenMatch[1]) {
          const accessToken = tokenMatch[1];
          const loginResult = await loginWithDiscord(accessToken);

          if (loginResult.success) {
            Alert.alert('✅ Thành công', 'Đăng nhập Discord thành công!');
          } else {
            Alert.alert('❌ Lỗi', loginResult.message || 'Đăng nhập Discord thất bại');
          }
        } else {
          Alert.alert('❌ Lỗi', 'Không lấy được access token từ Discord');
        }
      }
    } catch (error) {
      console.error('Discord login error:', error);
      Alert.alert('❌ Lỗi', 'Đăng nhập Discord thất bại');
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.colors.text }]}>
            {t('common.appName')}
          </Text>
          <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
            {t('auth.login')}
          </Text>
        </View>

        <View style={styles.form}>
          <Input
            label={t('auth.email') + ' / ' + t('auth.username')}
            value={emailOrUsername}
            onChangeText={(text) => {
              setEmailOrUsername(text);
              setErrors({ ...errors, emailOrUsername: null });
            }}
            placeholder="email@example.com"
            keyboardType="email-address"
            error={errors.emailOrUsername}
          />

          <Input
            label={t('auth.password')}
            value={password}
            onChangeText={(text) => {
              setPassword(text);
              setErrors({ ...errors, password: null });
            }}
            placeholder="••••••••"
            secureTextEntry
            error={errors.password}
          />

          <Button
            title={t('auth.login')}
            onPress={handleLogin}
            loading={loading}
            style={styles.loginButton}
          />

          <TouchableOpacity
            style={styles.forgotPassword}
            onPress={() => navigation.navigate('ForgotPassword')}
          >
            <Text style={[styles.forgotPasswordText, { color: theme.colors.primary }]}>
              {t('auth.forgotPassword')}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.divider}>
          <View style={[styles.dividerLine, { backgroundColor: theme.colors.border }]} />
          <Text style={[styles.dividerText, { color: theme.colors.textSecondary }]}>OR</Text>
          <View style={[styles.dividerLine, { backgroundColor: theme.colors.border }]} />
        </View>

        <View style={styles.socialButtons}>
          <Button
            title={t('auth.loginWithGoogle')}
            onPress={handleGoogleLogin}
            variant="secondary"
            style={styles.socialButton}
          />

          <Button
            title={t('auth.loginWithDiscord')}
            onPress={handleDiscordLogin}
            variant="secondary"
            style={styles.socialButton}
          />
        </View>

        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: theme.colors.textSecondary }]}>
            {t('auth.dontHaveAccount')}{' '}
          </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Register')}>
            <Text style={[styles.footerLink, { color: theme.colors.primary }]}>
              {t('auth.register')}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 48,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
  },
  form: {
    marginBottom: 24,
  },
  loginButton: {
    marginTop: 8,
  },
  forgotPassword: {
    alignItems: 'center',
    marginTop: 16,
  },
  forgotPasswordText: {
    fontSize: 14,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    marginHorizontal: 16,
    fontSize: 14,
  },
  socialButtons: {
    marginBottom: 24,
  },
  socialButton: {
    marginBottom: 12,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
  },
  footerLink: {
    fontSize: 14,
    fontWeight: '600',
  },
});

export default LoginScreen;
