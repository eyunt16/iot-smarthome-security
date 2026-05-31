import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Switch,
  Platform,
} from 'react-native';
import * as Device from 'expo-device';
import { useTheme } from '../theme/ThemeContext';
import { api } from '../services/api';

export default function ProfileScreen({ onLogout, token, user }) {
  const { isDark, toggleTheme, themeColors } = useTheme();

  // Change Password form states
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changing, setChanging] = useState(false);

  const username = user?.username || 'mytuyen_admin';
  const roleLabel = user?.role === 'admin' || user?.role === 'SuperAdmin' ? 'Admin' : 'Homeowner';
  const emailVal = user?.email || `${username}@smarthome.com`;

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      Alert.alert('Validation Error', 'Please fill out all password fields.');
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert('Validation Error', 'New passwords do not match.');
      return;
    }

    if (newPassword.length < 8) {
      Alert.alert('Validation Error', 'Password must be at least 8 characters long.');
      return;
    }

    setChanging(true);
    try {
      const response = await api.post('/auth/change-password', {
        currentPassword,
        newPassword
      }, token);
      Alert.alert('Success', response.message || 'Password changed successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      // If POST fallback fails, try PUT
      try {
        const response = await api.post('/auth/change-password', {
          currentPassword,
          newPassword
        }, token);
        Alert.alert('Success', response.message || 'Password changed successfully!');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } catch (errInner) {
        const msg = errInner.response?.data?.message || errInner.message || 'Unable to update password. Verify your current password.';
        Alert.alert('Error', msg);
      }
    } finally {
      setChanging(false);
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: themeColors.bg }]}>
      {/* Header */}
      <View style={[styles.topHeader, { backgroundColor: themeColors.card, borderBottomColor: themeColors.border }]}>
        <Text style={[styles.appTitle, { color: themeColors.text }]}>Settings</Text>
        <TouchableOpacity 
          style={[styles.logoutIconBtn, { backgroundColor: themeColors.bg }]}
          onPress={onLogout}
        >
          <Text style={styles.logoutIcon}>📤</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* User Card */}
        <View style={[styles.profileCard, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
          <View style={styles.avatarContainer}>
            <View style={[styles.avatar, { backgroundColor: themeColors.bg, borderColor: themeColors.accent }]}>
              <Text style={styles.avatarText}>👤</Text>
            </View>
            <View style={[styles.shieldBadge, { backgroundColor: themeColors.success, borderColor: themeColors.card }]}>
              <Text style={styles.shieldText}>✓</Text>
            </View>
          </View>
          <Text style={[styles.userName, { color: themeColors.text }]}>{username}</Text>
          <Text style={[styles.userEmail, { color: themeColors.textMuted }]}>{emailVal}</Text>
        </View>

        {/* Roles Access Grid */}
        <View style={styles.infoRow}>
          <View style={[styles.infoCard, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
            <View style={[styles.infoIconContainer, { backgroundColor: themeColors.bg }]}>
              <Text style={styles.infoIcon}>👑</Text>
            </View>
            <Text style={[styles.infoLabel, { color: themeColors.textMuted }]}>Role</Text>
            <Text style={[styles.infoValue, { color: themeColors.text }]}>{roleLabel}</Text>
          </View>
          <View style={[styles.infoCard, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
            <View style={[styles.infoIconContainer, { backgroundColor: themeColors.bg }]}>
              <Text style={styles.infoIcon}>🔑</Text>
            </View>
            <Text style={[styles.infoLabel, { color: themeColors.textMuted }]}>Access</Text>
            <Text style={[styles.infoValue, { color: themeColors.text }]}>
              {user?.role === 'admin' || user?.role === 'SuperAdmin' ? 'Full Control' : 'Home Access'}
            </Text>
          </View>
        </View>

        {/* Dynamic Dark Mode Settings Toggle */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: themeColors.text }]}>Appearance & Theme</Text>
          <View style={[styles.settingCard, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
            <View style={styles.settingContent}>
              <View style={[styles.settingIcon, { backgroundColor: themeColors.bg }]}>
                <Text style={styles.settingIconText}>🌙</Text>
              </View>
              <View style={styles.settingText}>
                <Text style={[styles.settingName, { color: themeColors.text }]}>Dark Mode</Text>
                <Text style={[styles.settingDesc, { color: themeColors.textMuted }]}>Adaptive dark latte UI theme</Text>
              </View>
            </View>
            <Switch
              value={isDark}
              onValueChange={toggleTheme}
              trackColor={{ false: themeColors.border, true: themeColors.accent }}
              thumbColor="#FFFFFF"
            />
          </View>
        </View>

        {/* Functional Change Password Form */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: themeColors.text }]}>Change Credentials</Text>
          <View style={[styles.passwordForm, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
            <Text style={[styles.formHeader, { color: themeColors.text }]}>Update Password</Text>
            <Text style={[styles.formSub, { color: themeColors.textMuted }]}>Minimum length is 8 characters</Text>

            <TextInput
              style={[styles.inputField, { backgroundColor: themeColors.bg, color: themeColors.text, borderColor: themeColors.border }]}
              value={currentPassword}
              onChangeText={setCurrentPassword}
              placeholder="Current Password"
              placeholderTextColor={themeColors.textMuted}
              secureTextEntry
              autoCapitalize="none"
            />

            <TextInput
              style={[styles.inputField, { backgroundColor: themeColors.bg, color: themeColors.text, borderColor: themeColors.border }]}
              value={newPassword}
              onChangeText={setNewPassword}
              placeholder="New Password"
              placeholderTextColor={themeColors.textMuted}
              secureTextEntry
              autoCapitalize="none"
            />

            <TextInput
              style={[styles.inputField, { backgroundColor: themeColors.bg, color: themeColors.text, borderColor: themeColors.border }]}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder="Confirm New Password"
              placeholderTextColor={themeColors.textMuted}
              secureTextEntry
              autoCapitalize="none"
            />

            <TouchableOpacity 
              style={[styles.submitBtn, { backgroundColor: themeColors.accent }]}
              onPress={handleChangePassword}
              disabled={changing}
            >
              {changing ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={styles.submitBtnText}>Update Credentials</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Active System Device Info */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: themeColors.text }]}>Active Sessions</Text>
          
          <View style={[styles.sessionItem, { backgroundColor: themeColors.card, borderColor: themeColors.border, marginBottom: 12 }]}>
            <View style={[styles.deviceIcon, { backgroundColor: themeColors.bg }]}>
              <Text style={styles.deviceIconText}>
                {Platform.OS === 'ios' ? '🍎' : '🤖'}
              </Text>
            </View>
            <View style={styles.sessionInfo}>
              <Text style={[styles.sessionDevice, { color: themeColors.text }]}>
                {Device.modelName || 'Mobile Client Device'}
              </Text>
              <Text style={[styles.sessionTime, { color: themeColors.textMuted }]}>
                {Device.osName} {Device.osVersion} • Connected over LAN
              </Text>
            </View>
            <View style={[styles.onlineDot, { backgroundColor: themeColors.success }]} />
          </View>

          <View style={[styles.sessionItem, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
            <View style={[styles.deviceIcon, { backgroundColor: themeColors.bg }]}>
              <Text style={styles.deviceIconText}>💻</Text>
            </View>
            <View style={styles.sessionInfo}>
              <Text style={[styles.sessionDevice, { color: themeColors.text }]}>
                Windows PC (Web Client)
              </Text>
              <Text style={[styles.sessionTime, { color: themeColors.textMuted }]}>
                Chrome on Windows 11 • Remote Access
              </Text>
            </View>
            <View style={[styles.onlineDot, { backgroundColor: themeColors.success }]} />
          </View>
        </View>

        {/* Sign Out Button */}
        <TouchableOpacity style={[styles.logoutBtn, { backgroundColor: themeColors.accent }]} onPress={onLogout}>
          <Text style={styles.logoutIcon}>📤</Text>
          <Text style={styles.logoutText}>Sign Out Command Center</Text>
        </TouchableOpacity>

        <Text style={[styles.footer, { color: themeColors.textMuted }]}>
          PLATFORM VERSION 2.0.4 • ESTABLISHED MQTTS 8883
        </Text>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  topHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  appTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  logoutIconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoutIcon: {
    fontSize: 20,
  },
  scrollContent: {
    padding: 20,
    paddingTop: 10,
    paddingBottom: 40,
  },
  profileCard: {
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 12,
  },
  avatar: {
    width: 76,
    height: 76,
    borderRadius: 38,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
  },
  avatarText: {
    fontSize: 36,
  },
  shieldBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
  },
  shieldText: {
    fontSize: 13,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  userName: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 13,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    gap: 10,
  },
  infoCard: {
    flex: 1,
    borderRadius: 16,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
  },
  infoIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoIcon: {
    fontSize: 18,
  },
  infoLabel: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 13,
    fontWeight: '700',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  settingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
  },
  settingContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingIcon: {
    width: 38,
    height: 38,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  settingIconText: {
    fontSize: 18,
  },
  settingText: {
    flex: 1,
  },
  settingName: {
    fontSize: 13,
    fontWeight: '700',
  },
  settingDesc: {
    fontSize: 11,
    marginTop: 2,
  },
  passwordForm: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
  },
  formHeader: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 2,
  },
  formSub: {
    fontSize: 11,
    marginBottom: 12,
  },
  inputField: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    marginBottom: 10,
  },
  submitBtn: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  sessionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
  },
  deviceIcon: {
    width: 38,
    height: 38,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  deviceIconText: {
    fontSize: 18,
  },
  sessionInfo: {
    flex: 1,
  },
  sessionDevice: {
    fontSize: 13,
    fontWeight: '700',
  },
  sessionTime: {
    fontSize: 11,
    marginTop: 2,
  },
  onlineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    paddingVertical: 14,
    marginVertical: 10,
  },
  logoutIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  logoutText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  footer: {
    fontSize: 10,
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 20,
  },
});
