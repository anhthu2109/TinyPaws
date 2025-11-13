import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FaShoppingCart, FaHeart, FaShare, FaStar, FaChevronLeft, FaChevronRight, FaPlus, FaMinus } from 'react-icons/fa';
import { publicApi } from '../api/publicApi';
import { getSafeImageUrl, handleImageError } from '../utils/imageUtils';
import RelatedProducts from '../components/RelatedProducts';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { useAuth } from '../context/AuthContext';

const ProductDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { addToCart, isInCart } = useCart();
    const { toggleWishlist, isInWishlist } = useWishlist();
    const { isAuthenticated, user } = useAuth();
    
    // State
    const [product, setProduct] = useState(null);
    const [relatedProducts, setRelatedProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [quantity, setQuantity] = useState(1);
    const [selectedImageIndex, setSelectedImageIndex] = useState(0);
    const [isImageModalOpen, setIsImageModalOpen] = useState(false);

    // Fetch product detail with fallback endpoints
    const fetchProduct = async () => {
        try {
            setLoading(true);
            setError('');

            const possibleEndpoints = [
                `/api/products/${id}`,
                `/products/${id}`,
                `/product/${id}`,
                `/api/product/${id}`,
                `/products/detail/${id}`,
                `/api/products/detail/${id}`
            ];

            let response = null;
            let usedEndpoint = null;

            for (const ep of possibleEndpoints) {
                try {
                    response = await publicApi.get(ep);
                    if (response && response.status >= 200 && response.status < 300) {
                        usedEndpoint = ep;
                        break;
                    }
                } catch (err) {
                    // Endpoint failed, try next
                }
            }

            if (!response) {
                setError('Sản phẩm không tồn tại hoặc server không phản hồi (404).');
                return;
            }

            // Normalize response
            const payload = response.data?.data ?? response.data;
            
            // Check success flag
            if (response.data?.success === false) {
                setError(response.data?.message || 'Sản phẩm không tồn tại');
                return;
            }

            setProduct(payload);
            console.log('✅ Product fetched from', usedEndpoint);
            
            // Track product view nếu user đã đăng nhập
            if (isAuthenticated && user?._id) {
                trackProductView(user._id, id).catch(err => {
                    console.warn('⚠️ Failed to track view:', err);
                });
            }
            
            // Fetch related products (non-blocking)
            if (payload?.category) {
                fetchRelatedProducts(payload.category).catch(err => {
                    console.warn('⚠️ Failed to fetch related products:', err);
                    // Don't block main product display
                });
            }
        } catch (error) {
            console.error('❌ Final Error fetching product:', error);
            if (error.response?.status === 404) {
                setError('Sản phẩm không tồn tại hoặc đã bị xóa');
            } else {
                setError('Có lỗi xảy ra khi tải sản phẩm');
            }
        } finally {
            setLoading(false);
        }
    };

    // Track product view
    const trackProductView = async (userId, productId) => {
        try {
            await publicApi.post('/api/recommendations/track/view', {
                userId,
                productId
            });
            console.log('👁️ Tracked product view:', productId);
        } catch (error) {
            console.error('❌ Error tracking view:', error);
            throw error;
        }
    };

    // Fetch related products
    const fetchRelatedProducts = async (category) => {
        try {
            // Extract category ID if it's an object
            const categoryId = typeof category === 'object' ? category._id : category;
            
            console.log('🔍 Fetching related products for category:', categoryId);
            
            const response = await publicApi.get('/api/products', {
                params: {
                    category: categoryId,
                    limit: 8,
                    page: 1
                }
            });
            
            if (response.data.success) {
                // Filter out current product
                const filtered = response.data.data.products.filter(p => p._id !== id);
                setRelatedProducts(filtered.slice(0, 4));
                console.log('✅ Fetched', filtered.length, 'related products');
            }
        } catch (error) {
            console.error('❌ Error fetching related products:', error);
            console.error('Response:', error.response?.data);
            throw error; // Re-throw to be caught by caller
        }
    };

    useEffect(() => {
        if (id) {
            // Reset state when product ID changes
            setProduct(null);
            setRelatedProducts([]);
            setSelectedImageIndex(0);
            setQuantity(1);
            setError('');
            
            // Scroll to top
            window.scrollTo(0, 0);
            
            // Fetch new product
            fetchProduct();
        }
    }, [id]);

    // Handle quantity change
    const handleQuantityChange = (action) => {
        if (action === 'increase') {
            setQuantity(prev => Math.min(prev + 1, product?.stock_quantity || 1));
        } else if (action === 'decrease') {
            setQuantity(prev => Math.max(prev - 1, 1));
        }
    };

    // Handle add to cart
    const handleAddToCart = () => {
        if (!product) return;
        
        // Check if user is logged in
        if (!isAuthenticated) {
            navigate('/dang-nhap', { state: { from: `/products/detail/${id}` } });
            return;
        }
        
        if (product.stock_quantity > 0) {
            addToCart(product, quantity);
        }
    };

    // Handle toggle wishlist
    const handleToggleWishlist = () => {
        if (!product) return;
        
        // Check if user is logged in
        if (!isAuthenticated) {
            navigate('/dang-nhap', { state: { from: `/products/detail/${id}` } });
            return;
        }
        
        toggleWishlist(product);
    };

    // Format price
    const formatPrice = (price) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(price);
    };

    // Handle image navigation
    const handleImageNavigation = (direction) => {
        if (!product?.images) return;
        
        if (direction === 'next') {
            setSelectedImageIndex(prev => 
                prev === product.images.length - 1 ? 0 : prev + 1
            );
        } else {
            setSelectedImageIndex(prev => 
                prev === 0 ? product.images.length - 1 : prev - 1
            );
        }
    };

    // Loading state
    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Đang tải sản phẩm...</p>
                </div>
            </div>
        );
    }

    // Error state
    if (error) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center max-w-md mx-auto p-6">
                    <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <FaHeart className="text-red-500 text-2xl" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Oops!</h2>
                    <p className="text-gray-600 mb-6">{error}</p>
                    <button
                        onClick={() => navigate('/products')}
                        className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
                    >
                        Xem tất cả sản phẩm
                    </button>
                </div>
            </div>
        );
    }

    if (!product) return null;

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Breadcrumb */}
            <div className="bg-white shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <nav className="flex" aria-label="Breadcrumb">
                        <ol className="inline-flex items-center space-x-1 md:space-x-3">
                            <li className="inline-flex items-center">
                                <button
                                    onClick={() => navigate('/')}
                                    className="text-gray-700 hover:text-blue-600"
                                >
                                    Trang chủ
                                </button>
                            </li>
                            <li>
                                <div className="flex items-center">
                                    <FaChevronRight className="w-4 h-4 text-gray-400" />
                                    <button
                                        onClick={() => navigate('/products')}
                                        className="ml-1 text-gray-700 hover:text-blue-600 md:ml-2"
                                    >
                                        Sản phẩm
                                    </button>
                                </div>
                            </li>
                            <li aria-current="page">
                                <div className="flex items-center">
                                    <FaChevronRight className="w-4 h-4 text-gray-400" />
                                    <span className="ml-1 text-gray-500 md:ml-2 truncate max-w-xs">
                                        {product.name}
                                    </span>
                                </div>
                            </li>
                        </ol>
                    </nav>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 p-8">
                        {/* Image Gallery */}
                        <div className="space-y-4">
                            {/* Main Image */}
                            <div className="relative aspect-square bg-gray-100 rounded-xl overflow-hidden">
                                {product.images && product.images.length > 0 ? (
                                    <>
                                        <img
                                            src={getSafeImageUrl([product.images[selectedImageIndex]], "600x600", product.name)}
                                            alt={product.name}
                                            className="w-full h-full object-cover cursor-pointer"
                                            onClick={() => setIsImageModalOpen(true)}
                                            onError={(e) => handleImageError(e, "600x600", product.name)}
                                        />
                                        
                                        {/* Navigation Arrows */}
                                        {product.images.length > 1 && (
                                            <>
                                                <button
                                                    onClick={() => handleImageNavigation('prev')}
                                                    className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white rounded-full p-2 shadow-lg transition-colors"
                                                >
                                                    <FaChevronLeft className="w-4 h-4 text-gray-600" />
                                                </button>
                                                <button
                                                    onClick={() => handleImageNavigation('next')}
                                                    className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white rounded-full p-2 shadow-lg transition-colors"
                                                >
                                                    <FaChevronRight className="w-4 h-4 text-gray-600" />
                                                </button>
                                            </>
                                        )}
                                    </>
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center">
                                        <div className="text-center">
                                            <FaHeart className="w-16 h-16 text-gray-300 mx-auto mb-2" />
                                            <p className="text-gray-500">Không có hình ảnh</p>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Thumbnail Images - Limit to first 4 images */}
                            {product.images && product.images.length > 1 && (
                                <div className="grid grid-cols-4 gap-2">
                                    {product.images.slice(0, 4).map((image, index) => (
                                        <button
                                            key={index}
                                            onClick={() => setSelectedImageIndex(index)}
                                            onMouseEnter={() => setSelectedImageIndex(index)}
                                            className={`aspect-square rounded-lg overflow-hidden border-2 transition-all duration-200 ${
                                                selectedImageIndex === index 
                                                    ? 'border-blue-500 ring-2 ring-blue-200' 
                                                    : 'border-gray-200 hover:border-blue-300 hover:shadow-md'
                                            }`}
                                        >
                                            <img
                                                src={getSafeImageUrl([image], "150x150", product.name)}
                                                alt={`${product.name} ${index + 1}`}
                                                className="w-full h-full object-cover"
                                                onError={(e) => handleImageError(e, "150x150", product.name)}
                                            />
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Product Info */}
                        <div className="space-y-6">
                            {/* Title & Category */}
                            <div>
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="px-3 py-1 bg-blue-100 text-blue-800 text-sm font-medium rounded-full">
                                        {product.category?.name || 'Chưa phân loại'}
                                    </span>
                                    {product.tags && product.tags.map((tag, index) => (
                                        <span key={index} className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                                            {tag}
                                        </span>
                                    ))}
                                </div>
                                <h1 className="text-3xl font-bold text-gray-900 leading-tight">
                                    {product.name}
                                </h1>
                            </div>

                            {/* Price */}
                            <div className="space-y-2">
                                <div className="flex items-center gap-3">
                                    <span className="text-3xl font-bold text-red-600">
                                        {formatPrice(product.sale_price || product.price)}
                                    </span>
                                    {product.sale_price && (
                                        <span className="text-xl text-gray-500 line-through">
                                            {formatPrice(product.price)}
                                        </span>
                                    )}
                                </div>
                                {product.sale_price && (
                                    <div className="inline-flex items-center px-2 py-1 bg-red-100 text-red-800 text-sm font-medium rounded-full">
                                        Tiết kiệm {formatPrice(product.price - product.sale_price)}
                                    </div>
                                )}
                            </div>

                            {/* Stock Status */}
                            <div className="flex items-center gap-2">
                                <div className={`w-3 h-3 rounded-full ${
                                    product.stock_quantity > 0 ? 'bg-green-500' : 'bg-red-500'
                                }`}></div>
                                <span className={`font-medium ${
                                    product.stock_quantity > 0 ? 'text-green-600' : 'text-red-600'
                                }`}>
                                    {product.stock_quantity > 0 
                                        ? `Còn ${product.stock_quantity} sản phẩm` 
                                        : 'Hết hàng'
                                    }
                                </span>
                            </div>

                            {/* Quantity & Add to Cart */}
                            {product.stock_quantity > 0 && (
                                <div className="space-y-4">
                                    <div className="flex items-center gap-4">
                                        <span className="font-medium text-gray-700">Số lượng:</span>
                                        <div className="flex items-center border border-gray-300 rounded-lg">
                                            <button
                                                onClick={() => handleQuantityChange('decrease')}
                                                disabled={quantity <= 1}
                                                className="p-2 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                <FaMinus className="w-3 h-3" />
                                            </button>
                                            <span className="px-4 py-2 font-medium min-w-[3rem] text-center">
                                                {quantity}
                                            </span>
                                            <button
                                                onClick={() => handleQuantityChange('increase')}
                                                disabled={quantity >= product.stock_quantity}
                                                className="p-2 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                <FaPlus className="w-3 h-3" />
                                            </button>
                                        </div>
                                    </div>

                                    <div className="flex gap-3">
                                        <button
                                            onClick={handleAddToCart}
                                            disabled={isInCart(product._id)}
                                            className={`flex-1 px-6 py-3 rounded-xl font-medium transition-colors flex items-center justify-center gap-2 ${
                                                isInCart(product._id)
                                                    ? 'bg-green-600 text-white cursor-default'
                                                    : 'bg-blue-600 text-white hover:bg-blue-700'
                                            }`}
                                        >
                                            <FaShoppingCart className="w-4 h-4" />
                                            {isInCart(product._id) ? 'Đã thêm vào giỏ' : 'Thêm vào giỏ hàng'}
                                        </button>
                                        <button 
                                            onClick={handleToggleWishlist}
                                            className={`px-4 py-3 border rounded-xl transition-colors ${
                                                isInWishlist(product._id)
                                                    ? 'border-red-500 bg-red-50 text-red-600'
                                                    : 'border-gray-300 hover:bg-gray-50'
                                            }`}
                                        >
                                            <FaHeart className="w-4 h-4 text-gray-600" />
                                        </button>
                                        <button className="px-4 py-3 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors">
                                            <FaShare className="w-4 h-4 text-gray-600" />
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Description */}
                            <div className="border-t pt-6">
                                <h3 className="text-lg font-semibold text-gray-900 mb-3">Mô tả sản phẩm</h3>
                                <div className="prose prose-sm max-w-none text-gray-700">
                                    {product.description ? (
                                        <p className="product-description">{product.description}</p>
                                    ) : (
                                        <p>Chưa có mô tả cho sản phẩm này.</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Related Products */}
                {relatedProducts.length > 0 && (
                    <div className="mt-12">
                        <h2 className="text-2xl font-bold text-gray-900 mb-6">Sản phẩm liên quan</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                            {relatedProducts.map((relatedProduct) => (
                                <div
                                    key={relatedProduct._id}
                                    className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
                                    onClick={() => navigate(`/products/detail/${relatedProduct._id}`)}
                                >
                                    <div className="aspect-square bg-gray-100">
                                        {relatedProduct.images && relatedProduct.images.length > 0 ? (
                                            <img
                                                src={getSafeImageUrl(relatedProduct.images, "300x300", relatedProduct.name)}
                                                alt={relatedProduct.name}
                                                className="w-full h-full object-cover"
                                                onError={(e) => handleImageError(e, "300x300", relatedProduct.name)}
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center">
                                                <FaHeart className="w-8 h-8 text-gray-300" />
                                            </div>
                                        )}
                                    </div>
                                    <div className="p-4">
                                        <h3 className="font-medium text-gray-900 mb-2 line-clamp-2">
                                            {relatedProduct.name}
                                        </h3>
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <span className="text-lg font-bold text-red-600">
                                                    {formatPrice(relatedProduct.sale_price || relatedProduct.price)}
                                                </span>
                                                {relatedProduct.sale_price && (
                                                    <span className="text-sm text-gray-500 line-through ml-2">
                                                        {formatPrice(relatedProduct.price)}
                                                    </span>
                                                )}
                                            </div>
                                            <button className="px-3 py-1 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors">
                                                Xem
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Image Modal */}
            {isImageModalOpen && product.images && (
                <div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4">
                    <div className="relative max-w-4xl max-h-full">
                        <button
                            onClick={() => setIsImageModalOpen(false)}
                            className="absolute top-4 right-4 text-white hover:text-gray-300 z-10"
                        >
                            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                        <img
                            src={getSafeImageUrl([product.images[selectedImageIndex]], "800x800", product.name)}
                            alt={product.name}
                            className="max-w-full max-h-full object-contain"
                            onError={(e) => handleImageError(e, "800x800", product.name)}
                        />
                    </div>
                </div>
            )}

            {/* Related Products Section */}
            <RelatedProducts currentProductId={id} userId={user?._id} />
        </div>
    );
};

export default ProductDetail;
