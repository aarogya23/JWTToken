import axios from 'axios';
import Constants from 'expo-constants';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const API_URL =
  process.env.EXPO_PUBLIC_API_URL ||
  Constants.expoConfig?.extra?.apiUrl ||
  Constants.manifest2?.extra?.expoClient?.extra?.apiUrl ||
  'http://localhost:8080';

export const googleAuthUrl = `${API_URL}/oauth2/authorization/google`;
export const TOKEN_KEY = 'jwtToken';

export const api = axios.create({
  baseURL: API_URL
});

api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem(TOKEN_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const getStoredToken = () => AsyncStorage.getItem(TOKEN_KEY);
export const setStoredToken = (token) => AsyncStorage.setItem(TOKEN_KEY, token);
export const clearStoredToken = () => AsyncStorage.removeItem(TOKEN_KEY);

export const requestMediaAsync = async (mediaTypes = ['images']) => {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) {
    throw new Error('Media library permission is required.');
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes,
    allowsEditing: true,
    quality: 0.9
  });

  if (result.canceled || !result.assets?.length) {
    return null;
  }

  return result.assets[0];
};

export const uploadFileAsset = async (asset) => {
  if (!asset?.uri) return null;

  const formData = new FormData();
  formData.append('file', {
    uri: asset.uri,
    name: asset.fileName || `upload-${Date.now()}.jpg`,
    type: asset.mimeType || 'image/jpeg'
  });

  const response = await api.post('/api/chat/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });

  return response.data;
};
