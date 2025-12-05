require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') }); // ⭐ FIX: Đường dẫn .env
const mongoose = require('mongoose');
const Product = require('../models/Product');
const ProductView = require('../models/ProductView');
const Order = require('../models/Order');
const Cart = require('../models/Cart');
const Wishlist = require('../models/Wishlist');
const Category = require('../models/Category');
const User = require('../models/User');

// Import hàm gợi ý
const { getRecommendations } = require('../controllers/recommendationController');

const TEST_USER_ID = new mongoose.Types.ObjectId();
let catMeoId, catChoId;
let testProducts = [];

// ========== HELPERS ==========
const createTestCategories = async () => {
    const catMeo = await Category.create({
        name: 'Thức ăn Mèo Test',
        slug: 'test-cat-food',
        type: 'product',
        parent: null
    });

    const catCho = await Category.create({
        name: 'Thức ăn Chó Test',
        slug: 'test-dog-food',
        type: 'product',
        parent: null
    });

    catMeoId = catMeo._id;
    catChoId = catCho._id;

    console.log('✅ Tạo 2 Category test: Mèo, Chó');
};

const createTestProducts = async () => {
    const products = [];

    // 10 sản phẩm Mèo
    for (let i = 1; i <= 10; i++) {
        products.push({
            name: `Sản phẩm Mèo ${i}`,
            slug: `sp-meo-${i}`,
            description: `Mô tả sản phẩm Mèo ${i} cho test benchmark`,
            category: catMeoId,
            price: 100000 + i * 10000,
            sale_price: 90000 + i * 10000,
            stock_quantity: 50,
            images: ['test.jpg'],
            is_active: true,
            target: 'cat', 
            tags: ['mèo', 'thức ăn'],
            sales_count: Math.floor(Math.random() * 20)
        });
    }

    // 10 sản phẩm Chó
    for (let i = 1; i <= 10; i++) {
        products.push({
            name: `Sản phẩm Chó ${i}`,
            slug: `sp-cho-${i}`,
            description: `Mô tả sản phẩm Chó ${i} cho test benchmark`,
            category: catChoId,
            price: 120000 + i * 10000,
            sale_price: 110000 + i * 10000,
            stock_quantity: 50,
            images: ['test.jpg'],
            is_active: true,
            target: 'dog', 
            tags: ['chó', 'thức ăn'],
            sales_count: Math.floor(Math.random() * 20)
        });
    }

    testProducts = await Product.insertMany(products);
    console.log('✅ Tạo 20 sản phẩm test (10 Mèo + 10 Chó)');
};

const simulateUserBehavior = async () => {
    const meoProducts = testProducts.filter(p => p.category.toString() === catMeoId.toString());
    const choProducts = testProducts.filter(p => p.category.toString() === catChoId.toString());

    // === 1. Tạo user test ===
    await User.create({
        _id: TEST_USER_ID,
        full_name: 'Test User',
        email: `test-${Date.now()}@example.com`,
        password: 'test123',
        phone: '0123456789',
        role: 'user'
    });

    // === 2. Hành vi dài hạn: Xem 8 sản phẩm Mèo ===
    const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000);
    const viewPromises = meoProducts.slice(0, 8).map((p, idx) =>
        ProductView.create({
            user: TEST_USER_ID,
            product: p._id,
            viewed_at: new Date(thirtyDaysAgo.getTime() + idx * 60000)
        })
    );
    await Promise.all(viewPromises);
    console.log('✅ Mô phỏng: Xem 8 sản phẩm Mèo (30 ngày trước)');

    // === 3. Hành vi dài hạn: Mua 1 sản phẩm Mèo ===
    try {
        await Order.create({
            user: TEST_USER_ID,
            items: [
                {
                    product_id: meoProducts[0]._id,
                    name: meoProducts[0].name,   
                    price: meoProducts[0].price,
                    quantity: 1,
                    image: meoProducts[0].images[0] || 'default.jpg'
                }
            ],
            total_amount: meoProducts[0].price,

            status: 'delivered',      
            payment_method: 'cash_on_delivery',   
            payment_status: 'pending', 

            shipping_address: {
                full_name: 'Test User',
                phone: '0123456789',
                address: '123 Đường Test',
                city: 'TP Test'
            },
            createdAt: new Date(Date.now() - 15 * 86400000)
        });
        console.log('✅ Mô phỏng: Mua 1 sản phẩm Mèo (15 ngày trước)');
    } catch (e) {
        console.error('⚠️ Lỗi tạo đơn hàng giả lập (bỏ qua để chạy tiếp):', e.message);
    }

    // === 4. Hành vi ngắn hạn: Xem 2 sản phẩm Chó ===
    const twelveHoursAgo = new Date(Date.now() - 12 * 60 * 60 * 1000);
    await ProductView.create({
        user: TEST_USER_ID,
        product: choProducts[0]._id,
        viewed_at: twelveHoursAgo
    });
    await ProductView.create({
        user: TEST_USER_ID,
        product: choProducts[1]._id,
        viewed_at: new Date(twelveHoursAgo.getTime() + 5 * 60000)
    });
    console.log('✅ Mô phỏng: Xem 2 sản phẩm Chó (12 giờ trước)');
};

// ========== RUN RECOMMENDATION ==========
const runRecommendation = async () => {
    console.log('\n📊 ĐANG CHẠY THUẬT TOÁN...\n');

    let recommendedProducts = [];

    const mockReq = {
        params: { userId: TEST_USER_ID.toString() },
        query: { limit: '10' }
    };

    const mockRes = {
        json: (data) => {
            if (data.success) {
                recommendedProducts = data.data.products;
            }
            return mockRes;
        },
        status: () => mockRes
    };

    await getRecommendations(mockReq, mockRes);

    return recommendedProducts;
};

// ========== CALCULATE METRICS ==========
const calculateMetrics = (recommendedProducts) => {
    console.log('\n📈 KẾT QUẢ ĐÁNH GIÁ\n');
    console.log('━'.repeat(80));

    const meoProducts = testProducts.filter(p => p.category.toString() === catMeoId.toString());
    const choProducts = testProducts.filter(p => p.category.toString() === catChoId.toString());

    const meoIds = new Set(meoProducts.map(p => p._id.toString()));
    const choIds = new Set(choProducts.map(p => p._id.toString()));

    let countMeo = 0;
    let countCho = 0;
    let countOther = 0;

    console.log('\n🎯 TOP 10 SẢN PHẨM GỢI Ý:\n');
    console.log('┌────┬──────────────────────────────────┬────────────┬───────────┐');
    console.log('│ #  │ Tên sản phẩm                     │ Category   │ Score     │');
    console.log('├────┼──────────────────────────────────┼────────────┼───────────┤');

    recommendedProducts.forEach((p, idx) => {
        const pid = p._id.toString();
        let category = 'Khác';

        if (meoIds.has(pid)) {
            category = 'Mèo';
            countMeo++;
        } else if (choIds.has(pid)) {
            category = 'Chó';
            countCho++;
        } else {
            countOther++;
        }

        const score = (p.recommendation_score || 0).toFixed(3);
        const name = p.name.padEnd(32, ' ').substring(0, 32);

        console.log(`│ ${(idx + 1).toString().padStart(2)} │ ${name} │ ${category.padEnd(10)} │ ${score.padStart(9)} │`);
    });

    console.log('└────┴──────────────────────────────────┴────────────┴───────────┘');

    // Tính Precision@10
    // Relevant = Mèo (lịch sử mua) + Chó (mới xem)
    const relevantCount = countMeo + countCho;
    const precision = relevantCount / 10;

    console.log('\n📊 PHÂN TÍCH CHI TIẾT:\n');
    console.log('┌─────────────────────────────────────┬─────────┬──────────┐');
    console.log('│ Chỉ số                              │ Giá trị │ Tỷ lệ    │');
    console.log('├─────────────────────────────────────┼─────────┼──────────┤');
    console.log(`│ Số sản phẩm Mèo (Lịch sử)          │ ${countMeo.toString().padStart(7)} │ ${((countMeo / 10) * 100).toFixed(1).padStart(7)}% │`);
    console.log(`│ Số sản phẩm Chó (Ngắn hạn)         │ ${countCho.toString().padStart(7)} │ ${((countCho / 10) * 100).toFixed(1).padStart(7)}% │`);
    console.log(`│ Số sản phẩm Khác (Nhiễu)           │ ${countOther.toString().padStart(7)} │ ${((countOther / 10) * 100).toFixed(1).padStart(7)}% │`);
    console.log('├─────────────────────────────────────┼─────────┼──────────┤');
    console.log(`│ 🎯 Precision@10                     │ ${relevantCount.toString().padStart(7)} │ ${(precision * 100).toFixed(1).padStart(7)}% │`);
    console.log('└─────────────────────────────────────┴─────────┴──────────┘');

    console.log('\n💡 ĐÁNH GIÁ:');
    if (precision >= 0.8) {
        console.log('   ✅ Xuất sắc: Thuật toán hoạt động rất tốt!');
    } else if (precision >= 0.6) {
        console.log('   ⚠️  Tốt: Thuật toán đáng tin cậy nhưng có thể cải thiện.');
    } else {
        console.log('   ❌ Cần cải thiện: Thuật toán cần điều chỉnh tham số.');
    }

    console.log('\n━'.repeat(80));
};

// ========== CLEANUP ==========
const cleanup = async () => {
    console.log('\n🧹 Dọn dẹp dữ liệu test...');

    try {
        await Promise.all([
            Product.deleteMany({ _id: { $in: testProducts.map(p => p._id) } }),
            Category.deleteMany({ _id: { $in: [catMeoId, catChoId] } }),
            ProductView.deleteMany({ user: TEST_USER_ID }),
            Order.deleteMany({ user: TEST_USER_ID }),
            Cart.deleteMany({ user: TEST_USER_ID }),
            Wishlist.deleteMany({ user: TEST_USER_ID }),
            User.deleteOne({ _id: TEST_USER_ID })
        ]);

        console.log('✅ Đã xóa dữ liệu test');
    } catch (error) {
        console.error('⚠️  Lỗi khi dọn dẹp:', error.message);
    }
};

// ========== MAIN ==========
const main = async () => {
    try {
        console.log('\n🚀 BẮT ĐẦU BENCHMARK THUẬT TOÁN GỢI Ý\n');

        // Kiểm tra MONGO_URI
        const mongoUri = process.env.MONGO_URI || process.env.MONGO_DB;

        if (!mongoUri) {
            throw new Error('MONGO_URI hoặc MONGO_DB không tồn tại trong file .env!');
        }

        // Kết nối MongoDB
        await mongoose.connect(mongoUri, {
            serverSelectionTimeoutMS: 5000
        });
        console.log('✅ Kết nối MongoDB thành công\n');

        // Xóa dữ liệu cũ (nếu có)
        console.log('🧹 Dọn dẹp dữ liệu test cũ (nếu có)...');
        await cleanup();

        // Tạo dữ liệu test
        await createTestCategories();
        await createTestProducts();
        await simulateUserBehavior();

        // Chạy thuật toán
        const recommendedProducts = await runRecommendation();

        // Tính toán metrics
        calculateMetrics(recommendedProducts);

        // ⭐ CHỜ USER ĐỌC KẾT QUẢ (5 giây)
        console.log('\n⏳ Đang chờ 5 giây để bạn xem kết quả...\n');
        await new Promise(resolve => setTimeout(resolve, 5000));

        // Dọn dẹp CUỐI CÙNG
        await cleanup();

        console.log('\n✅ HOÀN TẤT BENCHMARK!\n');
        await mongoose.connection.close();
        process.exit(0);

    } catch (error) {
        console.error('\n❌ LỖI:', error.message);
        try {
            await cleanup();
            await mongoose.connection.close();
        } catch (cleanupError) {
            console.error('⚠️  Lỗi khi dọn dẹp:', cleanupError.message);
        }
        process.exit(1);
    }
};

main();
