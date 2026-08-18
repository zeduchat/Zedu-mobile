import React, { useState } from 'react';
import { View, Image, StyleSheet, Platform } from 'react-native';
import { AppText } from '@/components/ui/text';
import { AppInput } from '@/components/ui/input';
import { AppButton } from '@/components/ui/button';
import { useNavigation } from '@react-navigation/native';
import { normalize } from '@/utils/normalize';
import { Colors } from '@/theme/colors';
import Container from '@/components/layout/container';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { useDataContext } from '@/store/useDataContext';
import { PostRequest } from '@/utils/requests';
import { ACTIONS } from '@/store/types';

const ForgotPasswordResetScreen: React.FC = () => {
    const navigation = useNavigation();
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const { state, dispatch } = useDataContext()
    const { email, code } = state?.authFlow || {};

    const handleSubmit = async () => {
        if (!newPassword || !confirmPassword) {
            dispatch({ type: ACTIONS.ERROR, payload: "Please fill in all password fields" });
            return;
        }

        if (newPassword.length < 8) {
            dispatch({ type: ACTIONS.ERROR, payload: "Password must be at least 8 characters long" });
            return;
        }

        if (newPassword !== confirmPassword) {
            dispatch({ type: ACTIONS.ERROR, payload: "Passwords do not match" });
            return;
        }

        setLoading(true);

        const payload = {
            token: code,
            new_password: newPassword,
        };

        const { data, error } = await PostRequest("/auth/password-reset/verify", payload);

        if (!error) {
            dispatch({ type: ACTIONS.SUCCESS, payload: data?.message || "Password reset successful" });
            navigation.navigate('Signin');
        } else {
            dispatch({ type: ACTIONS.ERROR, payload: error || "An error occurred" });
        }

        setLoading(false);
    };

    return (
        <Container>
            <KeyboardAwareScrollView
                contentContainerStyle={styles.scrollContent}
                enableOnAndroid={true}
                enableAutomaticScroll={true}
                extraScrollHeight={Platform.OS === 'ios' ? 50 : 100}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
            >
                <View style={styles.logoContainer}>
                    <Image source={require('@/assets/splash-logo.png')} style={styles.logo} resizeMode="contain" />
                </View>
                <AppText variant="bold" size={23} style={styles.title}>Reset password</AppText>
                <AppText size={18} style={styles.subtitle}>
                    Choose a new password for your account
                </AppText>
                <AppInput
                    label="New Password"
                    placeholder="Password"
                    value={newPassword}
                    onChangeText={setNewPassword}
                    secureTextEntry={!showNewPassword}
                    style={styles.input}
                />
                <AppInput
                    label="Confirm Password"
                    placeholder="Password"
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    secureTextEntry={!showConfirmPassword}
                    style={styles.input}
                />
                <AppButton
                    title="Submit"
                    onPress={handleSubmit}
                    loading={loading}
                    style={styles.submitBtn}
                />
                <AppButton
                    title="Back to Login"
                    onPress={() => navigation.navigate('Signin')}
                    variant='secondary'
                />
            </KeyboardAwareScrollView>
        </Container>
    );
};

const styles = StyleSheet.create({
    scrollContent: {
        paddingHorizontal: normalize(25),
        paddingBottom: normalize(40),
        flexGrow: 1
    },
    logoContainer: {
        alignItems: 'center',
        marginTop: normalize(40),
        marginBottom: normalize(30),
    },
    logo: {
        width: normalize(100),
        height: normalize(100),
        marginBottom: normalize(10),
    },
    brandText: {
        color: Colors.black,
        fontSize: normalize(32),
        fontFamily: 'Nunito-Bold',
        marginBottom: normalize(10),
    },
    title: {
        textAlign: 'center',
        marginTop: normalize(10),
        marginBottom: normalize(10),
        color: Colors.black,
    },
    subtitle: {
        textAlign: 'center',
        color: Colors.textSecondary,
        marginBottom: normalize(30),
        fontSize: normalize(16),
        paddingHorizontal: normalize(10),
    },
    input: {
        marginBottom: normalize(20),
    },
    submitBtn: {
        marginBottom: normalize(16),
    },
    backBtn: {
        borderColor: Colors.primary,
        borderWidth: 1.5,
        backgroundColor: Colors.white,
    },
    backBtnText: {
        color: Colors.primary,
    },
});

export default ForgotPasswordResetScreen;
