import { useWishlist } from '../context/WishlistContext';
import { useCart } from '../context/CartContext';
import { useNavigate } from 'react-router-dom';
import { FaTrash, FaShoppingCart, FaHeart } from 'react-icons/fa';

const WishlistPage = () => {
    const { wishlistItems, removeFromWishlist, clearWishlist } = useWishlist();
    const { addToCart, isInCart } = useCart();
    const navigate = useNavigate();

    const handleAddToCart = (product) => {
        if (product.stock_quantity > 0) {
            addToCart(product, 1);
        }
    };

    const formatPrice = (price) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(price);
    };

    if (wishlistItems.length === 0) {
        return (
            <div className="min-h-screen bg-gray-50 py-12">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center py-16">
                        <FaHeart className="mx-auto text-6xl text-gray-300 mb-4" />
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">
                            Danh sách yêu thích trống
                        </h2>
                        <p className="text-gray-600 mb-6">
                            Bạn chưa có sản phẩm yêu thích nào
                        </p>
                        <button
                            onClick={() => navigate('/products')}
                            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                            Khám phá sản phẩm
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-12">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">
                            Danh sách yêu thích
                        </h1>
                        <p className="text-gray-600 mt-1">
                            {wishlistItems.length} sản phẩm
                        </p>
                    </div>
                    <button
                        onClick={clearWishlist}
                        className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                        Xóa tất cả
                    </button>
                </div>

                {/* Wishlist Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {wishlistItems.map((product) => (
                        <div
                            key={product._id}
                            className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
                        >
                            {/* Product Image */}
                            <div
                                className="relative aspect-square bg-gray-100 cursor-pointer"
                                onClick={() => navigate(`/products/detail/${product._id}`)}
                            >
                                <img
                                    src={product.images?.[0] || product.image}
                                    alt={product.name}
                                    className="w-full h-full object-cover"
                                />
                                {product.stock_quantity === 0 && (
                                    <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                                        <span className="text-white font-semibold">Hết hàng</span>
                                    </div>
                                )}
                            </div>

                            {/* Product Info */}
                            <div className="p-4">
                                <h3
                                    className="font-semibold text-gray-900 mb-2 line-clamp-2 cursor-pointer hover:text-blue-600"
                                    onClick={() => navigate(`/products/detail/${product._id}`)}
                                >
                                    {product.name}
                                </h3>

                                {/* Category */}
                                <p className="text-sm text-gray-500 mb-2">
                                    {product.category?.name || product.category}
                                </p>

                                {/* Price */}
                                <div className="mb-4">
                                    {product.sale_price ? (
                                        <div className="flex items-center gap-2">
                                            <span className="text-lg font-bold text-red-600">
                                                {formatPrice(product.sale_price)}
                                            </span>
                                            <span className="text-sm text-gray-500 line-through">
                                                {formatPrice(product.price)}
                                            </span>
                                        </div>
                                    ) : (
                                        <span className="text-lg font-bold text-gray-900">
                                            {formatPrice(product.price)}
                                        </span>
                                    )}
                                </div>

                                {/* Actions */}
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => handleAddToCart(product)}
                                        disabled={product.stock_quantity === 0 || isInCart(product._id)}
                                        className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                                            product.stock_quantity === 0
                                                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                                : isInCart(product._id)
                                                ? 'bg-green-100 text-green-700'
                                                : 'bg-blue-600 text-white hover:bg-blue-700'
                                        }`}
                                    >
                                        <FaShoppingCart className="inline mr-2" />
                                        {isInCart(product._id) ? 'Đã thêm' : 'Thêm vào giỏ'}
                                    </button>
                                    <button
                                        onClick={() => removeFromWishlist(product._id)}
                                        className="px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
                                    >
                                        <FaTrash />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default WishlistPage;
