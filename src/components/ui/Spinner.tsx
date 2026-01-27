import { colors } from '@/src/constants/theme';
import React from 'react';
import { ActivityIndicator, StyleSheet, View, ViewStyle } from 'react-native';

type SpinnerSize = 'sm' | 'md' | 'lg';

interface SpinnerProps {
  size?: SpinnerSize;
  color?: string;
  style?: ViewStyle;
}

export const Spinner: React.FC<SpinnerProps> = ({
  size = 'md',
  color = colors.primary[600],
  style,
}) => {
  const spinnerSize = sizeMap[size];
  
  return (
    <View style={[styles.container, style]}>
      <ActivityIndicator size={spinnerSize} color={color} />
    </View>
  );
};

const sizeMap: Record<SpinnerSize, 'small' | 'large'> = {
  sm: 'small',
  md: 'small',
  lg: 'large',
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default Spinner;
