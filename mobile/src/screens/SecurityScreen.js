import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  Alert,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { api } from '../services/api';

export default function SecurityScreen({ user }) {
  const { isDark, themeColors } = useTheme();
  const isAdmin = user?.role === 'admin' || user?.role === 'SuperAdmin';
  
  // Door Lock states
  const [doorLocked, setDoorLocked] = useState(true);
  const [showPinModal, setShowPinModal] = useState(false);
  const [enteredPin, setEnteredPin] = useState('');
  const [unlocking, setUnlocking] = useState(false);

  // Admin Data states
  const [usersList, setUsersList] = useState([]);
  const [securityLogs, setSecurityLogs] = useState([]);
  const [loadingAdminData, setLoadingAdminData] = useState(false);

  useEffect(() => {
    if (isAdmin) {
      fetchAdminData();
    }
  }, [isAdmin]);

  const fetchAdminData = async () => {
    setLoadingAdminData(true);
    try {
      // 1. Fetch Users
      const usersResponse = await api.get('/auth/users');
      if (usersResponse && Array.isArray(usersResponse.users)) {
        setUsersList(usersResponse.users);
      } else if (usersResponse && Array.isArray(usersResponse)) {
        setUsersList(usersResponse);
      }

      // 2. Fetch Security Logs
      const logsResponse = await api.get('/auth/logs');
      if (logsResponse && Array.isArray(logsResponse.logs)) {
        setSecurityLogs(logsResponse.logs.slice(0, 10)); // Take latest 10 logs
      } else if (logsResponse && Array.isArray(logsResponse)) {
        setSecurityLogs(logsResponse.slice(0, 10));
      }
    } catch (err) {
      console.log('Error fetching admin data:', err);
    } finally {
      setLoadingAdminData(false);
    }
  };

  const handleDoorToggle = () => {
    if (doorLocked) {
      // Prompt for PIN to unlock
      setShowPinModal(true);
      setEnteredPin('');
    } else {
      // Directly lock the door without PIN
      handleLockDoor();
    }
  };

  const handleUnlockDoor = async () => {
    if (!enteredPin) {
      Alert.alert('Validation Error', 'Please enter your door security PIN.');
      return;
    }

    setUnlocking(true);
    try {
      const response = await api.post('/auth/door/unlock', { pin: enteredPin });
      setDoorLocked(false);
      setShowPinModal(false);
      Alert.alert('Success', response.message || 'Door successfully unlocked!');
      if (isAdmin) fetchAdminData();
    } catch (err) {
      const message = err.response?.data?.message || err.message || 'Incorrect PIN code entered.';
      Alert.alert('Access Denied', message);
    } finally {
      setUnlocking(false);
    }
  };

  const handleLockDoor = async () => {
    try {
      // Call endpoint or publish direct control via toggle
      await api.post('/device/control', {
        device: 'door',
        action: 'lock',
        value: 'lock'
      });
      setDoorLocked(true);
      Alert.alert('Locked', 'Main Entrance successfully locked.');
      if (isAdmin) fetchAdminData();
    } catch (err) {
      // Fallback update on simulation
      setDoorLocked(true);
    }
  };

  const handleClearLogs = async () => {
    Alert.alert(
      'Confirm Action',
      'Are you absolutely sure you want to clear the entire forensic security log trail?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Clear Logs', 
          style: 'destructive',
          onPress: async () => {
            try {
              await api.delete('/auth/logs');
              Alert.alert('Success', 'Security log trail successfully cleared.');
              fetchAdminData();
            } catch (err) {
              Alert.alert('Error', 'Failed to clear logs.');
            }
          }
        }
      ]
    );
  };

  const getSeverityStyle = (type) => {
    const normal = { color: themeColors.success, bg: 'rgba(16,185,129,0.1)' };
    const warning = { color: themeColors.warning, bg: 'rgba(245,158,11,0.1)' };
    const danger = { color: themeColors.danger, bg: 'rgba(239,68,68,0.1)' };
    
    if (!type) return normal;
    const lower = type.toLowerCase();
    if (lower.includes('failed') || lower.includes('ban') || lower.includes('intrusion')) return danger;
    if (lower.includes('warning') || lower.includes('lock')) return warning;
    return normal;
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: themeColors.bg }]}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.headerTitle, { color: themeColors.text }]}>Security Center</Text>
          <Text style={[styles.headerSubtitle, { color: themeColors.textMuted }]}>
            Secure main entry portals and monitor credentials
          </Text>
        </View>

        {/* Smart Door Lock Controller Card */}
        <View style={[styles.controlCard, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
          <View style={styles.cardMain}>
            <View style={[styles.controlIconBadge, { backgroundColor: themeColors.bg }]}>
              <Text style={styles.controlIcon}>{doorLocked ? '🔒' : '🔓'}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.controlLabel, { color: themeColors.text }]}>Main Entrance Door</Text>
              <Text style={[styles.controlSub, { color: themeColors.textMuted }]}>
                Status: {doorLocked ? 'LOCKED' : 'UNLOCKED'}
              </Text>
            </View>
            <TouchableOpacity 
              style={[styles.lockButton, { backgroundColor: doorLocked ? themeColors.border : themeColors.success }]}
              onPress={handleDoorToggle}
            >
              <Text style={[styles.lockButtonText, { color: doorLocked ? themeColors.text : '#FFFFFF' }]}>
                {doorLocked ? 'UNLOCK' : 'LOCK'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* PIN Entry Popup Modal (Rendered inline in the view) */}
        {showPinModal && (
          <View style={[styles.pinCard, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
            <Text style={[styles.pinTitle, { color: themeColors.text }]}>🔑 Enter Door Security PIN</Text>
            <Text style={[styles.pinSub, { color: themeColors.textMuted }]}>Default secure passcode is 1234</Text>
            
            <TextInput
              style={[styles.pinInput, { backgroundColor: themeColors.bg, color: themeColors.text, borderColor: themeColors.border }]}
              value={enteredPin}
              onChangeText={setEnteredPin}
              placeholder="PIN Code"
              placeholderTextColor={themeColors.textMuted}
              secureTextEntry
              keyboardType="number-pad"
              maxLength={6}
            />

            <View style={styles.pinActions}>
              <TouchableOpacity 
                style={[styles.pinCancelBtn, { borderColor: themeColors.border }]}
                onPress={() => setShowPinModal(false)}
              >
                <Text style={[styles.pinCancelText, { color: themeColors.text }]}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.pinConfirmBtn, { backgroundColor: themeColors.accent }]}
                onPress={handleUnlockDoor}
                disabled={unlocking}
              >
                {unlocking ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text style={styles.pinConfirmText}>Confirm</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Strict Admin RBAC Section */}
        {isAdmin ? (
          <View style={styles.adminContainer}>
            <Text style={[styles.adminHeaderTitle, { color: themeColors.text }]}>👑 System Administration</Text>
            
            {/* User List grid */}
            <View style={[styles.adminCard, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
              <Text style={[styles.adminCardTitle, { color: themeColors.text }]}>Active System Users</Text>
              <Text style={[styles.adminCardSub, { color: themeColors.textMuted }]}>Registered roles & credentials</Text>

              {loadingAdminData ? (
                <ActivityIndicator color={themeColors.accent} size="small" style={{ marginVertical: 16 }} />
              ) : usersList.length === 0 ? (
                <Text style={[styles.emptyText, { color: themeColors.textMuted }]}>No users found in database.</Text>
              ) : (
                usersList.map((userItem) => (
                  <View key={userItem.id || userItem._id} style={[styles.userRow, { borderBottomColor: themeColors.border }]}>
                    <View style={styles.userAvatar}>
                      <Text style={styles.avatarChar}>{userItem.username ? userItem.username.charAt(0).toUpperCase() : 'U'}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.userRowName, { color: themeColors.text }]}>{userItem.username}</Text>
                      <Text style={[styles.userRowEmail, { color: themeColors.textMuted }]}>{userItem.email || 'No email saved'}</Text>
                    </View>
                    <View style={[styles.roleBadge, { backgroundColor: userItem.role === 'admin' || userItem.role === 'SuperAdmin' ? 'rgba(166,123,91,0.12)' : 'rgba(0,0,0,0.05)' }]}>
                      <Text style={[styles.roleBadgeText, { color: userItem.role === 'admin' || userItem.role === 'SuperAdmin' ? themeColors.accent : themeColors.textMuted }]}>
                        {userItem.role}
                      </Text>
                    </View>
                  </View>
                ))
              )}
            </View>

            {/* Forensic Security Logs audit */}
            <View style={[styles.adminCard, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
              <View style={styles.logHeader}>
                <View>
                  <Text style={[styles.adminCardTitle, { color: themeColors.text }]}>Security Logs & Audits</Text>
                  <Text style={[styles.adminCardSub, { color: themeColors.textMuted }]}>Forensic logs</Text>
                </View>
                <TouchableOpacity onPress={handleClearLogs} style={styles.clearBtn}>
                  <Text style={styles.clearBtnText}>CLEAR TRAIL</Text>
                </TouchableOpacity>
              </View>

              {loadingAdminData ? (
                <ActivityIndicator color={themeColors.accent} size="small" style={{ marginVertical: 16 }} />
              ) : securityLogs.length === 0 ? (
                <Text style={[styles.emptyText, { color: themeColors.textMuted }]}>No security events logged.</Text>
              ) : (
                securityLogs.map((logItem) => {
                  const styleColors = getSeverityStyle(logItem.eventType);
                  return (
                    <View key={logItem._id || logItem.id} style={[styles.logRow, { borderBottomColor: themeColors.border }]}>
                      <View style={[styles.severityDot, { backgroundColor: styleColors.color }]} />
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.logText, { color: themeColors.text }]}>{logItem.description}</Text>
                        <Text style={[styles.logSub, { color: themeColors.textMuted }]}>
                          IP: {logItem.ipAddress || 'Unknown'} • {new Date(logItem.timestamp).toLocaleTimeString()}
                        </Text>
                      </View>
                      <View style={[styles.logTypeBadge, { backgroundColor: styleColors.bg }]}>
                        <Text style={[styles.logTypeText, { color: styleColors.color }]}>
                          {logItem.eventType}
                        </Text>
                      </View>
                    </View>
                  );
                })
              )}
            </View>
          </View>
        ) : (
          /* Customer Hidden State Indicator */
          <View style={[styles.customerPanel, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
            <Text style={styles.shieldBig}>🛡️</Text>
            <Text style={[styles.customerTitle, { color: themeColors.text }]}>System Protection Active</Text>
            <Text style={[styles.customerSub, { color: themeColors.textMuted }]}>
              Your HomeOwner account is fully protected under strict administrative cybersecurity guidelines. System audits and backend database grids are restricted strictly to Administrators.
            </Text>
          </View>
        )}

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingTop: 12,
    paddingBottom: 80,
  },
  header: {
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
  },
  controlCard: {
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    marginBottom: 20,
  },
  cardMain: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  controlIconBadge: {
    width: 46,
    height: 46,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  controlIcon: {
    fontSize: 24,
  },
  controlLabel: {
    fontSize: 14,
    fontWeight: '700',
  },
  controlSub: {
    fontSize: 12,
    marginTop: 2,
  },
  lockButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
  },
  lockButtonText: {
    fontSize: 12,
    fontWeight: '700',
  },
  pinCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 18,
    marginBottom: 20,
  },
  pinTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  pinSub: {
    fontSize: 12,
    marginBottom: 14,
  },
  pinInput: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    textAlign: 'center',
    fontWeight: '700',
    letterSpacing: 8,
    marginBottom: 16,
  },
  pinActions: {
    flexDirection: 'row',
    gap: 10,
  },
  pinCancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pinCancelText: {
    fontSize: 13,
    fontWeight: '700',
  },
  pinConfirmBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pinConfirmText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  adminContainer: {
    gap: 16,
  },
  adminHeaderTitle: {
    fontSize: 15,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  adminCard: {
    borderRadius: 22,
    padding: 16,
    borderWidth: 1,
  },
  adminCardTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  adminCardSub: {
    fontSize: 12,
    marginTop: 2,
    marginBottom: 14,
  },
  emptyText: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
    marginVertical: 16,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  userAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#A67B5B',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  avatarChar: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 15,
  },
  userRowName: {
    fontSize: 14,
    fontWeight: '700',
  },
  userRowEmail: {
    fontSize: 11,
    marginTop: 2,
  },
  roleBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  roleBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  logHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  clearBtn: {
    backgroundColor: 'rgba(239,68,68,0.1)',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  clearBtnText: {
    color: '#EF4444',
    fontSize: 10,
    fontWeight: '700',
  },
  logRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  severityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 10,
  },
  logText: {
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 18,
  },
  logSub: {
    fontSize: 10,
    marginTop: 2,
  },
  logTypeBadge: {
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 3,
    marginLeft: 8,
  },
  logTypeText: {
    fontSize: 9,
    fontWeight: '700',
  },
  customerPanel: {
    borderRadius: 22,
    borderWidth: 1,
    padding: 24,
    alignItems: 'center',
  },
  shieldBig: {
    fontSize: 64,
    marginBottom: 16,
  },
  customerTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
  },
  customerSub: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 20,
  },
});
