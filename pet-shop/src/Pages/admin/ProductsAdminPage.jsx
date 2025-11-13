import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaPlus, FaSearch, FaFilter } from 'react-icons/fa';
import ProductsTable from '../../components/admin/ProductsTable';
import { adminProductsApi, handleAdminApiError } from '../../api/adminApiHelpers';
import { CONFIG } from '../../constants/config';
import axios from 'axios';

const ProductsAdminPage = () => {
    const navigate = useNavigate();
    
    const [refreshTrigger, setRefreshTrigger] = useState(0);
    const [searchTerm, setSearchTerm] = useState('');
    const [showFilters, setShowFilters] = useState(false);
    const [filters, setFilters] = useState({
        category: 'all',
        status: 'all',
        stock: 'all'
    });
    
    const [categories, setCategories] = useState([]);
    const [loadingCategories, setLoadingCategories] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                setLoadingCategories(true);
                const response = await axios.get(`${CONFIG.API.BASE_URL}/api/categories`);
                if (response.data.success) {
                    const categoriesData = response.data.data;
                    setCategories(Array.isArray(categoriesData) ? categoriesData : []);
                }
            } catch (error) {
                setCategories([]);
            } finally {
                setLoadingCategories(false);
            }
        };
        
        fetchCategories();
    }, []);

    const handleAddProduct = () => {
        navigate('/admin/products/new');
    };

    const handleEditProduct = (product) => {
        navigate(`/admin/products/edit/${product._id}`);
    };

    const handleDeleteProduct = async (product) => {
        const confirmed = window.confirm(
            `Bạn có chắc chắn muốn xóa sản phẩm "${product.name}"?\n\nHành động này không thể hoàn tác.`
        );

        if (!confirmed) return;

        try {
            setLoading(true);
            setError('');

            const response = await adminProductsApi.deleteProduct(product._id);

            if (response.data.success) {
                setRefreshTrigger(prev => prev + 1);
            }
        } catch (error) {
            const errorInfo = handleAdminApiError(error, 'Có lỗi xảy ra khi xóa sản phẩm');
            setError(errorInfo.message);
            alert(`Lỗi: ${errorInfo.message}`);
        } finally {
            setLoading(false);
        }
    };

    const handleRefreshProducts = () => {
        setRefreshTrigger(prev => prev + 1);
    };

    const handleFilterChange = (filterName, value) => {
        setFilters(prev => ({
            ...prev,
            [filterName]: value
        }));
    };

    const handleSearch = (e) => {
        e.preventDefault();
        handleRefreshProducts();
    };

    const handleResetFilters = () => {
        setSearchTerm('');
        setFilters({
            category: 'all',
            status: 'all',
            stock: 'all'
        });
        handleRefreshProducts();
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white shadow">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center py-6">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">
                                Quản lý sản phẩm
                            </h1>
                            <p className="mt-1 text-sm text-gray-500">
                                Thêm, sửa, xóa và quản lý tất cả sản phẩm trong cửa hàng
                            </p>
                        </div>
                        <button
                            onClick={handleAddProduct}
                            disabled={loading}
                            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <FaPlus className="h-4 w-4 mr-2" />
                            Thêm sản phẩm mới
                        </button>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Error Message */}
                {error && (
                    <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
                        <div className="flex">
                            <div className="flex-shrink-0">
                                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                </svg>
                            </div>
                            <div className="ml-3">
                                <p className="text-sm text-red-700">{error}</p>
                            </div>
                            <div className="ml-auto pl-3">
                                <button
                                    onClick={() => setError('')}
                                    className="inline-flex text-red-400 hover:text-red-600"
                                >
                                    <span className="sr-only">Đóng</span>
                                    <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Search and Filter Bar */}
                <div className="bg-white rounded-lg shadow mb-6">
                    <div className="p-6">
                        <div className="flex flex-col sm:flex-row gap-4">
                            {/* Search */}
                            <form onSubmit={handleSearch} className="flex-1">
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <FaSearch className="h-4 w-4 text-gray-400" />
                                    </div>
                                    <input
                                        type="text"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        placeholder="Tìm kiếm sản phẩm theo tên, mô tả..."
                                    />
                                </div>
                            </form>

                            <button
                                onClick={() => setShowFilters(!showFilters)}
                                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                            >
                                <FaFilter className="h-4 w-4 mr-2" />
                                Bộ lọc
                            </button>

                            <button
                                type="submit"
                                onClick={handleSearch}
                                className="inline-flex items-center px-6 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                            >
                                Tìm kiếm
                            </button>
                        </div>

                        {showFilters && (
                            <div className="mt-4 pt-4 border-t border-gray-200">
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Danh mục
                                        </label>
                                        <select
                                            value={filters.category}
                                            onChange={(e) => handleFilterChange('category', e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            disabled={loadingCategories}
                                        >
                                            <option value="all">
                                                {loadingCategories ? 'Đang tải...' : 'Tất cả danh mục'}
                                            </option>
                                            {Array.isArray(categories) && categories.map((cat) => (
                                                <option key={cat._id} value={cat._id}>
                                                    {cat.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Trạng thái
                                        </label>
                                        <select 
                                            value={filters.status}
                                            onChange={(e) => handleFilterChange('status', e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        >
                                            <option value="all">Tất cả trạng thái</option>
                                            <option value="active">Đang hoạt động</option>
                                            <option value="inactive">Tạm dừng</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Tồn kho
                                        </label>
                                        <select 
                                            value={filters.stock}
                                            onChange={(e) => handleFilterChange('stock', e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        >
                                            <option value="all">Tất cả</option>
                                            <option value="in_stock">Còn hàng (&gt; 0)</option>
                                            <option value="low_stock">Sắp hết (≤ 10)</option>
                                            <option value="out_of_stock">Hết hàng (= 0)</option>
                                        </select>
                                    </div>

                                    <div className="flex items-end">
                                        <button
                                            onClick={handleResetFilters}
                                            className="w-full px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                                        >
                                            Đặt lại
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <ProductsTable
                    onEdit={handleEditProduct}
                    onDelete={handleDeleteProduct}
                    refreshTrigger={refreshTrigger}
                    searchTerm={searchTerm}
                    filters={filters}
                />
            </div>

            
            {loading && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
                    <div className="bg-white p-6 rounded-lg shadow-lg flex items-center space-x-3">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                        <span className="text-gray-700">Đang xử lý...</span>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProductsAdminPage;
