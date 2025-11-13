import { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { publicApi } from '../api/publicApi';

const CartContext = createContext();

export const useCart = () => {
    const context = useContext(CartContext);
    if (!context) throw new Error('useCart must be used within CartProvider');
    return context;
};

export const CartProvider = ({ children }) => {
    const { user } = useAuth();
    const [cartItems, setCartItems] = useState([]);

    // Get localStorage key based on user
    const getStorageKey = () => {
        const userId = user?.id || user?._id || 'guest';
        return `tinypaws_cart_${userId}`;
    };

    // Load cart from localStorage
    useEffect(() => {
        const storageKey = getStorageKey();
        const savedCart = localStorage.getItem(storageKey);

        if (savedCart) {
            try {
                const parsed = JSON.parse(savedCart).map(item => ({
                    ...item,
                    _id: item._id || item.id, // đồng bộ lại id
                    id: item._id || item.id
                }));
                setCartItems(parsed);
            } catch (error) {
                localStorage.removeItem(storageKey);
                setCartItems([]);
            }
        } else {
            setCartItems([]);
        }
    }, [user]);

    // Save cart to localStorage
    useEffect(() => {
        if (!cartItems) return;
        const storageKey = getStorageKey();
        localStorage.setItem(storageKey, JSON.stringify(cartItems));
    }, [cartItems, user]);

    // Add item to cart
    const addToCart = (product, quantity = 1) => {
        const productId = product._id || product.id;
        
        // Track cart add nếu user đã đăng nhập
        if (user?._id) {
            publicApi.post('/api/recommendations/cart/add', {
                userId: user._id,
                productId: productId,
                quantity: quantity
            }).catch(err => {
                console.warn('Failed to track cart add:', err);
            });
        }
        
        setCartItems(prevItems => {
            const existingItem = prevItems.find(item => (item._id || item.id) === productId);
            if (existingItem) {
                return prevItems.map(item =>
                    (item._id || item.id) === productId
                        ? { ...item, quantity: item.quantity + quantity }
                        : item
                );
            }
            return [...prevItems, { ...product, quantity, _id: productId, id: productId }];
        });
    };

    // Remove item (với soft delete tracking)
    const removeFromCart = (productId) => {
        // Track cart remove nếu user đã đăng nhập
        if (user?._id) {
            publicApi.post('/api/recommendations/cart/remove', {
                userId: user._id,
                productId: productId
            }).then(() => {
            }).catch(err => {
            });
        }
        
        setCartItems(prevItems => prevItems.filter(item => (item._id || item.id) !== productId));
    };

    // Update quantity
    const updateQuantity = (productId, quantity) => {
        if (!productId) return;

        setCartItems(prevItems => {
            if (quantity <= 0) return prevItems.filter(item => (item._id || item.id) !== productId);

            return prevItems.map(item => {
                const itemId = item._id || item.id;
                return itemId === productId
                    ? { ...item, quantity: Number(quantity) }
                    : item;
            });
        });
    };

    const clearCart = () => {
        setCartItems([]);
        const key = getStorageKey();
        localStorage.removeItem(key);
    };
    const getCartTotal = () => cartItems.reduce((t, i) => t + (i.sale_price || i.price) * i.quantity, 0);
    const getCartCount = () => cartItems.reduce((c, i) => c + i.quantity, 0);
    const isInCart = (productId) => cartItems.some(i => (i._id || i.id) === productId);

    const value = {
        cartItems,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        getCartTotal,
        getCartCount,
        isInCart
    };

    return (
        <CartContext.Provider value={value}>
            {children}
        </CartContext.Provider>
    );
};
