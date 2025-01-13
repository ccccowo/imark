import axios from 'axios';

const axiosInstance = axios.create({
  baseURL: '/',
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true
});

// 添加请求拦截器
axiosInstance.interceptors.request.use(async (config) => {
  // 添加 CSRF token
  config.headers['csrf-token'] = 'required';
  return config;
});

export default axiosInstance; 