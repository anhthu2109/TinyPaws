import { useCart } from '../../context/CartContext';
import { useNavigate } from 'react-router-dom';
import { FaTrash, FaShoppingCart } from 'react-icons/fa';
import { createPortal } from 'react-dom';

const MiniCart = ({ onClose, position }) => {
    const { cartItems, removeFromCart, getCartTotal, getCartCount } = useCart();
    const navigate = useNavigate();

    const formatPrice = (price) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(price);
    };

    const handleViewCart = () => {
        navigate('/cart');
        if (onClose) onClose();
    };

    // Render popup using Portal with fixed position
    return createPortal(
        <div 
            className="mini-cart-popup fixed z-[9999]"
            style={{
                top: `${position?.top || 0}px`,
                left: `${position?.left || 0}px`,
            }}
        >
            {cartItems.length === 0 ? (
                <div className="w-[380px] bg-white rounded-lg shadow-2xl border border-gray-200">
                    <div className="p-6 text-center">
                        <FaShoppingCart className="mx-auto text-5xl text-gray-300 mb-3" />
                        <p className="text-gray-600 font-medium">Chưa có sản phẩm</p>
                    </div>
                </div>
            ) : (
        <div className="w-[380px] bg-white rounded-lg shadow-2xl border border-gray-200">
            {/* Header */}
            <div className="px-4 py-3 border-b border-gray-200">
                <h3 className="text-sm font-semibold text-gray-700">
                    Sản phẩm mới thêm ({getCartCount()})
                </h3>
            </div>

            {/* Cart Items - Max 5 items with scroll */}
            <div className="max-h-[400px] overflow-y-auto">
                {cartItems.slice(0, 5).map((item) => {
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
                                        className="text-sm font-medium text-gray-900 line-clamp-2 cursor-pointer hover:text-blue-600"
                                        onClick={() => {
                                            navigate(`/products/detail/${productId}`);
                                            if (onClose) onClose();
                                        }}
                                    >
                                        {item.name}
                                    </h4>
                                    <div className="flex items-center justify-between mt-2">
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm font-semibold text-red-600">
                                                {formatPrice(price)}
                                            </span>
                                            <span className="text-xs text-gray-500">
                                                x{item.quantity}
                                            </span>
                                        </div>
                                        <button
                                            onClick={() => removeFromCart(productId)}
                                            className="text-gray-400 hover:text-red-600 transition-colors"
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

            {/* Show more indicator */}
            {cartItems.length > 5 && (
                <div className="px-4 py-2 bg-gray-50 text-center border-t border-gray-200">
                    <span className="text-xs text-gray-600">
                        Còn {cartItems.length - 5} sản phẩm khác...
                    </span>
                </div>
            )}

            {/* Footer */}
            <div className="px-4 py-3 bg-gray-50 border-t border-gray-200">
                <div className="flex items-center justify-between mb-3">
                    <span className="text-sm text-gray-600">Tổng cộng:</span>
                    <span className="text-lg font-bold text-red-600">
                        {formatPrice(getCartTotal())}
                    </span>
                </div>
                <button
                    onClick={handleViewCart}
                    className="w-full bg-blue-600 text-white py-2.5 rounded-lg font-medium hover:bg-blue-700 transition-colors"
                >
                    Xem giỏ hàng
                </button>
            </div>
        </div>
            )}
        </div>,
        document.body
    );
};

export default MiniCart;
