import React, { forwardRef } from 'react';
import {
  StyleSheet,
  View,
  Image,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { AppText } from '@/components/ui/text';
import { Colors } from '@/theme/colors';
import { normalize } from '@/utils/normalize';
import { AppBottomSheetRef } from '@/components/ui/bottom-sheet';
import { useNavigation } from '@react-navigation/native';

const { width } = Dimensions.get('window');

const ChannelOnboardingSheet = forwardRef<AppBottomSheetRef, {}>(
  (props, ref) => {
    const navigation = useNavigation();

    const createChannel = () => {
      navigation.navigate('ChannelStack', { screen: 'CreateChannel' });

      setTimeout(() => {
        if (ref && 'current' in ref) {
          ref.current?.close();
        }
      }, 1000);
    };

    //

    return (
      <View style={styles.container}>
        {/* Illustration Area */}
        <View style={styles.illustrationContainer}>
          <View style={styles.imageCard}>
            <Image
              source={require('@/assets/images/channel-intro.png')}
              style={styles.illustration}
              resizeMode="contain"
            />
          </View>
        </View>

        {/* Text Content */}
        <View style={styles.content}>
          <AppText variant="bold" style={styles.title}>
            What is a Channel?
          </AppText>

          <AppText style={styles.description}>
            Channels are a one-to-many space where you can share updates with an
            unlimited audience.
          </AppText>
        </View>

        {/* Action Button */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.button}
            activeOpacity={0.8}
            onPress={createChannel}
          >
            <AppText variant="bold" style={{ color: '#FFFFFF', fontSize: 16 }}>
              Get Started
            </AppText>
          </TouchableOpacity>
        </View>
      </View>
    );
  },
);

const styles = StyleSheet.create({
  container: {
    // flex: 1,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: normalize(24),
    // elevation: 6,
    // zIndex:100,
  },
  illustrationContainer: {
    alignItems: 'center',
    marginTop: normalize(20),
  },
  imageCard: {
    width: width * 0.55,
    height: width * 0.55,
    backgroundColor: '#F2F2F2',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E8E8E8',
  },
  illustration: {
    width: '80%',
    height: '80%',
  },
  pagination: {
    flexDirection: 'row',
    marginTop: normalize(25),
    alignItems: 'center',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#E0E0E0',
    marginHorizontal: 4,
  },
  activeDot: {
    backgroundColor: Colors.primary,
    width: 8,
    height: 8,
  },
  content: {
    marginTop: normalize(30),
    alignItems: 'center',
  },
  title: {
    fontSize: 26,
    color: '#000000',
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    marginTop: normalize(15),
    lineHeight: 24,
    paddingHorizontal: 10,
  },
  footer: {
    marginTop: 'auto',
    marginBottom: normalize(30),
  },
  button: {
    backgroundColor: Colors.primary,
    height: normalize(52),
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
    marginTop: 20,
  },
});

export default ChannelOnboardingSheet;
