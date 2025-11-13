import { useWishlist } from '../../context/WishlistContext';
import { useNavigate } from 'react-router-dom';
import { FaTrash, FaHeart } from 'react-icons/fa';
import { createPortal } from 'react-dom';

const MiniWishlist = ({ onClose, position }) => {
    const { wishlistItems, removeFromWishlist, getWishlistCount } = useWishlist();
    const navigate = useNavigate();

    const formatPrice = (price) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(price);
    };

    // Render popup using Portal with fixed position
    return createPortal(
        <div 
            className="mini-wishlist-popup fixed z-[9999]"
            style={{
                top: `${position?.top || 0}px`,
                left: `${position?.left || 0}px`,
            }}
        >
            {wishlistItems.length === 0 ? (
                <div className="w-[380px] bg-white rounded-lg shadow-2xl border border-gray-200">
                    <div className="p-6 text-center">
                        <FaHeart className="mx-auto text-5xl text-gray-300 mb-3" />
                        <p className="text-gray-600 font-medium">Chưa có sản phẩm yêu thích</p>
                    </div>
                </div>
            ) : (
        <div className="w-[380px] bg-white rounded-lg shadow-2xl border border-gray-200">
            {/* Header */}
            <div className="px-4 py-3 border-b border-gray-200">
                <h3 className="text-sm font-semibold text-gray-700">
                    Sản phẩm yêu thích ({getWishlistCount()})
                </h3>
            </div>

            {/* Wishlist Items - Scrollable */}
            <div className="max-h-[500px] overflow-y-auto">
                {wishlistItems.map((item) => {
                    const price = item.sale_price || item.price;
                    const productId = item._id || item.id;
                    return (
                        <div
                            key={productId}
                            className="px-4 py-3 hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-0"
                        >
                            <div className="flex gap-3">
                                {/* Product Image */}
                                <div
                                    className="w-16 h-16 flex-shrink-0 bg-gray-100 rounded cursor-pointer overflow-hidden"
                                    onClick={() => {
                                        navigate(`/products/detail/${productId}`);
                                        if (onClose) onClose();
                                    }}
                                >
                                    <img
                                        src={item.images?.[0] || item.image}
                                        alt={item.name}
                                        className="w-full h-full object-cover"
                                    />
                                </div>

                                {/* Product Info */}
                                <div className="flex-1 min-w-0">
                                    <h4
                                        className="text-sm font-medium text-gray-900 line-clamp-2 cursor-pointer hover:text-blue-600 mb-2"
                                        onClick={() => {
                                            navigate(`/products/detail/${productId}`);
                                            if (onClose) onClose();
                                        }}
                                    >
                                        {item.name}
                                    </h4>
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm font-semibold text-red-600">
                                            {formatPrice(price)}
                                        </span>
                                        <button
                                            onClick={() => removeFromWishlist(productId)}
                                            className="p-1.5 rounded bg-red-100 text-red-600 hover:bg-red-200 transition-colors"
                                            title="Xóa khỏi yêu thích"
                                        >
                                            <FaTrash className="text-xs" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

        </div>
            )}
        </div>,
        document.body
    );
};

export default MiniWishlist;
