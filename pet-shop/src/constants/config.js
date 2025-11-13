// Application Configuration Constants
export const CONFIG = {
    // API Configuration
    API: {
        BASE_URL: 'http://localhost:8000',
        ENDPOINTS: {
            // Product endpoints
            PRODUCTS: '/api/products',
            PRODUCT_DETAIL: '/api/products',
            FEATURED: '/api/products/featured',
            BESTSELLERS: '/api/products/bestsellers', 
            DEALS: '/api/products/deals',
            CATEGORIES: '/api/products/categories',
            BRANDS: '/api/products/brands',
            
            // Auth endpoints
            LOGIN: '/api/auth/login',
            REGISTER: '/api/auth/register',
            ME: '/api/auth/me',
            PROFILE: '/api/auth/profile',
            LOGOUT: '/api/auth/logout'
        }
    },
    
    // App Settings
    APP: {
        NAME: 'TinyPaws Pet Shop',
        VERSION: '1.0.0',
        ITEMS_PER_PAGE: 12,
        MAX_PRICE: 5000000
    }
};

export default CONFIG;
