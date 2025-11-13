import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaChevronLeft, FaChevronRight, FaStar, FaShoppingCart } from 'react-icons/fa';
import { publicApi } from '../api/publicApi';

const RelatedProducts = ({ currentProductId, userId }) => {
    const [relatedProducts, setRelatedProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentIndex, setCurrentIndex] = useState(0);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchRecommendations = async () => {
            // Chỉ hiển thị nếu user đã đăng nhập
            if (!userId) {
                setLoading(false);
                return;
            }
            
            try {
                setLoading(true);
                
                const res = await publicApi.get(`/api/recommendations/${userId}?limit=8`);
                if (res.data.success && res.data.data.products) {
                    setRelatedProducts(res.data.data.products);
                }
                
            } catch (err) {
                console.error('Fetch recommendations error:', err);
            } finally {
                setLoading(false);
            }
        };
        
        fetchRecommendations();
    }, [userId]);

    const formatPrice = (p) =>
        new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(p);

    const handleClick = (id) => {
        navigate(`/products/detail/${id}`);
        window.scrollTo(0, 0);
    };

    const itemsPerView = 4;
    const maxIndex = Math.max(0, relatedProducts.length - itemsPerView);

    if (loading || relatedProducts.length === 0) return null;

    return (
        <div className="bg-gray-50 py-16">
            <div className="max-w-7xl mx-auto px-6">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h2 className="text-3xl font-bold text-gray-900 mb-2">
                            Gợi ý dành cho bạn
                        </h2>
                        <p className="text-gray-600">
                            Dựa trên sở thích và hành vi mua sắm của bạn
                        </p>
                    </div>
                    {relatedProducts.length > itemsPerView && (
                        <div className="flex space-x-2">
                            <button
                                onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))}
                                disabled={currentIndex === 0}
                                className="p-3 rounded-full bg-white shadow-md hover:shadow-lg transition disabled:opacity-50"
                            >
                                <FaChevronLeft />
                            </button>
                            <button
                                onClick={() => setCurrentIndex((i) => Math.min(maxIndex, i + 1))}
                                disabled={currentIndex >= maxIndex}
                                className="p-3 rounded-full bg-white shadow-md hover:shadow-lg transition disabled:opacity-50"
                            >
                                <FaChevronRight />
                            </button>
                        </div>
                    )}
                </div>

                <div className="relative overflow-hidden">
                    <div
                        className="flex transition-transform duration-300 ease-in-out"
                        style={{
                            transform: `translateX(-${currentIndex * (100 / itemsPerView)}%)`,
                            width: `${(relatedProducts.length / itemsPerView) * 100}%`
                        }}
                    >
                        {relatedProducts.map((p) => (
                            <div key={p._id} className="flex-shrink-0 px-3" style={{ width: `${100 / relatedProducts.length}%` }}>
                                <div
                                    className="bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all cursor-pointer overflow-hidden group"
                                    onClick={() => handleClick(p._id)}
                                >
                                    <img
                                        src={p.images?.[0] || '/placeholder-product.jpg'}
                                        alt={p.name}
                                        className="w-full h-64 object-cover group-hover:scale-105 transition-transform duration-300"
                                    />
                                    <div className="p-4">
                                        <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2 group-hover:text-blue-600 transition">
                                            {p.name}
                                        </h3>
                                        <div className="flex items-center mb-2 text-yellow-400">
                                            {[...Array(5)].map((_, i) => <FaStar key={i} size={12} />)}
                                            <span className="text-sm text-gray-500 ml-1">(4.5)</span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-lg font-bold text-red-600">
                                                {formatPrice(p.sale_price || p.price)}
                                            </span>
                                            <span className="text-xs text-green-600 font-medium">
                                                {p.stock_quantity > 0 ? 'Còn hàng' : 'Hết hàng'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RelatedProducts;
