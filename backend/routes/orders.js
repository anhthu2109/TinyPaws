const express = require('express');
const router = express.Router();
const {
  createOrder,
  getAllOrders,
  getOrdersByUser,
  getOrderById,
  updateOrderStatus,
  deleteOrder,
  getOrderStats,
} = require('../controllers/orderController');

const { auth, adminAuth } = require('../middleware/auth'); // 👈 Dùng đúng tên middleware bạn có

// ===============================
//         ORDER ROUTES
// ===============================

// 🧾 Tạo đơn hàng mới
router.post('/', auth, createOrder);

// 📊 Lấy thống kê đơn hàng (MUST BE BEFORE /:id)
router.get('/stats/summary', adminAuth, getOrderStats);

// 📦 Lấy tất cả đơn hàng (Admin)
router.get('/', adminAuth, getAllOrders);

// 👤 Lấy danh sách đơn hàng của user
router.get('/user/:userId', auth, getOrdersByUser);

// 🔍 Lấy chi tiết đơn hàng theo ID
router.get('/:id', auth, getOrderById);

// 🔄 Cập nhật trạng thái đơn hàng
router.put('/:id/status', adminAuth, updateOrderStatus);

// ❌ Xoá đơn hàng
router.delete('/:id', adminAuth, deleteOrder);

module.exports = router;
