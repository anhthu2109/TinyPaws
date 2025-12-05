import { useState, useEffect } from 'react';
import axios from 'axios';
import { 
    FaUsers, 
    FaBox, 
    FaShoppingCart, 
    FaDollarSign,
    FaArrowUp,
    FaArrowDown,
    FaEye,
    FaChartLine
} from 'react-icons/fa';
import { 
    LineChart, 
    Line, 
    XAxis, 
    YAxis, 
    CartesianGrid, 
    Tooltip, 
    ResponsiveContainer,
    BarChart,
    Bar,
    PieChart,
    Pie,
    Cell
} from 'recharts';
import adminApi from '../../api/adminApi';
import { CONFIG } from '../../constants/config';

const Dashboard = () => {
    const [stats, setStats] = useState({});
    const [recentOrders, setRecentOrders] = useState([]);
    const [chartData, setChartData] = useState({
        revenue: [],
        orders: [],
        categories: []
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            setLoading(true);
            
            const token = localStorage.getItem('token');

            // Fetch all dashboard data in parallel
            const [statsRes, ordersRes, revenueRes] = await Promise.all([
                adminApi.get('/dashboard/stats'),
                axios.get(`${CONFIG.API.BASE_URL}/api/orders`, {
                    params: { limit: 5, page: 1 },
                    headers: token ? { Authorization: `Bearer ${token}` } : {}
                }),
                adminApi.get('/dashboard/revenue-chart')
            ]);

            if (statsRes.data.success) {
                setStats(statsRes.data.data);
            }

            if (ordersRes.data.success) {
                setRecentOrders(ordersRes.data.data.orders);
            }

            if (revenueRes.data.success) {
                setChartData(revenueRes.data.data);
            }

        } catch (error) {
            console.error('Error fetching dashboard data:', error);
            // Fallback to mock data if API fails
            setStats({
                totalUsers: 1234,
                totalProducts: 567,
                totalOrders: 89,
                totalRevenue: 45200000,
                userGrowth: 12,
                productGrowth: 5,
                orderGrowth: -3,
                revenueGrowth: 18
            });
            
            setRecentOrders([
                { _id: '1', order_number: '#001', user: { full_name: 'Nguyễn Văn A' }, final_total: 1250000, status: 'delivered' },
                { _id: '2', order_number: '#002', user: { full_name: 'Trần Thị B' }, final_total: 890000, status: 'processing' },
                { _id: '3', order_number: '#003', user: { full_name: 'Lê Văn C' }, final_total: 2100000, status: 'confirmed' },
                { _id: '4', order_number: '#004', user: { full_name: 'Phạm Thị D' }, final_total: 650000, status: 'pending' },
            ]);

            // Mock chart data
            setChartData({
                revenue: [
                    { name: 'T1', value: 4000000 },
                    { name: 'T2', value: 3000000 },
                    { name: 'T3', value: 5000000 },
                    { name: 'T4', value: 4500000 },
                    { name: 'T5', value: 6000000 },
                    { name: 'T6', value: 5500000 },
                    { name: 'T7', value: 7000000 }
                ],
                orders: [
                    { name: 'T1', orders: 45 },
                    { name: 'T2', orders: 52 },
                    { name: 'T3', orders: 48 },
                    { name: 'T4', orders: 61 },
                    { name: 'T5', orders: 55 },
                    { name: 'T6', orders: 67 },
                    { name: 'T7', orders: 73 }
                ],
                categories: [
                    { name: 'Thức ăn chó', value: 35, color: '#ff5252' },
                    { name: 'Thức ăn mèo', value: 30, color: '#2196f3' },
                    { name: 'Phụ kiện', value: 20, color: '#4caf50' },
                    { name: 'Đồ chơi', value: 15, color: '#ff9800' }
                ]
            });
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

    const formatNumber = (num) => {
        if (num >= 1000000) {
            return (num / 1000000).toFixed(1) + 'M';
        } else if (num >= 1000) {
            return (num / 1000).toFixed(1) + 'K';
        }
        return num.toString();
    };

    const getStatusLabel = (status) => {
        const statusMap = {
            pending: 'Chờ xử lý',
            confirmed: 'Đã xác nhận',
            processing: 'Đang xử lý',
            shipping: 'Đang giao',
            delivered: 'Đã giao',
            cancelled: 'Đã hủy'
        };
        return statusMap[status] || status;
    };

    const statsCards = [
        {
            title: 'Tổng người dùng',
            value: formatNumber(stats.totalUsers || 0),
            change: `${stats.userGrowth > 0 ? '+' : ''}${stats.userGrowth || 0}%`,
            changeType: (stats.userGrowth || 0) >= 0 ? 'increase' : 'decrease',
            icon: FaUsers,
            color: 'bg-blue-500'
        },
        {
            title: 'Sản phẩm',
            value: formatNumber(stats.totalProducts || 0),
            change: `${stats.productGrowth > 0 ? '+' : ''}${stats.productGrowth || 0}%`,
            changeType: (stats.productGrowth || 0) >= 0 ? 'increase' : 'decrease',
            icon: FaBox,
            color: 'bg-green-500'
        },
        {
            title: 'Đơn hàng',
            value: formatNumber(stats.totalOrders || 0),
            change: `${stats.orderGrowth > 0 ? '+' : ''}${stats.orderGrowth || 0}%`,
            changeType: (stats.orderGrowth || 0) >= 0 ? 'increase' : 'decrease',
            icon: FaShoppingCart,
            color: 'bg-orange-500'
        },
        {
            title: 'Doanh thu',
            value: formatNumber(stats.totalRevenue || 0),
            change: `${stats.revenueGrowth > 0 ? '+' : ''}${stats.revenueGrowth || 0}%`,
            changeType: (stats.revenueGrowth || 0) >= 0 ? 'increase' : 'decrease',
            icon: FaDollarSign,
            color: 'bg-purple-500'
        }
    ];

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold text-gray-800">Bảng điều khiển</h2>
                    <p className="text-gray-600 mt-2">
                        Tổng quan về hoạt động kinh doanh của TinyPaws
                    </p>
                </div>
            </div>

            {/* Loading State */}
            {loading ? (
                <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#ff5252]"></div>
                    <span className="ml-3 text-gray-600">Đang tải dữ liệu dashboard...</span>
                </div>
            ) : (
                <>
                    {/* Charts Row */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Revenue Chart */}
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-semibold text-gray-800">Doanh thu 30 ngày gần nhất</h3>
                                <FaChartLine className="text-[#ff5252]" />
                            </div>
                            <ResponsiveContainer width="100%" height={300}>
                                <LineChart data={chartData.revenue}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="name" />
                                    <YAxis tickFormatter={(value) => formatNumber(value)} />
                                    <Tooltip formatter={(value) => [formatPrice(value), 'Doanh thu']} />
                                    <Line 
                                        type="monotone" 
                                        dataKey="value" 
                                        stroke="#ff5252" 
                                        strokeWidth={3}
                                        dot={{ fill: '#ff5252', strokeWidth: 2, r: 4 }}
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>

                        {/* Orders Chart */}
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-semibold text-gray-800">Đơn hàng 30 ngày gần nhất</h3>
                                <FaShoppingCart className="text-blue-500" />
                            </div>
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart data={chartData.orders}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="name" />
                                    <YAxis />
                                    <Tooltip formatter={(value) => [value, 'Đơn hàng']} />
                                    <Bar dataKey="orders" fill="#2196f3" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Bottom Row */}
                    <div className="grid grid-cols-1 lg:grid-cols-5 gap-5 items-stretch">
                        {/* Category Distribution */}
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 lg:col-span-2">
                            <h3 className="text-sm sm:text-base font-semibold text-gray-800 mb-2">Phân bố danh mục</h3>                      
                            <div className="flex-1">
                                <ResponsiveContainer width="100%" height={280}>
                                    <PieChart>
                                        <Pie
                                            data={chartData.categories}
                                            cx="50%"
                                            cy="50%"
                                            outerRadius={90}
                                            dataKey="value"
                                            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                            labelStyle={{ fontSize: 12 }}
                                        >
                                            {chartData.categories.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} />
                                            ))}
                                        </Pie>
                                        <Tooltip />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Recent Orders */}
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 lg:col-span-3">
                            <div className="flex items-center justify-between mb-2">
                                <h3 className="text-sm sm:text-base font-semibold text-gray-800">Đơn hàng gần đây</h3>
                                <a href="/admin/orders" className="text-[#ff5252] hover:underline text-xs">
                                    Xem tất cả
                                </a>
                            </div>

                            <div className="overflow-x-auto flex-1">
                                <table className="w-full">
                                    <thead>
                                        <tr className="border-b border-gray-200">
                                            <th className="text-left py-1.5 text-xs font-medium text-gray-600">Mã đơn</th>
                                            <th className="text-left py-1.5 text-xs font-medium text-gray-600">Khách hàng</th>
                                            <th className="text-left py-1.5 text-xs font-medium text-gray-600">Số tiền</th>
                                            <th className="text-left py-1.5 text-xs font-medium text-gray-600">Trạng thái</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {recentOrders.map((order, index) => (
                                            <tr key={order._id || index} className="border-b border-gray-100">
                                                <td className="py-1.5 text-xs font-medium text-gray-800">
                                                    {order.order_number}
                                                </td>
                                                <td className="py-1.5 text-xs text-gray-600">
                                                    {order.user?.full_name}
                                                </td>
                                                <td className="py-1.5 text-xs text-gray-800 font-medium">
                                                    {formatPrice(order.final_total)}
                                                </td>
                                                <td className="py-1.5">
                                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
                                                        order.status === 'delivered' ? 'bg-green-100 text-green-800' :
                                                        order.status === 'processing' ? 'bg-blue-100 text-blue-800' :
                                                        order.status === 'confirmed' ? 'bg-yellow-100 text-yellow-800' :
                                                        'bg-red-100 text-red-800'
                                                    }`}>
                                                        {getStatusLabel(order.status)}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                </div>
                  
                </>
            )}
        </div>
    );
};

export default Dashboard;
