/**
 * Utility functions for handling images safely
 */

/**
 * Get safe image URL with fallback to placeholder
 * @param {string|Array} images - Single image URL or array of image URLs
 * @param {string} size - Size in format "WIDTHxHEIGHT" (e.g., "400x400")
 * @param {string} fallbackText - Text to display in placeholder (default: "No Image")
 * @returns {string} Safe image URL
 */
export const getSafeImageUrl = (images, size = "400x400", fallbackText = "No Image") => {
    // Handle array of images - get first one
    if (Array.isArray(images) && images.length > 0) {
        return images[0];
    }
    
    // Handle single image string
    if (typeof images === 'string' && images.trim()) {
        return images;
    }
    
    // Return placeholder if no valid image
    return `https://placehold.co/${size}?text=${encodeURIComponent(fallbackText)}`;
};

/**
 * Get error fallback image URL
 * @param {string} size - Size in format "WIDTHxHEIGHT"
 * @param {string} text - Text to display (default: "Error")
 * @returns {string} Error placeholder URL
 */
export const getErrorImageUrl = (size = "200x200", text = "Error") => {
    return `https://placehold.co/${size}?text=${encodeURIComponent(text)}`;
};

/**
 * Handle image error event
 * @param {Event} event - Image error event
 * @param {string} size - Size in format "WIDTHxHEIGHT"
 * @param {string} text - Text to display (default: "Error")
 */
export const handleImageError = (event, size = "200x200", text = "Error") => {
    event.target.src = getErrorImageUrl(size, text);
};

/**
 * Validate if URL is a valid image URL
 * @param {string} url - URL to validate
 * @returns {boolean} True if valid image URL
 */
export const isValidImageUrl = (url) => {
    if (!url || typeof url !== 'string') return false;
    
    // Basic URL validation
    try {
        new URL(url);
        return true;
    } catch {
        return false;
    }
};

/**
 * Preload image to check if it's valid
 * @param {string} url - Image URL to preload
 * @returns {Promise<boolean>} Promise that resolves to true if image loads successfully
 */
export const preloadImage = (url) => {
    return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => resolve(true);
        img.onerror = () => resolve(false);
        img.src = url;
    });
};
