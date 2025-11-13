import axios from 'axios';
import { CONFIG } from '../constants/config';

const API_BASE_URL = import.meta.env.VITE_API_URL?.replace(/\/$/, "") || "/api";

/**
 * Upload blog thumbnail image to server (using same endpoint as products)
 * @param {File} file - Image file to upload
 * @returns {Promise<string>} - URL of uploaded image
 */
export const uploadBlogImage = async (file) => {
  try {
    const formData = new FormData();
    formData.append('image', file);

    const token = localStorage.getItem('token');
    
    // Use same upload endpoint as products
    const response = await axios.post(`${API_BASE_URL}/upload`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        'Authorization': `Bearer ${token}`
      }
    });

    console.log('📤 Upload response:', response.data);

    if (response.data.success) {
      // Return full URL with backend base URL
      const imageUrl = response.data.url;
      const fullUrl = imageUrl.startsWith('http') 
        ? imageUrl 
        : `${CONFIG.API_BASE_URL}${imageUrl}`;
      
      console.log('✅ Full image URL:', fullUrl);
      return fullUrl;
    } else {
      throw new Error(response.data.message || 'Upload failed');
    }
  } catch (error) {
    console.error('❌ Error uploading blog image:', error);
    throw error;
  }
};

/**
 * Validate image file
 * @param {File} file - File to validate
 * @returns {Object} - { valid: boolean, error: string }
 */
export const validateImageFile = (file) => {
  const maxSize = 5 * 1024 * 1024; // 5MB
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];

  if (!file) {
    return { valid: false, error: 'Vui lòng chọn file' };
  }

  if (!allowedTypes.includes(file.type)) {
    return { valid: false, error: 'Chỉ chấp nhận file ảnh (JPG, PNG, GIF, WEBP)' };
  }

  if (file.size > maxSize) {
    return { valid: false, error: 'Kích thước file không được vượt quá 5MB' };
  }

  return { valid: true, error: null };
};
