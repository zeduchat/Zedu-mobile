// src/components/AppText.tsx
import React from 'react';
import { Text, TextProps, StyleSheet } from 'react-native';
import { fonts } from '../../theme/typography';
import { s } from 'react-native-size-matters';

interface AppTextProps extends TextProps {
  variant?: 'bold' | 'semiBold' | 'medium' | 'regular';
  size?: number;
  children: React.ReactNode;
}

export const AppText: React.FC<AppTextProps> = ({
  style,
  variant = 'regular',
  size = 15,
  ...props
}) => {
  return (
    <Text
      allowFontScaling={false}
      style={[styles.base, styles[variant], { fontSize: s(size) }, style]}
      {...props}
    />
  );
};

const styles = StyleSheet.create({
  base: {
    color: '#000',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  bold: { fontFamily: fonts.bold },
  semiBold: { fontFamily: fonts.semiBold },
  medium: { fontFamily: fonts.medium },
  regular: { fontFamily: fonts.regular },
});
