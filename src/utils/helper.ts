import AsyncStorage from '@react-native-async-storage/async-storage';
import {PostRequest} from './requests';

//
export const storeToken = async (key: string, value: any) => {
  try {
    const jsonValue = JSON.stringify(value);
    await AsyncStorage.setItem(key, jsonValue);
  } catch (e) {
    // saving error
  }
};

export const retrieveToken = async (key: string) => {
  try {
    const jsonValue = await AsyncStorage.getItem(key);
    return jsonValue != null ? JSON.parse(jsonValue) : null;
  } catch (e) {
    // error reading value
  }
};

export const storeData = async (key: string, value: any) => {
  try {
    const jsonValue = JSON.stringify(value);
    await AsyncStorage.setItem(key, jsonValue);
  } catch (e) {
    // saving error
  }
};

export const retrieveData = async (key: string) => {
  try {
    const jsonValue = await AsyncStorage.getItem(key);
    return jsonValue != null ? JSON.parse(jsonValue) : null;
  } catch (e) {
    // error reading value
  }
};

export const removeData = async (key: string) => {
  try {
    await AsyncStorage.removeItem(key);
  } catch (e) {
    // remove error
  }
};


export const storeMultipleData = async (keyValuePairs: [string, any][]) => {
  try {
    const pairs = keyValuePairs.map(([key, val]) => [key, JSON.stringify(val)]);
    await AsyncStorage.multiSet(pairs as [string, string][]);
  } catch (e) {
    // multi-set error
  }
};


export const retrieveMultipleData = async (keys: string[]) => {
  try {
    const result = await AsyncStorage.multiGet(keys);
    return result.map(([_, val]) => (val ? JSON.parse(val) : null));
  } catch (e) {
    // multi-get error
  }
};

export const clearAllData = async () => {
  try {
    await AsyncStorage.clear();
  } catch (e) {
    console.error("Error clearing local storage:", e);
  }
};