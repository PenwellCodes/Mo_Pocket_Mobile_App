// api/axiosInstance.js
import axios from 'axios';
import { getToken } from '../utils/secureStore'; // adjust path if needed
import { API_URL } from '../api/config';

const axiosInstance = axios.create({
  baseURL: API_URL,
});

axiosInstance.interceptors.request.use(
  async (config) => {
    const token = await getToken('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default axiosInstance;
