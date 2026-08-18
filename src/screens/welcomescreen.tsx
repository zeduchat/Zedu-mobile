import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Image, TouchableOpacity, StatusBar, Alert, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppText } from '../components/ui/text';
import { AppButton } from '../components/ui/button';
import { normalize } from '../utils/normalize';
import { Colors } from '../theme/colors';
import { useNavigation } from '@react-navigation/native';
import { OneSignal } from 'react-native-onesignal';
import { requestAppPermissions } from '@/lib/permissions';

const WelcomeScreen: React.FC = () => {
    const navigation = useNavigation();
    const [permissionsGranted, setPermissionsGranted] = useState(false);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if(!permissionsGranted){
            handleAcceptPermissions();
        }
    }, [permissionsGranted])

    const handleAcceptPermissions = async () => {
        setLoading(true);
        try {
            // Request camera + audio permissions immediately on welcome screen
            const granted = await requestAppPermissions();
            // Request notification permission
            await OneSignal.Notifications.requestPermission(true);
            if (granted) {
                setPermissionsGranted(true);
            } else {
                setPermissionsGranted(false);
                Alert.alert('Permissions Required', 'Please grant camera and microphone permissions to proceed.');
            }
        } catch (e) {
            setPermissionsGranted(false);
            Alert.alert('Error', 'An error occurred while requesting permissions.');
        } finally {
            setLoading(false);
        }
    };

    const openURL = async (url: string) => {
        const supported = await Linking.canOpenURL(url);
        if (supported) {
            await Linking.openURL(url);
        } else {
            Alert.alert('Error', `Don't know how to open this URL: ${url}`);
        }
    };

    return (
        <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
            <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

            <View style={styles.topSection}>
                <View style={styles.logoContainer}>
                    <Image
                        source={require('../assets/splash-logo.png')}
                        style={styles.logo}
                        resizeMode="contain"
                    />
                </View>
                <AppText variant="regular" style={styles.slogan}>
                    Seamless video calls and meetings for every learning community.
                </AppText>
            </View>

            <View style={styles.middleSection}>
                <AppText variant="bold" style={styles.welcomeTitle}>Welcome to Zedu</AppText>

                <AppText size={13} style={styles.legalText}>
                    By proceeding, you consent to our{"\n"}
                    <AppText
                        size={13}
                        style={styles.linkText}
                        onPress={() => openURL('https://zedu.chat/policy')}
                    >
                        Privacy Policy
                    </AppText>
                    {" "}and our{" "}
                    <AppText
                        size={13}
                        style={styles.linkText}
                        onPress={() => openURL('https://zedu.chat/terms-of-service')}
                    >
                        Terms of Service
                    </AppText>
                </AppText>
            </View>

            <View style={styles.bottomSection}>
                
                <AppButton
                    title="Create Account"
                    onPress={() => navigation.navigate('Signup')}
                    style={{ marginBottom: normalize(14) }}
                />
                <AppButton
                    title="Login"
                    variant="secondary"
                    onPress={() => navigation.navigate('Signin')}
                />
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
        paddingHorizontal: 25
    },
    topSection: {
        flex: 2,
        justifyContent: 'center',
        alignItems: 'center'
    },
    logoContainer: {
        alignItems: 'center',
    },
    logo: {
        width: 100,
        height: 100,
        marginRight: 10
    },
    brandName: {
        fontSize: 42,
        letterSpacing: -1.5
    },
    slogan: {
        fontSize: 17,
        textAlign: 'center',
        lineHeight: 24,
        color: '#333',
        paddingHorizontal:40
    },
    middleSection: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center'
    },
    welcomeTitle: {
        fontSize: 32,
        marginBottom: 12
    },
    legalText: {
        fontSize: 14,
        textAlign: 'center',
        color: '#666',
        lineHeight: 20
    },
    linkText: {
        color: Colors.primary
    },
    bottomSection: {
        flex: 1,
        justifyContent: 'flex-end',
        paddingBottom: 20
    },
    primaryBtn: {
        backgroundColor: Colors.primary,
        height: 56,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 14
    },
    primaryBtnText: {
        color: '#FFF',
        fontSize: 16
    },
    secondaryBtn: {
        height: 56,
        borderRadius: 12,
        borderWidth: 1.5,
        borderColor: Colors.primary,
        justifyContent: 'center',
        alignItems: 'center'
    },
    secondaryBtnText: {
        color: Colors.primary,
        fontSize: 16
    },
});

export default WelcomeScreen;


