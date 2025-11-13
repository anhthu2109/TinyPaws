import { useState, useEffect } from 'react';
import { FaEdit, FaTrash, FaEye, FaImage } from 'react-icons/fa';
import adminApi from '../../api/adminApi';
import { useAuth } from '../../context/AuthContext';
import { getSafeImageUrl, handleImageError } from '../../utils/imageUtils';

const ProductsTable = ({ onEdit, onDelete, refreshTrigger, searchTerm, filters }) => {
    const { token, isAdmin } = useAuth();
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalProducts, setTotalProducts] = useState(0);

    // Fetch products from API with retry logic
    const fetchProducts = async (page = 1, retryCount = 0) => {
        const maxRetries = 3;
        
        try {
            setLoading(true);
            setError('');
            
            // Check if user has token and is admin
            if (!token || !isAdmin) {
                setError('Bạn không có quyền truy cập');
                setLoading(false);
                return;
            }
            
            // Build query params with filters
            const params = {
                page,
                limit: 10,
                sortBy: 'createdAt',
                sortOrder: 'desc'
            };

            // Add search term
            if (searchTerm && searchTerm.trim()) {
                params.search = searchTerm.trim();
            }

            // Add filters
            if (filters) {
                if (filters.category && filters.category !== 'all') {
                    params.category = filters.category;
                }
                if (filters.status && filters.status !== 'all') {
                    params.status = filters.status;
                }
                if (filters.stock && filters.stock !== 'all') {
                    params.stock = filters.stock;
                }
            }


            const response = await adminApi.get('/products', { params });

            if (response.data.success) {
                setProducts(response.data.data.products);
                setTotalPages(response.data.data.pagination.totalPages);
                setTotalProducts(response.data.data.pagination.totalProducts);
                setCurrentPage(response.data.data.pagination.currentPage);
            }
        } catch (error) {
            console.error(`Error fetching products (attempt ${retryCount + 1}):`, error);
            
            // Check if it's a network error and we can retry
            const isNetworkError = !error.response || error.code === 'NETWORK_ERROR' || error.code === 'ECONNABORTED';
            
            if (isNetworkError && retryCount < maxRetries) {
                console.log(`Retrying... (${retryCount + 1}/${maxRetries})`);
                // Wait a bit before retrying (exponential backoff)
                setTimeout(() => {
                    fetchProducts(page, retryCount + 1);
                }, Math.pow(2, retryCount) * 1000); // 1s, 2s, 4s
                return;
            }
            
            // Set error message based on error type
            let errorMessage = 'Không thể tải danh sách sản phẩm';
            if (error.response?.status === 401) {
                errorMessage = 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.';
            } else if (error.response?.status === 403) {
                errorMessage = 'Bạn không có quyền truy cập tính năng này.';
            } else if (error.response?.status >= 500) {
                errorMessage = 'Lỗi server. Vui lòng thử lại sau.';
            } else if (isNetworkError) {
                errorMessage = 'Không thể kết nối đến server. Vui lòng kiểm tra kết nối mạng.';
            }
            
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    // Fetch products on component mount and when refreshTrigger changes
    useEffect(() => {
        // Add a small delay to avoid race conditions
        const timeoutId = setTimeout(() => {
            // Only fetch if we have token and user is admin
            if (token && isAdmin) {
                fetchProducts(currentPage);
            }
        }, 100); // 100ms delay

        return () => clearTimeout(timeoutId);
    }, [token, isAdmin, refreshTrigger, searchTerm, filters, currentPage]);

    // Reset to page 1 when filters change
    useEffect(() => {
        if (currentPage !== 1) {
            setCurrentPage(1);
        }
    }, [searchTerm, filters]);

    // Toggle product status (active/inactive)
    const handleToggleStatus = async (product) => {
        try {
            const newStatus = !product.is_active;
            
            const response = await adminApi.put(`/products/${product._id}`, {
                is_active: newStatus
            });

            if (response.data.success) {
                console.log('✅ Product status updated successfully');
                
                // Update local state
                setProducts(prevProducts => 
                    prevProducts.map(p => 
                        p._id === product._id 
                            ? { ...p, is_active: newStatus }
                            : p
                    )
                );
                
            }
        } catch (error) {
            console.error('❌ Error toggling product status:', error);
            alert('Có lỗi xảy ra khi cập nhật trạng thái sản phẩm');
        }
    };

    // Toggle product featured status
    const handleToggleFeatured = async (product) => {
        try {
            const newFeaturedStatus = !product.is_featured;
            
            const response = await adminApi.put(`/products/${product._id}`, {
                is_featured: newFeaturedStatus
            });

            if (response.data.success) {
                console.log('⭐ Product featured status updated successfully');
                
                // Update local state
                setProducts(prevProducts => 
                    prevProducts.map(p => 
                        p._id === product._id 
                            ? { ...p, is_featured: newFeaturedStatus }
                            : p
                    )
                );
                
            }
        } catch (error) {
            console.error('❌ Error toggling featured status:', error);
            alert('Có lỗi xảy ra khi cập nhật trạng thái nổi bật');
        }
    };

    // Format date
    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('vi-VN');
    };

    // Handle page change
    const handlePageChange = (newPage) => {
        if (newPage >= 1 && newPage <= totalPages) {
            setCurrentPage(newPage);
        }
    };

    // Check if user has permission
    if (!token || !isAdmin) {
        return (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-yellow-700">
                <p>Bạn không có quyền truy cập vào trang này. Vui lòng đăng nhập với tài khoản admin.</p>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="flex justify-center items-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-2">Đang tải...</span>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="font-medium">Có lỗi xảy ra</p>
                        <p className="text-sm mt-1">{error}</p>
                    </div>
                    <button
                        onClick={() => {
                            setError('');
                            fetchProducts(currentPage);
                        }}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
                    >
                        Thử lại
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-lg shadow">
            {/* Table Header */}
            <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex justify-between items-center">
                    <h3 className="text-lg font-semibold text-gray-900">
                        Danh sách sản phẩm ({totalProducts})
                    </h3>
                    <div className="text-sm text-gray-500">
                        Trang {currentPage} / {totalPages}
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Sản phẩm
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Danh mục
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-20">
                                Kho
                            </th>
                            {/* <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Trạng thái
                            </th> */}
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Ngày tạo
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Nổi bật
                            </th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Thao tác
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {products.length === 0 ? (
                            <tr>
                                <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                                    <div className="flex flex-col items-center">
                                        <FaImage className="h-12 w-12 text-gray-300 mb-2" />
                                        <p>Chưa có sản phẩm nào</p>
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            products.map((product) => (
                                <tr key={product._id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center">
                                            <div className="flex-shrink-0 h-12 w-12">
                                                {product.images && product.images.length > 0 ? (
                                                    <img
                                                        className="h-12 w-12 rounded-lg object-cover"
                                                        src={getSafeImageUrl(product.images, "48x48", "N/A")}
                                                        alt={product.name}
                                                        onError={(e) => handleImageError(e, "48x48", "N/A")}
                                                    />
                                                ) : (
                                                    <div className="h-12 w-12 rounded-lg bg-gray-200 flex items-center justify-center">
                                                        <FaImage className="h-6 w-6 text-gray-400" />
                                                    </div>
                                                )}
                                            </div>
                                            <div className="ml-4">
                                                <div className="text-sm font-medium text-gray-900 max-w-xs truncate">
                                                    {product.name}
                                                </div>
                                                <div className="text-sm text-gray-500">
                                                    ID: {product._id.slice(-6)}
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-gray-900">
                                            {product.category?.name || 'Chưa phân loại'}
                                        </div>
                                    </td>
                                    <td className="px-3 py-4 whitespace-nowrap">
                                        <div className="text-sm text-gray-900 text-center">
                                            {product.stock_quantity}
                                        </div>
                                        {product.stock_quantity <= 5 && (
                                            <div className="text-xs text-red-500 text-center">
                                                Hết
                                            </div>
                                        )}
                                    </td>
                                    {/* <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center">
                                            <label className="relative inline-flex items-center cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={product.is_active}
                                                    onChange={() => handleToggleStatus(product)}
                                                    className="sr-only peer"
                                                />
                                                <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-green-500"></div>
                                            </label>
                                            <span className={`ml-2 text-xs font-medium ${
                                                product.is_active ? 'text-green-600' : 'text-gray-500'
                                            }`}>
                                                {product.is_active ? 'Hoạt động' : 'Tạm dừng'}
                                            </span>
                                        </div>
                                    </td> */}
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {formatDate(product.createdAt)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center">
                                            <label className="relative inline-flex items-center cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={product.is_featured || false}
                                                    onChange={() => handleToggleFeatured(product)}
                                                    className="sr-only peer"
                                                />
                                                <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-amber-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-500"></div>
                                            </label>
                                            <span className={`ml-2 text-xs font-medium ${
                                                product.is_featured ? 'text-amber-600' : 'text-gray-500'
                                            }`}>
                                                {product.is_featured}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <div className="flex justify-end space-x-2">
                                            <button
                                                onClick={() => onEdit(product)}
                                                className="text-blue-600 hover:text-blue-900 p-2 rounded-full hover:bg-blue-50"
                                                title="Chỉnh sửa"
                                            >
                                                <FaEdit className="h-4 w-4" />
                                            </button>
                                            <button
                                                onClick={() => onDelete(product)}
                                                className="text-red-600 hover:text-red-900 p-2 rounded-full hover:bg-red-50"
                                                title="Xóa"
                                            >
                                                <FaTrash className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="px-6 py-4 border-t border-gray-200">
                    <div className="flex items-center justify-between">
                        <div className="text-sm text-gray-700">
                            Hiển thị {((currentPage - 1) * 10) + 1} - {Math.min(currentPage * 10, totalProducts)} của {totalProducts} sản phẩm
                        </div>
                        <div className="flex space-x-2">
                            <button
                                onClick={() => handlePageChange(currentPage - 1)}
                                disabled={currentPage === 1}
                                className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Trước
                            </button>
                            
                            {/* Page numbers */}
                            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                const pageNum = Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i;
                                return (
                                    <button
                                        key={pageNum}
                                        onClick={() => handlePageChange(pageNum)}
                                        className={`px-3 py-2 text-sm font-medium rounded-md ${
                                            pageNum === currentPage
                                                ? 'bg-blue-600 text-white'
                                                : 'text-gray-500 bg-white border border-gray-300 hover:bg-gray-50'
                                        }`}
                                    >
                                        {pageNum}
                                    </button>
                                );
                            })}
                            
                            <button
                                onClick={() => handlePageChange(currentPage + 1)}
                                disabled={currentPage === totalPages}
                                className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Sau
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProductsTable;
