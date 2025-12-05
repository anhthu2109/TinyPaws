const Product = require('../models/Product');
const ProductView = require('../models/ProductView');
const Wishlist = require('../models/Wishlist');
const Cart = require('../models/Cart');
const Order = require('../models/Order');

const ACTION_WEIGHTS = {
    viewed: 1,
    wishlist: 3,
    cart: 4,
    ordered: 6
};

const W_CB = 0.4;
const W_CF = 0.4;
const W_POP = 0.2;

const getRecommendations = async (req, res) => {
    try {
        const { userId } = req.params;
        const { limit = 10 } = req.query;

        const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000);
        const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

        const [views, wishlist, cart, orders, removedWishlist, removedCart] = await Promise.all([
            ProductView.find({ user: userId }).lean(),
            Wishlist.find({ user: userId, status: 'active' }).lean(),
            Cart.find({ user: userId, status: 'active' }).lean(),
            Order.find({ user: userId, createdAt: { $gte: thirtyDaysAgo } })
                .populate('items.product_id').lean(),
            Wishlist.find({ user: userId, status: 'removed' }).lean(),
            Cart.find({ user: userId, status: 'removed' }).lean()
        ]);

        const viewIds = views.map(v => v.product.toString());
        const wishlistIds = wishlist.map(w => w.product.toString());
        const cartIds = cart.map(c => c.product.toString());
        const orderIds = orders.flatMap(o =>
            o.items
                .map(i => i.product_id?._id?.toString() || i.product_id?.toString())
                .filter(Boolean)
        );

        const removedIds = [
            ...removedWishlist.map(w => w.product.toString()),
            ...removedCart.map(c => c.product.toString())
        ];

        const blockedIds = [...new Set([...orderIds, ...removedIds])];

        if (viewIds.length === 0 && wishlistIds.length === 0 && cartIds.length === 0) {
            return await getPopularProducts(res, limit);
        }

        // Get interacted products for category/tag analysis
        const interactedProducts = await Product.find({
            _id: { $in: [...viewIds, ...wishlistIds, ...cartIds] }
        }).select('category tags sales_count updatedAt').lean();

        // Short-term interests (last 24 hours)
        const recentViews = views.filter(v => new Date(v.viewed_at) > twentyFourHoursAgo);
        const recentInteractedIds = [
            ...new Set([
                ...recentViews.map(v => v.product.toString()),
                ...wishlistIds,
                ...cartIds
            ])
        ];

        const recentProducts = await Product.find({
            _id: { $in: recentInteractedIds }
        }).select('category tags').lean();

        // Long-term interests (frequency analysis over 30 days)
        const categoryFrequency = {};
        const tagFrequency = {};

        interactedProducts.forEach(product => {
            const catId = product.category?.toString();
            if (catId) {
                categoryFrequency[catId] = (categoryFrequency[catId] || 0) + 1;
            }
            (product.tags || []).forEach(tag => {
                tagFrequency[tag] = (tagFrequency[tag] || 0) + 1;
            });
        });

        // Get top categories and tags by frequency
        const topCategories = Object.entries(categoryFrequency)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 3)
            .map(([catId]) => catId);

        const topTags = Object.entries(tagFrequency)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 5)
            .map(([tag]) => tag);

        // Short-term stream (recent interests)
        const recentCategories = [...new Set(recentProducts.map(p => p.category?.toString()).filter(Boolean))];
        const recentTags = [...new Set(recentProducts.flatMap(p => p.tags || []))];

        let shortTermCandidates = [];
        if (recentCategories.length > 0 || recentTags.length > 0) {
            shortTermCandidates = await Product.find({
                _id: { $nin: blockedIds },
                is_active: true,
                $or: [
                    { category: { $in: recentCategories } },
                    { tags: { $in: recentTags } }
                ]
            })
                .select('name price sale_price images category stock_quantity sales_count is_featured is_active brand createdAt updatedAt rating tags')
                .populate('category', 'name type')
                .lean();
        }

        // Long-term stream (historical favorites)
        let longTermCandidates = [];
        if (topCategories.length > 0 || topTags.length > 0) {
            longTermCandidates = await Product.find({
                _id: { $nin: blockedIds },
                is_active: true,
                $or: [
                    { category: { $in: topCategories } },
                    { tags: { $in: topTags } }
                ]
            })
                .select('name price sale_price images category stock_quantity sales_count is_featured is_active brand createdAt updatedAt rating tags')
                .populate('category', 'name type')
                .lean();
        }

        // Mix and deduplicate
        const allCandidates = [...shortTermCandidates, ...longTermCandidates];
        const uniqueCandidates = allCandidates.filter((product, index, arr) => 
            arr.findIndex(p => p._id.toString() === product._id.toString()) === index
        );

        if (!uniqueCandidates.length) {
            return await getPopularProducts(res, limit);
        }

        // Score candidates with enhanced algorithm
        const scored = uniqueCandidates.map(item => {
            const id = item._id.toString();
            let cb = 0, cf = 0, pop = 0, recency = 0;

            // Content-Based (category + tag matching)
            if (topCategories.includes(item.category?._id?.toString())) cb += 1;
            if (recentCategories.includes(item.category?._id?.toString())) cb += 0.5;
            
            const tagMatch = (item.tags || []).filter(t => topTags.includes(t)).length;
            const recentTagMatch = (item.tags || []).filter(t => recentTags.includes(t)).length;
            cb += tagMatch / Math.max(topTags.length, 1);
            cb += recentTagMatch / Math.max(recentTags.length, 1) * 0.5;
            cb = Math.min(cb / 4, 1); // Normalize

            // Collaborative Filtering (implicit feedback)
            if (wishlistIds.includes(id)) cf += ACTION_WEIGHTS.wishlist;
            if (cartIds.includes(id)) cf += ACTION_WEIGHTS.cart;
            cf = Math.min(cf / 8, 1); 

            // Popularity
            pop = Math.min((item.sales_count || 0) / 20, 1);

            const daysSinceUpdate = (Date.now() - new Date(item.updatedAt || item.createdAt)) / (1000 * 60 * 60 * 24);
            recency = Math.max(0, 1 - daysSinceUpdate / 90); // Decay over 90 days

            const finalScore = (W_CB * cb) + (W_CF * cf) + (W_POP * pop) + (0.1 * recency);

            return {
                ...item,
                recommendation_score: finalScore
            };
        });

        const top = scored
            .sort((a, b) => b.recommendation_score - a.recommendation_score)
            .slice(0, limit);

        if (!top.length) {
            return await getPopularProducts(res, limit);
        }

        return res.json({
            success: true,
            algorithm: "Hybrid Recommendation with Mixing Strategy (Short-term + Long-term)",
            fallback: false,
            data: {
                products: top,
                total: top.length
            }
        });

    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

const getPopularProducts = async (res, limit) => {
    const items = await Product.find({ is_active: true })
        .select('name price sale_price images category stock_quantity sales_count is_featured is_active brand createdAt updatedAt rating tags')
        .sort({ sales_count: -1, createdAt: -1 })
        .limit(parseInt(limit))
        .populate('category', 'name type')
        .lean();

    return res.json({
        success: true,
        fallback: true,
        message: "Hiển thị sản phẩm phổ biến",
        data: {
            products: items,
            total: items.length
        }
    });
};

// Track product view
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

const removeFromWishlist = async (req, res) => {
    try {
        const { userId, productId } = req.body;

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

const addToCart = async (req, res) => {
    try {
        const { userId, productId, quantity = 1 } = req.body;

        if (!userId || !productId) {
            return res.status(400).json({
                success: false,
                message: 'Thiếu userId hoặc productId'
            });
        }

        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy sản phẩm'
            });
        }

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

const getCart = async (req, res) => {
    try {
        const { userId } = req.params;

        const cartItems = await Cart.find({ 
            user: userId,
            status: 'active' 
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

const removeFromCart = async (req, res) => {
    try {
        const { userId, productId } = req.body;

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

const getWishlist = async (req, res) => {
    try {
        const { userId } = req.params;

        const wishlistItems = await Wishlist.find({ 
            user: userId,
            status: 'active'
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

const getProductDetailRecommendations = async (req, res) => {
    try {
        const { productId } = req.params;
        const { limit = 8 } = req.query;

        const currentProduct = await Product.findById(productId)
            .select('category tags target')
            .populate('category', 'name')
            .lean();

        if (!currentProduct) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy sản phẩm'
            });
        }

        const currentCategory = currentProduct.category?._id?.toString();
        const currentTags = currentProduct.tags || [];
        const currentTarget = currentProduct.target || 'both';

        const similarProducts = await Product.find({
            _id: { $ne: productId }, 
            is_active: true,
            $or: [
                { category: currentCategory },
                { tags: { $in: currentTags } }
            ],
            $and: [
                {
                    $or: [
                        { target: currentTarget },
                        { target: 'both' },
                        { target: 'ca-cho-va-meo' }
                    ]
                }
            ]
        })
            .select('name price sale_price images category stock_quantity sales_count is_featured is_active brand createdAt updatedAt rating tags')
            .populate('category', 'name type')
            .lean();

        if (!similarProducts.length) {
            const fallbackProducts = await Product.find({ 
                is_active: true,
                $or: [
                    { target: currentTarget },
                    { target: 'both' },
                    { target: 'ca-cho-va-meo' }
                ]
            })
                .select('name price sale_price images category stock_quantity sales_count is_featured is_active brand createdAt updatedAt rating tags')
                .sort({ sales_count: -1 })
                .limit(parseInt(limit))
                .populate('category', 'name type')
                .lean();

            return res.json({
                success: true,
                algorithm: "Content-Based Similarity (Fallback to Popular)",
                fallback: true,
                data: {
                    products: fallbackProducts,
                    total: fallbackProducts.length
                }
            });
        }

        const scored = similarProducts.map(product => {
            let score = 0;

            if (product.category?._id?.toString() === currentCategory) {
                score += 3;
            }

            const productTags = product.tags || [];
            const commonTags = currentTags.filter(tag => productTags.includes(tag));
            score += commonTags.length;

            score += Math.min((product.sales_count || 0) / 10, 1);

            return {
                ...product,
                similarity_score: score
            };
        });

        const top = scored
            .sort((a, b) => b.similarity_score - a.similarity_score)
            .slice(0, limit);

        return res.json({
            success: true,
            algorithm: "Content-Based Similarity (Category + Tags)",
            fallback: false,
            data: {
                products: top,
                total: top.length
            }
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy gợi ý sản phẩm tương tự',
            error: error.message
        });
    }
};

module.exports = {
    getRecommendations,
    getProductDetailRecommendations,
    trackProductView,
    addToWishlist,
    removeFromWishlist,
    addToCart,
    removeFromCart,
    getCart,
    getWishlist
};
