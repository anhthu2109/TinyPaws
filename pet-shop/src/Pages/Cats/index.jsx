import { useState } from 'react';
import ProductCard from '../../components/ProductCard';
import { FaCat, FaFilter, FaThLarge, FaList } from 'react-icons/fa';
import { Button, FormControl, InputLabel, Select, MenuItem } from '@mui/material';
import './style.css';

const Cats = () => {
    const [viewMode, setViewMode] = useState('grid');
    const [sortBy, setSortBy] = useState('popular');

    const products = [
        {
            id: 2,
            name: 'Pate Whiskas cho mèo vị cá ngừ',
            category: 'Thức ăn cho mèo',
            price: 35000,
            oldPrice: 45000,
            discount: 22,
            image: 'https://images.unsplash.com/photo-1611003228941-98852ba62227?w=400',
            rating: 4,
            reviews: 89,
            stock: 120,
            isNew: true
        },
        {
            id: 5,
            name: 'Cát vệ sinh cho mèo Ever Clean',
            category: 'Vệ sinh',
            price: 320000,
            oldPrice: 380000,
            discount: 16,
            image: 'https://images.unsplash.com/photo-1573865526739-10c1d3a1acc3?w=400',
            rating: 5,
            reviews: 342,
            stock: 60,
            isNew: false
        },
        {
            id: 9,
            name: 'Cây cào móng cho mèo 3 tầng',
            category: 'Đồ chơi',
            price: 890000,
            oldPrice: 1200000,
            discount: 26,
            image: 'https://images.unsplash.com/photo-1545249390-6bdfa286032f?w=400',
            rating: 5,
            reviews: 156,
            stock: 12,
            isNew: true
        },
        {
            id: 11,
            name: 'Thức ăn hạt Me-O cho mèo mọi lứa tuổi',
            category: 'Thức ăn cho mèo',
            price: 380000,
            oldPrice: 450000,
            discount: 16,
            image: 'https://images.unsplash.com/photo-1589652717521-10c0d092dea9?w=400',
            rating: 5,
            reviews: 267,
            stock: 90,
            isNew: false
        },
        {
            id: 14,
            name: 'Nhà ngủ hình hang động cho mèo',
            category: 'Phụ kiện',
            price: 450000,
            oldPrice: 650000,
            discount: 31,
            image: 'https://images.unsplash.com/photo-1513360371669-4adf3dd7dff8?w=400',
            rating: 5,
            reviews: 98,
            stock: 8,
            isNew: true
        },
        {
            id: 17,
            name: 'Khay vệ sinh cho mèo có nắp đậy',
            category: 'Vệ sinh',
            price: 420000,
            oldPrice: 550000,
            discount: 24,
            image: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=400',
            rating: 5,
            reviews: 223,
            stock: 42,
            isNew: false
        },
        {
            id: 19,
            name: 'Đồ chơi chuột nhồi bông cho mèo',
            category: 'Đồ chơi',
            price: 45000,
            oldPrice: null,
            discount: null,
            image: 'https://images.unsplash.com/photo-1545249390-6bdfa286032f?w=400',
            rating: 4,
            reviews: 156,
            stock: 200,
            isNew: false
        },
        {
            id: 20,
            name: 'Vòng cổ chống ve rận cho mèo',
            category: 'Phụ kiện',
            price: 580000,
            oldPrice: 720000,
            discount: 19,
            image: 'https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?w=400',
            rating: 5,
            reviews: 189,
            stock: 35,
            isNew: true
        }
    ];

    const categories = [
        'Tất cả',
        'Thức ăn cho mèo',
        'Đồ chơi',
        'Phụ kiện',
        'Chăm sóc sức khỏe',
        'Vệ sinh'
    ];

    return (
        <div className="cats-page py-6">
            <div className="container">
                <div className="breadcrumb mb-4 text-[14px]">
                    <span className="text-gray-500">Trang chủ</span>
                    <span className="mx-2">/</span>
                    <span className="text-[#ff5252] font-semibold">Sản phẩm cho Mèo</span>
                </div>

                <div className="page-header mb-6">
                    <div className="flex items-center gap-3 mb-2">
                        <FaCat className="text-[32px] text-[#ff5252]" />
                        <h1 className="text-[32px] font-bold">Sản phẩm cho Mèo</h1>
                    </div>
                    <p className="text-[14px] text-gray-600">
                        Khám phá bộ sưu tập sản phẩm chất lượng cao dành cho boss mèo của bạn
                    </p>
                </div>

                <div className="flex gap-6">
                    <div className="sidebar w-[250px] flex-shrink-0">
                        <div className="filter-box bg-white rounded-lg p-4 shadow-sm">
                            <h3 className="text-[16px] font-bold mb-4 flex items-center gap-2">
                                <FaFilter /> Bộ lọc
                            </h3>

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

                    <div className="main-content flex-1">
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

                        <div className={`products-grid ${viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4' : 'flex flex-col gap-4'}`}>
                            {products.map((product) => (
                                <ProductCard key={product.id} product={product} />
                            ))}
                        </div>

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

export default Cats;
