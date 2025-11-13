import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import logo from '../../assets/logo/logo.png';
import Search from '../Search';
import Badge from '@mui/material/Badge';
import { styled } from '@mui/material/styles';
import IconButton from '@mui/material/IconButton';
import { MdOutlineShoppingCart } from "react-icons/md";
import { FaHeart, FaUser, FaSignOutAlt, FaCog, FaBoxOpen, FaChartBar, FaHistory } from "react-icons/fa";
import Tooltip from '@mui/material/Tooltip';
import { Menu, MenuItem, Avatar, Divider } from '@mui/material';
import Navigation from './Navigation';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { useWishlist } from '../../context/WishlistContext';
import MiniCart from '../MiniCart';
import MiniWishlist from '../MiniWishlist';

const StyledBadge = styled(Badge)(({ theme }) => ({
    '& .MuiBadge-badge': {
        right: -3,
        top: 13,
        padding: '0 4px',
    },
}));

const HeaderDesktop = () => {
    const { user, logout, isAuthenticated } = useAuth();
    const { getCartCount } = useCart();
    const { getWishlistCount } = useWishlist();
    const navigate = useNavigate();
    const [anchorEl, setAnchorEl] = useState(null);
    const open = Boolean(anchorEl);
    const [userAvatar, setUserAvatar] = useState(null);
    
    // Mini Cart & Wishlist popup states
    const [showMiniCart, setShowMiniCart] = useState(false);
    const [showMiniWishlist, setShowMiniWishlist] = useState(false);
    const [cartPosition, setCartPosition] = useState({ top: 0, left: 0 });
    const [wishlistPosition, setWishlistPosition] = useState({ top: 0, left: 0 });
    const cartButtonRef = useRef(null);
    const wishlistButtonRef = useRef(null);

    // Load avatar from localStorage
    useEffect(() => {
        if (user) {
            const savedAvatar = localStorage.getItem(`avatar_${user.id}`);
            setUserAvatar(savedAvatar);
        }
    }, [user]);

    const handleClick = (event) => {
        setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    const handleLogout = () => {
        logout();
        handleClose();
        navigate('/');  // Redirect to homepage after logout
    };

    // Calculate popup position
    const calculatePosition = (buttonRef) => {
        if (!buttonRef.current) return { top: 0, left: 0 };
        const rect = buttonRef.current.getBoundingClientRect();
        return {
            top: rect.bottom + 8, // 8px gap below button
            left: rect.right - 380, // Align right edge of popup with button (380px = popup width)
        };
    };

    // Handle cart toggle
    const handleCartToggle = () => {
        if (!showMiniCart) {
            setCartPosition(calculatePosition(cartButtonRef));
        }
        setShowMiniCart(!showMiniCart);
    };

    // Handle wishlist toggle
    const handleWishlistToggle = () => {
        if (!showMiniWishlist) {
            setWishlistPosition(calculatePosition(wishlistButtonRef));
        }
        setShowMiniWishlist(!showMiniWishlist);
    };

    // Close popups when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            // Check if click is on cart button or inside cart popup
            if (showMiniCart) {
                const isClickOnButton = cartButtonRef.current?.contains(event.target);
                const isClickInPopup = event.target.closest('.mini-cart-popup');
                // Don't close if clicking on any cart/wishlist action buttons on the page
                const isActionButton = event.target.closest('[data-action="add-to-cart"]') || 
                                      event.target.closest('[data-action="toggle-wishlist"]');
                
                if (!isClickOnButton && !isClickInPopup && !isActionButton) {
                    setShowMiniCart(false);
                }
            }
            
            // Check if click is on wishlist button or inside wishlist popup
            if (showMiniWishlist) {
                const isClickOnButton = wishlistButtonRef.current?.contains(event.target);
                const isClickInPopup = event.target.closest('.mini-wishlist-popup');
                // Don't close if clicking on any cart/wishlist action buttons on the page
                const isActionButton = event.target.closest('[data-action="add-to-cart"]') || 
                                      event.target.closest('[data-action="toggle-wishlist"]');
                
                if (!isClickOnButton && !isClickInPopup && !isActionButton) {
                    setShowMiniWishlist(false);
                }
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [showMiniCart, showMiniWishlist]);

    // Recalculate position on scroll/resize
    useEffect(() => {
        const handleUpdate = () => {
            if (showMiniCart) {
                setCartPosition(calculatePosition(cartButtonRef));
            }
            if (showMiniWishlist) {
                setWishlistPosition(calculatePosition(wishlistButtonRef));
            }
        };

        window.addEventListener('scroll', handleUpdate);
        window.addEventListener('resize', handleUpdate);
        return () => {
            window.removeEventListener('scroll', handleUpdate);
            window.removeEventListener('resize', handleUpdate);
        };
    }, [showMiniCart, showMiniWishlist]);

    return (
        <header className='bg-white hidden md:block sticky top-0 z-[9998] shadow-sm'>
            {/* Top Strip */}
            <div className="top-strip py-2 border-t-[1px] border-gray-250 border-b-[1px] bg-gray-50">
                <div className="container">
                    <div className="flex items-center justify-between">
                        <div className="col1 w-[50%]">
                            <p className="text-[12px] font-[450]">🐾 Tiny Paws, Big Love – Bringing Happiness to Every Home 🏡</p>
                        </div>

                        <div className="col1 w-[50%] flex justify-end">
                            <p className="text-[12px] font-[450]">💕Hotline: 1800-1234💕</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Header - Single Row Layout */}
            <div className="header py-3 border-b-[1px] border-gray-200 bg-white">
                <div className="container">
                    <div className="flex items-center justify-between gap-6">
                        {/* Logo */}
                        <div className="flex-shrink-0">
                            <Link to={"/"}>
                                <img src={logo} alt="Logo" className="h-16 w-auto" />
                            </Link>
                        </div>

                        {/* Navigation */}
                        <div className="flex-1">
                            <Navigation />
                        </div>

                        {/* Search */}
                        <div className="w-[280px] flex-shrink-0">
                            <Search />
                        </div>

                        {/* Icons */}
                        <div className="flex items-center gap-2 flex-shrink-0">
                        <ul className="flex items-center gap-2">
                            {!isAuthenticated ? (
                                <li className='list-none'>
                                    <Link to="/dang-nhap" className='link no-underline transition text-[14px] font-[500]'>Đăng nhập</Link> | &nbsp;
                                    <Link to="/dang-ky" className='link no-underline transition text-[14px] font-[500]'>Đăng ký</Link>
                                </li>
                            ) : (
                                <li className='list-none'>
                                    <Tooltip title="">
                                        <IconButton
                                            onClick={handleClick}
                                            size="small"
                                            sx={{ ml: 2 }}
                                            aria-controls={open ? 'account-menu' : undefined}
                                            aria-haspopup="true"
                                            aria-expanded={open ? 'true' : undefined}
                                        >
                                            <Avatar 
                                                src={userAvatar}
                                                sx={{ width: 32, height: 32, bgcolor: '#ff5252' }}
                                            >
                                                {!userAvatar && user?.full_name?.charAt(0).toUpperCase()}
                                            </Avatar>
                                        </IconButton>
                                    </Tooltip>
                                    <Menu
                                        anchorEl={anchorEl}
                                        id="account-menu"
                                        open={open}
                                        onClose={handleClose}
                                        sx={{
                                            zIndex: 300000,
                                            '& .MuiPaper-root': {
                                                zIndex: 300000
                                            }
                                        }}
                                        PaperProps={{
                                            elevation: 0,
                                            sx: {
                                                overflow: 'visible',
                                                filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.32))',
                                                mt: 1.5,
                                                zIndex: 300000,
                                                '& .MuiAvatar-root': {
                                                    width: 32,
                                                    height: 32,
                                                    ml: -0.5,
                                                    mr: 1,
                                                },
                                                '&:before': {
                                                    content: '""',
                                                    display: 'block',
                                                    position: 'absolute',
                                                    top: 0,
                                                    right: 14,
                                                    width: 10,
                                                    height: 10,
                                                    bgcolor: 'background.paper',
                                                    transform: 'translateY(-50%) rotate(45deg)',
                                                    zIndex: 0,
                                                },
                                            },
                                        }}
                                        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                                        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
                                    >
                                        <MenuItem onClick={handleClose}>
                                            <Avatar src={userAvatar} sx={{ bgcolor: '#ff5252' }}>
                                                {!userAvatar && user?.full_name?.charAt(0).toUpperCase()}
                                            </Avatar>
                                            <div>
                                                <div className="font-semibold">{user?.full_name}</div>
                                                <div className="text-sm text-gray-500">{user?.email}</div>
                                                {user?.role === 'admin' && (
                                                    <div className="text-xs text-red-500 font-semibold">ADMIN</div>
                                                )}
                                            </div>
                                        </MenuItem>
                                        <Divider />
                                        
                                        {user?.role === 'admin' ? (
                                            [
                                                <MenuItem key="dashboard" onClick={handleClose} component={Link} to="/admin/dashboard">
                                                    <FaChartBar className="mr-2 text-green-500" />
                                                    Bảng điều khiển
                                                </MenuItem>,
                                                <MenuItem key="products" onClick={handleClose} component={Link} to="/admin/products">
                                                    <FaBoxOpen className="mr-2 text-blue-500" />
                                                    Quản lý sản phẩm
                                                </MenuItem>,
                                                <MenuItem key="orders" onClick={handleClose} component={Link} to="/admin/orders">
                                                    <FaHistory className="mr-2 text-orange-500" />
                                                    Quản lý đơn hàng
                                                </MenuItem>,
                                                <MenuItem key="users" onClick={handleClose} component={Link} to="/admin/users">
                                                    <FaUser className="mr-2 text-purple-500" />
                                                    Quản lý người dùng
                                                </MenuItem>
                                            ]
                                        ) : (
                                            [
                                                <MenuItem key="profile" onClick={handleClose} component={Link} to="/profile">
                                                    <FaUser className="mr-2 text-blue-500" />
                                                    Trang cá nhân
                                                </MenuItem>,
                                                <MenuItem key="history" onClick={handleClose} component={Link} to="/orders">
                                                    <FaHistory className="mr-2 text-green-500" />
                                                    Lịch sử mua hàng
                                                </MenuItem>,
                                                <MenuItem key="settings" onClick={handleClose}>
                                                    <FaCog className="mr-2 text-gray-500" />
                                                    Cài đặt
                                                </MenuItem>
                                            ]
                                        )}
                                        
                                        <Divider />
                                        <MenuItem onClick={handleLogout} sx={{ color: '#f44336' }}>
                                            <FaSignOutAlt className="mr-2" />
                                            Đăng xuất
                                        </MenuItem>
                                    </Menu>
                                </li>
                            )}

                            {/* Wishlist with Popup */}
                            <li>
                                <Tooltip title="">
                                    <IconButton 
                                        ref={wishlistButtonRef}
                                        aria-label="wishlist" 
                                        onClick={handleWishlistToggle}
                                        size="small"
                                    >
                                        <StyledBadge badgeContent={getWishlistCount()} color="secondary">
                                            <FaHeart className='text-[#8f1c1c]'/>
                                        </StyledBadge>
                                    </IconButton>
                                </Tooltip>
                            </li>

                            {/* Cart with Popup */}
                            <li>
                                <Tooltip title="">
                                    <IconButton 
                                        ref={cartButtonRef}
                                        aria-label="cart" 
                                        onClick={handleCartToggle}
                                        size="small"
                                    >
                                        <StyledBadge badgeContent={getCartCount()} color="secondary">
                                            <MdOutlineShoppingCart className='text-[#024a1f]'/>
                                        </StyledBadge>
                                    </IconButton>
                                </Tooltip>
                            </li>
                        </ul>
                        </div>
                    </div>
                </div>
            </div>

            {/* Render Popups using Portal */}
            {showMiniWishlist && (
                <MiniWishlist 
                    onClose={() => setShowMiniWishlist(false)} 
                    position={wishlistPosition}
                />
            )}
            {showMiniCart && (
                <MiniCart 
                    onClose={() => setShowMiniCart(false)} 
                    position={cartPosition}
                />
            )}
        </header>
    );
};

export default HeaderDesktop;
