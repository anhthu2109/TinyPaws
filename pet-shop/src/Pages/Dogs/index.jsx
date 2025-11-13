import { useState } from 'react';
import ProductCard from '../../components/ProductCard';
import { FaDog, FaFilter, FaThLarge, FaList } from 'react-icons/fa';
import { Button, FormControl, InputLabel, Select, MenuItem } from '@mui/material';
import './style.css';

const Dogs = () => {
    const [viewMode, setViewMode] = useState('grid');
    const [sortBy, setSortBy] = useState('popular');

    const products = [
        {
            id: 1,
            name: 'Thức ăn hạt Royal Canin cho chó trưởng thành',
            category: 'Thức ăn cho chó',
            price: 450000,
            oldPrice: 550000,
            discount: 18,
            image: 'https://images.unsplash.com/photo-1589924691995-400dc9ecc119?w=400',
            rating: 5,
            reviews: 128,
            stock: 45,
            isNew: false
        },
        {
            id: 4,
            name: 'Đồ chơi bóng cao su cho chó',
            category: 'Đồ chơi',
            price: 85000,
            oldPrice: null,
            discount: null,
            image: 'https://images.unsplash.com/photo-1535294435445-d7249524ef2e?w=400',
            rating: 4,
            reviews: 67,
            stock: 85,
            isNew: true
        },
        {
            id: 7,
            name: 'Sữa tắm Bio-Groom cho chó lông dài',
            category: 'Chăm sóc',
            price: 280000,
            oldPrice: 320000,
            discount: 13,
            image: 'https://images.unsplash.com/photo-1576201836106-db1758fd1c97?w=400',
            rating: 5,
            reviews: 189,
            stock: 55,
            isNew: false
        },
        {
            id: 8,
            name: 'Xương gặm sạch răng Dentastix',
            category: 'Thức ăn cho chó',
            price: 125000,
            oldPrice: null,
            discount: null,
            image: 'https://images.unsplash.com/photo-1623387641168-d9803ddd3f35?w=400',
            rating: 5,
            reviews: 423,
            stock: 200,
            isNew: false
        },
        {
            id: 10,
            name: 'Áo hoodie cho chó size S',
            category: 'Quần áo',
            price: 150000,
            oldPrice: null,
            discount: null,
            image: 'https://images.unsplash.com/photo-1534361960057-19889db9621e?w=400',
            rating: 4,
            reviews: 78,
            stock: 40,
            isNew: true
        },
        {
            id: 12,
            name: 'Dây dắt chó tự động 5m',
            category: 'Phụ kiện',
            price: 220000,
            oldPrice: 280000,
            discount: 21,
            image: 'https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=400',
            rating: 4,
            reviews: 134,
            stock: 35,
            isNew: false
        },
        {
            id: 13,
            name: 'Combo 6 lon pate Pedigree cho chó',
            category: 'Thức ăn cho chó',
            price: 180000,
            oldPrice: 270000,
            discount: 33,
            image: 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=400',
            rating: 5,
            reviews: 312,
            stock: 25,
            isNew: false
        },
        {
            id: 15,
            name: 'Vitamin tổng hợp cho chó Canxi Plus',
            category: 'Chăm sóc sức khỏe',
            price: 195000,
            oldPrice: 250000,
            discount: 22,
            image: 'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=400',
            rating: 5,
            reviews: 445,
            stock: 150,
            isNew: false
        }
    ];

    const categories = [
        'Tất cả',
        'Thức ăn cho chó',
        'Đồ chơi',
        'Quần áo & Phụ kiện',
        'Chăm sóc sức khỏe',
        'Vệ sinh'
    ];

    return (
        <div className="dogs-page py-6">
            <div className="container">
                {/* Breadcrumb */}
                <div className="breadcrumb mb-4 text-[14px]">
                    <span className="text-gray-500">Trang chủ</span>
                    <span className="mx-2">/</span>
                    <span className="text-[#ff5252] font-semibold">Sản phẩm cho Chó</span>
                </div>

                {/* Page Header */}
                <div className="page-header mb-6">
                    <div className="flex items-center gap-3 mb-2">
                        <FaDog className="text-[32px] text-[#ff5252]" />
                        <h1 className="text-[32px] font-bold">Sản phẩm cho Chó</h1>
                    </div>
                    <p className="text-[14px] text-gray-600">
                        Khám phá bộ sưu tập sản phẩm chất lượng cao dành cho người bạn bốn chân của bạn
                    </p>
                </div>

                <div className="flex gap-6">
                    {/* Sidebar Filter */}
                    <div className="sidebar w-[250px] flex-shrink-0">
                        <div className="filter-box bg-white rounded-lg p-4 shadow-sm">
                            <h3 className="text-[16px] font-bold mb-4 flex items-center gap-2">
                                <FaFilter /> Bộ lọc
                            </h3>

                            {/* Categories */}
                            <div className="filter-group mb-6">
                                <h4 className="text-[14px] font-semibold mb-3">Danh mục</h4>
                                <ul className="space-y-2">
                                    {categories.map((cat, index) => (
                                        <li key={index}>
                                            <label className="flex items-center gap-2 cursor-pointer text-[14px] hover:text-[#ff5252] transition">
                                                <input type="checkbox" className="accent-[#ff5252]" />
                                                {cat}
                                            </label>
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            {/* Price Range */}
                            <div className="filter-group mb-6">
                                <h4 className="text-[14px] font-semibold mb-3">Khoảng giá</h4>
                                <ul className="space-y-2">
                                    <li>
                                        <label className="flex items-center gap-2 cursor-pointer text-[14px] hover:text-[#ff5252] transition">
                                            <input type="checkbox" className="accent-[#ff5252]" />
                                            Dưới 100.000đ
                                        </label>
                                    </li>
                                    <li>
                                        <label className="flex items-center gap-2 cursor-pointer text-[14px] hover:text-[#ff5252] transition">
                                            <input type="checkbox" className="accent-[#ff5252]" />
                                            100.000đ - 300.000đ
                                        </label>
                                    </li>
                                    <li>
                                        <label className="flex items-center gap-2 cursor-pointer text-[14px] hover:text-[#ff5252] transition">
                                            <input type="checkbox" className="accent-[#ff5252]" />
                                            300.000đ - 500.000đ
                                        </label>
                                    </li>
                                    <li>
                                        <label className="flex items-center gap-2 cursor-pointer text-[14px] hover:text-[#ff5252] transition">
                                            <input type="checkbox" className="accent-[#ff5252]" />
                                            Trên 500.000đ
                                        </label>
                                    </li>
                                </ul>
                            </div>

                            {/* Rating */}
                            <div className="filter-group mb-6">
                                <h4 className="text-[14px] font-semibold mb-3">Đánh giá</h4>
                                <ul className="space-y-2">
                                    {[5, 4, 3].map((rating) => (
                                        <li key={rating}>
                                            <label className="flex items-center gap-2 cursor-pointer text-[14px] hover:text-[#ff5252] transition">
                                                <input type="checkbox" className="accent-[#ff5252]" />
                                                <span className="flex">
                                                    {[...Array(rating)].map((_, i) => (
                                                        <span key={i} className="text-[#ffc107]">★</span>
                                                    ))}
                                                    {[...Array(5 - rating)].map((_, i) => (
                                                        <span key={i} className="text-gray-300">★</span>
                                                    ))}
                                                </span>
                                                trở lên
                                            </label>
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            <Button className="!w-full !bg-[#ff5252] !text-white hover:!bg-[#013b22]">
                                Áp dụng bộ lọc
                            </Button>
                        </div>
                    </div>

                    {/* Main Content */}
                    <div className="main-content flex-1">
                        {/* Toolbar */}
                        <div className="toolbar bg-white rounded-lg p-4 mb-4 shadow-sm flex items-center justify-between">
                            <div className="result-count text-[14px] text-gray-600">
                                Hiển thị <strong>{products.length}</strong> sản phẩm
                            </div>

                            <div className="toolbar-actions flex items-center gap-4">
                                <FormControl size="small" className="!min-w-[200px]">
                                    <InputLabel>Sắp xếp theo</InputLabel>
                                    <Select
                                        value={sortBy}
                                        label="Sắp xếp theo"
                                        onChange={(e) => setSortBy(e.target.value)}
                                    >
                                        <MenuItem value="popular">Phổ biến nhất</MenuItem>
                                        <MenuItem value="newest">Mới nhất</MenuItem>
                                        <MenuItem value="price-asc">Giá: Thấp đến Cao</MenuItem>
                                        <MenuItem value="price-desc">Giá: Cao đến Thấp</MenuItem>
                                        <MenuItem value="rating">Đánh giá cao nhất</MenuItem>
                                    </Select>
                                </FormControl>

                                <div className="view-mode flex gap-2">
                                    <Button 
                                        className={`!min-w-[40px] !w-[40px] !h-[40px] ${viewMode === 'grid' ? '!bg-[#ff5252] !text-white' : '!bg-gray-100'}`}
                                        onClick={() => setViewMode('grid')}
                                    >
                                        <FaThLarge />
                                    </Button>
                                    <Button 
                                        className={`!min-w-[40px] !w-[40px] !h-[40px] ${viewMode === 'list' ? '!bg-[#ff5252] !text-white' : '!bg-gray-100'}`}
                                        onClick={() => setViewMode('list')}
                                    >
                                        <FaList />
                                    </Button>
                                </div>
                            </div>
                        </div>

                        {/* Products Grid */}
                        <div className={`products-grid ${viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4' : 'flex flex-col gap-4'}`}>
                            {products.map((product) => (
                                <ProductCard key={product.id} product={product} />
                            ))}
                        </div>

                        {/* Pagination */}
                        <div className="pagination flex justify-center items-center gap-2 mt-8">
                            <Button className="!min-w-[40px] !h-[40px] !border !border-gray-300">«</Button>
                            <Button className="!min-w-[40px] !h-[40px] !bg-[#ff5252] !text-white">1</Button>
                            <Button className="!min-w-[40px] !h-[40px] !border !border-gray-300">2</Button>
                            <Button className="!min-w-[40px] !h-[40px] !border !border-gray-300">3</Button>
                            <Button className="!min-w-[40px] !h-[40px] !border !border-gray-300">»</Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dogs;
