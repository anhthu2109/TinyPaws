import { useCart } from '../context/CartContext';
import { useNavigate } from 'react-router-dom';
import { FaTrash, FaShoppingCart, FaMinus, FaPlus } from 'react-icons/fa';

const CartPage = () => {
    const { cartItems, removeFromCart, updateQuantity, clearCart, getCartTotal, getCartCount } = useCart();
    const navigate = useNavigate();

    const formatPrice = (price) =>
        new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);

    const handleQuantityChange = (productId, currentQuantity, change) => {
        const newQuantity = currentQuantity + change;
        if (newQuantity > 0) updateQuantity(productId, newQuantity);
    };

    if (cartItems.length === 0) {
        return (
            <div className="min-h-screen bg-gray-50 py-12">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <FaShoppingCart className="mx-auto text-6xl text-gray-300 mb-4" />
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Giỏ hàng trống</h2>
                    <p className="text-gray-600 mb-6">Bạn chưa có sản phẩm nào trong giỏ hàng</p>
                    <button
                        onClick={() => navigate('/products')}
                        className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        Tiếp tục mua sắm
                    </button>
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
                        <h1 className="text-3xl font-bold text-gray-900">Giỏ hàng</h1>
                        <p className="text-gray-600 mt-1">{getCartCount()} sản phẩm</p>
                    </div>
                    <button onClick={clearCart} className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg">
                        Xóa tất cả
                    </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Cart Items */}
                    <div className="lg:col-span-2 space-y-4">
                        {cartItems.map((item) => {
                            const id = item._id || item.id;
                            const price = item.sale_price || item.price;
                            const subtotal = price * item.quantity;

                            return (
                                <div key={id} className="bg-white rounded-lg shadow-md p-4 flex gap-4">
                                    <div
                                        className="w-24 h-24 flex-shrink-0 bg-gray-100 rounded-lg overflow-hidden cursor-pointer"
                                        onClick={() => navigate(`/products/detail/${id}`)}
                                    >
                                        <img
                                            src={item.images?.[0] || item.image}
                                            alt={item.name}
                                            className="w-full h-full object-cover"
                                        />
                                    </div>

                                    <div className="flex-1">
                                        <h3
                                            className="font-semibold text-gray-900 mb-1 line-clamp-2 cursor-pointer hover:text-blue-600"
                                            onClick={() => navigate(`/products/detail/${id}`)}
                                        >
                                            {item.name}
                                        </h3>
                                        <p className="text-sm text-gray-500 mb-2">{item.category?.name || item.category}</p>

                                        <div className="flex items-center gap-2 mb-3">
                                            <span className="text-lg font-bold text-red-600">
                                                {formatPrice(price)}
                                            </span>
                                            {item.sale_price && (
                                                <span className="text-sm text-gray-500 line-through">
                                                    {formatPrice(item.price)}
                                                </span>
                                            )}
                                        </div>

                                        {/* Quantity Controls */}
                                        <div className="flex items-center gap-4">
                                            <div className="flex items-center border border-gray-300 rounded-lg">
                                                <button
                                                    onClick={() => handleQuantityChange(id, item.quantity, -1)}
                                                    className="px-3 py-1 hover:bg-gray-100"
                                                >
                                                    <FaMinus className="text-sm" />
                                                </button>
                                                <span className="px-4 py-1 border-x border-gray-300 min-w-[60px] text-center">
                                                    {item.quantity}
                                                </span>
                                                <button
                                                    onClick={() => handleQuantityChange(id, item.quantity, 1)}
                                                    disabled={item.quantity >= item.stock_quantity}
                                                    className="px-3 py-1 hover:bg-gray-100 disabled:opacity-50"
                                                >
                                                    <FaPlus className="text-sm" />
                                                </button>
                                            </div>

                                            {item.quantity >= item.stock_quantity && (
                                                <span className="text-xs text-red-600">Đã đạt tối đa</span>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex flex-col items-end justify-between">
                                        <button
                                            onClick={() => removeFromCart(id)}
                                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                                        >
                                            <FaTrash />
                                        </button>
                                        <div className="text-right">
                                            <p className="text-sm text-gray-500">Tổng</p>
                                            <p className="text-lg font-bold text-gray-900">{formatPrice(subtotal)}</p>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Order Summary */}
                    <div className="lg:col-span-1">
                        <div className="bg-white rounded-lg shadow-md p-6 sticky top-4">
                            <h2 className="text-xl font-bold text-gray-900 mb-4">Tổng đơn hàng</h2>
                            <div className="space-y-3 mb-6">
                                <div className="flex justify-between text-gray-600">
                                    <span>Tạm tính</span>
                                    <span>{formatPrice(getCartTotal())}</span>
                                </div>
                                <div className="flex justify-between text-gray-600">
                                    <span>Phí vận chuyển</span>
                                    <span className="text-green-600">Miễn phí</span>
                                </div>
                                <div className="border-t pt-3">
                                    <div className="flex justify-between text-lg font-bold text-gray-900">
                                        <span>Tổng cộng</span>
                                        <span className="text-red-600">{formatPrice(getCartTotal())}</span>
                                    </div>
                                </div>
                            </div>

                            <button
                                onClick={() => navigate('/payment')}
                                className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                            >
                                Tiến hành thanh toán
                            </button>

                            <button
                                onClick={() => navigate('/products')}
                                className="w-full mt-3 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
                            >
                                Tiếp tục mua sắm
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CartPage;
