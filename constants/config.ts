import Constants from 'expo-constants';

const getApiBaseUrl = () => {
  const env = process.env.NODE_ENV === 'production' ? 'production' : 'development';
  return Constants.expoConfig?.extra?.env?.[env]?.apiBaseUrl || '';
};

export const API_BASE_URL = getApiBaseUrl();
