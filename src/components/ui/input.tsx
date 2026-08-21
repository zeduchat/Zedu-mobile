import React, { useState } from 'react';
import {
  View,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { AppText } from './text';
import { Colors } from '@/theme/colors';
import { normalize } from '@/utils/normalize';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

interface AppInputProps {
  label?: string;
  placeholder: string;
  value: string;
  onChangeText: (text: string) => void;
  secureTextEntry?: boolean;
  error?: string;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  keyboardType?: 'default' | 'email-address' | 'numeric' | 'phone-pad';
  disabled?: boolean;
  multiline?: boolean;
  style?: ViewStyle;
  inputStyle?: TextStyle;
  onFocus?: any;
}

export const AppInput: React.FC<AppInputProps> = ({
  label,
  placeholder,
  value,
  onChangeText,
  secureTextEntry,
  error,
  autoCapitalize = 'none',
  keyboardType = 'default',
  disabled = false,
  multiline,
  style,
  inputStyle,
  onFocus,
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(!secureTextEntry);

  return (
    <View style={[styles.container, style]}>
      {label && (
        <AppText variant="medium" size={14} style={styles.label}>
          {label}
        </AppText>
      )}
      <View
        style={[
          styles.inputWrapper,
          isFocused && styles.inputWrapperFocused,
          error ? styles.inputWrapperError : null,
          disabled && styles.inputWrapperDisabled,
          multiline && {
            height: 'auto',
            minHeight: normalize(100),
            alignItems: 'flex-start',
            paddingTop: normalize(10),
          },
        ]}
      >
        <TextInput
          style={[styles.input, inputStyle]}
          placeholder={placeholder}
          placeholderTextColor={Colors.textSecondary}
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={secureTextEntry && !isPasswordVisible}
          autoCapitalize={autoCapitalize}
          keyboardType={keyboardType}
          onFocus={() => {
            setIsFocused(true);
            onFocus && onFocus();
          }}
          onBlur={() => setIsFocused(false)}
          editable={!disabled}
          multiline={multiline}
          textAlignVertical={multiline ? 'top' : 'center'}
        />
        {secureTextEntry && (
          <TouchableOpacity
            onPress={() => setIsPasswordVisible(!isPasswordVisible)}
            disabled={disabled}
          >
            <Icon
              name={isPasswordVisible ? 'eye-off' : 'eye'}
              size={22}
              color={Colors.textSecondary}
            />
          </TouchableOpacity>
        )}
      </View>
      {error && (
        <AppText size={12} style={styles.errorText}>
          {error}
        </AppText>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { marginBottom: normalize(20), width: '100%' },
  label: { marginBottom: normalize(8), color: Colors.textMuted },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    height: normalize(52),
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: normalize(8),
    paddingHorizontal: normalize(15),
    backgroundColor: Colors.white,
  },
  inputWrapperFocused: {
    borderColor: Colors.primary,
  },
  inputWrapperError: {
    borderColor: 'red',
  },
  inputWrapperDisabled: {
    backgroundColor: '#F5F5F5',
    borderColor: Colors.border,
  },
  errorText: {
    color: 'red',
    marginTop: normalize(4),
    fontSize: normalize(12),
  },
  input: {
    flex: 1,
    fontSize: normalize(16),
    color: Colors.black,
    height: '100%',
  },
});
