import adminApi from './adminApi';

/**
 * Admin API Helper Functions
 * Centralized functions for common admin operations
 */

// Products API
export const adminProductsApi = {
    // Get all products with pagination
    getProducts: (params = {}) => {
        return adminApi.get('/products', { params });
    },

    // Get single product by ID
    getProduct: (id) => {
        return adminApi.get(`/products/${id}`);
    },

    // Create new product
    createProduct: (productData) => {
        return adminApi.post('/products', productData);
    },

    // Update product
    updateProduct: (id, productData) => {
        return adminApi.put(`/products/${id}`, productData);
    },

    // Delete product
    deleteProduct: (id) => {
        return adminApi.delete(`/products/${id}`);
    },

    // Bulk operations
    bulkUpdateProducts: (productIds, updateData) => {
        return adminApi.patch('/products/bulk', { productIds, updateData });
    },

    // Toggle product status
    toggleProductStatus: (id, isActive) => {
        return adminApi.patch(`/products/${id}/status`, { is_active: isActive });
    }
};

// Categories API (if needed for admin)
export const adminCategoriesApi = {
    getCategories: () => {
        return adminApi.get('/categories');
    },

    createCategory: (categoryData) => {
        return adminApi.post('/categories', categoryData);
    },

    updateCategory: (id, categoryData) => {
        return adminApi.put(`/categories/${id}`, categoryData);
    },

    deleteCategory: (id) => {
        return adminApi.delete(`/categories/${id}`);
    }
};

// Users API (if needed for admin)
export const adminUsersApi = {
    getUsers: (params = {}) => {
        return adminApi.get('/users', { params });
    },

    getUser: (id) => {
        return adminApi.get(`/users/${id}`);
    },

    updateUser: (id, userData) => {
        return adminApi.put(`/users/${id}`, userData);
    },

    deleteUser: (id) => {
        return adminApi.delete(`/users/${id}`);
    }
};

// Orders API (if needed for admin)
export const adminOrdersApi = {
    getOrders: (params = {}) => {
        return adminApi.get('/orders', { params });
    },

    getOrder: (id) => {
        return adminApi.get(`/orders/${id}`);
    },

    updateOrderStatus: (id, status) => {
        return adminApi.patch(`/orders/${id}/status`, { status });
    }
};

// Analytics API (if needed)
export const adminAnalyticsApi = {
    getDashboardStats: () => {
        return adminApi.get('/analytics/dashboard');
    },

    getProductStats: () => {
        return adminApi.get('/analytics/products');
    },

    getSalesStats: (params = {}) => {
        return adminApi.get('/analytics/sales', { params });
    }
};

// Error handling helper
export const handleAdminApiError = (error, defaultMessage = 'Có lỗi xảy ra') => {
    if (error.response) {
        // Server responded with error status
        const message = error.response.data?.message || defaultMessage;
        const status = error.response.status;
        
        console.error(`Admin API Error ${status}:`, message);
        
        return {
            success: false,
            message,
            status,
            data: error.response.data
        };
    } else if (error.request) {
        // Network error
        console.error('Admin API Network Error:', error.request);
        return {
            success: false,
            message: 'Lỗi kết nối mạng',
            status: 0
        };
    } else {
        // Other error
        console.error('Admin API Error:', error.message);
        return {
            success: false,
            message: defaultMessage,
            status: -1
        };
    }
};
