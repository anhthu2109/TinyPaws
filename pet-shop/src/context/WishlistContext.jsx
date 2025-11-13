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
        return user ? `tinypaws_wishlist_${user.id}` : 'tinypaws_wishlist_guest';
    };

    // Load wishlist from localStorage when user changes
    useEffect(() => {
        const storageKey = getStorageKey();
        const savedWishlist = localStorage.getItem(storageKey);
        if (savedWishlist) {
            try {
                setWishlistItems(JSON.parse(savedWishlist));
            } catch (error) {
                localStorage.removeItem(storageKey);
                setWishlistItems([]);
            }
        } else {
            setWishlistItems([]);
        }
    }, [user]); // Reload when user changes

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
