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
import { PostRequest } from '@/utils/requests';
import { useDataContext } from '@/store/useDataContext';
import { ACTIONS } from '@/store/types';

const ForgotPasswordEmailScreen: React.FC = () => {
  const navigation = useNavigation();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const { dispatch } = useDataContext();

  const handleSubmit = async () => {
    setLoading(true);

    const { data, error } = await PostRequest('/auth/password-reset', {
      email: email,
    });

    if (!error) {
      dispatch({
        type: ACTIONS.AUTH_FLOW,
        payload: { email: email, code: '' },
      });
      dispatch({ type: ACTIONS.SUCCESS, payload: data.message });
      navigation.navigate('ForgotPasswordCode');
    } else {
      dispatch({ type: ACTIONS.ERROR, payload: error || 'An error occurred' });
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
          <Image
            source={require('@/assets/splash-logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>

        <AppText variant="bold" size={23} style={styles.title}>
          Forgot password
        </AppText>
        <AppText size={18} style={styles.subtitle}>
          Enter the email you used in creating your account, we will send you
          instructions on how to reset your password.
        </AppText>

        <AppInput
          label="Email Address"
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
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
          onPress={() => navigation.goBack()}
          variant="secondary"
        />
      </KeyboardAwareScrollView>
    </Container>
  );
};

const styles = StyleSheet.create({
  scrollContent: {
    paddingHorizontal: normalize(25),
    paddingBottom: normalize(40),
    flexGrow: 1,
  },
  logoContainer: {
    alignItems: 'center',
    marginTop: normalize(40),
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
    color: Colors.primary,
  },
  backBtnText: {
    color: Colors.primary,
  },
});

export default ForgotPasswordEmailScreen;
