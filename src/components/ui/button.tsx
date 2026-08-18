import React from 'react';
import {
    TouchableOpacity,
    StyleSheet,
    ViewStyle,
    ActivityIndicator
} from 'react-native';
import { AppText } from './text';
import { normalize } from '../../utils/normalize';


interface AppButtonProps {
    title: string;
    onPress: () => void;
    variant?: 'primary' | 'secondary' | 'danger';
    loading?: boolean;
    style?: ViewStyle;
    disabled?: boolean;
}

export const AppButton: React.FC<AppButtonProps> = ({
    title,
    onPress,
    variant = 'primary',
    loading = false,
    style,
    disabled = false
}) => {
    const isPrimary = variant === 'primary';
    const isDanger = variant === 'danger';

    return (
        <TouchableOpacity
            onPress={onPress}
            activeOpacity={0.8}
            disabled={loading || disabled}
            style={[
                styles.button,
                isPrimary ? styles.primaryBtn : isDanger ? styles.dangerBtn : styles.secondaryBtn,
                style,
                disabled && { opacity: 0.6 }
            ]}
        >
            {loading && <ActivityIndicator color={isPrimary ? "#FFF" : "#6C47FF"} />}
           
                <AppText
                    variant="semiBold"
                    size={16}
                    style={isPrimary ? styles.primaryText : isDanger ? styles.dangerText : styles.secondaryText}
                >
                    {title}
                </AppText>
            
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    button: {
        height: normalize(56),
        borderRadius: normalize(12),
        justifyContent: 'center',
        alignItems: 'center',
        width: '100%',
        flexDirection:'row',
        gap:6
    },
    primaryBtn: {
        backgroundColor: '#6C47FF',
    },
    dangerBtn: {
        backgroundColor: 'red',
    },
    secondaryBtn: {
        backgroundColor: 'transparent',
        borderWidth: 1.5,
        borderColor: '#6C47FF',
    },
    primaryText: {
        color: '#FFFFFF',
    },
    dangerText: {
        color: '#FFFFFF',
    },
    secondaryText: {
        color: '#6C47FF',
    },
});