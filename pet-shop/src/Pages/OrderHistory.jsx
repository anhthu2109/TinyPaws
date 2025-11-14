import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { FaBox, FaSpinner, FaShoppingCart, FaComments } from 'react-icons/fa';
import { CONFIG } from '../constants/config';

const API_BASE_URL = CONFIG.API.BASE_URL;

const OrderHistory = () => {
    const { user } = useAuth();
    const { addToCart } = useCart();
    const navigate = useNavigate();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchOrders();
    }, []);

    const fetchOrders = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                navigate('/dang-nhap');
                return;
            }

            const response = await fetch(`${API_BASE_URL}/orders/user/${user?.id || user?._id}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            const data = await response.json();

            if (response.ok) {
                setOrders(Array.isArray(data) ? data : data.data || []);
            } else {
                setError(data.message || 'Không thể tải đơn hàng');
            }
        } catch (error) {
            setError('Lỗi khi tải danh sách đơn hàng');
        } finally {
            setLoading(false);
        }
    };

    const formatPrice = (price) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(price);
    };

    const formatDate = (date) => {
        return new Date(date).toLocaleDateString('vi-VN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getStatusBadge = (status) => {
        const statusConfig = {
            pending: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Chờ xử lý' },
            confirmed: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Đã xác nhận' },
            processing: { bg: 'bg-indigo-100', text: 'text-indigo-800', label: 'Đang xử lý' },
            shipping: { bg: 'bg-purple-100', text: 'text-purple-800', label: 'Đang giao' },
            delivered: { bg: 'bg-green-100', text: 'text-green-800', label: 'Đã giao' },
            cancelled: { bg: 'bg-red-100', text: 'text-red-800', label: 'Đã hủy' }
        };
        
        const config = statusConfig[status] || statusConfig.pending;
        return (
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
                {config.label}
            </span>
        );
    };

    const handleReorder = (order) => {
        // Add all items from order to cart
        order.items?.forEach(item => {
            const product = {
                _id: item.product_id?._id || item.product_id,
                id: item.product_id?._id || item.product_id,
                name: item.name,
                price: item.price,
                sale_price: item.price,
                images: item.product_id?.images || [item.image],
                image: item.image
            };
            addToCart(product, item.quantity);
        });
        
        // Show success message and navigate to cart
        // alert(`Đã thêm ${order.items?.length} sản phẩm vào giỏ hàng!`);
        navigate('/cart');
    };

    const handleContactShop = () => {
        // Trigger chatbot - assuming chatbot widget has a global function or event
        const chatButton = document.querySelector('.chatbot-trigger') || 
                          document.querySelector('[data-chatbot]') ||
                          document.querySelector('.chat-widget-button');
        
        if (chatButton) {
            chatButton.click();
        } else {
            // Fallback: dispatch custom event for chatbot
            window.dispatchEvent(new CustomEvent('openChatbot'));
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <FaSpinner className="animate-spin text-4xl text-blue-500 mx-auto mb-4" />
                    <p className="text-gray-600">Đang tải đơn hàng...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <p className="text-red-600 mb-4">{error}</p>
                    <button
                        onClick={() => navigate('/')}
                        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                        Về trang chủ
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-6xl mx-auto px-4">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Lịch sử mua hàng</h1>
                    <p className="text-gray-600">Quản lý và theo dõi đơn hàng của bạn</p>
                </div>

                {/* Orders List */}
                {orders.length === 0 ? (
                    <div className="bg-white rounded-lg shadow-md p-12 text-center">
                        <FaBox className="text-6xl text-gray-300 mx-auto mb-4" />
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">Chưa có đơn hàng nào</h3>
                        <p className="text-gray-600 mb-6">Bạn chưa có đơn hàng nào. Hãy mua sắm ngay!</p>
                        <button
                            onClick={() => navigate('/products')}
                            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                        >
                            Mua sắm ngay
                        </button>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {orders.map((order) => (
                            <div key={order._id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition">
                                {/* Order Header */}
                                <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <div>
                                                <p className="text-sm text-gray-500">Mã đơn hàng</p>
                                                <p className="font-semibold text-gray-900">{order.order_number}</p>
                                            </div>
                                            <div className="h-8 w-px bg-gray-300"></div>
                                            <div>
                                                <p className="text-sm text-gray-500">Ngày đặt</p>
                                                <p className="font-medium text-gray-900">{formatDate(order.createdAt)}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            {getStatusBadge(order.status)}
                                        </div>
                                    </div>
                                </div>

                                {/* Order Body */}
                                <div className="px-6 py-4">
                                    {/* Items List - Vertical Layout */}
                                    <div className="space-y-3 mb-4">
                                        {order.items?.map((item, index) => (
                                            <div key={index} className="flex items-center gap-4 py-3 border-b border-gray-100 last:border-0">
                                                {/* Product Image */}
                                                <img
                                                    src={item.product_id?.images?.[0] || item.image}
                                                    alt={item.name}
                                                    className="w-20 h-20 object-cover rounded-lg border border-gray-200 flex-shrink-0"
                                                />
                                                
                                                {/* Product Info */}
                                                <div className="flex-1 min-w-0">
                                                    <h4 className="text-sm font-medium text-gray-900 mb-1 line-clamp-2">
                                                        {item.name}
                                                    </h4>
                                                    <p className="text-xs text-gray-500 mb-1">
                                                        Phân loại: {item.product_id?.category?.name || item.product_id?.category || 'Chưa phân loại'}
                                                    </p>
                                                    <div className="flex items-center text-sm">
                                                        <span className="text-gray-600">Số lượng: <span className="font-medium">{item.quantity}</span></span>
                                                    </div>
                                                </div>
                                                
                                                {/* Price - Right Side */}
                                                <div className="text-right flex-shrink-0">
                                                    {item.original_price && item.sale_price && item.original_price > item.sale_price ? (
                                                        <>
                                                            <p className="text-xs text-gray-400 line-through">
                                                                {formatPrice(item.original_price)}
                                                            </p>
                                                            <p className="text-base font-bold text-red-600">
                                                                {formatPrice(item.sale_price)}
                                                            </p>
                                                        </>
                                                    ) : (
                                                        <p className="text-base font-bold text-red-600">
                                                            {formatPrice(item.sale_price || item.price)}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Order Footer */}
                                    <div className="pt-4 border-t border-gray-200">
                                        <div className="flex items-center justify-end mb-4">
                                            <div className="text-right">
                                                <p className="text-sm text-gray-500 mb-1">Thành tiền:</p>
                                                <p className="text-2xl font-bold text-red-600">{formatPrice(order.final_total)}</p>
                                            </div>
                                        </div>
                                        
                                        {/* Action Buttons */}
                                        <div className="flex items-center gap-3">
                                            <button
                                                onClick={() => handleReorder(order)}
                                                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
                                            >
                                                <FaShoppingCart />
                                                Mua lại
                                            </button>
                                            <button
                                                onClick={handleContactShop}
                                                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium"
                                            >
                                                <FaComments />
                                                Liên hệ shop
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default OrderHistory;
