import React from 'react'
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
} from 'react-native'
import { useTheme } from '../context/ThemeContext'

/**
 * Yeniden kullanılabilir buton — renkleri aktif temadan gelir.
 * variant: 'primary' | 'secondary' | 'outline' | 'ghost'
 */
export default function StyledButton({
  onPress,
  title,
  loading  = false,
  disabled = false,
  variant  = 'primary',
  style,
  textStyle,
}) {
  const { theme } = useTheme()

  // Tema'ya duyarlı renkler (inline — StyleSheet ile static olunca tema değişimi yansımaz)
  const variantBg = {
    primary:   theme.primary,
    secondary: theme.secondary,
    outline:   'transparent',
    ghost:     theme.soft50,
  }
  const variantBorder = {
    primary:   theme.primary,
    secondary: theme.secondary,
    outline:   theme.primary,
    ghost:     'transparent',
  }
  const variantTextColor = {
    primary:   '#fff',
    secondary: '#fff',
    outline:   theme.primary,
    ghost:     theme.primary,
  }
  const spinnerColor = (variant === 'outline' || variant === 'ghost')
    ? theme.primary
    : '#fff'

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
      style={[
        styles.base,
        {
          backgroundColor: variantBg[variant] ?? theme.primary,
          borderColor:     variantBorder[variant] ?? theme.primary,
          borderWidth:     variant === 'outline' ? 2 : 0,
        },
        (disabled || loading) && styles.disabled,
        style,
      ]}
    >
      {loading
        ? <ActivityIndicator color={spinnerColor} size="small" />
        : (
          <Text style={[
            styles.text,
            { color: variantTextColor[variant] ?? '#fff' },
            textStyle,
          ]}>
            {title}
          </Text>
        )}
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  base: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 50,
  },
  disabled: { opacity: 0.6 },
  text: { fontSize: 15, fontWeight: '700' },
})
