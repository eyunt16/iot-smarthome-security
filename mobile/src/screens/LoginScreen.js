import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useColorScheme,
  View,
} from 'react-native';
import { api } from '../services/api';

const DEMO_USERNAME = 'admin';
const DEMO_PASSWORD = 'admin';
const DEMO_INVITE_CODE = 'tuyenhome';
const LOCKED_ACCOUNT_MESSAGE =
  '\u26A0\uFE0F Your account has been locked due to too many failed login attempts. Please contact the Administrator to unlock.';
const INVALID_CREDENTIALS_MESSAGE =
  'Invalid credentials. Please try again.';

function colorWithAlpha(hex, alpha) {
  const normalized = hex.replace('#', '');

  if (normalized.length !== 6) {
    return hex;
  }

  const red = Number.parseInt(normalized.slice(0, 2), 16);
  const green = Number.parseInt(normalized.slice(2, 4), 16);
  const blue = Number.parseInt(normalized.slice(4, 6), 16);

  return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
}

const palette = {
  light: {
    background: '#F5F0E7',
    backgroundSecondary: '#EFE6D7',
    card: 'rgba(255, 251, 245, 0.94)',
    cardBorder: 'rgba(111, 88, 59, 0.10)',
    text: '#1F241D',
    textMuted: '#6E655B',
    textSoft: '#8A7D71',
    forest: '#274437',
    forestSoft: '#E2ECE6',
    accent: '#A67C52',
    accentStrong: '#8F6842',
    accentSoft: '#E9D7C1',
    input: '#F8F1E6',
    inputBorder: '#E5D6C2',
    iconFill: '#EEE2CF',
    shadow: '#342416',
    tabIdle: 'rgba(255, 255, 255, 0.48)',
    success: '#2E6B4A',
    danger: '#B05345',
  },
  dark: {
    background: '#171A18',
    backgroundSecondary: '#222723',
    card: 'rgba(31, 35, 33, 0.94)',
    cardBorder: 'rgba(229, 215, 195, 0.08)',
    text: '#F2ECE2',
    textMuted: '#B6AA9E',
    textSoft: '#8D837A',
    forest: '#4E7A63',
    forestSoft: 'rgba(78, 122, 99, 0.18)',
    accent: '#B78A5C',
    accentStrong: '#D0A06D',
    accentSoft: 'rgba(183, 138, 92, 0.18)',
    input: '#232826',
    inputBorder: '#343A36',
    iconFill: '#2D332F',
    shadow: '#000000',
    tabIdle: 'rgba(255, 255, 255, 0.03)',
    success: '#6FB38A',
    danger: '#DE8578',
  },
};

const createStyles = (theme) =>
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: theme.background,
    },
    keyboardContainer: {
      flex: 1,
    },
    scrollContent: {
      flexGrow: 1,
      paddingHorizontal: 22,
      paddingVertical: 24,
      justifyContent: 'center',
    },
    screen: {
      position: 'relative',
      overflow: 'hidden',
    },
    ambientCircleTop: {
      position: 'absolute',
      top: -90,
      right: -30,
      width: 220,
      height: 220,
      borderRadius: 110,
      backgroundColor: theme.forestSoft,
    },
    ambientCircleBottom: {
      position: 'absolute',
      bottom: -70,
      left: -40,
      width: 210,
      height: 210,
      borderRadius: 105,
      backgroundColor: theme.accentSoft,
    },
    hero: {
      alignItems: 'center',
      marginBottom: 24,
    },
    shieldShell: {
      width: 86,
      height: 86,
      borderRadius: 28,
      backgroundColor: theme.card,
      borderWidth: 1,
      borderColor: theme.cardBorder,
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: theme.shadow,
      shadowOffset: { width: 0, height: 18 },
      shadowOpacity: 0.16,
      shadowRadius: 26,
      elevation: 10,
      marginBottom: 18,
    },
    shieldInner: {
      width: 58,
      height: 58,
      borderRadius: 20,
      backgroundColor: theme.forest,
      alignItems: 'center',
      justifyContent: 'center',
    },
    shieldText: {
      color: '#F7F1E8',
      fontSize: 25,
      fontWeight: '700',
    },
    brand: {
      fontSize: 34,
      color: theme.text,
      fontWeight: '700',
      fontFamily: Platform.select({ ios: 'Georgia', default: 'serif' }),
      letterSpacing: 0.3,
    },
    portalLabel: {
      marginTop: 6,
      fontSize: 12,
      color: theme.textSoft,
      letterSpacing: 2.6,
      fontWeight: '700',
    },
    card: {
      backgroundColor: theme.card,
      borderRadius: 28,
      borderWidth: 1,
      borderColor: theme.cardBorder,
      padding: 18,
      shadowColor: theme.shadow,
      shadowOffset: { width: 0, height: 20 },
      shadowOpacity: 0.14,
      shadowRadius: 30,
      elevation: 14,
    },
    tabBar: {
      flexDirection: 'row',
      backgroundColor: theme.backgroundSecondary,
      borderRadius: 18,
      padding: 5,
      marginBottom: 22,
    },
    tabButton: {
      flex: 1,
      borderRadius: 14,
      paddingVertical: 12,
      alignItems: 'center',
      justifyContent: 'center',
    },
    tabButtonActive: {
      backgroundColor: theme.forest,
      shadowColor: theme.forest,
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.22,
      shadowRadius: 16,
      elevation: 6,
    },
    tabButtonIdle: {
      backgroundColor: theme.tabIdle,
    },
    tabText: {
      fontSize: 14,
      fontWeight: '700',
      letterSpacing: 0.3,
    },
    tabTextActive: {
      color: '#F9F4EC',
    },
    tabTextIdle: {
      color: theme.textMuted,
    },
    introRow: {
      marginBottom: 18,
    },
    eyebrow: {
      color: theme.accentStrong,
      fontSize: 12,
      fontWeight: '700',
      letterSpacing: 1.6,
      marginBottom: 7,
    },
    heading: {
      color: theme.text,
      fontSize: 26,
      lineHeight: 31,
      fontWeight: '700',
      fontFamily: Platform.select({ ios: 'Georgia', default: 'serif' }),
      marginBottom: 8,
    },
    subheading: {
      color: theme.textMuted,
      fontSize: 14,
      lineHeight: 22,
    },
    authAlert: {
      borderRadius: 16,
      paddingHorizontal: 14,
      paddingVertical: 12,
      marginBottom: 16,
      borderWidth: 1,
    },
    authAlertError: {
      backgroundColor: theme.accentSoft,
      borderColor: theme.accentStrong,
    },
    authAlertLocked: {
      backgroundColor: colorWithAlpha(theme.danger, 0.16),
      borderColor: theme.danger,
    },
    authAlertTitle: {
      color: theme.text,
      fontSize: 13,
      fontWeight: '800',
      marginBottom: 4,
    },
    authAlertText: {
      color: theme.text,
      fontSize: 13,
      lineHeight: 20,
    },
    formGroup: {
      marginBottom: 14,
    },
    label: {
      color: theme.text,
      fontSize: 12,
      fontWeight: '700',
      letterSpacing: 1,
      marginBottom: 8,
    },
    fieldShell: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.input,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: theme.inputBorder,
      paddingLeft: 10,
      paddingRight: 8,
      minHeight: 58,
      shadowColor: theme.shadow,
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.06,
      shadowRadius: 14,
      elevation: 2,
    },
    iconBadge: {
      width: 36,
      height: 36,
      borderRadius: 12,
      backgroundColor: theme.iconFill,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 10,
    },
    iconLabel: {
      color: theme.forest,
      fontSize: 11,
      fontWeight: '800',
      letterSpacing: 0.4,
    },
    input: {
      flex: 1,
      color: theme.text,
      fontSize: 15,
      paddingVertical: 16,
    },
    eyeButton: {
      minWidth: 44,
      minHeight: 44,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 12,
    },
    eyeText: {
      color: theme.textMuted,
      fontSize: 12,
      fontWeight: '700',
      letterSpacing: 0.3,
    },
    submitButton: {
      backgroundColor: theme.accent,
      minHeight: 58,
      borderRadius: 18,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 8,
      shadowColor: theme.accent,
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.22,
      shadowRadius: 18,
      elevation: 6,
    },
    submitButtonDisabled: {
      opacity: 0.72,
    },
    submitText: {
      color: '#FFF9F3',
      fontSize: 15,
      fontWeight: '800',
      letterSpacing: 0.8,
    },
    helperRow: {
      marginTop: 16,
      paddingTop: 14,
      borderTopWidth: 1,
      borderTopColor: theme.cardBorder,
      gap: 6,
    },
    helperText: {
      color: theme.textSoft,
      fontSize: 12,
      textAlign: 'center',
      lineHeight: 18,
    },
    helperAccent: {
      color: theme.forest,
      fontWeight: '700',
    },
    footerNote: {
      marginTop: 18,
      color: theme.textSoft,
      fontSize: 12,
      textAlign: 'center',
      lineHeight: 18,
    },
  });

function Field({
  styles,
  theme,
  label,
  icon,
  value,
  onChangeText,
  placeholder,
  secureTextEntry,
  showToggle,
  toggleText,
  onTogglePress,
  editable,
  keyboardType,
  autoCapitalize,
}) {
  return (
    <View style={styles.formGroup}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.fieldShell}>
        <View style={styles.iconBadge}>
          <Text style={styles.iconLabel}>{icon}</Text>
        </View>
        <TextInput
          style={styles.input}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={theme.textSoft}
          secureTextEntry={secureTextEntry}
          editable={editable}
          autoCapitalize={autoCapitalize}
          keyboardType={keyboardType}
        />
        {showToggle ? (
          <TouchableOpacity style={styles.eyeButton} onPress={onTogglePress}>
            <Text style={styles.eyeText}>{toggleText}</Text>
          </TouchableOpacity>
        ) : null}
      </View>
    </View>
  );
}

export default function LoginScreen({ onLoginSuccess }) {
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? palette.dark : palette.light;
  const styles = useMemo(() => createStyles(theme), [theme]);

  const [activeTab, setActiveTab] = useState('signin');
  const [signinUsername, setSigninUsername] = useState('');
  const [signinPassword, setSigninPassword] = useState('');
  const [requestName, setRequestName] = useState('');
  const [requestEmail, setRequestEmail] = useState('');
  const [requestPassword, setRequestPassword] = useState('');
  const [requestCode, setRequestCode] = useState(DEMO_INVITE_CODE);
  const [showSigninPassword, setShowSigninPassword] = useState(false);
  const [showRequestPassword, setShowRequestPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [signinError, setSigninError] = useState('');
  const [isAccountLocked, setIsAccountLocked] = useState(false);

  const isSignin = activeTab === 'signin';

  const clearSigninFeedback = () => {
    setSigninError('');
    setIsAccountLocked(false);
  };

  const handleSigninUsernameChange = (value) => {
    clearSigninFeedback();
    setSigninUsername(value);
  };

  const handleSigninPasswordChange = (value) => {
    clearSigninFeedback();
    setSigninPassword(value);
  };

  const handleSignIn = async () => {
    if (!signinUsername.trim() || !signinPassword.trim()) {
      Alert.alert('Validation Error', 'Please enter both username and password.');
      return;
    }

    clearSigninFeedback();
    setLoading(true);

    try {
      const response = await api.post('/auth/login', {
        usernameOrEmail: signinUsername.trim(),
        password: signinPassword,
      });

      if (response?.token || response?.status === 'success') {
        onLoginSuccess(response.token || 'api-auth-token');
      } else {
        setSigninError(response?.message || INVALID_CREDENTIALS_MESSAGE);
      }
    } catch (error) {
      const responseData = error?.response?.data || error?.data || null;
      const statusCode = error?.response?.status || error?.status;
      const responseMessage = String(
        responseData?.message || error?.message || '',
      );
      const normalizedMessage = responseMessage.toLowerCase();
      const lockedFromPayload =
        responseData?.isLocked === true
        || responseData?.locked === true
        || normalizedMessage.includes('account is locked')
        || normalizedMessage.includes('locked');

      if (statusCode === 423 || lockedFromPayload) {
        setIsAccountLocked(true);
        setSigninError(LOCKED_ACCOUNT_MESSAGE);
        return;
      }

      if (
        statusCode === 401 ||
        statusCode === 403 ||
        normalizedMessage.includes('invalid credentials') ||
        normalizedMessage.includes('authentication failed') ||
        normalizedMessage.includes('wrong password')
      ) {
        setSigninError(INVALID_CREDENTIALS_MESSAGE);
        return;
      }

      Alert.alert(
        'Network Error',
        error.message ||
          'Could not reach the server. Check that the backend is running on the same network.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleRequestAccess = async () => {
    if (
      !requestName.trim() ||
      !requestEmail.trim() ||
      !requestPassword.trim() ||
      !requestCode.trim()
    ) {
      Alert.alert('Validation Error', 'Please complete every field before submitting.');
      return;
    }

    if (!requestEmail.includes('@')) {
      Alert.alert('Validation Error', 'Please enter a valid email address.');
      return;
    }

    if (requestCode.trim().toLowerCase() !== DEMO_INVITE_CODE) {
      Alert.alert('Invalid Invitation Code', 'Use the demo invite code: tuyenhome');
      return;
    }

    setLoading(true);

    try {
      const suggestedUsername = requestEmail.trim().split('@')[0];
      setSigninUsername(suggestedUsername || DEMO_USERNAME);
      setSigninPassword(requestPassword);
      setActiveTab('signin');

      Alert.alert(
        'Request Submitted',
        'Access request received. The sign-in form has been prepared with your credentials.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = () => {
    if (isSignin) {
      handleSignIn();
      return;
    }

    handleRequestAccess();
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar
        barStyle={colorScheme === 'dark' ? 'light-content' : 'dark-content'}
        backgroundColor={theme.background}
      />
      <KeyboardAvoidingView
        style={styles.keyboardContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.screen}>
            <View style={styles.ambientCircleTop} />
            <View style={styles.ambientCircleBottom} />

            <View style={styles.hero}>
              <View style={styles.shieldShell}>
                <View style={styles.shieldInner}>
                  <Text style={styles.shieldText}>TH</Text>
                </View>
              </View>
              <Text style={styles.brand}>Tuyen Home</Text>
              <Text style={styles.portalLabel}>SECURE ADMIN PORTAL</Text>
            </View>

            <View style={styles.card}>
              <View style={styles.tabBar}>
                <TouchableOpacity
                  style={[
                    styles.tabButton,
                    isSignin ? styles.tabButtonActive : styles.tabButtonIdle,
                  ]}
                  onPress={() => setActiveTab('signin')}
                  disabled={loading}
                >
                  <Text style={[styles.tabText, isSignin ? styles.tabTextActive : styles.tabTextIdle]}>
                    Sign In
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.tabButton,
                    !isSignin ? styles.tabButtonActive : styles.tabButtonIdle,
                  ]}
                  onPress={() => setActiveTab('request')}
                  disabled={loading}
                >
                  <Text style={[styles.tabText, !isSignin ? styles.tabTextActive : styles.tabTextIdle]}>
                    Request Access
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={styles.introRow}>
                <Text style={styles.eyebrow}>
                  {isSignin ? 'PRIVATE ENTRY' : 'INVITATION REQUIRED'}
                </Text>
                <Text style={styles.heading}>
                  {isSignin ? 'Welcome back to your home command center.' : 'Request elevated access to the smart home portal.'}
                </Text>
                <Text style={styles.subheading}>
                  {isSignin
                    ? 'Sign in to monitor devices, security signals, and environmental controls.'
                    : 'Complete the registration form with your invitation code to activate the admin onboarding flow.'}
                </Text>
              </View>

              {isSignin && signinError ? (
                <View
                  style={[
                    styles.authAlert,
                    isAccountLocked ? styles.authAlertLocked : styles.authAlertError,
                  ]}
                >
                  <Text style={styles.authAlertTitle}>
                    {isAccountLocked ? 'Security Lock Activated' : 'Authentication Failed'}
                  </Text>
                  <Text style={styles.authAlertText}>{signinError}</Text>
                </View>
              ) : null}

              {isSignin ? (
                <>
                  <Field
                    styles={styles}
                    theme={theme}
                    label="Username"
                    icon="USER"
                    value={signinUsername}
                    onChangeText={handleSigninUsernameChange}
                    placeholder="Enter your username"
                    editable={!loading}
                    autoCapitalize="none"
                  />
                  <Field
                    styles={styles}
                    theme={theme}
                    label="Password"
                    icon="LOCK"
                    value={signinPassword}
                    onChangeText={handleSigninPasswordChange}
                    placeholder="Enter your password"
                    secureTextEntry={!showSigninPassword}
                    showToggle
                    toggleText={showSigninPassword ? 'HIDE' : 'SHOW'}
                    onTogglePress={() => setShowSigninPassword((current) => !current)}
                    editable={!loading}
                    autoCapitalize="none"
                  />
                </>
              ) : (
                <>
                  <Field
                    styles={styles}
                    theme={theme}
                    label="Full Name"
                    icon="ID"
                    value={requestName}
                    onChangeText={setRequestName}
                    placeholder="Your full name"
                    editable={!loading}
                    autoCapitalize="words"
                  />
                  <Field
                    styles={styles}
                    theme={theme}
                    label="Email Address"
                    icon="MAIL"
                    value={requestEmail}
                    onChangeText={setRequestEmail}
                    placeholder="name@tuyenhome.com"
                    editable={!loading}
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                  <Field
                    styles={styles}
                    theme={theme}
                    label="Password"
                    icon="LOCK"
                    value={requestPassword}
                    onChangeText={setRequestPassword}
                    placeholder="Create a password"
                    secureTextEntry={!showRequestPassword}
                    showToggle
                    toggleText={showRequestPassword ? 'HIDE' : 'SHOW'}
                    onTogglePress={() => setShowRequestPassword((current) => !current)}
                    editable={!loading}
                    autoCapitalize="none"
                  />
                  <Field
                    styles={styles}
                    theme={theme}
                    label="Admin Invitation Code"
                    icon="KEY"
                    value={requestCode}
                    onChangeText={setRequestCode}
                    placeholder="Enter invitation code"
                    editable={!loading}
                    autoCapitalize="none"
                  />
                </>
              )}

              <TouchableOpacity
                style={[styles.submitButton, loading && styles.submitButtonDisabled]}
                onPress={handleSubmit}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#FFF9F3" />
                ) : (
                  <Text style={styles.submitText}>
                    {isSignin ? 'ENTER PORTAL' : 'REQUEST ACCESS'}
                  </Text>
                )}
              </TouchableOpacity>

              <View style={styles.helperRow}>
                <Text style={styles.helperText}>
                  Demo credentials: <Text style={styles.helperAccent}>admin / admin</Text>
                </Text>
                <Text style={styles.helperText}>
                  Demo invite code: <Text style={styles.helperAccent}>tuyenhome</Text>
                </Text>
              </View>
            </View>

            <Text style={styles.footerNote}>
              Premium authentication styling is now in place with adaptive light and dark mode.
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
