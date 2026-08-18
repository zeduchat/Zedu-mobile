import React, { useEffect } from 'react';
import {
    Platform,
    StatusBar,
    StyleSheet,
    View,
} from 'react-native';
import { s } from 'react-native-size-matters';
import { Colors } from '@/theme/colors';
import { AppText } from '../ui/text';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useDataContext } from '@/store/useDataContext';
import { isAndroid15Plus, statusBarTopPadding } from '@/utils/status-bar-inset';
import { ACTIONS } from '@/store/types';
// 1. Import Reanimated
import Animated, { FadeInUp, FadeOutUp } from 'react-native-reanimated';

interface Props {
    children: any;
    dark?: boolean;
    color?: string;
}

const Container = (props: Props) => {
    const { state, dispatch } = useDataContext();
    const insets = useSafeAreaInsets();
    const topPadding = statusBarTopPadding(insets.top);
    const toastTopPadding = Platform.OS === 'ios'
        ? 60
        : (isAndroid15Plus ? insets.top + 15 : 30);

    useEffect(() => {
        let timer: any;
        if (state?.success || state?.error) {
            timer = setTimeout(() => {
                dispatch({
                    type: state.success ? ACTIONS.SUCCESS : ACTIONS.ERROR,
                    payload: null
                });
            }, 3000);
        }
        return () => clearTimeout(timer);
    }, [state.error, state.success, dispatch]);

    // Always render StatusBar at the top, not conditionally
    return (
        <View
            style={{
                backgroundColor: props?.dark ? Colors.secondary : props?.color ? props.color : Colors.white,
                flex: 1,
                paddingTop: topPadding,
            }}>
            <StatusBar
                translucent={false}
                barStyle={
                    state?.error || state?.success || props?.dark
                        ? 'light-content'
                        : 'dark-content'
                }
                backgroundColor={
                    state?.error
                        ? 'red'
                        : state?.success
                            ? 'green'
                            : props?.color
                                ? props.color
                                : Colors.white
                }
            />

            {/* Error Message */}
            {state?.error && (
                <Animated.View
                    entering={FadeInUp.duration(400)}
                    exiting={FadeOutUp.duration(400)}
                    style={[styles.error, { paddingTop: toastTopPadding }]}
                >
                    <AppText style={{ color: Colors.white, fontSize: s(12), fontWeight: '600' }}>
                        {state?.error}
                    </AppText>
                </Animated.View>
            )}

            {/* Success Message */}
            {state?.success && (
                <Animated.View
                    entering={FadeInUp.duration(400)}
                    exiting={FadeOutUp.duration(400)}
                    style={[styles.success, { paddingTop: toastTopPadding }]}
                >
                    <AppText style={{ color: Colors.white, fontSize: s(12), fontWeight: '600' }}>
                        {state?.success}
                    </AppText>
                </Animated.View>
            )}

            <View style={{ backgroundColor: Colors.white, flex: 1 }}>
                {props.children}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    error: {
        backgroundColor: 'red',
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 9999,
        paddingBottom: 15,
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
    },
    success: {
        backgroundColor: 'green',
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 9999,
        paddingBottom: 15,
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
    },
});

export default Container;