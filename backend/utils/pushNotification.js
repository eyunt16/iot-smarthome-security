const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

/**
 * Send push notifications via Expo
 * @param {string[]} tokens - Array of Expo push tokens
 * @param {string} title - Notification title
 * @param {string} message - Notification message
 * @param {object} data - Optional additional data to send with notification
 */
async function sendPushNotification(tokens, title, message, data = {}) {
  if (!tokens || tokens.length === 0) {
    console.log('[Push Notification] No tokens provided, skipping send');
    return;
  }

  // Filter out invalid tokens
  const validTokens = tokens.filter(token => 
    token && typeof token === 'string' && token.trim().length > 0
  );

  if (validTokens.length === 0) {
    console.log('[Push Notification] No valid tokens after filtering');
    return;
  }

  try {
    const payload = {
      to: validTokens,
      sound: 'default',
      title,
      body: message,
      data,
      badge: 1,
      priority: 'high',
    };

    const response = await fetch(EXPO_PUSH_URL, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Accept-Encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[Push Notification] Expo API error (${response.status}): ${errorText}`);
      return;
    }

    const result = await response.json();
    console.log(`[Push Notification] Successfully sent to ${validTokens.length} device(s):`, result);
    return result;
  } catch (error) {
    console.error('[Push Notification] Failed to send notification:', error);
  }
}

module.exports = {
  sendPushNotification,
};
