import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@mui/material';
import { FaShoppingCart, FaHeart } from 'react-icons/fa';
import { useCart } from '../../context/CartContext';
import { useWishlist } from '../../context/WishlistContext';
import { useAuth } from '../../context/AuthContext';
import './style.css';

const ProductCard = ({ product, viewMode = 'grid' }) => {
    const { addToCart, isInCart } = useCart();
    const { toggleWishlist, isInWishlist } = useWishlist();
    const { isAuthenticated } = useAuth();
    const navigate = useNavigate();

    const handleAddToCart = (e) => {
        e.preventDefault();
        e.stopPropagation();
        
        // Check if user is logged in
        if (!isAuthenticated) {
            navigate('/dang-nhap', { state: { from: window.location.pathname } });
            return;
        }
        
        if (product.stock_quantity > 0 || product.stock > 0) {
            addToCart(product, 1);
        }
    };

    const handleToggleWishlist = (e) => {
        e.preventDefault();
        e.stopPropagation();
        
        // Check if user is logged in
        if (!isAuthenticated) {
            navigate('/dang-nhap', { state: { from: window.location.pathname } });
            return;
        }
        
        toggleWishlist(product);
    };

    if (viewMode === 'list') {
        return (
            <div className="productCard bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 flex">
                <div className="w-48 h-48 flex-shrink-0">
                    <Link to={`/products/detail/${product._id || product.id}`}>
                        <img 
                            src={product.image || product.images?.[0]} 
                            alt={product.name} 
                            className="w-full h-full object-cover"
                        />
                    </Link>
                </div>
                <div className="flex-1 p-4 flex flex-col justify-between">
                    <div>
                        <Link to={`/products/detail/${product._id || product.id}`}>
                            <h4 className="text-lg font-semibold mt-1 mb-1 hover:text-[#ff5252] transition">
                                {product.name}
                            </h4>
                        </Link>
                        
                        {/* Brand or Category */}
                        {product.brand ? (
                            <p className="text-xs font-medium text-green-700 mb-2">
                                {product.brand}
                            </p>
                        ) : (
                            <span className="text-xs text-gray-500 uppercase">{product.category?.name || product.category}</span>
                        )}
                        
                        {product.rating && (
                            <div className="rating flex items-center gap-1 mb-2">
                                {[...Array(5)].map((_, index) => (
                                    <span key={index} className={`text-sm ${index < product.rating ? 'text-[#ffc107]' : 'text-gray-300'}`}>
                                        ★
                                    </span>
                                ))}
                                <span className="text-sm text-gray-500 ml-1">({product.reviews})</span>
                            </div>
                        )}
                    </div>
                    
                    <div className="flex items-center justify-between">
                        <div className="price flex items-center gap-2">
                            {product.oldPrice && (
                                <span className="text-sm text-gray-400 line-through">{product.oldPrice.toLocaleString()}đ</span>
                            )}
                            <span className="text-xl font-bold text-[#ff5252]">{product.price.toLocaleString()}đ</span>
                        </div>
                        <Button 
                            variant="contained" 
                            className="!bg-[#ff5252] hover:!bg-[#e53e3e] !text-white"
                            startIcon={<FaShoppingCart />}
                        >
                            Thêm vào giỏ
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="productCard bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 relative">
            <div className="imgWrapper relative overflow-hidden h-[180px] sm:h-[200px] md:h-[220px]">
                <Link to={`/products/detail/${product._id || product.id}`}>
                    <img 
                        src={product.image || product.images?.[0]} 
                        alt={product.name} 
                        className="w-full h-full object-cover transition-transform duration-300 hover:scale-110"
                    />
                </Link>
            </div>

            <div className="info p-3 sm:p-4">
                <Link to={`/products/detail/${product._id || product.id}`}>
                    <h4 className="text-[13px] sm:text-[14px] font-semibold mb-1 hover:text-[#ff5252] transition line-clamp-2 leading-tight">
                        {product.name}
                    </h4>
                </Link>
                
                {/* Brand or Category with Wishlist Icon */}
                <div className="flex items-center justify-between mb-2">
                    <div className="flex-1">
                        {product.brand ? (
                            <p className="text-[11px] font-bold" style={{ color: 'oklch(0.3 0.07 151.12)' }}>
                                {product.brand}
                            </p>
                        ) : product.category && (
                            <span className="text-[10px] text-gray-500 uppercase">{product.category?.name || product.category}</span>
                        )}
                    </div>
                    <Button 
                        onClick={handleToggleWishlist}
                        data-action="toggle-wishlist"
                        className={`!min-w-[28px] !w-[28px] !h-[28px] !rounded-full transition !flex !items-center !justify-center !p-0 ${
                            isInWishlist(product._id || product.id)
                                ? '!bg-pink-100 !text-[#ff6b81]'
                                : '!bg-gray-100 !text-gray-400 hover:!bg-pink-50 hover:!text-[#ff6b81]'
                        }`}
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}
                    >
                        <FaHeart className="text-[12px]" />
                    </Button>
                </div>
                
                {product.rating && (
                    <div className="rating flex items-center gap-1 mb-2">
                        {[...Array(5)].map((_, index) => (
                            <span key={index} className={`text-[11px] sm:text-[12px] ${index < product.rating ? 'text-[#ffc107]' : 'text-gray-300'}`}>
                                ★
                            </span>
                        ))}
                        <span className="text-[10px] sm:text-[11px] text-gray-500 ml-1">({product.reviews})</span>
                    </div>
                )}

                {/* Price with Cart Icon */}
                <div className="flex items-center justify-between gap-2">
                    <div className="price flex items-center gap-2">
                        <span className="text-[15px] sm:text-[15px] font-medium text-[#ff5252]">{product.price.toLocaleString()}đ</span>
                        {product.oldPrice && (
                            <span className="text-[10px] font-medium bg-pink-50 text-red-500 px-1.5 py-0.5 rounded">
                                -{Math.round(((product.oldPrice - product.price) / product.oldPrice) * 100)}%
                            </span>
                        )}
                    </div>
                    <Button 
                        onClick={handleAddToCart}
                        data-action="add-to-cart"
                        disabled={!product.stock_quantity && !product.stock}
                        className={`!min-w-[32px] !w-[32px] !h-[32px] !rounded-full transition !flex !items-center !justify-center !p-0 ${
                            isInCart(product._id || product.id)
                                ? '!bg-green-100 !text-green-600'
                                : '!bg-gray-100 !text-gray-500 hover:!bg-pink-50 hover:!text-[#ff6b81]'
                        }`}
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}
                    >
                        <FaShoppingCart className="text-[14px]" />
                    </Button>
                </div>

                {/* {product.stock !== undefined && (
                    <div className="stock mt-2">
                        {product.stock > 0 ? (
                            <span className="text-[10px] sm:text-[11px] text-green-600">Còn {product.stock} sản phẩm</span>
                        ) : (
                            <span className="text-[10px] sm:text-[11px] text-red-600">Hết hàng</span>
                        )}
                    </div>
                )} */}
            </div>
        </div>
    );
};

export default ProductCard;
