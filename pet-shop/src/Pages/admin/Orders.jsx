import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { FaEye, FaEdit, FaSearch, FaFilter, FaDownload, FaTrash, FaTimes } from 'react-icons/fa';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL?.replace(/\/$/, "") || "/api";

const Orders = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [stats, setStats] = useState({});
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [showDetailModal, setShowDetailModal] = useState(false);

    useEffect(() => {
        fetchOrders();
        fetchOrderStats();
    }, [currentPage, searchTerm, statusFilter]);

    const fetchOrders = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            const params = {
                page: currentPage,
                limit: 10,
                ...(searchTerm && { search: searchTerm }),
                ...(statusFilter && { status: statusFilter })
            };
            
            const response = await axios.get(`${API_BASE_URL}/orders`, { 
                params,
                headers: { Authorization: `Bearer ${token}` }
            });
            
            if (response.data.success) {
                setOrders(response.data.data.orders);
                setTotalPages(response.data.data.pagination.totalPages);
            }
        } catch (error) {
            // Error fetching orders
        } finally {
            setLoading(false);
        }
    };

    const fetchOrderStats = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(`${API_BASE_URL}/orders/stats/summary`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (response.data.success) {
                setStats(response.data.data);
            }
        } catch (error) {
            // Error fetching order stats
        }
    };

    const updateOrderStatus = async (orderId, newStatus) => {
        try {
            const token = localStorage.getItem('token');
            await axios.put(`${API_BASE_URL}/orders/${orderId}/status`, {
                status: newStatus
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchOrders();
            fetchOrderStats();
            if (selectedOrder?._id === orderId) {
                setSelectedOrder({ ...selectedOrder, status: newStatus });
            }
        } catch (error) {
            alert('Có lỗi xảy ra khi cập nhật trạng thái đơn hàng');
        }
    };

    const deleteOrder = async (orderId) => {
        if (!confirm('Bạn có chắc chắn muốn xóa đơn hàng này?')) return;
        
        try {
            const token = localStorage.getItem('token');
            await axios.delete(`${API_BASE_URL}/orders/${orderId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchOrders();
            fetchOrderStats();
            // alert('Xóa đơn hàng thành công');
        } catch (error) {
            // Error deleting order
        }
    };

    const viewOrderDetail = (order) => {
        setSelectedOrder(order);
        setShowDetailModal(true);
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
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
                {config.label}
            </span>
        );
    };

    const getPaymentStatusBadge = (order) => {
        // Nếu payment_method là paypal thì tự động là "Đã thanh toán"
        const status = order.payment_method === 'paypal' ? 'paid' : (order.payment_status || 'pending');
        
        const statusConfig = {
            pending: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Chờ thanh toán' },
            paid: { bg: 'bg-green-100', text: 'text-green-800', label: 'Đã thanh toán' },
            failed: { bg: 'bg-red-100', text: 'text-red-800', label: 'Thất bại' }
        };
        
        const config = statusConfig[status] || statusConfig.pending;
        return (
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
                {config.label}
            </span>
        );
    };

    const getPaymentMethodBadge = (paymentMethod) => {
        if (paymentMethod === 'paypal') {
            return (
                <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    PayPal
                </span>
            );
        }
        return (
            <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                COD
            </span>
        );
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold text-gray-800">Quản lý đơn hàng</h2>
                    <p className="text-gray-600 mt-2">Theo dõi và xử lý đơn hàng của khách hàng</p>
                </div>
                <button className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                    <FaDownload />
                    <span>Xuất báo cáo</span>
                </button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600 mb-1">Tổng đơn hàng</p>
                            <p className="text-3xl font-bold text-gray-800">{stats.totalOrders || 0}</p>
                        </div>
                        <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center">
                            <FaEye className="text-white text-xl" />
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600 mb-1">Chờ xử lý</p>
                            <p className="text-3xl font-bold text-yellow-600">{stats.pendingOrders || 0}</p>
                        </div>
                        <div className="w-12 h-12 bg-yellow-500 rounded-lg flex items-center justify-center">
                            <FaEdit className="text-white text-xl" />
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600 mb-1">Đã giao</p>
                            <p className="text-3xl font-bold text-green-600">{stats.deliveredOrders || 0}</p>
                        </div>
                        <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center">
                            <FaEye className="text-white text-xl" />
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600 mb-1">Doanh thu</p>
                            <p className="text-2xl font-bold text-purple-600">{formatPrice(stats.totalRevenue || 0)}</p>
                        </div>
                        <div className="w-12 h-12 bg-purple-500 rounded-lg flex items-center justify-center">
                            <span className="text-white text-xl">₫</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Search */}
                    <div className="relative">
                        <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Tìm kiếm đơn hàng..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#ff5252] focus:border-transparent"
                        />
                    </div>

                    {/* Status Filter */}
                    <div className="relative">
                        <FaFilter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#ff5252] focus:border-transparent appearance-none"
                        >
                            <option value="">Tất cả trạng thái</option>
                            <option value="pending">Chờ xử lý</option>
                            <option value="confirmed">Đã xác nhận</option>
                            <option value="processing">Đang xử lý</option>
                            <option value="shipping">Đang giao</option>
                            <option value="delivered">Đã giao</option>
                            <option value="cancelled">Đã hủy</option>
                        </select>
                    </div>

                    {/* Reset Filters */}
                    <button
                        onClick={() => {
                            setSearchTerm('');
                            setStatusFilter('');
                            setCurrentPage(1);
                        }}
                        className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                        Đặt lại bộ lọc
                    </button>
                </div>
            </div>

            {/* Orders Table */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                {loading ? (
                    <div className="flex items-center justify-center py-12">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#ff5252]"></div>
                        <span className="ml-2 text-gray-600">Đang tải...</span>
                    </div>
                ) : (
                    <>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Mã đơn hàng
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Khách hàng
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Ngày đặt
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Tổng tiền
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            PT thanh toán
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Thanh toán
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Trạng thái
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Thao tác
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {orders.map((order) => (
                                        <tr key={order._id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm font-medium text-gray-900">
                                                    {order.order_number}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-sm font-medium text-gray-900">{order.shipping_address?.full_name}</div>
                                                <div className="text-sm text-gray-500">{order.shipping_address?.phone}</div>
                                                <div className="text-xs text-gray-400 mt-1 max-w-xs truncate">{order.shipping_address?.address}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                {formatDate(order.createdAt)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                {formatPrice(order.final_total)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                {getPaymentMethodBadge(order.payment_method)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                {getPaymentStatusBadge(order)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <select
                                                    value={order.status}
                                                    onChange={(e) => updateOrderStatus(order._id, e.target.value)}
                                                    className="text-sm border border-gray-300 rounded px-2 py-1 focus:ring-2 focus:ring-[#ff5252] focus:border-transparent"
                                                >
                                                    <option value="pending">Chờ xử lý</option>
                                                    <option value="confirmed">Đã xác nhận</option>
                                                    <option value="processing">Đang xử lý</option>
                                                    <option value="shipping">Đang giao</option>
                                                    <option value="delivered">Đã giao</option>
                                                    <option value="cancelled">Đã hủy</option>
                                                </select>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                <div className="flex items-center gap-2">
                                                    <button 
                                                        onClick={() => viewOrderDetail(order)}
                                                        className="text-blue-600 hover:text-blue-900 p-2 hover:bg-blue-50 rounded"
                                                        title="Xem chi tiết"
                                                    >
                                                        <FaEye />
                                                    </button>
                                                    <button 
                                                        onClick={() => deleteOrder(order._id)}
                                                        className="text-red-600 hover:text-red-900 p-2 hover:bg-red-50 rounded"
                                                        title="Xóa đơn hàng"
                                                    >
                                                        <FaTrash />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200">
                                <div className="flex-1 flex justify-between sm:hidden">
                                    <button
                                        onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                                        disabled={currentPage === 1}
                                        className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                                    >
                                        Trước
                                    </button>
                                    <button
                                        onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                                        disabled={currentPage === totalPages}
                                        className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                                    >
                                        Sau
                                    </button>
                                </div>
                                <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                                    <div>
                                        <p className="text-sm text-gray-700">
                                            Trang <span className="font-medium">{currentPage}</span> của{' '}
                                            <span className="font-medium">{totalPages}</span>
                                        </p>
                                    </div>
                                    <div>
                                        <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                                            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                                                <button
                                                    key={page}
                                                    onClick={() => setCurrentPage(page)}
                                                    className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                                                        page === currentPage
                                                            ? 'z-10 bg-[#ff5252] border-[#ff5252] text-white'
                                                            : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                                                    }`}
                                                >
                                                    {page}
                                                </button>
                                            ))}
                                        </nav>
                                    </div>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Order Detail Modal */}
            {showDetailModal && selectedOrder && createPortal(
            <div 
                className="fixed inset-0 bg-black/25 backdrop-blur-sm flex items-center justify-center z-[99999] p-4"
                onClick={() => setShowDetailModal(false)}
            >
                <div 
                    className="bg-white rounded-xl shadow-2xl max-w-3xl w-full p-6 overflow-y-auto max-h-[90vh]"
                    onClick={(e) => e.stopPropagation()}
                >

                {/* Header */}
                <div className="sticky top-0 bg-white border-b border-gray-200 pb-1 mb-2 flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900">Chi tiết đơn hàng</h3>
                    <button
                    onClick={() => setShowDetailModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                    >
                    <FaTimes size={20} />
                    </button>
                </div>

                {/* Nội dung */}
                <div className="space-y-5 text-[13.5px] leading-relaxed">

                    {/* Thông tin chung */}
                    <div className="grid grid-cols-2 gap-3">
                    <div>
                        <p className="text-sm text-gray-500">Mã đơn hàng</p>
                        <p className="font-medium text-gray-900">{selectedOrder.order_number}</p>
                    </div>
                    <div>
                        <p className="text-sm text-gray-500">Thời gian đặt</p>
                        <p className="font-medium text-gray-900">{formatDate(selectedOrder.createdAt)}</p>
                    </div>
                    </div>

                    {/* Hai cột chính */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    
                    {/* Thông tin khách hàng */}
                    <div className="border rounded-lg p-4 bg-gray-50">
                        <h4 className="font-semibold text-gray-900 mb-2 text-[13px] uppercase">Thông tin khách hàng</h4>
                        <div className="space-y-1.5 text-[13px]">
                        <p><span className="text-gray-600">Họ tên:</span> {selectedOrder.shipping_address?.full_name}</p>
                        <p><span className="text-gray-600">Số điện thoại:</span> {selectedOrder.shipping_address?.phone}</p>
                        <p><span className="text-gray-600">Email:</span> {selectedOrder.shipping_address?.email || 'Không có'}</p>
                        <p><span className="text-gray-600">Địa chỉ:</span> {selectedOrder.shipping_address?.address}
                            {selectedOrder.shipping_address?.ward && `, ${selectedOrder.shipping_address.ward}`}
                            {selectedOrder.shipping_address?.district && `, ${selectedOrder.shipping_address.district}`}
                            {selectedOrder.shipping_address?.city && `, ${selectedOrder.shipping_address.city}`}
                        </p>
                        </div>
                    </div>

                    {/* Thanh toán & trạng thái */}
                    <div className="border rounded-lg p-4 bg-gray-50">
                        <h4 className="font-semibold text-gray-900 mb-2 text-[13px] uppercase">Thanh toán & Trạng thái</h4>
                        <div className="space-y-1.5 text-[13px]">
                        <p><span className="text-gray-600">Phương thức:</span> {selectedOrder.payment_method === 'paypal' ? 'PayPal' : 'COD'}</p>
                        <p><span className="text-gray-600">TT thanh toán:</span> {getPaymentStatusBadge(selectedOrder)}</p>
                        <p><span className="text-gray-600">TT đơn hàng:</span> {getStatusBadge(selectedOrder.status)}</p>
                        </div>
                    </div>
                    </div>

                    {/* Bảng sản phẩm */}
                    <div className="border-t pt-3">
                    <h4 className="font-semibold text-gray-900 mb-2 text-[13px] uppercase">Sản phẩm</h4>
                    <div className="overflow-x-auto">
                        <table className="w-full text-[13px]">
                        <thead className="bg-gray-50">
                            <tr>
                            <th className="px-3 py-2 text-left font-medium text-gray-500">Sản phẩm</th>
                            <th className="px-3 py-2 text-right font-medium text-gray-500">SL</th>
                            <th className="px-3 py-2 text-right font-medium text-gray-500">Giá</th>
                            <th className="px-3 py-2 text-right font-medium text-gray-500">Giảm</th>
                            <th className="px-3 py-2 text-right font-medium text-gray-500">Tổng</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {selectedOrder.items?.map((item, i) => (
                            <tr key={i}>
                                <td className="px-3 py-2 flex items-center gap-2">
                                <img src={item.product_id?.images?.[0] || item.image} className="w-9 h-9 rounded object-cover" />
                                <span className="truncate">{item.name}</span>
                                </td>
                                <td className="px-3 py-2 text-right">{item.quantity}</td>
                                <td className="px-3 py-2 text-right">{formatPrice(item.price)}</td>
                                <td className="px-3 py-2 text-right">{formatPrice(item.discount || 0)}</td>
                                <td className="px-3 py-2 text-right font-medium">{formatPrice(item.price * item.quantity - (item.discount || 0))}</td>
                            </tr>
                            ))}
                        </tbody>
                        </table>
                    </div>
                    </div>

                    {/* Tổng cộng */}
                    <div className="border-t pt-3 space-y-1.5 text-[13px]">
                    <div className="flex justify-between">
                        <span className="text-gray-600">Tạm tính</span>
                        <span className="font-medium">{formatPrice(selectedOrder.sub_total || 0)}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-gray-600">Phí vận chuyển</span>
                        <span className="font-medium">{formatPrice(selectedOrder.shipping_fee || 0)}</span>
                    </div>
                    {selectedOrder.discount_amount > 0 && (
                        <div className="flex justify-between text-red-600">
                        <span>Giảm giá</span>
                        <span>-{formatPrice(selectedOrder.discount_amount)}</span>
                        </div>
                    )}
                    <div className="flex justify-between text-[14px] font-bold border-t pt-2 mt-2">
                        <span className="text-gray-900">Tổng cộng</span>
                        <span className="text-blue-600">{formatPrice(selectedOrder.final_total)}</span>
                    </div>
                    </div>

                    {/* Ghi chú */}
                    {selectedOrder.notes && (
                    <div className="border-t pt-3">
                        <h4 className="font-semibold text-gray-900 mb-1.5 text-[13px] uppercase">Ghi chú</h4>
                        <p className="text-[13px] text-gray-700">{selectedOrder.notes}</p>
                    </div>
                    )}
                </div>
                </div>
            </div>,
            document.body
            )}
        </div>
    );
};

export default Orders;
