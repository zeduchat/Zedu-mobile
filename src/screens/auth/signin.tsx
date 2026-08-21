import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  View,
  Image,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { normalize } from '@/utils/normalize';
import { Colors } from '@/theme/colors';
import { AppText } from '@/components/ui/text';
import { AppInput } from '@/components/ui/input';
import { AppButton } from '@/components/ui/button';
import { useNavigation } from '@react-navigation/native';
import { configureGoogleSignIn, signInWithGoogle } from '@/lib/google-auth';
import { signInWithApple } from '@/lib/apple-auth';
import { PostRequest } from '@/utils/requests';
import { useDataContext } from '@/store/useDataContext';
import { ACTIONS } from '@/store/types';
import Container from '@/components/layout/container';
import { storeMultipleData } from '@/utils/helper';

const SigninScreen: React.FC = () => {
  const { dispatch } = useDataContext();
  const navigation = useNavigation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [googleLoading, setGoogleLoading] = useState(false);
  const [buttonLoading, setButtonLoading] = useState(false);
  const [appleLoading, setAppleLoading] = useState(false);

  const handleAppleLogin = async () => {
    setAppleLoading(true);
    try {
      const appleData = await signInWithApple();
      const token = appleData?.identityToken;

      if (token) {
        const { data, error } = await PostRequest('/auth/apple', {
          id_token: token,
        });

        if (error) {
          setAppleLoading(false);
          return;
        }
        await storeMultipleData([
          ['user', data.data.user],
          ['token', data.data.access_token],
          ['current_org', data.data.user.current_org],
          ['organisation', data.data.user.organisation],
        ]);
        dispatch({ type: ACTIONS.USER, payload: data.data.user });
        dispatch({ type: ACTIONS.TOKEN, payload: data.data.access_token });
        dispatch({ type: ACTIONS.ORG_ID, payload: data.data.user.current_org });
        dispatch({
          type: ACTIONS.ORG_DATA,
          payload: data.data.user.organisation,
        });
      }
    } catch (_e) {
      // Already logged in signInWithApple
    }
    setAppleLoading(false);
  };

  useEffect(() => {
    configureGoogleSignIn();
  }, []);

  const handleGoogleLogin = async () => {
    setGoogleLoading(true);

    const googleData = await signInWithGoogle();
    const token = googleData?.idToken;

    if (token) {
      // No try/catch needed!
      const { data, error } = await PostRequest('/auth/google', {
        grant_code: token,
      });

      if (error) {
        setGoogleLoading(false);
        return;
      }

      await storeMultipleData([
        ['user', data.data.user],
        ['token', data.data.access_token],
        ['current_org', data.data.user.current_org],
        ['organisation', data.data.user.organisation],
      ]);

      dispatch({ type: ACTIONS.USER, payload: data.data.user });
      dispatch({ type: ACTIONS.TOKEN, payload: data.data.access_token });
      dispatch({ type: ACTIONS.ORG_ID, payload: data.data.user.current_org });
      dispatch({
        type: ACTIONS.ORG_DATA,
        payload: data.data.user.organisation,
      });

      setGoogleLoading(false);
    }

    setGoogleLoading(false);
  };

  const handleLogin = async () => {
    setButtonLoading(true);

    const payload = {
      email,
      password,
    };

    const { data, error } = await PostRequest('/auth/login', payload);
    if (error) {
      dispatch({ type: ACTIONS.ERROR, payload: error });
      setButtonLoading(false);
      return;
    }

    await storeMultipleData([
      ['user', data.data.user],
      ['token', data.data.access_token],
      ['current_org', data.data.user.current_org],
      ['organisation', data.data.user.organisation],
    ]);

    dispatch({ type: ACTIONS.USER, payload: data.data.user });
    dispatch({ type: ACTIONS.TOKEN, payload: data.data.access_token });
    dispatch({ type: ACTIONS.ORG_ID, payload: data.data.user.current_org });
    dispatch({ type: ACTIONS.ORG_DATA, payload: data.data.user.organisation });

    setButtonLoading(false);
  };

  //

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
        {/* Logo Section */}
        <View style={styles.header}>
          <Image
            source={require('@/assets/splash-logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>

        <AppText variant="bold" size={23} style={styles.title}>
          Login to Zedu
        </AppText>

        {/* Social Login Buttons */}

        <TouchableOpacity
          style={styles.socialBtn}
          activeOpacity={0.8}
          onPress={handleGoogleLogin}
          disabled={googleLoading}
        >
          <Image
            source={require('@/assets/google-icon.png')}
            style={styles.socialIcon}
          />
          <AppText variant="medium" size={16}>
            Sign in with Google
          </AppText>
          {googleLoading && <ActivityIndicator />}
        </TouchableOpacity>
        {Platform.OS === 'ios' && (
          <TouchableOpacity
            style={styles.socialBtn}
            activeOpacity={0.8}
            onPress={handleAppleLogin}
            disabled={appleLoading}
          >
            <Image
              source={require('@/assets/icons/apple.png')}
              style={styles.socialIcon}
            />
            <AppText variant="medium" size={16}>
              Sign in with Apple
            </AppText>
            {appleLoading && <ActivityIndicator />}
          </TouchableOpacity>
        )}

        {/* Divider */}
        <View style={styles.dividerContainer}>
          <View style={styles.line} />
          <AppText size={14} style={styles.orText}>
            OR
          </AppText>
          <View style={styles.line} />
        </View>

        {/* Input Fields */}
        <AppInput
          label="Email Address"
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
        />

        <AppInput
          label="Password"
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        {/* Forgot Password */}
        <TouchableOpacity
          style={styles.forgotPasswordContainer}
          onPress={() => navigation.navigate('ForgotPasswordEmail')}
        >
          <AppText style={styles.forgotPasswordText}>Forgot Password?</AppText>
        </TouchableOpacity>

        <AppButton
          title="Login"
          onPress={handleLogin}
          style={styles.submitBtn}
          loading={buttonLoading}
          disabled={!email || !password || googleLoading}
        />

        {/* Footer Link */}
        <View style={styles.footer}>
          <AppText style={styles.footerText}>Don't have an account? </AppText>
          <TouchableOpacity onPress={() => navigation.navigate('Signup')}>
            <AppText variant="medium" style={styles.signupLink}>
              Sign Up
            </AppText>
          </TouchableOpacity>
        </View>
      </KeyboardAwareScrollView>
    </Container>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  scrollContent: {
    paddingHorizontal: normalize(25),
    paddingBottom: normalize(40),
    flexGrow: 1,
  },
  header: {
    alignItems: 'center',
    marginTop: normalize(20),
    flexDirection: 'row',
    justifyContent: 'center',
  },
  logo: {
    width: normalize(100),
    height: normalize(100),
    marginRight: normalize(10),
  },
  brandText: {
    color: Colors.black,
  },
  title: {
    textAlign: 'center',
    marginTop: normalize(40),
    marginBottom: normalize(30),
    color: Colors.black,
  },
  socialBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: normalize(52),
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: normalize(10),
    marginBottom: normalize(16),
  },
  socialIcon: {
    width: 22,
    height: 22,
    marginRight: 12,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: normalize(25),
  },
  line: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.border,
  },
  orText: {
    marginHorizontal: 15,
    color: Colors.textSecondary,
  },
  forgotPasswordContainer: {
    alignSelf: 'flex-end',
    marginTop: normalize(-5), // Slight offset for alignment
    marginBottom: normalize(25),
  },
  forgotPasswordText: {
    color: Colors.primary,
    fontSize: normalize(14),
  },
  submitBtn: {
    marginTop: normalize(10),
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: normalize(30),
  },
  footerText: {
    color: Colors.textMuted,
  },
  signupLink: {
    color: Colors.primary,
  },
});

export default SigninScreen;
