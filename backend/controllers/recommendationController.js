const Product = require('../models/Product');
const ProductView = require('../models/ProductView');
const Wishlist = require('../models/Wishlist');
const Cart = require('../models/Cart');
const Order = require('../models/Order');

/**
 * Recommendation System - Content-Based + Collaborative Filtering
 * 
 * Logic:
 * 1. Lấy hành vi user: viewed, wishlist, cart, orders
 * 2. Tính điểm ưu tiên cho mỗi loại hành vi
 * 3. Tìm sản phẩm liên quan dựa trên category và tags
 * 4. Kết hợp popularity score
 * 5. Loại bỏ sản phẩm đã mua/đã có trong giỏ
 */

// Lấy recommendations cho user
const getRecommendations = async (req, res) => {
    try {
        const { userId } = req.params;
        const { limit = 10 } = req.query;

        // 1. Lấy hành vi user (30 ngày gần nhất)
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

        const [viewedProducts, wishlistProducts, cartProducts, orderProducts, removedWishlist, removedCart] = await Promise.all([
            // Sản phẩm đã xem (7 ngày gần nhất)
            ProductView.find({
                user: userId,
                viewed_at: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
            })
                .populate('product')
                .sort({ viewed_at: -1 })
                .limit(20)
                .lean(),

            // Sản phẩm trong wishlist (ACTIVE only)
            Wishlist.find({ 
                user: userId,
                status: 'active'
            })
                .populate('product')
                .sort({ added_at: -1 })
                .lean(),

            // Sản phẩm trong giỏ hàng (ACTIVE only)
            Cart.find({ 
                user: userId,
                status: 'active'
            })
                .populate('product')
                .lean(),

            // Sản phẩm đã mua (30 ngày gần nhất)
            Order.find({
                user: userId,
                createdAt: { $gte: thirtyDaysAgo },
                status: { $in: ['completed', 'processing', 'shipped'] }
            })
                .populate('items.product')
                .lean(),

            // Sản phẩm đã XÓA khỏi wishlist (để phân tích)
            Wishlist.find({
                user: userId,
                status: 'removed'
            })
                .select('product')
                .lean(),

            // Sản phẩm đã XÓA khỏi cart (để phân tích)
            Cart.find({
                user: userId,
                status: 'removed'
            })
                .select('product')
                .lean()
        ]);

        // 2. Extract product IDs và categories/tags
        const viewedIds = viewedProducts.map(v => v.product?._id).filter(Boolean);
        const wishlistIds = wishlistProducts.map(w => w.product?._id).filter(Boolean);
        const cartIds = cartProducts.map(c => c.product?._id).filter(Boolean);
        const orderIds = orderProducts.flatMap(o =>
            o.items.map(item => item.product?._id).filter(Boolean)
        );
        
        // Sản phẩm đã removed (để LOẠI BỎ khỏi recommendations)
        const removedWishlistIds = removedWishlist.map(w => w.product?.toString()).filter(Boolean);
        const removedCartIds = removedCart.map(c => c.product?.toString()).filter(Boolean);
        const excludeIds = [...new Set([...removedWishlistIds, ...removedCartIds])];

        // Tất cả product IDs user đã tương tác (ACTIVE only)
        const allInteractedIds = [...new Set([
            ...viewedIds,
            ...wishlistIds,
            ...cartIds,
            ...orderIds
        ])];

        // 3. Lấy categories và tags từ các sản phẩm đã tương tác
        const interactedProducts = await Product.find({
            _id: { $in: allInteractedIds }
        }).select('category tags').lean();

        const categories = [...new Set(
            interactedProducts.map(p => p.category?.toString()).filter(Boolean)
        )];
        const tags = [...new Set(
            interactedProducts.flatMap(p => p.tags || [])
        )];

        // 4. Nếu chưa có dữ liệu, trả về sản phẩm phổ biến
        if (allInteractedIds.length === 0) {
            return await getPopularProducts(res, limit);
        }

        // 5. Tìm sản phẩm gợi ý dựa trên content-based filtering
        const recommendedProducts = await Product.find({
            _id: { 
                $nin: [
                    ...cartIds,      // Loại bỏ đang trong giỏ
                    ...orderIds,     // Loại bỏ đã mua
                    ...excludeIds    // Loại bỏ đã removed (user không thích)
                ]
            },
            is_active: true,
            $or: [
                { category: { $in: categories } },
                { tags: { $in: tags } }
            ]
        })
            .populate('category', 'name type')
            .limit(parseInt(limit) * 3) // Lấy nhiều hơn để tính score
            .lean();

        // 6. Tính recommendation score cho mỗi sản phẩm
        const scoredProducts = recommendedProducts.map(product => {
            let score = 0;

            // Category match (40 điểm)
            if (categories.includes(product.category?._id?.toString())) {
                score += 40;
            }

            // Tags match (30 điểm)
            const matchingTags = (product.tags || []).filter(tag => tags.includes(tag));
            score += (matchingTags.length / Math.max(tags.length, 1)) * 30;

            // Popularity score (20 điểm)
            const popularityScore = (product.rating || 0) * 2 + 
                                   Math.min((product.salesCount || 0) / 10, 10);
            score += popularityScore;

            // Recency bonus (10 điểm) - sản phẩm mới
            const daysSinceCreated = (Date.now() - new Date(product.createdAt)) / (1000 * 60 * 60 * 24);
            if (daysSinceCreated < 30) {
                score += 10 * (1 - daysSinceCreated / 30);
            }

            return {
                ...product,
                recommendation_score: score
            };
        });

        // 7. Sort theo score và lấy top N
        const topRecommendations = scoredProducts
            .sort((a, b) => b.recommendation_score - a.recommendation_score)
            .slice(0, parseInt(limit));

        res.json({
            success: true,
            data: {
                products: topRecommendations,
                total: topRecommendations.length,
                user_interactions: {
                    viewed: viewedIds.length,
                    wishlist: wishlistIds.length,
                    cart: cartIds.length,
                    orders: orderIds.length
                }
            }
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy gợi ý sản phẩm',
            error: error.message
        });
    }
};

// 🧩 Fallback: Lấy sản phẩm phổ biến khi chưa có dữ liệu user
const getPopularProducts = async (res, limit = 10) => {
    try {
        const popularProducts = await Product.find({ is_active: true })
            .populate('category', 'name type')
            .sort({ rating: -1, salesCount: -1, createdAt: -1 })
            .limit(parseInt(limit))
            .lean();

        res.json({
            success: true,
            data: {
                products: popularProducts,
                total: popularProducts.length,
                fallback: true,
                message: 'Hiển thị sản phẩm phổ biến (chưa có dữ liệu hành vi)'
            }
        });
    } catch (error) {
        throw error;
    }
};

// 🧩 Track product view
const trackProductView = async (req, res) => {
    try {
        const { userId, productId } = req.body;

        if (!userId || !productId) {
            return res.status(400).json({
                success: false,
                message: 'Thiếu userId hoặc productId'
            });
        }

        // Kiểm tra xem đã view trong vòng 1 giờ chưa (tránh spam)
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
        const existingView = await ProductView.findOne({
            user: userId,
            product: productId,
            viewed_at: { $gte: oneHourAgo }
        });

        if (existingView) {
            // Update viewed_at
            existingView.viewed_at = new Date();
            await existingView.save();
        } else {
            // Tạo mới
            await ProductView.create({
                user: userId,
                product: productId,
                viewed_at: new Date()
            });
        }

        res.json({ success: true, message: 'Đã ghi nhận lượt xem' });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Lỗi khi ghi nhận lượt xem',
            error: error.message
        });
    }
};

// 🧩 Add to wishlist
const addToWishlist = async (req, res) => {
    try {
        const { userId, productId } = req.body;

        if (!userId || !productId) {
            return res.status(400).json({
                success: false,
                message: 'Thiếu userId hoặc productId'
            });
        }

        // Kiểm tra product tồn tại
        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy sản phẩm'
            });
        }

        // Thêm vào wishlist (unique constraint sẽ tự động handle duplicate)
        const wishlistItem = await Wishlist.findOneAndUpdate(
            { user: userId, product: productId },
            { user: userId, product: productId, added_at: new Date() },
            { upsert: true, new: true }
        );

        res.json({
            success: true,
            message: 'Đã thêm vào danh sách yêu thích',
            data: wishlistItem
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Lỗi khi thêm vào wishlist',
            error: error.message
        });
    }
};

// 🧩 Remove from wishlist (SOFT DELETE)
const removeFromWishlist = async (req, res) => {
    try {
        const { userId, productId } = req.body;

        // Soft delete: Đánh dấu removed thay vì xóa
        const updated = await Wishlist.findOneAndUpdate(
            { user: userId, product: productId },
            { 
                status: 'removed',
                removed_at: new Date()
            },
            { new: true }
        );

        if (!updated) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy item trong wishlist'
            });
        }

        res.json({
            success: true,
            message: 'Đã xóa khỏi danh sách yêu thích',
            data: updated
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Lỗi khi xóa khỏi wishlist',
            error: error.message
        });
    }
};

// 🧩 Add to cart
const addToCart = async (req, res) => {
    try {
        const { userId, productId, quantity = 1 } = req.body;

        if (!userId || !productId) {
            return res.status(400).json({
                success: false,
                message: 'Thiếu userId hoặc productId'
            });
        }

        // Kiểm tra product tồn tại
        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy sản phẩm'
            });
        }

        // Thêm hoặc update quantity
        const cartItem = await Cart.findOneAndUpdate(
            { user: userId, product: productId },
            {
                user: userId,
                product: productId,
                quantity: quantity,
                added_at: new Date()
            },
            { upsert: true, new: true }
        ).populate('product');

        res.json({
            success: true,
            message: 'Đã thêm vào giỏ hàng',
            data: cartItem
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Lỗi khi thêm vào giỏ hàng',
            error: error.message
        });
    }
};

// 🧩 Get user's cart (ACTIVE only)
const getCart = async (req, res) => {
    try {
        const { userId } = req.params;

        const cartItems = await Cart.find({ 
            user: userId,
            status: 'active'  // Chỉ lấy active items
        })
            .populate('product')
            .sort({ added_at: -1 })
            .lean();

        res.json({
            success: true,
            data: {
                items: cartItems,
                total: cartItems.length
            }
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy giỏ hàng',
            error: error.message
        });
    }
};

// 🧩 Remove from cart (SOFT DELETE)
const removeFromCart = async (req, res) => {
    try {
        const { userId, productId } = req.body;

        // Soft delete: Đánh dấu removed thay vì xóa
        const updated = await Cart.findOneAndUpdate(
            { user: userId, product: productId },
            { 
                status: 'removed',
                removed_at: new Date()
            },
            { new: true }
        );

        if (!updated) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy item trong cart'
            });
        }

        res.json({
            success: true,
            message: 'Đã xóa khỏi giỏ hàng',
            data: updated
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Lỗi khi xóa khỏi giỏ hàng',
            error: error.message
        });
    }
};

// 🧩 Get user's wishlist (ACTIVE only)
const getWishlist = async (req, res) => {
    try {
        const { userId } = req.params;

        const wishlistItems = await Wishlist.find({ 
            user: userId,
            status: 'active'  // Chỉ lấy active items
        })
            .populate('product')
            .sort({ added_at: -1 })
            .lean();

        res.json({
            success: true,
            data: {
                items: wishlistItems,
                total: wishlistItems.length
            }
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy wishlist',
            error: error.message
        });
    }
};

module.exports = {
    getRecommendations,
    trackProductView,
    addToWishlist,
    removeFromWishlist,
    addToCart,
    removeFromCart,
    getCart,
    getWishlist
};
