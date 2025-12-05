import { useState, useEffect } from 'react';
import axios from 'axios';
import HomeSlider from '../../components/HomeSlider';
import Features from '../../components/Features';
import BannerPromo from '../../components/BannerPromo';
import ProductRow from '../../components/ProductRow';
import { FaFire, FaStar, FaTag, FaPaw, FaLightbulb } from 'react-icons/fa';
import { CONFIG } from '../../constants/config';
import { useAuth } from '../../context/AuthContext';

const Home = () => {
    const { user } = useAuth();
    const [featuredProducts, setFeaturedProducts] = useState([]);
    const [recommendedProducts, setRecommendedProducts] = useState([]);
    const [bestsellerProducts, setBestsellerProducts] = useState([]);
    const [newProducts, setNewProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showRecommendations, setShowRecommendations] = useState(false);

    // Fetch recommendations for logged-in users
    useEffect(() => {
        const fetchRecommendations = async () => {
            if (!user?._id) {
                setShowRecommendations(false);
                return;
            }

            try {
                console.log('Fetching recommendations for user:', user._id);
                const response = await axios.get(`${CONFIG.API.BASE_URL}/api/recommendations/${user._id}?limit=8`);
                console.log('Recommendations API response:', response.data);
                
                const products = response.data?.data?.products || [];
                const isPersonalized = response.data?.fallback === false && products.length > 0;
                
                console.log('Products count:', products.length);
                console.log('Is personalized:', isPersonalized);
                console.log('Fallback value:', response.data?.fallback);

                if (response.data.success && isPersonalized) {
                    // Transform recommendations to match component format
                    const transformedRecommendations = products.map(product => ({
                        id: product._id,
                        name: product.name,
                        category: product.category?.name || 'Chưa phân loại',
                        brand: product.brand,
                        price: product.sale_price || product.price,
                        oldPrice: product.sale_price ? product.price : null,
                        image: product.images?.[0] || 'https://placehold.co/400x400?text=No+Image',
                        rating: product.rating || 4.5,
                        reviews: Math.floor(Math.random() * 200) + 10,
                        stock: product.stock_quantity,
                        isNew: new Date(product.createdAt) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
                        updatedAt: product.updatedAt || product.createdAt
                    }))
                    .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)); // Sort by updatedAt
                    
                    setRecommendedProducts(transformedRecommendations);
                    setShowRecommendations(true);
                } else {
                    console.log('Not showing recommendations - success:', response.data.success, 'isPersonalized:', isPersonalized);
                    setRecommendedProducts([]);
                    setShowRecommendations(false);
                }
            } catch (error) {
                console.error('Recommendations API error:', error);
                console.error('Error response:', error.response?.data);
                // Nếu API fail hoặc chưa có dữ liệu, không hiển thị recommendations
                setRecommendedProducts([]);
                setShowRecommendations(false);
            }
        };

        fetchRecommendations();
    }, [user]);

    // Fetch products from API
    useEffect(() => {
        const fetchProducts = async () => {
            try {
                setLoading(true);
                
                // Fetch featured products (is_featured = true, sorted by updatedAt)
                const featuredResponse = await axios.get(`${CONFIG.API.BASE_URL}/api/products/featured?limit=8&sort=updatedAt&sortOrder=desc`);
                
                // Fetch bestsellers (sorted by sales_count, then updatedAt)
                const bestsellersResponse = await axios.get(`${CONFIG.API.BASE_URL}/api/products?sort=bestseller&limit=20&sortBy=updatedAt&sortOrder=desc`);
                
                // Fetch new products (sorted by updatedAt)
                const newProductsResponse = await axios.get(`${CONFIG.API.BASE_URL}/api/products?limit=40&sort=updatedAt&sortOrder=desc`);

                // Set featured products from API
                if (featuredResponse.data.success && featuredResponse.data.data.products) {
                    const featured = featuredResponse.data.data.products.map(product => ({
                        id: product._id,
                        name: product.name,
                        category: product.category?.name || 'Chưa phân loại',
                        brand: product.brand,
                        price: product.sale_price || product.price,
                        oldPrice: product.sale_price ? product.price : null,
                        image: product.images?.[0] || 'https://placehold.co/400x400?text=No+Image',
                        rating: product.rating || 4.5,
                        reviews: Math.floor(Math.random() * 200) + 10,
                        stock: product.stock_quantity,
                        salesCount: product.sales_count || 0,
                        isNew: new Date(product.createdAt) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
                        updatedAt: product.updatedAt || product.createdAt
                    }))
                    .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)); // Sort by updatedAt
                    setFeaturedProducts(featured);
                }
                
                // Set bestsellers from dedicated API
                if (bestsellersResponse.data.success && bestsellersResponse.data.data.products) {
                    const bestsellers = bestsellersResponse.data.data.products.map(product => ({
                        id: product._id,
                        name: product.name,
                        category: product.category?.name || 'Chưa phân loại',
                        brand: product.brand,
                        price: product.sale_price || product.price,
                        oldPrice: product.sale_price ? product.price : null,
                        image: product.images?.[0] || 'https://placehold.co/400x400?text=No+Image',
                        rating: product.rating || 4.5,
                        reviews: Math.floor(Math.random() * 200) + 10,
                        stock: product.stock_quantity,
                        salesCount: product.sales_count || 0,
                        isNew: new Date(product.createdAt) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
                        updatedAt: product.updatedAt || product.createdAt
                    }))
                    .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)); // Sort by updatedAt
                    
                    // Debug: Log bestsellers with sales_count
                    console.log('🔥 Bestsellers from API:', bestsellers.map(p => ({
                        name: p.name,
                        salesCount: p.salesCount
                    })));
                    
                    setBestsellerProducts(bestsellers);
                }
                
                // Set new products (sorted by updatedAt, newest first)
                if (newProductsResponse.data.success && newProductsResponse.data.data.products) {
                    const newProds = newProductsResponse.data.data.products
                        .map(product => ({
                            id: product._id,
                            name: product.name,
                            category: product.category?.name || 'Chưa phân loại',
                            brand: product.brand,
                            price: product.sale_price || product.price,
                            oldPrice: product.sale_price ? product.price : null,
                            image: product.images?.[0] || 'https://placehold.co/400x400?text=No+Image',
                            rating: product.rating || 4.5,
                            reviews: Math.floor(Math.random() * 200) + 10,
                            stock: product.stock_quantity,
                            salesCount: product.sales_count || 0,
                            isNew: new Date(product.createdAt) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
                            updatedAt: product.updatedAt || product.createdAt
                        }))
                        .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)); // Sort by updatedAt
                    setNewProducts(newProds);
                }
            } catch (error) {
                setFeaturedProducts(mockFeaturedProducts);
                setBestsellerProducts(mockBestsellerProducts);
                setNewProducts(mockFeaturedProducts.filter(p => p.isNew));
            } finally {
                setLoading(false);
            }
        };

        fetchProducts();
    }, []);

    // Mock data as fallback
    const mockFeaturedProducts = [
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
            id: 6,
            name: 'Lồng vận chuyển thú cưng size M',
            category: 'Phụ kiện',
            price: 550000,
            oldPrice: null,
            discount: null,
            image: 'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=400',
            rating: 4,
            reviews: 45,
            stock: 15,
            isNew: false
        }
    ];

    const bestSellers = [
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
        }
    ];

    const dealsOfDay = [
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
            id: 18,
            name: 'Bát ăn tự động cho thú cưng',
            category: 'Phụ kiện',
            price: 850000,
            oldPrice: 1100000,
            discount: 23,
            image: 'https://images.unsplash.com/photo-1450778869180-41d0601e046e?w=400',
            rating: 5,
            reviews: 189,
            stock: 22,
            isNew: true
        }
    ];

    const mockBestsellerProducts = featuredProducts.slice(0, 6);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Đang tải sản phẩm...</p>
                </div>
            </div>
        );
    }

    return (
        <>
            <HomeSlider />
            <Features />

            {showRecommendations && (
                <ProductRow 
                    title="Gợi ý dành cho bạn" 
                    products={recommendedProducts}
                    icon={<FaLightbulb />}
                    category="recommendations"
                    showViewAll={false}
                />
            )}

            {featuredProducts.length > 0 && (
                <ProductRow 
                    title="Sản phẩm nổi bật" 
                    products={featuredProducts}
                    icon={<FaFire />}
                    category="featured"
                    linkTo="/products?tag=featured"
                />
            )}
            
            <BannerPromo />

            {bestsellerProducts.length > 0 && (
                <ProductRow 
                    title="Bán chạy nhất" 
                    products={bestsellerProducts}
                    icon={<FaStar />}
                    category="bestseller"
                    showViewAll={false}
                />
            )}
            
            {newProducts.length > 0 && (
                <ProductRow 
                    title="Sản phẩm mới" 
                    products={newProducts}
                    icon={<FaPaw />}
                    category="new_products"
                    showViewAll={false}
                />
            )}
        </>
    );
};

export default Home;
