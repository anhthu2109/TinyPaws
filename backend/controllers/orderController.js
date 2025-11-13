const Order = require('../models/Order');
const Product = require('../models/Product');

// Try to import Cart model, but don't fail if it doesn't exist
let Cart;
try {
    Cart = require('../models/Cart');
} catch (error) {
    Cart = null;
}

// ========== TẠO ĐƠN HÀNG ==========
exports.createOrder = async (req, res) => {
  try {
    const userId = req.user?._id || req.body.user;
    if (!userId) {
      return res.status(400).json({ message: 'Thiếu thông tin người dùng.' });
    }

    const { items, shipping_address, payment_method, notes } = req.body;

    if (!items || !items.length) {
      return res.status(400).json({ message: 'Đơn hàng không có sản phẩm nào.' });
    }

    // Kiểm tra tồn tại sản phẩm và cập nhật giá hiện tại
    const validatedItems = await Promise.all(
      items.map(async (item) => {
        const product = await Product.findById(item.product_id);
        if (!product) throw new Error(`Không tìm thấy sản phẩm: ${item.name || item.product_id}`);
        
        // Xác định giá gốc và giá sale
        const originalPrice = product.price;
        const salePrice = product.sale_price || product.price;
        
        return {
          product_id: product._id,
          name: product.name,
          price: salePrice,  // Giá hiện tại (sale hoặc gốc)
          original_price: originalPrice,  // Giá gốc
          sale_price: salePrice,  // Giá sale
          quantity: item.quantity,
          discount: item.discount || 0,
          image: product.images?.[0] || null,
        };
      })
    );

    // Tạo đơn hàng mới (model sẽ tự tính toán tổng giá trị)
    const order = new Order({
      user: userId,
      items: validatedItems,
      shipping_address,
      payment_method,
      notes: notes || '',
      shipping_fee: req.body.shipping_fee || 30000, // default 30k
      discount_amount: req.body.discount_amount || 0,
      status: 'pending',
      payment_status: payment_method === 'paypal' ? 'completed' : 'pending',
    });

    const savedOrder = await order.save();

    // Xoá giỏ hàng của người dùng sau khi đặt hàng (nếu có)
    if (Cart) {
      await Cart.findOneAndUpdate({ user: userId }, { items: [] });
    }

    const populatedOrder = await savedOrder.populate([
      { path: 'user', select: 'full_name email' },
      { 
        path: 'items.product_id', 
        select: 'name images category',
        populate: { path: 'category', select: 'name' }
      },
    ]);

    res.status(201).json({
      message: 'Đặt hàng thành công!',
      order: populatedOrder,
    });
  } catch (error) {
    console.error('Lỗi tạo đơn hàng:', error);
    res.status(500).json({ message: 'Tạo đơn hàng thất bại', error: error.message });
  }
};

// ========== LẤY TẤT CẢ ĐƠN HÀNG ==========
exports.getAllOrders = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const search = req.query.search || '';
    const status = req.query.status || '';

    // Build query
    const query = {};
    if (status) query.status = status;
    if (search) {
      query.$or = [
        { order_number: { $regex: search, $options: 'i' } },
        { 'shipping_address.full_name': { $regex: search, $options: 'i' } },
        { 'shipping_address.phone': { $regex: search, $options: 'i' } }
      ];
    }

    const total = await Order.countDocuments(query);
    const orders = await Order.find(query)
      .populate('user', 'full_name email')
      .populate({
        path: 'items.product_id',
        select: 'name images category',
        populate: { path: 'category', select: 'name' }
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.status(200).json({
      success: true,
      data: {
        orders,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalOrders: total,
          limit
        }
      }
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: 'Không thể tải danh sách đơn hàng', 
      error: error.message 
    });
  }
};

// ========== LẤY ĐƠN HÀNG THEO USER ==========
exports.getOrdersByUser = async (req, res) => {
  try {
    const userId = req.user?._id || req.params.userId;
    const orders = await Order.find({ user: userId })
      .populate({
        path: 'items.product_id',
        select: 'name images category',
        populate: { path: 'category', select: 'name' }
      })
      .sort({ createdAt: -1 });

    res.status(200).json(orders);
  } catch (error) {
    res.status(500).json({ message: 'Không thể tải đơn hàng của người dùng', error: error.message });
  }
};

// ========== LẤY CHI TIẾT ĐƠN HÀNG ==========
exports.getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('user', 'full_name email')
      .populate({
        path: 'items.product_id',
        select: 'name images category',
        populate: { path: 'category', select: 'name' }
      });

    if (!order) {
      return res.status(404).json({ 
        success: false,
        message: 'Không tìm thấy đơn hàng.' 
      });
    }

    res.status(200).json({
      success: true,
      data: order
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: 'Lỗi khi lấy chi tiết đơn hàng', 
      error: error.message 
    });
  }
};

// ========== CẬP NHẬT TRẠNG THÁI ==========
exports.updateOrderStatus = async (req, res) => {
  try {
    const { status, reason } = req.body;
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ message: 'Không tìm thấy đơn hàng.' });
    }

    await order.updateStatus(status, reason);

    res.status(200).json({ message: 'Cập nhật trạng thái thành công', order });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi cập nhật đơn hàng', error: error.message });
  }
};

// ========== XOÁ ĐƠN HÀNG ==========
exports.deleteOrder = async (req, res) => {
  try {
    const order = await Order.findByIdAndDelete(req.params.id);
    if (!order) return res.status(404).json({ message: 'Không tìm thấy đơn hàng để xoá.' });

    res.status(200).json({ message: 'Đã xoá đơn hàng thành công.' });
  } catch (error) {
    res.status(500).json({ message: 'Không thể xoá đơn hàng', error: error.message });
  }
};

// ========== THỐNG KÊ ==========
exports.getOrderStats = async (req, res) => {
  try {
    const stats = await Order.getOrderStats();
    res.status(200).json(stats);
  } catch (error) {
    res.status(500).json({ message: 'Không thể lấy thống kê đơn hàng', error: error.message });
  }
};
