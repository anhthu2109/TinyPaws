import axios from 'axios';
import { CONFIG } from '../constants/config';

// Create an Axios instance specifically for admin API calls
const adminApi = axios.create({
    baseURL: `${CONFIG.API.BASE_URL}/api/admin`,
    timeout: 15000, // 15 seconds timeout (increased)
    headers: {
        'Content-Type': 'application/json',
    },
    // Add retry configuration
    retry: 3,
    retryDelay: 1000,
});

// Request interceptor to automatically add Authorization header
adminApi.interceptors.request.use(
    (config) => {
        // Get token from localStorage
        const token = localStorage.getItem('token');
        
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        } else {
            console.warn('No token found in localStorage for admin API call');
        }
        
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor to handle common errors
adminApi.interceptors.response.use(
    (response) => {
        return response;
    },
    (error) => {
        // Handle 401 Unauthorized errors
        if (error.response?.status === 401) {
            console.error('Admin API: Unauthorized access - token may be invalid or expired');
            
            // Optionally redirect to login page or clear invalid token
            // localStorage.removeItem('token');
            // window.location.href = '/admin/login';
        }
        
        // Handle 403 Forbidden errors
        if (error.response?.status === 403) {
            console.error('Admin API: Access forbidden - insufficient permissions');
        }
        
        // Handle network errors with retry logic
        if (!error.response) {
            console.error('Admin API: Network error or server unavailable');
            
            // Add retry logic for network errors
            const config = error.config;
            if (!config || !config.retry) {
                return Promise.reject(error);
            }
            
            config.__retryCount = config.__retryCount || 0;
            
            if (config.__retryCount >= config.retry) {
                return Promise.reject(error);
            }
            
            config.__retryCount += 1;
            
            // Create new promise to handle retry
            const backoff = new Promise((resolve) => {
                setTimeout(() => {
                    resolve();
                }, config.retryDelay || 1000);
            });
            
            return backoff.then(() => {
                return adminApi(config);
            });
        }
        
        return Promise.reject(error);
    }
);

export default adminApi;
