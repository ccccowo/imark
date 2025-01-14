import axios from 'axios';

const axiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || '',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  }
});

// 添加请求拦截器
axiosInstance.interceptors.request.use(
  (config) => {
    console.log('Axios Request:', config.method?.toUpperCase(), config.url);
    return config;
  },
  (error) => {
    console.error('Axios Request Error:', error);
    return Promise.reject(error);
  }
);

export default axiosInstance; 