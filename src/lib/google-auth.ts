import { GoogleSignin } from '@react-native-google-signin/google-signin';

export const configureGoogleSignIn = () => {
  GoogleSignin.configure({
    webClientId:
      '764182056638-bi8bet0rdoabaeq24bqsdnb5iukn7ko4.apps.googleusercontent.com',
    offlineAccess: true,
    forceCodeForRefreshToken: true,
  });
};

export const signInWithGoogle = async () => {
  try {
    await GoogleSignin.hasPlayServices();
    await GoogleSignin.signOut();

    const userInfo = await GoogleSignin.signIn();

    return userInfo.data;
  } catch (error) {
    console.error('Google Sign-In Error:', error);
    throw error;
  }
};
