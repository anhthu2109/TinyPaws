// // Application Configuration Constants
// export const CONFIG = {
//     // API Configuration
//     API: {
//         BASE_URL: 'http://localhost:8000',
//         ENDPOINTS: {
//             // Product endpoints
//             PRODUCTS: '/api/products',
//             PRODUCT_DETAIL: '/api/products',
//             FEATURED: '/api/products/featured',
//             BESTSELLERS: '/api/products/bestsellers', 
//             DEALS: '/api/products/deals',
//             CATEGORIES: '/api/products/categories',
//             BRANDS: '/api/products/brands',

//             // Auth endpoints
//             LOGIN: '/api/auth/login',
//             REGISTER: '/api/auth/register',
//             ME: '/api/auth/me',
//             PROFILE: '/api/auth/profile',
//             LOGOUT: '/api/auth/logout'
//         }
//     },

//     // App Settings
//     APP: {
//         NAME: 'TinyPaws Pet Shop',
//         VERSION: '1.0.0',
//         ITEMS_PER_PAGE: 12,
//         MAX_PRICE: 5000000
//     }
// };

// export default CONFIG;


// 1. Đọc link API từ file .env (VITE_API_URL)
//    - Khi ở máy bạn: Nó sẽ là 'http://localhost:8000'
//    - Khi deploy Vercel: Nó sẽ là link Render (vd: 'https://tinypaws-api.onrender.com')
const DYNAMIC_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// Application Configuration Constants
export const CONFIG = {
    // API Configuration
    API: {
        // 2. Sử dụng link động thay vì link cứng
        BASE_URL: DYNAMIC_BASE_URL,

        // 3. Các Endpoints giữ nguyên (Chúng sẽ tự nối vào BASE_URL)
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