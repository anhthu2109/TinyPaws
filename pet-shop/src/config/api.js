import { CONFIG } from '../constants/config';

// API Configuration
const API_CONFIG = {
    BASE_URL: CONFIG.API.BASE_URL,
    ENDPOINTS: CONFIG.API.ENDPOINTS
};

// API Helper functions
export const apiCall = async (endpoint, options = {}) => {
    const url = `${API_CONFIG.BASE_URL}${endpoint}`;
    
    try {
        const response = await fetch(url, {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            ...options
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('API Call Error:', error);
        throw error;
    }
};

// Product API functions
export const productAPI = {
    // Get products with filters
    getProducts: (params = {}) => {
        const queryString = new URLSearchParams(params).toString();
        const endpoint = queryString ? 
            `${API_CONFIG.ENDPOINTS.PRODUCTS}?${queryString}` : 
            API_CONFIG.ENDPOINTS.PRODUCTS;
        return apiCall(endpoint);
    },
    
    // Get product by ID
    getProductById: (id) => {
        return apiCall(`${API_CONFIG.ENDPOINTS.PRODUCT_DETAIL}/${id}`);
    },
    
    // Get featured products
    getFeatured: (limit = 8) => {
        return apiCall(`${API_CONFIG.ENDPOINTS.FEATURED}?limit=${limit}`);
    },
    
    // Get bestsellers
    getBestsellers: (limit = 8) => {
        return apiCall(`${API_CONFIG.ENDPOINTS.BESTSELLERS}?limit=${limit}`);
    },
    
    // Get deals
    getDeals: (limit = 8) => {
        return apiCall(`${API_CONFIG.ENDPOINTS.DEALS}?limit=${limit}`);
    },
    
    // Get categories
    getCategories: () => {
        return apiCall(API_CONFIG.ENDPOINTS.CATEGORIES);
    },
    
    // Get brands
    getBrands: () => {
        return apiCall(API_CONFIG.ENDPOINTS.BRANDS);
    }
};

export default API_CONFIG;
