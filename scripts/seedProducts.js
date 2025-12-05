require('dotenv').config();
const path = require('path');
const mongoose = require(path.join(__dirname, '../backend/node_modules/mongoose'));

const Category = require(path.join(__dirname, '../backend/models/Category'));
const Product = require(path.join(__dirname, '../backend/models/Product'));

const CATEGORY_NAME_MAP = [
  { key: 'food', regex: /thức ăn/i },
  { key: 'hygiene', regex: /vệ sinh|làm đẹp/i },
  { key: 'accessory', regex: /phụ kiện/i },
  { key: 'toy', regex: /đồ chơi/i }
];

const BRAND_POOLS = {
  dog: ['Goodies', 'Orgo', 'SmartHeart', 'Ganador', 'Pawise', 'Natural Core', 'ANF', 'Zenith', 
            'Pedigree', 'Taste of the Wild', 'Nutrience', 'Iskhan', 'Classic Pets', 'Reflex', 'DoggyMan', 'Kong'],
  cat: ['Royal Canin', 'Whiskas', 'Me-O', 'Catsrang', 'Minino', 'Ciao', 'PetQ', 'Nutrience', 'Reflex',
            'Inaba', 'Nutri Plan'],
  hygiene: ['Yu', 'SOS', 'Absorb Plus', 'Natural Core', 'Alkin', 'Dorrikey', 'Joyce & Dolls', 
            'Tropiclean', 'Budle\'Budle', 'Cature', 'Genki', 'Maneki Neko'],
  accessory: ['Petkit', 'Dogness', 'Bobby', 'Ferplast', 'IBIYAYA', 'Petmate', 'PetSafe', 'Nobby']
};

const PRODUCT_TYPES = {
  dog: [
    { label: 'Thức ăn ướt', keyword: 'Sốt thịt hầm đậm đà', target: 'dog' },
    { label: 'Thức ăn khô', keyword: 'Hạt khô dinh dưỡng', target: 'dog' },
    { label: 'Thức ăn hỗ trợ điều trị bệnh', keyword: 'Hạt chức năng hỗ trợ trị liệu', target: 'dog' },
    { label: 'Thức ăn hữu cơ', keyword: 'Hạt công thức hữu cơ Organic', target: 'dog' },
    { label: 'Pate', keyword: 'Pate mềm cao cấp', target: 'dog' },
    { label: 'Snack', keyword: 'Snack dinh dưỡng', target: 'dog' }
  ],
  cat: [
    { label: 'Hạt khô', keyword: 'Hạt khô kiểm soát búi lông', target: 'cat' },
    { label: 'Pate', keyword: 'Pate ướt bổ sung taurine', target: 'cat' },
    { label: 'Thức ăn ướt', keyword: 'Soup thưởng dạng lỏng', target: 'cat' },
    { label: 'Thức ăn hỗ trợ điều trị bệnh', keyword: 'Dinh dưỡng trị liệu chuyên sâu', target: 'cat' }
  ],
  hygiene: [
    { label: 'Cát vệ sinh', keyword: 'Cát vệ sinh siêu vón', target: 'cat' },
    { label: 'Sữa tắm', keyword: 'Sữa tắm khử mùi', target: 'both' },
    { label: 'Xịt khử mùi', keyword: 'Xịt khử mùi diệt khuẩn', target: 'both' }
  ],
  accessory: [
    { label: 'Vòng cổ', keyword: 'Vòng cổ da bò', target: 'both' },
    { label: 'Balo vận chuyển', keyword: 'Balo phi hành gia', target: 'both' },
    { label: 'Đồ chơi', keyword: 'Đồ chơi gặm nhai', target: 'dog' }
  ]
};

const DESCRIPTIONS = [
  'Công thức giàu protein, bổ sung vitamin và khoáng chất giúp thú cưng phát triển toàn diện.',
  'Nguyên liệu nhập khẩu, sản xuất theo tiêu chuẩn châu Âu, an toàn cho hệ tiêu hoá.',
  'Hương vị thơm ngon, kích thích vị giác và phù hợp với cả thú cưng kén ăn.',
  'Bổ sung omega 3-6 giúp lông mượt, da khoẻ mạnh và tăng cường miễn dịch.',
  'Được bác sĩ thú y khuyên dùng cho chế độ ăn cân bằng và kiểm soát cân nặng.'
];

const FLAVORS = ['vị bò hầm', 'vị cá ngừ', 'vị gà nướng', 'hương thảo mộc', 'hương hoa hồng', 'bổ sung collagen', 'hỗ trợ tiêu hoá', 'dành cho da nhạy cảm', 'kiểm soát búi lông', 'giảm mùi hiệu quả'];
const PACKAGING = ['400g', '1kg', '2kg', '3kg', '5kg', '8kg', '10kg', '12kg', '15kg', '18kg', '400ml', '500ml', '750ml', '1L'];
const PLACEHOLDER_IMAGES = [
  'https://placehold.co/600x600?text=TinyPaws+Product',
  'https://placehold.co/600x600?text=Pet+Store',
  'https://placehold.co/600x600?text=Premium+Pet+Food'
];

const TARGET_RATIOS = [
  { key: 'dog', amount: 60, categoryKey: 'food' },
  { key: 'cat', amount: 60, categoryKey: 'food' },
  { key: 'hygiene', amount: 40, categoryKey: 'hygiene' },
  { key: 'accessory', amount: 40, categoryKey: 'accessory' }
];

const randomItem = arr => arr[Math.floor(Math.random() * arr.length)];
const randomPrice = () => {
  const value = Math.floor(Math.random() * (2000000 - 50000 + 1)) + 50000;
  return Math.round(value / 1000) * 1000;
};
const randomDescription = () => {
  const count = Math.random() > 0.5 ? 3 : 2;
  return Array.from({ length: count }, () => randomItem(DESCRIPTIONS)).join(' ');
};

const connectDB = async () => {
  const uri = process.env.MONGO_DB || 'mongodb://127.0.0.1:27017/tinypaws';
  await mongoose.connect(uri);
  console.log('✅ Connected to MongoDB');
};

const findCategoryIds = async () => {
  const categoryMap = {};

  for (const { key, regex } of CATEGORY_NAME_MAP) {
    const category = await Category.findOne({ name: { $regex: regex } }).lean();
    if (category) {
      categoryMap[key] = {
        _id: category._id,
        name: category.name,
        subcategories: category.subcategories || []
      };
      console.log(`🔎 Found category for ${key}: ${category.name}`);
    } else {
      console.warn(`⚠️ Không tìm thấy category cho key: ${key}`);
    }
  }

  if (!categoryMap.default) {
    const fallback = await Category.findOne().lean();
    if (!fallback) {
      throw new Error('Không có category nào trong DB. Hãy seed categories trước.');
    }
    categoryMap.default = {
      _id: fallback._id,
      name: fallback.name,
      subcategories: fallback.subcategories || []
    };
    console.log('ℹ️ Dùng category mặc định:', fallback.name);
  }

  return categoryMap;
};

const buildProductName = (brand, typeInfo) => {
  return `${brand} ${typeInfo.keyword} ${randomItem(FLAVORS)} ${randomItem(PACKAGING)}`;
};

const pickSubcategoryName = (categoryData, target) => {
  if (!categoryData || !categoryData.subcategories?.length) return null;
  const candidates = categoryData.subcategories.filter(sub => {
    if (!sub.target || sub.target === 'both') return true;
    if (!target) return true;
    return sub.target === target;
  });

  if (candidates.length === 0) return null;
  return randomItem(candidates).name;
};

const generateProducts = (categoryMap) => {
  const products = [];

  TARGET_RATIOS.forEach(({ key, amount, categoryKey }) => {
    const categoryData = categoryMap[categoryKey] || categoryMap.default;
    const categoryId = categoryData?._id || categoryMap.default?._id;
    const brandPool = BRAND_POOLS[key] || BRAND_POOLS.dog;
    const typePool = PRODUCT_TYPES[key] || PRODUCT_TYPES.dog;

    for (let i = 0; i < amount; i++) {
      const typeInfo = randomItem(typePool);
      const brand = randomItem(brandPool);
      const name = buildProductName(brand, typeInfo);
      const price = randomPrice();
      const hasSale = Math.random() < 0.45;
      const salePrice = hasSale ? price - Math.round(price * (Math.random() * 0.2 + 0.1)) : null;

      let target = typeInfo.target;
      if (key === 'hygiene') {
        if (/cát vệ sinh/i.test(typeInfo.keyword)) target = 'cat';
        if (/sữa tắm/i.test(typeInfo.keyword)) target = 'both';
      }

      const subcategoryName = pickSubcategoryName(categoryData, target);

      products.push({
        name,
        description: randomDescription(),
        price,
        sale_price: salePrice,
        stock_quantity: Math.floor(Math.random() * 250) + 20,
        images: [randomItem(PLACEHOLDER_IMAGES)],
        category: categoryId,
        target,
        brand,
        tags: [typeInfo.label.toLowerCase(), key, ...(subcategoryName ? [subcategoryName.toLowerCase()] : [])],
        is_featured: Math.random() < 0.2,
        is_active: true
      });
    }
  });

  return products;
};

const seedProducts = async () => {
  try {
    await connectDB();
    const categoryMap = await findCategoryIds();
    const products = generateProducts(categoryMap);

    console.log(`🚀 Inserting ${products.length} products...`);
    await Product.insertMany(products);
    console.log('✅ Seed completed successfully!');
  } catch (error) {
    console.error('❌ Seed failed:', error);
  } finally {
    await mongoose.disconnect();
    process.exit();
  }
};

seedProducts();
