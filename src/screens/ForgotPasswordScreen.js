import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { useTranslation } from 'react-i18next';
import { Button, Input } from '../components';
import axios from 'axios';
import { API_BASE_URL } from '../constants/api';

const ForgotPasswordScreen = ({ navigation }) => {
  const { theme } = useTheme();
  const { t } = useTranslation();

  const [step, setStep] = useState(1); // 1: Email, 2: OTP, 3: New Password
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const handleSendOTP = async () => {
    if (!email.trim()) {
      setErrors({ email: 'Email is required' });
      return;
    }

    try {
      setLoading(true);
      const response = await axios.post(`${API_BASE_URL}/auth/forgot-password`, {
        email,
      });

      if (response.data.success) {
        Alert.alert('✅ Success', 'OTP has been sent to your email');
        setStep(2);
      } else {
        Alert.alert('❌ Error', response.data.message || 'Failed to send OTP');
      }
    } catch (error) {
      console.error('Send OTP error:', error);
      Alert.alert('❌ Error', 'Failed to send OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (!otp.trim()) {
      setErrors({ otp: 'OTP is required' });
      return;
    }

    try {
      setLoading(true);
      const response = await axios.post(`${API_BASE_URL}/auth/verify-otp`, {
        email,
        otp,
      });

      if (response.data.success) {
        Alert.alert('✅ Success', 'OTP verified successfully');
        setStep(3);
      } else {
        Alert.alert('❌ Error', response.data.message || 'Invalid OTP');
      }
    } catch (error) {
      console.error('Verify OTP error:', error);
      Alert.alert('❌ Error', 'Invalid OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    const newErrors = {};

    if (!newPassword) {
      newErrors.newPassword = 'New password is required';
    } else if (newPassword.length < 8) {
      newErrors.newPassword = 'Password must be at least 8 characters';
    }

    if (newPassword !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      setLoading(true);
      const response = await axios.post(`${API_BASE_URL}/auth/reset-password`, {
        email,
        otp,
        newPassword,
      });

      if (response.data.success) {
        Alert.alert('✅ Success', 'Password reset successfully', [
          { text: 'OK', onPress: () => navigation.navigate('Login') },
        ]);
      } else {
        Alert.alert('❌ Error', response.data.message || 'Failed to reset password');
      }
    } catch (error) {
      console.error('Reset password error:', error);
      Alert.alert('❌ Error', 'Failed to reset password. Please try again.');
    } finally {
      setLoading(false);
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
            Forgot Password
          </Text>
          <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
            {step === 1 && 'Enter your email to receive OTP'}
            {step === 2 && 'Enter the OTP sent to your email'}
            {step === 3 && 'Enter your new password'}
          </Text>
        </View>

        <View style={styles.form}>
          {step === 1 && (
            <>
              <Input
                label="Email"
                value={email}
                onChangeText={(text) => {
                  setEmail(text);
                  setErrors({ ...errors, email: null });
                }}
                placeholder="email@example.com"
                keyboardType="email-address"
                error={errors.email}
              />

              <Button
                title="Send OTP"
                onPress={handleSendOTP}
                loading={loading}
                style={styles.button}
              />
            </>
          )}

          {step === 2 && (
            <>
              <Input
                label="OTP Code"
                value={otp}
                onChangeText={(text) => {
                  setOtp(text);
                  setErrors({ ...errors, otp: null });
                }}
                placeholder="Enter 6-digit OTP"
                keyboardType="number-pad"
                maxLength={6}
                error={errors.otp}
              />

              <Button
                title="Verify OTP"
                onPress={handleVerifyOTP}
                loading={loading}
                style={styles.button}
              />

              <Button
                title="Resend OTP"
                onPress={handleSendOTP}
                variant="secondary"
                style={styles.button}
              />
            </>
          )}

          {step === 3 && (
            <>
              <Input
                label="New Password"
                value={newPassword}
                onChangeText={(text) => {
                  setNewPassword(text);
                  setErrors({ ...errors, newPassword: null });
                }}
                placeholder="••••••••"
                secureTextEntry
                error={errors.newPassword}
              />

              <Input
                label="Confirm Password"
                value={confirmPassword}
                onChangeText={(text) => {
                  setConfirmPassword(text);
                  setErrors({ ...errors, confirmPassword: null });
                }}
                placeholder="••••••••"
                secureTextEntry
                error={errors.confirmPassword}
              />

              <Button
                title="Reset Password"
                onPress={handleResetPassword}
                loading={loading}
                style={styles.button}
              />
            </>
          )}
        </View>

        <Button
          title="Back to Login"
          onPress={() => navigation.navigate('Login')}
          variant="secondary"
          style={styles.backButton}
        />
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
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
  },
  form: {
    marginBottom: 24,
  },
  button: {
    marginTop: 8,
  },
  backButton: {
    marginTop: 16,
  },
});

export default ForgotPasswordScreen;
