import React, { useState } from 'react'
import {
  View,
  TextInput,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native'
import Colors from '../constants/colors'

/**
 * Yeniden kullanılabilir input bileşeni
 * Web uygulamasının pembe temalı inputlarıyla uyumlu
 */
export default function StyledInput({
  label,
  value,
  onChangeText,
  placeholder,
  secureTextEntry = false,
  keyboardType = 'default',
  autoCapitalize = 'none',
  style,
  error,
  ...props
}) {
  const [showPassword, setShowPassword] = useState(false)
  const isPassword = secureTextEntry

  return (
    <View style={[styles.wrapper, style]}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <View style={[styles.inputWrapper, error && styles.inputError]}>
        <TextInput
          style={styles.input}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={Colors.textLight}
          secureTextEntry={isPassword && !showPassword}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          {...props}
        />
        {isPassword && (
          <TouchableOpacity
            onPress={() => setShowPassword(!showPassword)}
            style={styles.eyeButton}
          >
            <Text style={styles.eyeText}>
              {showPassword ? 'Gizle' : 'Göster'}
            </Text>
          </TouchableOpacity>
        )}
      </View>
      {error ? <Text style={styles.errorText}>💔 {error}</Text> : null}
    </View>
  )
}

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: 12,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textMuted,
    marginBottom: 6,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff0f5',
    borderWidth: 2,
    borderColor: Colors.pink100,
    borderRadius: 16,
    paddingHorizontal: 14,
  },
  inputError: {
    borderColor: Colors.error,
  },
  input: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 14,
    color: Colors.text,
  },
  eyeButton: {
    paddingLeft: 8,
  },
  eyeText: {
    color: Colors.primaryDark,
    fontWeight: '700',
    fontSize: 13,
  },
  errorText: {
    color: Colors.error,
    fontSize: 12,
    marginTop: 4,
    paddingLeft: 4,
  },
})
