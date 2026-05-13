import React from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, TouchableOpacity, Platform } from 'react-native';
import * as Device from 'expo-device';
import { colors } from '../theme/colors';

export default function ProfileScreen({ onLogout }) {
  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header with Logout Button */}
      <View style={styles.topHeader}>
        <Text style={styles.appTitle}>Profile</Text>
        <TouchableOpacity 
          style={styles.logoutIconBtn}
          onPress={onLogout}
        >
          <Text style={styles.logoutIcon}>📤</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Settings</Text>
          <Text style={styles.headerSubtitle}>Manage your account</Text>
        </View>

        {/* User Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>👤</Text>
            </View>
            <View style={styles.shieldBadge}>
              <Text style={styles.shieldText}>✓</Text>
            </View>
          </View>
          <Text style={styles.userName}>My Tuyen</Text>
          <Text style={styles.userEmail}>mytuyen@home.io</Text>
        </View>

        {/* Role & Access */}
        <View style={styles.infoRow}>
          <View style={styles.infoCard}>
            <View style={styles.infoIconContainer}>
              <Text style={styles.infoIcon}>👑</Text>
            </View>
            <Text style={styles.infoLabel}>Role</Text>
            <Text style={styles.infoValue}>System Admin</Text>
          </View>
          <View style={styles.infoCard}>
            <View style={styles.infoIconContainer}>
              <Text style={styles.infoIcon}>🔑</Text>
            </View>
            <Text style={styles.infoLabel}>Access</Text>
            <Text style={styles.infoValue}>Full Control</Text>
          </View>
        </View>

        {/* Active Sessions */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Active Sessions</Text>
            <View style={styles.sessionBadge}>
              <Text style={styles.sessionBadgeText}>2 Online</Text>
            </View>
          </View>

          <View style={styles.sessionItem}>
            <View style={styles.deviceIcon}>
              {/* Tự động đổi icon tùy theo hệ điều hành đang cầm */}
              <Text style={styles.deviceIconText}>
                {Platform.OS === 'ios' ? '🍎' : '🤖'}
              </Text>
            </View>
            
            <View style={styles.sessionInfo}>
              {/* Device.modelName sẽ in ra chính xác dòng máy, VD: "iPhone 15 Pro" */}
              <Text style={styles.sessionDevice}>
                {Device.modelName || 'Mobile Device'} (Current)
              </Text>
              
              {/* In thêm hệ điều hành ở dưới cho xịn */}
              <Text style={styles.sessionTime}>
                {Device.osName} {Device.osVersion} • Active now
              </Text>
            </View>
            <View style={styles.onlineDot} />
          </View>

          <View style={styles.sessionItem}>
            <View style={styles.deviceIcon}>
              <Text style={styles.deviceIconText}>💻</Text>
            </View>
            <View style={styles.sessionInfo}>
              <Text style={styles.sessionDevice}>MacBook Air - Home Office</Text>
              <Text style={styles.sessionTime}>Active now</Text>
            </View>
            <View style={styles.onlineDot} />
          </View>
        </View>

        {/* Privacy & Notifications Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Privacy & Notification Settings</Text>

          <View style={styles.settingCard}>
            <View style={styles.settingContent}>
              <View style={styles.settingIcon}>
                <Text style={styles.settingIconText}>🔔</Text>
              </View>
              <View style={styles.settingText}>
                <Text style={styles.settingName}>Push Notifications</Text>
                <Text style={styles.settingDesc}>Alerts for security events</Text>
              </View>
            </View>
            <View style={styles.toggle}>
              <View style={styles.toggleOn} />
            </View>
          </View>

          <View style={styles.settingCard}>
            <View style={styles.settingContent}>
              <View style={styles.settingIcon}>
                <Text style={styles.settingIconText}>👁️</Text>
              </View>
              <View style={styles.settingText}>
                <Text style={styles.settingName}>Private Mode</Text>
                <Text style={styles.settingDesc}>Hide stats from guest users</Text>
              </View>
            </View>
            <View style={styles.toggle}>
              <View style={styles.toggleOff} />
            </View>
          </View>

          <View style={styles.settingCard}>
            <View style={styles.settingContent}>
              <View style={styles.settingIcon}>
                <Text style={styles.settingIconText}>📍</Text>
              </View>
              <View style={styles.settingText}>
                <Text style={styles.settingName}>Location Awareness</Text>
                <Text style={styles.settingDesc}>Auto-lock when leaving home</Text>
              </View>
            </View>
            <View style={styles.toggle}>
              <View style={styles.toggleOn} />
            </View>
          </View>
        </View>

        {/* System Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>System Information</Text>

          <View style={styles.infoItem}>
            <View style={styles.infoItemIcon}>
              <Text style={styles.infoItemIconText}>🏠</Text>
            </View>
            <View style={styles.infoItemContent}>
              <Text style={styles.infoItemLabel}>Project name</Text>
              <Text style={styles.infoItemValue}>Tuyen_Main_Hub_v2</Text>
            </View>
          </View>

          <View style={styles.infoItem}>
            <View style={styles.infoItemIcon}>
              <Text style={styles.infoItemIconText}>🎛️</Text>
            </View>
            <View style={styles.infoItemContent}>
              <Text style={styles.infoItemLabel}>Microcontroller</Text>
              <Text style={styles.infoItemValue}>ESP32-S3 WROOM</Text>
            </View>
          </View>

          <View style={styles.infoItem}>
            <View style={styles.infoItemIcon}>
              <Text style={styles.infoItemIconText}>⏱️</Text>
            </View>
            <View style={styles.infoItemContent}>
              <Text style={styles.infoItemLabel}>Firmware</Text>
              <Text style={styles.infoItemValue}>1.4.2 (Latest)</Text>
            </View>
          </View>
        </View>

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutBtn} onPress={onLogout}>
          <Text style={styles.logoutIcon}>📤</Text>
          <Text style={styles.logoutText}>Sign Out</Text>
        </TouchableOpacity>

        <Text style={styles.footer}>VERSION 2.0.4 • BUILT WITH CARE</Text>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    padding: 20,
    paddingTop: 10,
    paddingBottom: 32,
  },
  header: {
    marginBottom: 24,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: colors.textMuted,
  },
  profileCard: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: colors.border,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.accent,
  },
  avatarText: {
    fontSize: 40,
  },
  shieldBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.success,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: colors.surface,
  },
  shieldText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  userName: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 6,
  },
  userEmail: {
    fontSize: 14,
    color: colors.textMuted,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
    gap: 12,
  },
  infoCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  infoIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoIcon: {
    fontSize: 22,
  },
  infoLabel: {
    fontSize: 11,
    color: colors.textMuted,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  sessionBadge: {
    backgroundColor: colors.success,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  sessionBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  sessionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  deviceIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  deviceIconText: {
    fontSize: 20,
  },
  sessionInfo: {
    flex: 1,
  },
  sessionDevice: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  sessionTime: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  onlineDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.success,
  },
  settingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  settingContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  settingIconText: {
    fontSize: 20,
  },
  settingText: {
    flex: 1,
  },
  settingName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  settingDesc: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  toggle: {
    width: 50,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.border,
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  toggleOn: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.success,
    marginLeft: 'auto',
  },
  toggleOff: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.textMuted,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  infoItemIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  infoItemIconText: {
    fontSize: 20,
  },
  infoItemContent: {
    flex: 1,
  },
  infoItemLabel: {
    fontSize: 12,
    color: colors.textMuted,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  infoItemValue: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
    marginTop: 2,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.accent,
    borderRadius: 18,
    paddingVertical: 16,
    marginVertical: 16,
  },
  logoutIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  footer: {
    fontSize: 11,
    color: colors.textMuted,
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 24,
  },
});
