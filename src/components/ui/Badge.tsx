import { borderRadius, colors, fontSize, spacing } from '@/src/constants/theme';
import React from 'react';
import { StyleSheet, Text, TextStyle, View, ViewStyle } from 'react-native';

type BadgeVariant = 'default' | 'primary' | 'success' | 'warning' | 'error';

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  style?: ViewStyle;
  textStyle?: TextStyle;
  backgroundColor?: string;
  textColor?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'default',
  style,
  textStyle,
  backgroundColor,
  textColor,
}) => {
  const badgeStyle: ViewStyle = {
    backgroundColor: backgroundColor || variantColors[variant].bg,
  };

  const labelStyle: TextStyle = {
    color: textColor || variantColors[variant].text,
  };

  return (
    <View style={[styles.badge, badgeStyle, style]}>
      <Text style={[styles.text, labelStyle, textStyle]}>{children}</Text>
    </View>
  );
};

const variantColors: Record<BadgeVariant, { bg: string; text: string }> = {
  default: { bg: colors.gray[100], text: colors.gray[700] },
  primary: { bg: colors.primary[100], text: colors.primary[700] },
  success: { bg: colors.success[100], text: colors.success[700] },
  warning: { bg: colors.warning[100], text: colors.warning[700] },
  error: { bg: colors.error[100], text: colors.error[700] },
};

const styles = StyleSheet.create({
  badge: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.full,
    alignSelf: 'flex-start',
  },
  text: {
    fontSize: fontSize.xs,
    fontWeight: '600',
  },
});

export default Badge;
