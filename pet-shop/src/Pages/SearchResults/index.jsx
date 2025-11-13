import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { CONFIG } from '../../constants/config';
import ProductCard from '../../components/ProductCard';
import { FaSearch, FaArrowLeft } from 'react-icons/fa';

const SearchResults = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const query = searchParams.get('q') || '';
    
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const searchProducts = async () => {
            if (!query.trim()) {
                setLoading(false);
                return;
            }

            setLoading(true);
            setError('');
            
            try {
                const response = await axios.get(
                    `${CONFIG.API.BASE_URL}/api/products/search?query=${encodeURIComponent(query)}`
                );
                
                if (response.data.success) {
                    // Transform data to match ProductCard format
                    const transformedProducts = response.data.data.products.map(product => ({
                        id: product._id,
                        _id: product._id,
                        name: product.name,
                        category: product.category?.name || 'Chưa phân loại',
                        brand: product.brand,
                        price: product.sale_price ?? product.price,
                        oldPrice: product.sale_price ? product.price : null,
                        image: product.images?.[0] || 'https://placehold.co/400x400?text=No+Image',
                        rating: 4.5,
                        reviews: Math.floor(Math.random() * 200) + 10,
                        stock: product.stock_quantity,
                        stock_quantity: product.stock_quantity,
                        isNew: new Date(product.createdAt) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
                    }));
                    
                    setProducts(transformedProducts);
                } else {
                    setError('Có lỗi xảy ra khi tìm kiếm');
                }
            } catch (err) {
                setError('Không thể kết nối đến server');
            } finally {
                setLoading(false);
            }
        };

        searchProducts();
    }, [query]);

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => navigate(-1)}
                            className="p-2 hover:bg-gray-100 rounded-full transition"
                        >
                            <FaArrowLeft className="text-gray-600" />
                        </button>
                        <div className="flex-1">
                            <h1 className="text-xl font-semibold text-gray-800">
                                Kết quả tìm kiếm
                            </h1>
                            {query && (
                                <p className="text-sm text-gray-500 mt-1">
                                    Từ khóa: <span className="font-medium text-gray-700">"{query}"</span>
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20">
                        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-200 border-t-blue-600 mb-4"></div>
                        <p className="text-gray-600">Đang tìm kiếm...</p>
                    </div>
                ) : error ? (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
                        <p className="text-red-600">{error}</p>
                    </div>
                ) : products.length === 0 ? (
                    <div className="bg-white rounded-lg shadow-sm p-12 text-center">
                        <FaSearch className="text-6xl text-gray-300 mx-auto mb-4" />
                        <h2 className="text-2xl font-semibold text-gray-800 mb-2">
                            Không tìm thấy sản phẩm phù hợp
                        </h2>
                        <p className="text-gray-600 mb-6">
                            Không có sản phẩm nào khớp với từ khóa "{query}"
                        </p>
                        <button
                            onClick={() => navigate('/')}
                            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                        >
                            Về trang chủ
                        </button>
                    </div>
                ) : (
                    <div>
                        <div className="mb-4">
                            <p className="text-gray-600">
                                Tìm thấy <span className="font-semibold text-gray-800">{products.length}</span> sản phẩm
                            </p>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
                            {products.map(product => (
                                <ProductCard 
                                    key={product.id} 
                                    product={product}
                                    viewMode="grid"
                                />
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SearchResults;
