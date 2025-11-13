import axios from 'axios';
import { CONFIG } from '../constants/config';

// Create axios instance for public API calls
export const publicApi = axios.create({
    baseURL: CONFIG.API.BASE_URL,
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor
publicApi.interceptors.request.use(
    (config) => {
        console.log(`📡 Public API Request: ${config.method?.toUpperCase()} ${config.url}`);
        return config;
    },
    (error) => {
        console.error('❌ Public API Request Error:', error);
        return Promise.reject(error);
    }
);

// Response interceptor
publicApi.interceptors.response.use(
    (response) => {
        console.log(`✅ Public API Response: ${response.config.method?.toUpperCase()} ${response.config.url}`, response.data);
        return response;
    },
    (error) => {
        console.error('❌ Public API Response Error:', error.response?.data || error.message);
        return Promise.reject(error);
    }
);

export default publicApi;
