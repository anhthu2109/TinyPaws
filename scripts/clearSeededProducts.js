require('dotenv').config();
const path = require('path');
const mongoose = require(path.join(__dirname, '../backend/node_modules/mongoose'));
const Product = require(path.join(__dirname, '../backend/models/Product'));

(async () => {
  try {
    const uri = process.env.MONGO_DB || 'mongodb://127.0.0.1:27017/tinypaws';
    await mongoose.connect(uri);
    console.log('✅ Connected to MongoDB');

    const tagMarkers = ['dog', 'cat', 'hygiene', 'accessory'];
    const result = await Product.deleteMany({ tags: { $in: tagMarkers } });

    console.log(`🧹 Đã xoá ${result.deletedCount} sản phẩm seed gần đây.`);
  } catch (err) {
    console.error('❌ Clear failed:', err);
  } finally {
    await mongoose.disconnect();
    process.exit();
  }
})();