import { Button, Card, CardContent, CardHeader, CardTitle } from '@/src/components/ui';
import { borderRadius, colors, fontSize, spacing } from '@/src/constants/theme';
import { getErrorMessage } from '@/src/lib/api-client';
import { authService } from '@/src/services/auth.service';
import { useAuthStore } from '@/src/store/auth.store';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { GestureDetector } from 'react-native-gesture-handler';
import { useSwipeNavigation } from '../../hooks/useSwipeNavigation';

export default function SettingsScreen() {
  const { user, logout } = useAuthStore();
  const swipeGesture = useSwipeNavigation();
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  
  // Profile form state
  const [firstName, setFirstName] = useState(user?.firstName || '');
  const [lastName, setLastName] = useState(user?.lastName || '');
  const [phoneNumber, setPhoneNumber] = useState(user?.phoneNumber || '');
  const [specialization, setSpecialization] = useState(user?.specialization || '');
  
  // Password form state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleUpdateProfile = async () => {
    setIsUpdatingProfile(true);
    try {
      // API call here
      await new Promise(resolve => setTimeout(resolve, 1000));
      Alert.alert('Success', 'Profile updated successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to update profile');
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }
    if (newPassword.length < 8) {
      Alert.alert('Error', 'Password must be at least 8 characters');
      return;
    }

    setIsChangingPassword(true);
    try {
      await authService.changePassword(currentPassword, newPassword);
      Alert.alert('Success', 'Password changed successfully');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      Alert.alert('Error', getErrorMessage(error));
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              await authService.logout();
            } catch (error) {
              console.error('Logout error:', error);
            } finally {
              logout();
              router.replace('/login');
            }
          },
        },
      ]
    );
  };

  return (
    <GestureDetector gesture={swipeGesture}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Profile Header */}
      <View style={styles.profileHeader}>
        <View style={styles.avatarContainer}>
          <Text style={styles.avatarText}>
            {user?.firstName?.[0]}{user?.lastName?.[0]}
          </Text>
        </View>
        <Text style={styles.profileName}>{user?.fullName}</Text>
        <Text style={styles.profileEmail}>{user?.email}</Text>
      </View>

      {/* Profile Settings */}
      <Card style={styles.section}>
        <CardHeader>
          <CardTitle>
            <View style={styles.sectionTitleRow}>
              <Ionicons name="person-outline" size={18} color={colors.primary[600]} />
              <Text style={styles.sectionTitle}>Profile Information</Text>
            </View>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <View style={styles.formRow}>
            <View style={styles.formHalf}>
              <Text style={styles.label}>First Name</Text>
              <TextInput
                style={styles.input}
                value={firstName}
                onChangeText={setFirstName}
                placeholder="First name"
              />
            </View>
            <View style={styles.formHalf}>
              <Text style={styles.label}>Last Name</Text>
              <TextInput
                style={styles.input}
                value={lastName}
                onChangeText={setLastName}
                placeholder="Last name"
              />
            </View>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Email</Text>
            <View style={[styles.input, styles.inputDisabled]}>
              <Text style={styles.disabledText}>{user?.email}</Text>
            </View>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Phone Number</Text>
            <TextInput
              style={styles.input}
              value={phoneNumber}
              onChangeText={setPhoneNumber}
              placeholder="Enter phone number"
              keyboardType="phone-pad"
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Specialization</Text>
            <TextInput
              style={styles.input}
              value={specialization}
              onChangeText={setSpecialization}
              placeholder="e.g., General Practitioner"
            />
          </View>

          <Button
            title="Save Changes"
            onPress={handleUpdateProfile}
            isLoading={isUpdatingProfile}
            fullWidth
            leftIcon={<Ionicons name="save-outline" size={18} color={colors.white} />}
          />
        </CardContent>
      </Card>

      {/* Change Password */}
      <Card style={styles.section}>
        <CardHeader>
          <CardTitle>
            <View style={styles.sectionTitleRow}>
              <Ionicons name="lock-closed-outline" size={18} color={colors.primary[600]} />
              <Text style={styles.sectionTitle}>Change Password</Text>
            </View>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <View style={styles.formGroup}>
            <Text style={styles.label}>Current Password</Text>
            <TextInput
              style={styles.input}
              value={currentPassword}
              onChangeText={setCurrentPassword}
              placeholder="Enter current password"
              secureTextEntry
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>New Password</Text>
            <TextInput
              style={styles.input}
              value={newPassword}
              onChangeText={setNewPassword}
              placeholder="Enter new password"
              secureTextEntry
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Confirm New Password</Text>
            <TextInput
              style={styles.input}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder="Confirm new password"
              secureTextEntry
            />
          </View>

          <Button
            title="Change Password"
            onPress={handleChangePassword}
            isLoading={isChangingPassword}
            variant="outline"
            fullWidth
          />
        </CardContent>
      </Card>

      {/* Logout */}
      <Card style={styles.section}>
        <CardContent>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={20} color={colors.error[600]} />
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </CardContent>
      </Card>

      {/* App Info */}
      <View style={styles.appInfo}>
        <Text style={styles.appInfoText}>PandaHealth Doctor v1.0.0</Text>
        <Text style={styles.appInfoText}>© 2026 PandaHealth</Text>
      </View>
    </ScrollView>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.gray[50],
  },
  profileHeader: {
    alignItems: 'center',
    padding: spacing.xl,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[100],
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primary[600],
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  avatarText: {
    fontSize: fontSize['2xl'],
    fontWeight: '700',
    color: colors.white,
  },
  profileName: {
    fontSize: fontSize.xl,
    fontWeight: '700',
    color: colors.gray[900],
  },
  profileEmail: {
    fontSize: fontSize.sm,
    color: colors.gray[500],
    marginTop: spacing.xs,
  },
  section: {
    margin: spacing.lg,
    marginBottom: 0,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  sectionTitle: {
    fontSize: fontSize.base,
    fontWeight: '600',
    color: colors.gray[900],
  },
  formGroup: {
    marginBottom: spacing.lg,
  },
  formRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  formHalf: {
    flex: 1,
  },
  label: {
    fontSize: fontSize.sm,
    fontWeight: '500',
    color: colors.gray[700],
    marginBottom: spacing.sm,
  },
  input: {
    backgroundColor: colors.gray[50],
    borderWidth: 1,
    borderColor: colors.gray[200],
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    fontSize: fontSize.base,
    color: colors.gray[900],
  },
  inputDisabled: {
    backgroundColor: colors.gray[100],
  },
  disabledText: {
    fontSize: fontSize.base,
    color: colors.gray[500],
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
  },
  logoutText: {
    fontSize: fontSize.base,
    fontWeight: '600',
    color: colors.error[600],
  },
  appInfo: {
    alignItems: 'center',
    padding: spacing.xl,
    paddingBottom: spacing['4xl'],
  },
  appInfoText: {
    fontSize: fontSize.xs,
    color: colors.gray[400],
  },
});
