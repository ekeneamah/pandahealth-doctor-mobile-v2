import { Button, Input } from '@/src/components/ui';
import { borderRadius, colors, fontSize, spacing } from '@/src/constants/theme';
import { getErrorMessage } from '@/src/lib/api-client';
import { getDeviceFingerprint } from '@/src/lib/device';
import { authService } from '@/src/services/auth.service';
import { useAuthStore } from '@/src/store/auth.store';
import { Ionicons } from '@expo/vector-icons';
import { zodResolver } from '@hookform/resolvers/zod';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import {
    Alert,
    Image,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { z } from 'zod';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginScreen() {
  const { setAuth } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    console.log('[LoginScreen] Login started', { email: data.email });
    setIsLoading(true);
    try {
      const deviceFingerprint = await getDeviceFingerprint();
      console.log('[LoginScreen] Device fingerprint:', deviceFingerprint);
      
      const response = await authService.login({
        email: data.email,
        password: data.password,
        deviceFingerprint,
      });
      
      console.log('[LoginScreen] Login response:', {
        userId: response.userId,
        email: response.email,
        role: response.role,
        hasToken: !!response.idToken,
        hasRefreshToken: !!response.refreshToken,
        hasSessionId: !!response.sessionId,
      });

      if (response.role !== 'Doctor') {
        console.log('[LoginScreen] Access denied - not a doctor');
        Alert.alert('Access Denied', 'This app is for doctors only');
        setIsLoading(false);
        return;
      }

      // Use user object from response if available, otherwise construct from response data
      const user = response.user || {
        id: response.userId,
        email: response.email,
        firstName: response.fullName.split(' ')[0] || '',
        lastName: response.fullName.split(' ').slice(1).join(' ') || '',
        fullName: response.fullName,
        role: response.role,
        isActive: true,
        isEmailVerified: true,
      };
      
      console.log('[LoginScreen] Setting auth state');
      setAuth(user, response.idToken, response.refreshToken, response.sessionId);
      console.log('[LoginScreen] Navigating to tabs');
      router.replace('/(tabs)');
    } catch (error) {
      console.error('[LoginScreen] Login error:', error);
      Alert.alert('Login Failed', getErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Logo & Branding */}
        <View style={styles.brandContainer}>
          <Image 
            source={require('@/assets/images/pandahealth-doctor-logo.png')} 
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.brandSubtitle}>Doctor Portal</Text>
        </View>

        {/* Login Form */}
        <View style={styles.formContainer}>
          <Text style={styles.welcomeText}>Welcome back, Doctor</Text>
          <Text style={styles.subtitleText}>
            Sign in to access your cases and consultations
          </Text>

          <View style={styles.form}>
            <Controller
              control={control}
              name="email"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="Email Address"
                  placeholder="doctor@example.com"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                  leftIcon={<Ionicons name="mail-outline" size={20} color={colors.gray[400]} />}
                  error={errors.email?.message}
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                />
              )}
            />

            <Controller
              control={control}
              name="password"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="Password"
                  placeholder="Enter your password"
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  leftIcon={<Ionicons name="lock-closed-outline" size={20} color={colors.gray[400]} />}
                  rightIcon={
                    <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                      <Ionicons
                        name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                        size={20}
                        color={colors.gray[400]}
                      />
                    </TouchableOpacity>
                  }
                  error={errors.password?.message}
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                />
              )}
            />

            <Button
              title="Sign In"
              onPress={handleSubmit(onSubmit)}
              isLoading={isLoading}
              fullWidth
              size="lg"
            />
          </View>
        </View>

        {/* Footer */}
        <Text style={styles.footerText}>© 2026 PandaHealth. All rights reserved.</Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.gray[50],
  },
  scrollContent: {
    flexGrow: 1,
    padding: spacing.xl,
  },
  brandContainer: {
    alignItems: 'center',
    paddingTop: spacing['4xl'],
    paddingBottom: spacing['3xl'],
  },
  logo: {
    width: 200,
    height: 80,
    marginBottom: spacing.md,
  },
  brandSubtitle: {
    fontSize: fontSize.base,
    color: colors.primary[600],
    marginTop: spacing.xs,
  },
  formContainer: {
    backgroundColor: colors.white,
    borderRadius: borderRadius['2xl'],
    padding: spacing.xl,
    marginBottom: spacing['2xl'],
  },
  welcomeText: {
    fontSize: fontSize.xl,
    fontWeight: '700',
    color: colors.gray[900],
    textAlign: 'center',
  },
  subtitleText: {
    fontSize: fontSize.sm,
    color: colors.gray[500],
    textAlign: 'center',
    marginTop: spacing.sm,
    marginBottom: spacing['2xl'],
  },
  form: {
    gap: spacing.md,
  },
  footerText: {
    fontSize: fontSize.xs,
    color: colors.gray[400],
    textAlign: 'center',
    marginTop: 'auto',
    paddingBottom: spacing.lg,
  },
});
