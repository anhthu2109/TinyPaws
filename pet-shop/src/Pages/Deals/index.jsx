import { useState } from 'react';
import ProductCard from '../../components/ProductCard';
import { FaTag, FaFire, FaClock } from 'react-icons/fa';
import { Button } from '@mui/material';
import './style.css';

const Deals = () => {
    const [activeTab, setActiveTab] = useState('flash-sale');

    const flashSaleProducts = [
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
            id: 16,
            name: 'Balo vận chuyển thú cưng trong suốt',
            category: 'Phụ kiện',
            price: 680000,
            oldPrice: 890000,
            discount: 24,
            image: 'https://images.unsplash.com/photo-1541781774459-bb2af2f05b55?w=400',
            rating: 4,
            reviews: 67,
            stock: 18,
            isNew: true
        },
        {
            id: 3,
            name: 'Vòng cổ chống ve rận Seresto cho chó',
            category: 'Phụ kiện',
            price: 680000,
            oldPrice: 850000,
            discount: 20,
            image: 'https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?w=400',
            rating: 5,
            reviews: 256,
            stock: 30,
            isNew: false
        }
    ];

    const weeklyDeals = [
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

    const comboDeals = [
        {
            id: 21,
            name: 'Combo chăm sóc toàn diện cho chó',
            category: 'Combo',
            price: 1200000,
            oldPrice: 1800000,
            discount: 33,
            image: 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=400',
            rating: 5,
            reviews: 89,
            stock: 15,
            isNew: true
        },
        {
            id: 22,
            name: 'Combo thức ăn + đồ chơi cho mèo',
            category: 'Combo',
            price: 850000,
            oldPrice: 1200000,
            discount: 29,
            image: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=400',
            rating: 5,
            reviews: 156,
            stock: 20,
            isNew: true
        },
        {
            id: 23,
            name: 'Combo starter kit cho chó con',
            category: 'Combo',
            price: 950000,
            oldPrice: 1400000,
            discount: 32,
            image: 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=400',
            rating: 5,
            reviews: 234,
            stock: 12,
            isNew: true
        },
        {
            id: 24,
            name: 'Combo vệ sinh cho mèo',
            category: 'Combo',
            price: 680000,
            oldPrice: 950000,
            discount: 28,
            image: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=400',
            rating: 4,
            reviews: 178,
            stock: 25,
            isNew: false
        }
    ];

    const getProducts = () => {
        switch (activeTab) {
            case 'flash-sale':
                return flashSaleProducts;
            case 'weekly':
                return weeklyDeals;
            case 'combo':
                return comboDeals;
            default:
                return flashSaleProducts;
        }
    };

    return (
        <div className="deals-page py-6">
            <div className="container">
                <div className="breadcrumb mb-4 text-[14px]">
                    <span className="text-gray-500">Trang chủ</span>
                    <span className="mx-2">/</span>
                    <span className="text-[#ff5252] font-semibold">Ưu đãi</span>
                </div>

                {/* Hero Banner */}
                <div className="deals-hero bg-gradient-to-r from-[#ff5252] to-[#ff7b7b] rounded-xl p-8 mb-6 text-white">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-[36px] font-bold mb-2 flex items-center gap-3">
                                <FaTag className="text-[32px]" />
                                Ưu đãi đặc biệt
                            </h1>
                            <p className="text-[16px] opacity-90">
                                Tiết kiệm đến 50% cho các sản phẩm chăm sóc thú cưng
                            </p>
                        </div>
                        <div className="countdown bg-white/20 rounded-lg p-6 text-center backdrop-blur-sm">
                            <FaClock className="text-[32px] mx-auto mb-2" />
                            <div className="text-[24px] font-bold">23:45:12</div>
                            <div className="text-[12px] opacity-80">Kết thúc sau</div>
                        </div>
                    </div>
                </div>

                {/* Tabs */}
                <div className="deals-tabs flex gap-4 mb-6">
                    <Button
                        className={`!px-6 !py-3 !rounded-lg !text-[15px] !font-semibold ${
                            activeTab === 'flash-sale'
                                ? '!bg-[#ff5252] !text-white'
                                : '!bg-white !text-gray-700 hover:!bg-gray-100'
                        }`}
                        onClick={() => setActiveTab('flash-sale')}
                    >
                        <FaFire className="mr-2" />
                        Flash Sale
                    </Button>
                    <Button
                        className={`!px-6 !py-3 !rounded-lg !text-[15px] !font-semibold ${
                            activeTab === 'weekly'
                                ? '!bg-[#ff5252] !text-white'
                                : '!bg-white !text-gray-700 hover:!bg-gray-100'
                        }`}
                        onClick={() => setActiveTab('weekly')}
                    >
                        <FaTag className="mr-2" />
                        Deal trong tuần
                    </Button>
                    <Button
                        className={`!px-6 !py-3 !rounded-lg !text-[15px] !font-semibold ${
                            activeTab === 'combo'
                                ? '!bg-[#ff5252] !text-white'
                                : '!bg-white !text-gray-700 hover:!bg-gray-100'
                        }`}
                        onClick={() => setActiveTab('combo')}
                    >
                        <FaTag className="mr-2" />
                        Combo tiết kiệm
                    </Button>
                </div>

                {/* Products Grid */}
                <div className="products-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {getProducts().map((product) => (
                        <ProductCard key={product.id} product={product} />
                    ))}
                </div>

                {/* Promo Banners */}
                <div className="promo-banners grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
                    <div className="promo-card bg-gradient-to-br from-[#4caf50] to-[#66bb6a] rounded-lg p-6 text-white">
                        <h3 className="text-[20px] font-bold mb-2">Miễn phí vận chuyển</h3>
                        <p className="text-[14px] opacity-90 mb-3">
                            Cho đơn hàng từ 500.000đ
                        </p>
                        <Button className="!bg-white !text-[#4caf50] !font-semibold">
                            Mua ngay
                        </Button>
                    </div>

                    <div className="promo-card bg-gradient-to-br from-[#2196f3] to-[#42a5f5] rounded-lg p-6 text-white">
                        <h3 className="text-[20px] font-bold mb-2">Tích điểm đổi quà</h3>
                        <p className="text-[14px] opacity-90 mb-3">
                            Nhận ngay 100 điểm khi đăng ký
                        </p>
                        <Button className="!bg-white !text-[#2196f3] !font-semibold">
                            Đăng ký ngay
                        </Button>
                    </div>

                    <div className="promo-card bg-gradient-to-br from-[#ff9800] to-[#ffa726] rounded-lg p-6 text-white">
                        <h3 className="text-[20px] font-bold mb-2">Giảm 15% đơn đầu</h3>
                        <p className="text-[14px] opacity-90 mb-3">
                            Dành cho khách hàng mới
                        </p>
                        <Button className="!bg-white !text-[#ff9800] !font-semibold">
                            Nhận mã
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Deals;
