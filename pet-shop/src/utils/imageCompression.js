// Image compression utility
export const compressImage = (file, maxWidth = 800, quality = 0.8) => {
    return new Promise((resolve) => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const img = new Image();
        
        img.onload = function() {
            // Calculate new dimensions
            let { width, height } = img;
            
            if (width > maxWidth || height > maxWidth) {
                if (width > height) {
                    height = (height * maxWidth) / width;
                    width = maxWidth;
                } else {
                    width = (width * maxWidth) / height;
                    height = maxWidth;
                }
            }
            
            canvas.width = width;
            canvas.height = height;
            
            // Draw and compress
            ctx.drawImage(img, 0, 0, width, height);
            
            canvas.toBlob((blob) => {
                const reader = new FileReader();
                reader.onload = () => resolve(reader.result);
                reader.readAsDataURL(blob);
            }, 'image/jpeg', quality);
        };
        
        img.src = URL.createObjectURL(file);
    });
};

// Get file size in KB
export const getImageSizeKB = (base64String) => {
    if (!base64String) return 0;
    
    // Remove data URL prefix
    const base64 = base64String.split(',')[1] || base64String;
    
    // Calculate size (base64 is ~4/3 larger than original)
    const sizeInBytes = (base64.length * 3) / 4;
    return Math.round(sizeInBytes / 1024);
};

// Validate image size
export const validateImageSize = (base64String, maxSizeKB = 500) => {
    const sizeKB = getImageSizeKB(base64String);
    return {
        isValid: sizeKB <= maxSizeKB,
        sizeKB,
        maxSizeKB
    };
};
