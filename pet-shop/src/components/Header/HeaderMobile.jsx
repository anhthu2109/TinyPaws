import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { FaBars, FaTimes, FaSearch, FaUser, FaHeart, FaShoppingCart } from 'react-icons/fa';
import { IconButton, Badge, Avatar, Menu, MenuItem, Divider } from '@mui/material';
import { styled } from '@mui/material/styles';
import logo from '../../assets/logo/logo.png';
import { useAuth } from '../../context/AuthContext';

const StyledBadge = styled(Badge)(({ theme }) => ({
    '& .MuiBadge-badge': {
        right: -3,
        top: 13,
        padding: '0 4px',
    },
}));

const HeaderMobile = () => {
    const { user, logout, isAuthenticated } = useAuth();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [anchorEl, setAnchorEl] = useState(null);
    const open = Boolean(anchorEl);
    const [userAvatar, setUserAvatar] = useState(null);

    // Load avatar from localStorage
    useEffect(() => {
        if (user) {
            const savedAvatar = localStorage.getItem(`avatar_${user.id}`);
            setUserAvatar(savedAvatar);
        }
    }, [user]);

    const handleUserMenuClick = (event) => {
        setAnchorEl(event.currentTarget);
    };

    const handleUserMenuClose = () => {
        setAnchorEl(null);
    };

    const handleLogout = () => {
        logout();
        handleUserMenuClose();
    };

    const toggleMenu = () => {
        setIsMenuOpen(!isMenuOpen);
        
        // Prevent body scroll when menu is open
        if (!isMenuOpen) {
            document.body.classList.add('menu-open');
        } else {
            document.body.classList.remove('menu-open');
        }
    };

    const closeMenu = () => {
        setIsMenuOpen(false);
        document.body.classList.remove('menu-open');
    };

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            document.body.classList.remove('menu-open');
        };
    }, []);

    const toggleSearch = () => {
        setIsSearchOpen(!isSearchOpen);
    };

    return (
        <header className="bg-white shadow-sm md:hidden">
            {/* Mobile Header */}
            <div className="px-4 py-3">
                <div className="flex items-center justify-between">
                    {/* Menu Button */}
                    <button
                        onClick={toggleMenu}
                        className="p-2 text-gray-600 hover:text-gray-800"
                    >
                        {isMenuOpen ? <FaTimes size={20} /> : <FaBars size={20} />}
                    </button>

                    {/* Logo */}
                    <Link to="/" className="flex-shrink-0">
                        <img src={logo} alt="TinyPaws" className="h-10 w-auto" />
                    </Link>

                    {/* Right Icons */}
                    <div className="flex items-center space-x-2">
                        {/* Search Button */}
                        <button
                            onClick={toggleSearch}
                            className="p-2 text-gray-600 hover:text-gray-800"
                        >
                            <FaSearch size={18} />
                        </button>

                        {/* User Account */}
                        {!isAuthenticated ? (
                            <Link
                                to="/dang-nhap"
                                className="p-2 text-gray-600 hover:text-gray-800"
                            >
                                <FaUser size={18} />
                            </Link>
                        ) : (
                            <IconButton
                                onClick={handleUserMenuClick}
                                size="small"
                                aria-controls={open ? 'mobile-account-menu' : undefined}
                                aria-haspopup="true"
                                aria-expanded={open ? 'true' : undefined}
                            >
                                <Avatar 
                                    src={userAvatar}
                                    sx={{ width: 28, height: 28, bgcolor: '#ff5252' }}
                                >
                                    {!userAvatar && user?.full_name?.charAt(0).toUpperCase()}
                                </Avatar>
                            </IconButton>
                        )}

                        {/* Wishlist */}
                        <IconButton size="small">
                            <StyledBadge badgeContent={0} color="secondary">
                                <FaHeart className="text-red-500" size={18} />
                            </StyledBadge>
                        </IconButton>

                        {/* Cart */}
                        <IconButton size="small">
                            <StyledBadge badgeContent={0} color="secondary">
                                <FaShoppingCart className="text-green-700" size={18} />
                            </StyledBadge>
                        </IconButton>
                    </div>
                </div>

                {/* Mobile Search Bar */}
                {isSearchOpen && (
                    <div className="mt-3 pb-3 border-b border-gray-200">
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="Tìm kiếm sản phẩm..."
                                className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                            />
                            <button className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                                <FaSearch size={16} />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Mobile Menu Overlay - Rendered at document root */}
            {isMenuOpen && createPortal(
                <>
                    <div 
                        className="mobile-menu-overlay-global md:hidden" 
                        onClick={closeMenu}
                    ></div>
                    <div 
                        className={`mobile-menu-global transform transition-transform duration-300 ease-in-out md:hidden ${
                            isMenuOpen ? 'translate-x-0' : '-translate-x-full'
                        }`}
                    >
                        {/* Menu Header */}
                        <div className="flex items-center justify-between p-4 border-b border-gray-200">
                            <img src={logo} alt="TinyPaws" className="h-8 w-auto" />
                            <button
                                onClick={closeMenu}
                                className="p-2 text-gray-600 hover:text-gray-800"
                            >
                                <FaTimes size={20} />
                            </button>
                        </div>

                        {/* Menu Items */}
                        <nav className="p-4">
                            <ul className="space-y-4">
                                <li>
                                    <Link
                                        to="/"
                                        className="block py-2 text-gray-800 hover:text-red-500 font-medium"
                                        onClick={closeMenu}
                                    >
                                        Trang Chủ
                                    </Link>
                                </li>
                                <li>
                                    <Link
                                        to="/products/category/cho"
                                        className="block py-2 text-gray-800 hover:text-red-500 font-medium"
                                        onClick={closeMenu}
                                    >
                                        Chó
                                    </Link>
                                </li>
                                <li>
                                    <Link
                                        to="/products/category/meo"
                                        className="block py-2 text-gray-800 hover:text-red-500 font-medium"
                                        onClick={closeMenu}
                                    >
                                        Mèo
                                    </Link>
                                </li>
                                {/* <li>
                                    <Link
                                        to="/uu-dai"
                                        className="block py-2 text-gray-800 hover:text-red-500 font-medium"
                                        onClick={closeMenu}
                                    >
                                        Ưu Đãi
                                    </Link>
                                </li> */}
                                <li>
                                    <Link
                                        to="/blog"
                                        className="block py-2 text-gray-800 hover:text-red-500 font-medium"
                                        onClick={closeMenu}
                                    >
                                        Blog
                                    </Link>
                                </li>
                                <li>
                                    <Link
                                        to="/lien-he"
                                        className="block py-2 text-gray-800 hover:text-red-500 font-medium"
                                        onClick={closeMenu}
                                    >
                                        Liên Hệ
                                    </Link>
                                </li>
                            </ul>

                            {/* Auth Section */}
                            {!isAuthenticated && (
                                <div className="mt-6 pt-6 border-t border-gray-200">
                                    <div className="space-y-3">
                                        <Link
                                            to="/dang-nhap"
                                            className="block w-full py-2 px-4 bg-red-500 text-white text-center rounded-lg hover:bg-red-600 transition-colors"
                                            onClick={closeMenu}
                                        >
                                            Đăng nhập
                                        </Link>
                                        <Link
                                            to="/dang-ky"
                                            className="block w-full py-2 px-4 border border-red-500 text-red-500 text-center rounded-lg hover:bg-red-50 transition-colors"
                                            onClick={closeMenu}
                                        >
                                            Đăng ký
                                        </Link>
                                    </div>
                                </div>
                            )}

                            {/* Contact Info */}
                            <div className="mt-6 pt-6 border-t border-gray-200">
                                <p className="text-sm text-gray-600 mb-2">Hotline hỗ trợ:</p>
                                <p className="text-lg font-semibold text-red-500">1800-1234</p>
                            </div>
                        </nav>
                    </div>
                </>,
                document.body
            )}

            {/* User Menu */}
            <Menu
                anchorEl={anchorEl}
                id="mobile-account-menu"
                open={open}
                onClose={handleUserMenuClose}
                PaperProps={{
                    elevation: 0,
                    sx: {
                        overflow: 'visible',
                        filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.32))',
                        mt: 1.5,
                        '& .MuiAvatar-root': {
                            width: 32,
                            height: 32,
                            ml: -0.5,
                            mr: 1,
                        },
                    },
                }}
                transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
            >
                <MenuItem onClick={handleUserMenuClose}>
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
                        <MenuItem key="dashboard" onClick={handleUserMenuClose} component={Link} to="/admin/dashboard">
                            Bảng điều khiển
                        </MenuItem>,
                        <MenuItem key="products" onClick={handleUserMenuClose} component={Link} to="/admin/products">
                            Quản lý sản phẩm
                        </MenuItem>,
                        <MenuItem key="orders" onClick={handleUserMenuClose} component={Link} to="/admin/orders">
                            Quản lý đơn hàng
                        </MenuItem>,
                        <MenuItem key="users" onClick={handleUserMenuClose} component={Link} to="/admin/users">
                            Quản lý người dùng
                        </MenuItem>
                    ]
                ) : (
                    [
                        <MenuItem key="profile" onClick={handleUserMenuClose} component={Link} to="/profile">
                            Trang cá nhân
                        </MenuItem>,
                        <MenuItem key="history" onClick={handleUserMenuClose}>
                            Lịch sử mua hàng
                        </MenuItem>,
                        <MenuItem key="settings" onClick={handleUserMenuClose}>
                            Cài đặt
                        </MenuItem>
                    ]
                )}
                
                <Divider />
                <MenuItem onClick={handleLogout} sx={{ color: '#f44336' }}>
                    Đăng xuất
                </MenuItem>
            </Menu>
        </header>
    );
};

export default HeaderMobile;
