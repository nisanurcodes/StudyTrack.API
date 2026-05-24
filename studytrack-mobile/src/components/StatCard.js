import React from 'react'
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native'

/**
 * Dashboard istatistik kartı
 * onPress verilirse TouchableOpacity olarak çalışır.
 */
export default function StatCard({ emoji, label, value, bgColor, textColor, onPress }) {
  const Wrapper = onPress ? TouchableOpacity : View
  return (
    <Wrapper
      style={[styles.card, { backgroundColor: bgColor }]}
      onPress={onPress}
      activeOpacity={onPress ? 0.75 : 1}
    >
      <Text style={styles.emoji}>{emoji}</Text>
      <Text style={[styles.value, { color: textColor }]}>{value ?? '~'}</Text>
      <Text style={[styles.label, { color: textColor }]}>{label}</Text>
      {onPress && <Text style={[styles.tapHint, { color: textColor }]}>›</Text>}
    </Wrapper>
  )
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    borderRadius: 20,
    padding: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.45)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    minWidth: 130,
    margin: 6,
  },
  emoji:   { fontSize: 30, marginBottom: 6 },
  value:   { fontSize: 32, fontWeight: '700', marginBottom: 4 },
  label:   { fontSize: 13, fontWeight: '600' },
  tapHint: { fontSize: 18, fontWeight: '700', marginTop: 2, opacity: 0.6 },
})
