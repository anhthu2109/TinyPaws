import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@mui/material';
import { FaShoppingCart, FaHeart, FaShare, FaMinus, FaPlus, FaStar } from 'react-icons/fa';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Thumbs } from 'swiper/modules';
import axios from 'axios';
import RelatedProducts from '../components/RelatedProducts';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/thumbs';

const ProductDetailPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [quantity, setQuantity] = useState(1);
    const [selectedImage, setSelectedImage] = useState(0);
    const [thumbsSwiper, setThumbsSwiper] = useState(null);

    useEffect(() => {
        fetchProduct();
    }, [id]);

    const fetchProduct = async () => {
        try {
            setLoading(true);
            const response = await axios.get(`http://localhost:8000/api/products/${id}`);
            
            if (response.data.success) {
                setProduct(response.data.data);
            } else {
                setError('Không tìm thấy sản phẩm');
            }
        } catch (error) {
            console.error('Error fetching product:', error);
            setError(error.response?.data?.message || 'Lỗi khi tải thông tin sản phẩm');
        } finally {
            setLoading(false);
        }
    };

    const handleQuantityChange = (type) => {
        if (type === 'increase') {
            setQuantity(prev => Math.min(prev + 1, product.stock_quantity));
        } else {
            setQuantity(prev => Math.max(prev - 1, 1));
        }
    };

    const handleAddToCart = () => {
        // TODO: Implement add to cart functionality
        console.log('Add to cart:', { product: product._id, quantity });
        // alert(`Đã thêm ${quantity} sản phẩm vào giỏ hàng!`);
    };

    const handleBuyNow = () => {
        // TODO: Implement buy now functionality
        console.log('Buy now:', { product: product._id, quantity });
        alert('Chức năng mua ngay đang được phát triển!');
    };

    if (loading) {
        return (
            <div className="container mx-auto px-4 py-8">
                <div className="flex justify-center items-center min-h-[400px]">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#ff5252] mx-auto mb-4"></div>
                        <p className="text-gray-600">Đang tải thông tin sản phẩm...</p>
                    </div>
                </div>
            </div>
        );
    }

    if (error || !product) {
        return (
            <div className="container mx-auto px-4 py-8">
                <div className="text-center min-h-[400px] flex flex-col justify-center">
                    <h2 className="text-2xl font-bold text-gray-800 mb-4">Không tìm thấy sản phẩm</h2>
                    <p className="text-gray-600 mb-6">{error}</p>
                    <Button 
                        variant="contained" 
                        onClick={() => navigate('/')}
                        className="!bg-[#ff5252] hover:!bg-[#e53e3e] !mx-auto"
                    >
                        Về trang chủ
                    </Button>
                </div>
            </div>
        );
    }

    const formatPrice = (price) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(price);
    };

    const discountedPrice = product.discount_percentage 
        ? product.price * (1 - product.discount_percentage / 100)
        : product.price;

    return (
        <div className="container mx-auto px-4 py-8">
            {/* Breadcrumb */}
            <nav className="mb-6">
                <ol className="flex items-center space-x-2 text-sm text-gray-600">
                    <li><a href="/" className="hover:text-[#ff5252]">Trang chủ</a></li>
                    <li>/</li>
                    <li><a href="/products" className="hover:text-[#ff5252]">Sản phẩm</a></li>
                    <li>/</li>
                    <li className="text-gray-800">{product.name}</li>
                </ol>
            </nav>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Product Images */}
                <div className="space-y-4">
                    <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                        <Swiper
                            spaceBetween={10}
                            navigation={true}
                            thumbs={{ swiper: thumbsSwiper }}
                            modules={[Navigation, Thumbs]}
                            className="h-full"
                        >
                            {product.images?.map((image, index) => (
                                <SwiperSlide key={index}>
                                    <img 
                                        src={image} 
                                        alt={`${product.name} ${index + 1}`}
                                        className="w-full h-full object-cover"
                                    />
                                </SwiperSlide>
                            ))}
                        </Swiper>
                    </div>
                    
                    {/* Thumbnails */}
                    {product.images?.length > 1 && (
                        <Swiper
                            onSwiper={setThumbsSwiper}
                            spaceBetween={10}
                            slidesPerView={4}
                            freeMode={true}
                            watchSlidesProgress={true}
                            modules={[Navigation, Thumbs]}
                            className="thumbs-swiper"
                        >
                            {product.images.map((image, index) => (
                                <SwiperSlide key={index}>
                                    <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden cursor-pointer">
                                        <img 
                                            src={image} 
                                            alt={`Thumb ${index + 1}`}
                                            className="w-full h-full object-cover"
                                        />
                                    </div>
                                </SwiperSlide>
                            ))}
                        </Swiper>
                    )}
                </div>

                {/* Product Info */}
                <div className="space-y-6">
                    <div>
                        <span className="text-sm text-gray-500 uppercase">
                            {product.category?.name}
                        </span>
                        <h1 className="text-3xl font-bold text-gray-800 mt-2">
                            {product.name}
                        </h1>
                    </div>

                    {/* Rating */}
                    {product.average_rating > 0 && (
                        <div className="flex items-center gap-2">
                            <div className="flex items-center">
                                {[...Array(5)].map((_, index) => (
                                    <FaStar 
                                        key={index} 
                                        className={`text-sm ${
                                            index < Math.floor(product.average_rating) 
                                                ? 'text-yellow-400' 
                                                : 'text-gray-300'
                                        }`} 
                                    />
                                ))}
                            </div>
                            <span className="text-sm text-gray-600">
                                ({product.average_rating}/5) - {product.review_count || 0} đánh giá
                            </span>
                        </div>
                    )}

                    {/* Price */}
                    <div className="space-y-2">
                        <div className="flex items-center gap-3">
                            {product.discount_percentage > 0 && (
                                <span className="text-lg text-gray-400 line-through">
                                    {formatPrice(product.price)}
                                </span>
                            )}
                            <span className="text-3xl font-bold text-[#ff5252]">
                                {formatPrice(discountedPrice)}
                            </span>
                            {product.discount_percentage > 0 && (
                                <span className="bg-[#ff5252] text-white px-2 py-1 rounded text-sm font-semibold">
                                    -{product.discount_percentage}%
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Stock Status */}
                    <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-600">Tình trạng:</span>
                        {product.stock_quantity > 0 ? (
                            <span className="text-green-600 font-semibold">
                                Còn {product.stock_quantity} sản phẩm
                            </span>
                        ) : (
                            <span className="text-red-600 font-semibold">Hết hàng</span>
                        )}
                    </div>

                    {/* Description */}
                    {product.description && (
                        <div>
                            <h3 className="text-lg font-semibold mb-2">Mô tả sản phẩm</h3>
                            <p className="text-gray-600 leading-relaxed product-description">
                                {product.description}
                            </p>
                        </div>
                    )}

                    {/* Quantity & Actions */}
                    {product.stock_quantity > 0 && (
                        <div className="space-y-4">
                            <div className="flex items-center gap-4">
                                <span className="text-sm font-semibold">Số lượng:</span>
                                <div className="flex items-center border rounded-lg">
                                    <button 
                                        onClick={() => handleQuantityChange('decrease')}
                                        disabled={quantity <= 1}
                                        className="p-2 hover:bg-gray-100 disabled:opacity-50"
                                    >
                                        <FaMinus className="text-sm" />
                                    </button>
                                    <span className="px-4 py-2 min-w-[60px] text-center">
                                        {quantity}
                                    </span>
                                    <button 
                                        onClick={() => handleQuantityChange('increase')}
                                        disabled={quantity >= product.stock_quantity}
                                        className="p-2 hover:bg-gray-100 disabled:opacity-50"
                                    >
                                        <FaPlus className="text-sm" />
                                    </button>
                                </div>
                            </div>

                            <div className="flex gap-4">
                                <Button
                                    variant="outlined"
                                    onClick={handleAddToCart}
                                    className="!border-[#ff5252] !text-[#ff5252] hover:!bg-[#ff5252] hover:!text-white !flex-1"
                                    startIcon={<FaShoppingCart />}
                                >
                                    Thêm vào giỏ
                                </Button>
                                <Button
                                    variant="contained"
                                    onClick={handleBuyNow}
                                    className="!bg-[#ff5252] hover:!bg-[#e53e3e] !flex-1"
                                >
                                    Mua ngay
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* Additional Actions */}
                    <div className="flex gap-4 pt-4 border-t">
                        <button className="flex items-center gap-2 text-gray-600 hover:text-[#ff5252] transition">
                            <FaHeart />
                            <span>Yêu thích</span>
                        </button>
                        <button className="flex items-center gap-2 text-gray-600 hover:text-[#ff5252] transition">
                            <FaShare />
                            <span>Chia sẻ</span>
                        </button>
                    </div>
                </div>
            </div>

            {product && <RelatedProducts currentProductId={id} />}

            {/* Related Products */}
            {/* {product?.category && (
                <RelatedProducts 
                    currentProductId={id} 
                    categoryId={typeof product.category === 'string' ? product.category : product.category._id} 
                />
            )} */}
        </div>
    );
};

export default ProductDetailPage;
