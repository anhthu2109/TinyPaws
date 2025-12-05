import { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { publicApi } from '../api/publicApi';

const WishlistContext = createContext();

export const useWishlist = () => {
    const context = useContext(WishlistContext);
    if (!context) {
        throw new Error('useWishlist must be used within WishlistProvider');
    }
    return context;
};

export const WishlistProvider = ({ children }) => {
    const { user } = useAuth();
    const [wishlistItems, setWishlistItems] = useState([]);

    // Get localStorage key based on user
    const getStorageKey = () => {
        const userId = user?._id || user?.id;
        return userId ? `tinypaws_wishlist_${userId}` : 'tinypaws_wishlist_guest';
    };

    // Load wishlist (backend for logged-in, local for guest)
    useEffect(() => {
        const loadWishlist = async () => {
            const storageKey = getStorageKey();

            if (!user?._id) {
                const savedWishlist = localStorage.getItem(storageKey);
                if (savedWishlist) {
                    try {
                        setWishlistItems(JSON.parse(savedWishlist));
                        return;
                    } catch (error) {
                        localStorage.removeItem(storageKey);
                    }
                }
                setWishlistItems([]);
                return;
            }

            try {
                const response = await publicApi.get(`/api/recommendations/wishlist/${user._id}`);
                if (response.data.success) {
                    const items = (response.data.data?.items || []).map(item => item.product || item);
                    setWishlistItems(items);
                    localStorage.setItem(storageKey, JSON.stringify(items));
                } else {
                    setWishlistItems([]);
                }
            } catch (error) {
                console.warn('Failed to load wishlist from server:', error);
                setWishlistItems([]);
            }
        };

        loadWishlist();
    }, [user?._id]); // Reload when user changes

    // Save wishlist to localStorage whenever it changes
    useEffect(() => {
        const storageKey = getStorageKey();
        localStorage.setItem(storageKey, JSON.stringify(wishlistItems));
    }, [wishlistItems, user]);

    // Add item to wishlist
    const addToWishlist = (product) => {
        const productId = product._id || product.id;
        setWishlistItems(prevItems => {
            const exists = prevItems.find(item => (item._id || item.id) === productId);
            if (exists) {
                return prevItems; // Already in wishlist
            }
            
            // Track wishlist add nếu user đã đăng nhập
            if (user?._id) {
                publicApi.post('/api/recommendations/wishlist/add', {
                    userId: user._id,
                    productId: productId
                }).catch(err => {
                    console.warn('Failed to track wishlist add:', err);
                });
            }
            
            return [...prevItems, product];
        });
    };

    // Remove item from wishlist
    const removeFromWishlist = (productId) => {
        // Track wishlist remove nếu user đã đăng nhập
        if (user?._id) {
            publicApi.post('/api/recommendations/wishlist/remove', {
                userId: user._id,
                productId: productId
            }).catch(err => {
                console.warn('Failed to track wishlist remove:', err);
            });
        }
        
        setWishlistItems(prevItems => prevItems.filter(item => (item._id || item.id) !== productId));
    };

    // Toggle item in wishlist
    const toggleWishlist = (product) => {
        const productId = product._id || product.id;
        setWishlistItems(prevItems => {
            const exists = prevItems.find(item => (item._id || item.id) === productId);
            
            if (exists) {
                // Remove from wishlist - Track remove
                if (user?._id) {
                    publicApi.post('/api/recommendations/wishlist/remove', {
                        userId: user._id,
                        productId: productId
                    }).catch(err => {
                        console.warn('Failed to track wishlist remove:', err);
                    });
                }
                return prevItems.filter(item => (item._id || item.id) !== productId);
            }
            
            // Add to wishlist - Track add
            if (user?._id) {
                publicApi.post('/api/recommendations/wishlist/add', {
                    userId: user._id,
                    productId: productId
                }).catch(err => {
                });
            }
            
            return [...prevItems, product];
        });
    };

    // Clear wishlist
    const clearWishlist = () => {
        setWishlistItems([]);
    };

    // Check if product is in wishlist
    const isInWishlist = (productId) => {
        return wishlistItems.some(item => (item._id || item.id) === productId);
    };

    // Get wishlist count
    const getWishlistCount = () => {
        return wishlistItems.length;
    };

    const value = {
        wishlistItems,
        addToWishlist,
        removeFromWishlist,
        toggleWishlist,
        clearWishlist,
        isInWishlist,
        getWishlistCount
    };

    return (
        <WishlistContext.Provider value={value}>
            {children}
        </WishlistContext.Provider>
    );
};
