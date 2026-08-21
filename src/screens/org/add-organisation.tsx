import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Platform,
  KeyboardAvoidingView,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { AppText } from '@/components/ui/text';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { Colors } from '@/theme/colors';
import { useNavigation } from '@react-navigation/native';
import CountryPicker, {
  Country,
  CountryCode,
} from 'react-native-country-picker-modal';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PostRequest, PutRequest } from '@/utils/requests';
import { storeMultipleData } from '@/utils/helper';
import { ACTIONS } from '@/store/types';
import { useDataContext } from '@/store/useDataContext';

const AddOrganisationScreen = () => {
  const navigation = useNavigation();
  const [orgName, setOrgName] = useState('');
  const [orgType, setOrgType] = useState('');
  const [country, setCountry] = useState<Country | null>(null);
  const [countryCode, setCountryCode] = useState<CountryCode>('US');
  const [showCountryPicker, setShowCountryPicker] = useState(false);
  const [loading, setLoading] = useState(false);
  const { dispatch } = useDataContext();

  const resetForm = () => {
    setOrgName('');
    setOrgType('');
    setCountry(null);
    setCountryCode('US');
  };

  const handleSubmit = async () => {
    setLoading(true);

    const payload = {
      name: orgName,
      type: orgType,
      country: country
        ? typeof country.name === 'string'
          ? country.name
          : country.name.common
        : null,
      email: 'email@email.com',
    };

    const { data: res, error } = await PostRequest('/organisations', payload);

    if (!error) {
      const switchPayload = {
        current_org: res.data.id,
      };

      const { data, error } = await PutRequest(
        '/users/switch-org',
        switchPayload,
      );

      if (!error) {
        await storeMultipleData([
          ['token', data.data.access_token],
          ['current_org', data.data.organisation.id],
          ['organisation', data.data.organisation],
        ]);

        dispatch({ type: ACTIONS.TOKEN, payload: data.data.access_token });
        dispatch({ type: ACTIONS.ORG_ID, payload: data.data.organisation.id });
        dispatch({ type: ACTIONS.ORG_DATA, payload: data.data.organisation });
      }

      resetForm();
      navigation.goBack();
      setLoading(false);
    } else {
      dispatch({ type: ACTIONS.ERROR, payload: error });
      setLoading(false);
    }
  };

  const onSelect = (selectedCountry: Country) => {
    setCountryCode(selectedCountry.cca2);
    setCountry(selectedCountry);
    setShowCountryPicker(false);
  };

  //

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.white }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          keyboardShouldPersistTaps="handled"
        >
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color={Colors.primary} />
          </TouchableOpacity>

          <AppText variant="bold" size={28} style={styles.title}>
            Create Your Organization
          </AppText>
          <AppText size={16} style={styles.subtitle}>
            Input the details of your organization below
          </AppText>

          <View style={styles.formGroup}>
            <AppText size={15} style={styles.label}>
              Organization Name
            </AppText>
            <TextInput
              style={styles.input}
              placeholder="Enter your organization Name"
              placeholderTextColor={Colors.textMuted}
              value={orgName}
              onChangeText={setOrgName}
            />
          </View>

          <View style={styles.formGroup}>
            <AppText size={15} style={styles.label}>
              Organization Type
            </AppText>
            <TextInput
              style={styles.input}
              placeholder="What does your organization do"
              placeholderTextColor={Colors.textMuted}
              value={orgType}
              onChangeText={setOrgType}
            />
          </View>

          <View style={styles.formGroup}>
            <AppText size={15} style={styles.label}>
              Country
            </AppText>
            <TouchableOpacity
              style={styles.countrySelector}
              onPress={() => setShowCountryPicker(true)}
              activeOpacity={0.8}
            >
              <AppText
                size={15}
                style={{ color: country ? Colors.black : Colors.textMuted }}
              >
                {country
                  ? typeof country.name === 'string'
                    ? country.name
                    : country.name.common
                  : 'Select an option...'}
              </AppText>
              <Ionicons
                name="chevron-down"
                size={20}
                color={Colors.textMuted}
              />
            </TouchableOpacity>

            <CountryPicker
              countryCode={countryCode}
              visible={showCountryPicker}
              withFilter
              withFlag
              withCountryNameButton={false}
              withAlphaFilter
              onSelect={onSelect}
              onClose={() => setShowCountryPicker(false)}
              modalProps={{
                visible: showCountryPicker,
              }}
            />
          </View>

          <TouchableOpacity
            style={[
              styles.submitBtn,
              (loading || !orgName || !orgType || !country) && { opacity: 0.5 },
            ]}
            onPress={handleSubmit}
            activeOpacity={0.8}
            disabled={loading || !orgName || !orgType || !country}
          >
            {loading && <ActivityIndicator color={Colors.white} />}

            <AppText variant="bold" size={18} style={{ color: Colors.white }}>
              Submit
            </AppText>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  scrollContainer: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  backBtn: {
    alignSelf: 'flex-start',
    marginTop: 10,
    marginBottom: 10,
    backgroundColor: '#F4EDF4',
    borderRadius: 20,
    padding: 8,
  },
  title: {
    textAlign: 'center',
    marginTop: 10,
    marginBottom: 8,
    color: Colors.secondary,
  },
  subtitle: {
    textAlign: 'center',
    color: Colors.textMuted,
    marginBottom: 32,
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    marginBottom: 8,
  },
  input: {
    height: 52,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    paddingHorizontal: 16,
    fontSize: 16,
    backgroundColor: '#F9F9FB',
    color: Colors.black,
  },
  countrySelector: {
    height: 52,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    paddingHorizontal: 16,
    backgroundColor: '#F9F9FB',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  submitBtn: {
    marginTop: 20,
    backgroundColor: Colors.primary,
    borderRadius: 8,
    height: 52,
    flexDirection: 'row',
    gap: 3,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
});

export default AddOrganisationScreen;
