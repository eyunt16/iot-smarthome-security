import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../theme/colors';

export default function DashboardCard({ title, value, unit, icon, colorHint }) {
  const isNoData = value === null || value === '--';

  return (
    <View style={[styles.card, { backgroundColor: colors.surface }]}>
      <View style={[styles.iconContainer, { backgroundColor: colorHint }]}>
        <Text style={styles.iconPlaceholder}>{icon}</Text>
      </View>
      <Text style={styles.title}>{title}</Text>
      <View style={styles.valueRow}>
        {isNoData ? (
          <Text style={styles.noData}>--</Text>
        ) : (
          <>
            <Text style={styles.value}>{value}</Text>
            <Text style={styles.unit}>{unit}</Text>
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    minWidth: 140,
    margin: 8,
    padding: 16,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: colors.border,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  iconPlaceholder: {
    fontSize: 20, // We use emoji placeholders if vector icons aren't installed yet
  },
  title: {
    fontSize: 14,
    color: colors.textMuted,
    fontWeight: '500',
    marginBottom: 4,
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  value: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.text,
    marginRight: 4,
  },
  unit: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textMuted,
  },
  noData: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#cbd5e1',
  }
});
