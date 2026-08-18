import React, { useMemo } from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { AppText } from '@/components/ui/text';
import { Colors } from '@/theme/colors';
import { getUserStatusDisplay, UserStatusSource } from '@/utils/user-status';

interface UserStatusLabelProps {
    user?: UserStatusSource | null;
    dark?: boolean;
    style?: ViewStyle;
    numberOfLines?: number;
}

export const UserStatusLabel = ({
    user,
    dark = false,
    style,
    numberOfLines = 1,
}: UserStatusLabelProps) => {
    const status = useMemo(() => getUserStatusDisplay(user), [user]);

    if (!status) {
        return null;
    }

    const textColor = dark ? 'rgba(255,255,255,0.78)' : Colors.textSecondary;

    return (
        <View style={[styles.container, style]}>
            {!!status.icon && (
                <AppText size={12} style={styles.emoji}>{status.icon}</AppText>
            )}
            <AppText
                size={12}
                numberOfLines={numberOfLines}
                style={[styles.text, { color: textColor }]}
            >
                {status.text}
            </AppText>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        flexShrink: 1,
        maxWidth: 140,
    },
    emoji: {
        marginRight: 4,
    },
    text: {
        flexShrink: 1,
    },
});
