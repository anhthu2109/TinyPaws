import { Button } from '@mui/material';
import { Link, useNavigate } from 'react-router-dom';
import './style.css';

const BannerPromo = () => {
    const navigate = useNavigate();

    const handleDogProductsClick = () => {
        navigate('/products/category/cho');
    };

    const handleCatProductsClick = () => {
        navigate('/products/category/meo');
    };

    return (
        <div className="bannerPromo py-6">
            <div className="container">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Banner cho Chó */}
                    <div 
                        className="banner-item relative rounded-xl overflow-hidden h-[200px] sm:h-[220px] md:h-[250px] group cursor-pointer transform hover:scale-[1.02] transition-all duration-300"
                        onClick={handleDogProductsClick}
                        role="button"
                        tabIndex={0}
                        aria-label="Xem sản phẩm cho chó - Giảm giá đến 30%"
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault();
                                handleDogProductsClick();
                            }
                        }}
                    >
                        <img 
                            src="https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=800" 
                            alt="Dog Products" 
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        />
                        <div className="absolute inset-0 bg-gradient-to-r from-black/70 to-black/20 flex items-center">
                            <div className="content p-4 sm:p-6 md:p-8 text-white">
                                <span className="text-[12px] sm:text-[14px] font-semibold text-[#ffc107]">Giảm giá đến 30%</span>
                                <h3 className="text-[20px] sm:text-[24px] md:text-[28px] font-bold mt-2 mb-3 leading-tight">
                                    Sản phẩm<br className="hidden sm:block"/>
                                    <span className="sm:hidden"> </span>cho Chó
                                </h3>
                                <Button 
                                    className="!bg-white !text-black !px-4 !py-2 sm:!px-6 !rounded-full hover:!bg-[#ff5252] hover:!text-white transition !text-[12px] sm:!text-[14px] !font-medium"
                                    onClick={(e) => {
                                        e.stopPropagation(); // Prevent banner click event
                                        handleDogProductsClick();
                                    }}
                                >
                                    Mua ngay
                                </Button>
                            </div>
                        </div>
                    </div>

                    {/* Banner cho Mèo */}
                    <div 
                        className="banner-item relative rounded-xl overflow-hidden h-[200px] sm:h-[220px] md:h-[250px] group cursor-pointer transform hover:scale-[1.02] transition-all duration-300"
                        onClick={handleCatProductsClick}
                        role="button"
                        tabIndex={0}
                        aria-label="Xem sản phẩm cho mèo - Giảm giá đến 25%"
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault();
                                handleCatProductsClick();
                            }
                        }}
                    >
                        <img 
                            src="https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=800" 
                            alt="Cat Products" 
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        />
                        <div className="absolute inset-0 bg-gradient-to-r from-black/70 to-black/20 flex items-center">
                            <div className="content p-4 sm:p-6 md:p-8 text-white">
                                <span className="text-[12px] sm:text-[14px] font-semibold text-[#ffc107]">Giảm giá đến 25%</span>
                                <h3 className="text-[20px] sm:text-[24px] md:text-[28px] font-bold mt-2 mb-3 leading-tight">
                                    Sản phẩm<br className="hidden sm:block"/>
                                    <span className="sm:hidden"> </span>cho Mèo
                                </h3>
                                <Button 
                                    className="!bg-white !text-black !px-4 !py-2 sm:!px-6 !rounded-full hover:!bg-[#ff5252] hover:!text-white transition !text-[12px] sm:!text-[14px] !font-medium"
                                    onClick={(e) => {
                                        e.stopPropagation(); // Prevent banner click event
                                        handleCatProductsClick();
                                    }}
                                >
                                    Mua ngay
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BannerPromo;
