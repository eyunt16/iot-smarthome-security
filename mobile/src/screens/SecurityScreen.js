import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, TouchableOpacity } from 'react-native';
import { colors } from '../theme/colors';

export default function SecurityScreen() {
  const [activeAlert] = useState({
    title: 'INTRUSION DETECTION',
    message: 'Active Alert',
    detail: 'PIR Sensor triggered in North Corridor',
    severity: 'high'
  });

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Security</Text>
          <Text style={styles.headerSubtitle}>System monitoring</Text>
        </View>

        {/* Active Alert */}
        {activeAlert && (
          <View style={styles.alertCard}>
            <View style={styles.alertHeader}>
              <View style={styles.alertIcon}>
                <Text style={styles.alertIconText}>!</Text>
              </View>
              <Text style={styles.alertLabel}>{activeAlert.title}</Text>
            </View>
            <Text style={styles.alertTitle}>{activeAlert.message}</Text>
            <Text style={styles.alertDetail}>{activeAlert.detail}</Text>
            <View style={styles.alertActions}>
              <TouchableOpacity style={styles.dismissBtn}>
                <Text style={styles.dismissText}>DISMISS</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.callBtn}>
                <Text style={styles.callText}>CALL AUTHORITIES</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Biometric & Protocol */}
        <View style={styles.statusRow}>
          {/* Biometric */}
          <View style={styles.statusCard}>
            <View style={styles.statusIcon}>
              <Text style={styles.iconText}>👁️</Text>
            </View>
            <Text style={styles.statusLabel}>Biometric</Text>
            <Text style={styles.statusSubtitle}>Main Entry Lock</Text>
            <View style={styles.statusBadge}>
              <Text style={styles.statusBadgeText}>ACTIVE</Text>
            </View>
            <TouchableOpacity style={styles.toggleSwitch}>
              <View style={styles.switchInner} />
            </TouchableOpacity>
          </View>

          {/* Protocol */}
          <View style={styles.statusCard}>
            <View style={styles.statusIcon}>
              <Text style={styles.iconText}>🛡️</Text>
            </View>
            <Text style={styles.statusLabel}>Protocol</Text>
            <View style={styles.protocolDetails}>
              <View style={styles.protocolRow}>
                <Text style={styles.protocolLabel}>AES-256 GCM</Text>
                <Text style={styles.protocolValue}>PORT</Text>
              </View>
              <Text style={styles.protocolPort}>8443</Text>
              <View style={styles.protocolRow}>
                <Text style={styles.protocolLabel}>SSL</Text>
                <Text style={styles.protocolValue}>STRICT</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Alert Log */}
        <View style={styles.logSection}>
          <View style={styles.logHeader}>
            <Text style={styles.logTitle}>Alert Log</Text>
            <TouchableOpacity>
              <Text style={styles.viewAll}>VIEW ALL →</Text>
            </TouchableOpacity>
          </View>

          {/* Alert Items */}
          <View style={styles.alertItem}>
            <View style={styles.alertItemIcon}>
              <Text style={styles.itemIconText}>🚨</Text>
            </View>
            <View style={styles.alertItemContent}>
              <Text style={styles.alertItemTitle}>PIR Sensor Triggered</Text>
              <Text style={styles.alertItemTime}>North Corridor • 2m ago</Text>
            </View>
            <Text style={styles.alertItemArrow}>›</Text>
          </View>

          <View style={styles.alertItem}>
            <View style={styles.alertItemIcon}>
              <Text style={styles.itemIconText}>🔓</Text>
            </View>
            <View style={styles.alertItemContent}>
              <Text style={styles.alertItemTitle}>Biometric Unlock</Text>
              <Text style={styles.alertItemTime}>Main Gate • 14:22 PM</Text>
            </View>
            <Text style={styles.alertItemArrow}>›</Text>
          </View>

          <View style={styles.alertItem}>
            <View style={styles.alertItemIcon}>
              <Text style={styles.itemIconText}>🔐</Text>
            </View>
            <View style={styles.alertItemContent}>
              <Text style={styles.alertItemTitle}>Keypad Pin Changed</Text>
              <Text style={styles.alertItemTime}>Service Entrance • 09:15 AM</Text>
            </View>
            <Text style={styles.alertItemArrow}>›</Text>
          </View>
        </View>

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
  alertCard: {
    backgroundColor: '#C85450',
    borderRadius: 24,
    padding: 20,
    marginBottom: 24,
  },
  alertHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  alertIcon: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  alertIconText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  alertLabel: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  alertTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  alertDetail: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    marginBottom: 20,
  },
  alertActions: {
    flexDirection: 'row',
    gap: 12,
  },
  dismissBtn: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dismissText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 12,
  },
  callBtn: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  callText: {
    color: '#C85450',
    fontWeight: '700',
    fontSize: 12,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
    gap: 12,
  },
  statusCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  statusIcon: {
    fontSize: 32,
    marginBottom: 12,
  },
  iconText: {
    fontSize: 28,
  },
  statusLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  statusSubtitle: {
    fontSize: 12,
    color: colors.textMuted,
    marginBottom: 12,
  },
  statusBadge: {
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    marginBottom: 12,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.success,
  },
  toggleSwitch: {
    width: 50,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.success,
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  switchInner: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    marginLeft: 'auto',
  },
  protocolDetails: {
    width: '100%',
  },
  protocolRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  protocolLabel: {
    fontSize: 11,
    color: colors.textMuted,
    fontWeight: '600',
  },
  protocolValue: {
    fontSize: 11,
    color: colors.textMuted,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  protocolPort: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 6,
  },
  logSection: {
    marginBottom: 32,
  },
  logHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  logTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  viewAll: {
    fontSize: 13,
    color: colors.accent,
    fontWeight: '600',
  },
  alertItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  alertItemIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  itemIconText: {
    fontSize: 20,
  },
  alertItemContent: {
    flex: 1,
  },
  alertItemTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  alertItemTime: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  alertItemArrow: {
    fontSize: 18,
    color: colors.textMuted,
  },
});
