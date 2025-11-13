const Product = require('../models/Product');

// GET /api/products - Lấy danh sách sản phẩm với query parameters
const getProducts = async (req, res) => {
    try {
        const {
            category,
            sort,
            tag,
            page = 1,
            limit = 12,
            search,
            minPrice,
            maxPrice,
            brand
        } = req.query;

        // Xây dựng query object
        let query = {};
        
        // Filter theo category
        if (category && category !== 'all') {
            query.category = { $regex: category, $options: 'i' };
        }

        // Filter theo tag
        if (tag) {
            switch (tag) {
                case 'daily_deal':
                    query.discount = { $gt: 0 };
                    break;
                case 'featured':
                    query.rating = { $gte: 4.5 };
                    break;
                case 'new_arrivals':
                    query.isNew = true;
                    break;
                default:
                    query.tags = { $in: [tag] };
            }
        }

        // Filter theo search term
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } },
                { category: { $regex: search, $options: 'i' } }
            ];
        }

        // Filter theo price range
        if (minPrice || maxPrice) {
            query.price = {};
            if (minPrice) query.price.$gte = Number(minPrice);
            if (maxPrice) query.price.$lte = Number(maxPrice);
        }

        // Filter theo brand
        if (brand) {
            query.brand = { $regex: brand, $options: 'i' };
        }

        // Xây dựng sort object
        let sortObject = {};
        
        if (sort) {
            switch (sort) {
                case 'bestseller':
                    sortObject = { salesCount: -1, reviews: -1 };
                    break;
                case 'price_asc':
                    sortObject = { price: 1 };
                    break;
                case 'price_desc':
                    sortObject = { price: -1 };
                    break;
                case 'rating':
                    sortObject = { rating: -1 };
                    break;
                case 'newest':
                    sortObject = { createdAt: -1 };
                    break;
                default:
                    sortObject = { name: 1 };
            }
        } else {
            sortObject = { createdAt: -1 }; // Mặc định sắp xếp theo mới nhất
        }

        // Pagination
        const pageNumber = parseInt(page);
        const limitNumber = parseInt(limit);
        const skip = (pageNumber - 1) * limitNumber;

        // Execute query
        const products = await Product.find(query)
            .sort(sortObject)
            .skip(skip)
            .limit(limitNumber)
            .populate('category', 'name')
            .lean();

        // Get total count for pagination
        const totalProducts = await Product.countDocuments(query);
        const totalPages = Math.ceil(totalProducts / limitNumber);

        // Response
        res.status(200).json({
            success: true,
            data: {
                products,
                pagination: {
                    currentPage: pageNumber,
                    totalPages,
                    totalProducts,
                    hasNextPage: pageNumber < totalPages,
                    hasPrevPage: pageNumber > 1
                },
                filters: {
                    category,
                    sort,
                    tag,
                    search,
                    minPrice,
                    maxPrice,
                    brand
                }
            }
        });

    } catch (error) {
        console.error('Error fetching products:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server khi lấy danh sách sản phẩm',
            error: error.message
        });
    }
};

// GET /api/products/:id - Lấy chi tiết sản phẩm
const getProductById = async (req, res) => {
    try {
        const { id } = req.params;
        
        console.log(`🔍 Fetching product with ID: ${id}`);
        console.log(`📏 ID length: ${id.length}`);
        console.log(`🔤 ID format: ${/^[0-9a-fA-F]{24}$/.test(id) ? 'Valid ObjectId' : 'Invalid ObjectId'}`);
        
        // Check if ID is valid MongoDB ObjectId
        if (!id.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(400).json({
                success: false,
                message: 'ID sản phẩm không hợp lệ'
            });
        }
        
        const product = await Product.findById(id);
        console.log(`📦 Product found:`, product ? 'YES' : 'NO');
        
        if (!product) {
            // Log all products to see what IDs exist
            const allProducts = await Product.find({}, '_id name').limit(5);
            console.log(`📋 Sample product IDs in database:`, allProducts.map(p => ({ id: p._id, name: p.name })));
            
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy sản phẩm'
            });
        }

        // Only return active products for public API
        if (!product.is_active) {
            return res.status(404).json({
                success: false,
                message: 'Sản phẩm không khả dụng'
            });
        }

        console.log(`✅ Product found: ${product.name}`);

        res.status(200).json({
            success: true,
            data: product
        });

    } catch (error) {
        console.error('Error fetching product:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server khi lấy chi tiết sản phẩm',
            error: error.message
        });
    }
};

// GET /api/products/featured - Lấy sản phẩm nổi bật
const getFeaturedProducts = async (req, res) => {
    try {
        const { limit = 8 } = req.query;

        const products = await Product.find({
            $or: [
                { rating: { $gte: 4.5 } },
                { tags: 'featured' },
                { salesCount: { $gte: 100 } }
            ]
        })
        .sort({ rating: -1, salesCount: -1 })
        .limit(parseInt(limit))
        .populate('category', 'name')
        .lean();

        res.status(200).json({
            success: true,
            data: products
        });

    } catch (error) {
        console.error('Error fetching featured products:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server khi lấy sản phẩm nổi bật',
            error: error.message
        });
    }
};

// GET /api/products/bestsellers - Lấy sản phẩm bán chạy
const getBestsellerProducts = async (req, res) => {
    try {
        const { limit = 8 } = req.query;

        const products = await Product.find({})
            .sort({ salesCount: -1, reviews: -1 })
            .limit(parseInt(limit))
            .populate('category', 'name')
            .lean();

        res.status(200).json({
            success: true,
            data: products
        });

    } catch (error) {
        console.error('Error fetching bestseller products:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server khi lấy sản phẩm bán chạy',
            error: error.message
        });
    }
};

// GET /api/products/deals - Lấy sản phẩm ưu đãi
const getDealProducts = async (req, res) => {
    try {
        const { limit = 8 } = req.query;

        const products = await Product.find({
            discount: { $gt: 0 }
        })
        .sort({ discount: -1, createdAt: -1 })
        .limit(parseInt(limit))
        .populate('category', 'name')
        .lean();

        res.status(200).json({
            success: true,
            data: products
        });

    } catch (error) {
        console.error('Error fetching deal products:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server khi lấy sản phẩm ưu đãi',
            error: error.message
        });
    }
};

// GET /api/products/categories - Lấy danh sách categories
const getCategories = async (req, res) => {
    try {
        const categories = await Product.distinct('category');
        
        res.status(200).json({
            success: true,
            data: categories
        });

    } catch (error) {
        console.error('Error fetching categories:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server khi lấy danh sách danh mục',
            error: error.message
        });
    }
};

// GET /api/products/brands - Lấy danh sách brands
const getBrands = async (req, res) => {
    try {
        const brands = await Product.distinct('brand');
        
        res.status(200).json({
            success: true,
            data: brands
        });

    } catch (error) {
        console.error('Error fetching brands:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server khi lấy danh sách thương hiệu',
            error: error.message
        });
    }
};

module.exports = {
    getProducts,
    getProductById,
    getFeaturedProducts,
    getBestsellerProducts,
    getDealProducts,
    getCategories,
    getBrands
};
