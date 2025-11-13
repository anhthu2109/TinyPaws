import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation } from 'swiper/modules';
import { Link } from 'react-router-dom';
import ProductCard from '../ProductCard';
import 'swiper/css';
import 'swiper/css/navigation';

const ProductRow = ({ title, products, icon, category = 'noi-bat', linkTo, showViewAll = true }) => {
    // Generate category slug from title or use linkTo prop
    const getViewAllLink = () => {
        if (linkTo) {
            return linkTo;
        }
        
        // Special handling for featured products
        if (title === 'Sản phẩm nổi bật' || category === 'featured') {
            return '/products?tag=featured';
        }
        
        const slugMap = {
            'Thức ăn cho chó': 'thuc-an-cho',
            'Thức ăn cho mèo': 'thuc-an-meo',
            'Đồ chơi thú cưng': 'do-choi',
            'Phụ kiện thú cưng': 'phu-kien',
            'Vệ sinh thú cưng': 've-sinh',
            'Sản phẩm cho chó': 'cho',
            'Sản phẩm cho mèo': 'meo'
        };
        return `/products/${slugMap[title] || category}`;
    };

    return (
        <div className="productRow py-6">
            <div className="container">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-[18px] sm:text-[20px] md:text-[24px] font-bold flex items-center gap-2">
                        {icon && <span className="text-[#ff5252] text-[16px] sm:text-[18px] md:text-[20px]">{icon}</span>}
                        <span className="line-clamp-1">{title}</span>
                    </h2>
                    {showViewAll && (
                        <Link 
                            to={getViewAllLink()}
                            className="group flex items-center gap-1 text-[12px] sm:text-[14px] text-[#ff5252] hover:text-[#e53e3e] transition-all duration-200 whitespace-nowrap"
                        >
                            <span className="hidden sm:inline">Xem tất cả</span>
                            <span className="sm:hidden">Xem</span>
                            <span className="transform group-hover:translate-x-1 transition-transform duration-200">→</span>
                        </Link>
                    )}
                </div>

                <Swiper
                    slidesPerView={5}
                    slidesPerGroup={5}
                    spaceBetween={20}
                    navigation={true}
                    modules={[Navigation]}
                    className="productSwiper"
                    breakpoints={{
                        320: {
                            slidesPerView: 1,
                            slidesPerGroup: 1,
                            spaceBetween: 10
                        },
                        640: {
                            slidesPerView: 2,
                            slidesPerGroup: 2,
                            spaceBetween: 15
                        },
                        768: {
                            slidesPerView: 3,
                            slidesPerGroup: 3,
                            spaceBetween: 15
                        },
                        1024: {
                            slidesPerView: 4,
                            slidesPerGroup: 4,
                            spaceBetween: 20
                        },
                        1280: {
                            slidesPerView: 5,
                            slidesPerGroup: 5,
                            spaceBetween: 20
                        }
                    }}
                >
                    {products.map((product, index) => (
                        <SwiperSlide key={index}>
                            <ProductCard product={product} />
                        </SwiperSlide>
                    ))}
                </Swiper>
            </div>
        </div>
    );
};

export default ProductRow;
