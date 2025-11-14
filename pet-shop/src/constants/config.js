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
// Đọc dynamic runtime từ file env
const API_BASE = import.meta.env.VITE_CHATBOT_URL || "http://localhost:8001";

export const CONFIG = {
    API: {
        // API Petshop
        BASE_URL: import.meta.env.VITE_API_URL || "http://localhost:8000",

        // API Chatbot
        CHATBOT: {
            BASE: import.meta.env.VITE_CHATBOT_URL || "http://localhost:8001",
            CHAT: "/chat",
        },


        ENDPOINTS: {
            PRODUCTS: "/api/products",
            PRODUCT_DETAIL: "/api/products",
            FEATURED: "/api/products/featured",
            BESTSELLERS: "/api/products/bestsellers",
            DEALS: "/api/products/deals",
            CATEGORIES: "/api/products/categories",
            BRANDS: "/api/products/brands",

            LOGIN: "/api/auth/login",
            REGISTER: "/api/auth/register",
            ME: "/api/auth/me",
            PROFILE: "/api/auth/profile",
            LOGOUT: "/api/auth/logout",
        },
    },

    APP: {
        NAME: "TinyPaws Pet Shop",
        VERSION: "1.0.0",
        ITEMS_PER_PAGE: 12,
        MAX_PRICE: 5000000,
    },
};
