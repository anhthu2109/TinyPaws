const User = require('../models/User');
const Product = require('../models/Product');
const Order = require('../models/Order');

// @desc    Get dashboard statistics
// @route   GET /api/admin/dashboard/stats
// @access  Private/Admin
const getDashboardStats = async (req, res) => {
    try {
        // Get current date for comparisons
        const now = new Date();
        const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
        
        // Get total counts
        const [totalUsers, totalProducts, totalOrders] = await Promise.all([
            User.countDocuments({ role: 'user' }),
            Product.countDocuments(),
            Order.countDocuments()
        ]);

        // Get total revenue
        const revenueResult = await Order.aggregate([
            { $match: { status: { $in: ['delivered', 'processing', 'confirmed'] } } },
            { $group: { _id: null, total: { $sum: '$final_total' } } }
        ]);
        const totalRevenue = revenueResult.length > 0 ? revenueResult[0].total : 0;

        // Get growth percentages (compared to last month)
        const [lastMonthUsers, lastMonthProducts, lastMonthOrders] = await Promise.all([
            User.countDocuments({ role: 'user', createdAt: { $lt: lastMonth } }),
            Product.countDocuments({ createdAt: { $lt: lastMonth } }),
            Order.countDocuments({ createdAt: { $lt: lastMonth } })
        ]);

        const lastMonthRevenueResult = await Order.aggregate([
            { 
                $match: { 
                    status: { $in: ['delivered', 'processing', 'confirmed'] },
                    createdAt: { $lt: lastMonth }
                } 
            },
            { $group: { _id: null, total: { $sum: '$final_total' } } }
        ]);
        const lastMonthRevenue = lastMonthRevenueResult.length > 0 ? lastMonthRevenueResult[0].total : 0;

        // Calculate growth percentages
        const userGrowth = lastMonthUsers > 0 ? Math.round(((totalUsers - lastMonthUsers) / lastMonthUsers) * 100) : 0;
        const productGrowth = lastMonthProducts > 0 ? Math.round(((totalProducts - lastMonthProducts) / lastMonthProducts) * 100) : 0;
        const orderGrowth = lastMonthOrders > 0 ? Math.round(((totalOrders - lastMonthOrders) / lastMonthOrders) * 100) : 0;
        const revenueGrowth = lastMonthRevenue > 0 ? Math.round(((totalRevenue - lastMonthRevenue) / lastMonthRevenue) * 100) : 0;

        res.json({
            success: true,
            data: {
                totalUsers,
                totalProducts,
                totalOrders,
                totalRevenue,
                userGrowth,
                productGrowth,
                orderGrowth,
                revenueGrowth
            }
        });

    } catch (error) {
        console.error('Error getting dashboard stats:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server khi lấy thống kê dashboard',
            error: error.message
        });
    }
};

// @desc    Get revenue chart data
// @route   GET /api/admin/dashboard/revenue-chart
// @access  Private/Admin
const getRevenueChartData = async (req, res) => {
    try {
        // Get last 7 days revenue data
        const last7Days = [];
        for (let i = 6; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            date.setHours(0, 0, 0, 0);
            
            const nextDate = new Date(date);
            nextDate.setDate(nextDate.getDate() + 1);
            
            const dayRevenue = await Order.aggregate([
                {
                    $match: {
                        status: { $in: ['delivered', 'processing', 'confirmed'] },
                        createdAt: { $gte: date, $lt: nextDate }
                    }
                },
                { $group: { _id: null, total: { $sum: '$final_total' } } }
            ]);
            
            const dayOrders = await Order.countDocuments({
                createdAt: { $gte: date, $lt: nextDate }
            });

            last7Days.push({
                name: `T${i === 0 ? 'hôm nay' : i}`,
                value: dayRevenue.length > 0 ? dayRevenue[0].total : 0,
                orders: dayOrders
            });
        }

        // Get category distribution
        const categoryData = await Order.aggregate([
            { $unwind: '$items' },
            {
                $lookup: {
                    from: 'products',
                    localField: 'items.product_id',
                    foreignField: '_id',
                    as: 'product'
                }
            },
            { $unwind: '$product' },
            {
                $group: {
                    _id: '$product.category',
                    count: { $sum: '$items.quantity' },
                    revenue: { $sum: { $multiply: ['$items.quantity', '$items.price'] } }
                }
            },
            { $sort: { count: -1 } },
            { $limit: 5 }
        ]);

        const colors = ['#ff5252', '#2196f3', '#4caf50', '#ff9800', '#9c27b0'];
        const categories = categoryData.map((item, index) => ({
            name: item._id || 'Khác',
            value: item.count,
            revenue: item.revenue,
            color: colors[index] || '#607d8b'
        }));

        res.json({
            success: true,
            data: {
                revenue: last7Days,
                orders: last7Days.map(day => ({ name: day.name, orders: day.orders })),
                categories
            }
        });

    } catch (error) {
        console.error('Error getting revenue chart data:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server khi lấy dữ liệu biểu đồ',
            error: error.message
        });
    }
};

module.exports = {
    getDashboardStats,
    getRevenueChartData
};
