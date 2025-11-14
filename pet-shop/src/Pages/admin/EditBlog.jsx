import React, { useEffect, useState, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button, TextField, Snackbar, Alert, CircularProgress } from "@mui/material";
import { FaImage, FaTrash } from "react-icons/fa";
import axios from "axios";
import { uploadBlogImage, validateImageFile } from "../../utils/blogImageUpload";
import { CONFIG } from "../../constants/config";

const API_BASE_URL = `${CONFIG.API.BASE_URL}/api`;

const EditBlog = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [thumbnailPreview, setThumbnailPreview] = useState(null);
  const thumbnailInputRef = useRef(null);
  
  const [form, setForm] = useState({
    title: "",
    content: "",
    excerpt: "",
    featured_image: "",
    tags: [],
    status: "draft",
    is_featured: false
  });
  const [tagInput, setTagInput] = useState('');

  const showMessage = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleThumbnailSelect = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    console.log('📁 Selected file:', file.name, file.type, file.size);

    const validation = validateImageFile(file);
    if (!validation.valid) {
      showMessage(validation.error, 'error');
      return;
    }

    try {
      setUploadingImage(true);
      console.log('🔄 Starting upload...');
      
      // Create preview first
      const reader = new FileReader();
      reader.onloadend = () => {
        console.log('👁️ Preview created');
        setThumbnailPreview(reader.result);
      };
      reader.readAsDataURL(file);

      // Upload to server
      const imageUrl = await uploadBlogImage(file);
      console.log('✅ Image uploaded, URL:', imageUrl);
      
      setForm(prev => ({ ...prev, featured_image: imageUrl }));
      showMessage('Upload ảnh thành công!');
    } catch (error) {
      console.error('❌ Upload error:', error);
      showMessage(error.response?.data?.message || 'Lỗi khi upload ảnh', 'error');
      // Clear preview on error
      setThumbnailPreview(null);
    } finally {
      setUploadingImage(false);
    }
  };

  const handleRemoveThumbnail = () => {
    setThumbnailPreview(null);
    setForm({ ...form, featured_image: '' });
    if (thumbnailInputRef.current) {
      thumbnailInputRef.current.value = '';
    }
  };

  const handleAddTag = (e) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      const newTag = tagInput.trim().toLowerCase();
      if (!form.tags.includes(newTag)) {
        setForm({ ...form, tags: [...form.tags, newTag] });
        console.log('✅ Tag added:', newTag);
      }
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove) => {
    setForm({ ...form, tags: form.tags.filter(tag => tag !== tagToRemove) });
    console.log('❌ Tag removed:', tagToRemove);
  };

  useEffect(() => {
    fetchBlog();
  }, [id]);

  const fetchBlog = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE_URL}/blogs/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        const blog = response.data.data.blog;
        setForm({
          title: blog.title || "",
          content: blog.content || "",
          excerpt: blog.excerpt || "",
          featured_image: blog.featured_image || "",
          tags: blog.tags || [],
          status: blog.status || "draft",
          is_featured: blog.is_featured || false
        });
        
        // Set thumbnail preview if exists
        if (blog.featured_image) {
          setThumbnailPreview(blog.featured_image);
        }
      }
    } catch (error) {
      showMessage("Không thể tải bài viết", "error");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      // Validation
      if (!form.title || !form.title.trim()) {
        showMessage("Vui lòng nhập tiêu đề bài viết", "error");
        return;
      }

      if (!form.content || !form.content.trim()) {
        showMessage("Vui lòng nhập nội dung bài viết", "error");
        return;
      }

      if (!form.featured_image) {
        showMessage("Vui lòng chọn ảnh đại diện", "error");
        return;
      }

      setSaving(true);
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      const blogData = {
        title: form.title.trim(),
        content: form.content.trim(),
        excerpt: form.excerpt.trim() || form.content.trim().substring(0, 200),
        featured_image: form.featured_image,
        tags: form.tags || [],
        status: form.status || "draft",
        is_featured: form.is_featured || false
      };

      console.log('📤 Updating blog data:', blogData);

      const response = await axios.put(`${API_BASE_URL}/blogs/admin/${id}`, blogData, { headers });
      
      console.log('✅ Response:', response.data);
      showMessage("Cập nhật bài viết thành công!");
      
      setTimeout(() => {
        navigate('/admin/blogs');
      }, 1500);
    } catch (error) {
      console.error('❌ Error details:', error.response?.data);
      const errorMsg = error.response?.data?.message || 
                       error.response?.data?.error || 
                       "Lỗi khi lưu bài viết";
      showMessage(errorMsg, "error");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <CircularProgress />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <h2 className="text-2xl font-bold">Chỉnh sửa bài viết</h2>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outlined" 
            onClick={() => navigate('/admin/blogs')}
          >
            Hủy
          </Button>
          <Button 
            variant="contained" 
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
          </Button>
        </div>
      </div>

      {/* Form */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 space-y-6">
        {/* Title */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Tiêu đề bài viết <span className="text-red-500">*</span>
          </label>
          <TextField
            fullWidth
            placeholder="Nhập tiêu đề bài viết..."
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            required
            variant="outlined"
          />
        </div>

        {/* Short Description */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Mô tả ngắn
          </label>
          <TextField
            fullWidth
            multiline
            rows={3}
            placeholder="Nhập mô tả ngắn về bài viết (tối đa 300 ký tự)..."
            value={form.excerpt}
            onChange={(e) => setForm({ ...form, excerpt: e.target.value })}
            variant="outlined"
            helperText={`${form.excerpt.length}/300 ký tự`}
          />
        </div>

        {/* Thumbnail */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Ảnh đại diện (Thumbnail) <span className="text-red-500">*</span>
          </label>
          
          <input
            ref={thumbnailInputRef}
            type="file"
            accept="image/*"
            onChange={handleThumbnailSelect}
            className="hidden"
          />
          
          {!thumbnailPreview ? (
            <button
              type="button"
              onClick={() => thumbnailInputRef.current?.click()}
              disabled={uploadingImage}
              className="w-full border-2 border-dashed border-gray-300 rounded-lg p-8 hover:border-blue-500 transition-colors flex flex-col items-center justify-center gap-3 bg-gray-50 hover:bg-blue-50"
            >
              {uploadingImage ? (
                <>
                  <CircularProgress size={40} />
                  <span className="text-sm text-gray-600">Đang upload...</span>
                </>
              ) : (
                <>
                  <FaImage className="text-4xl text-gray-400" />
                  <div className="text-center">
                    <p className="text-sm font-medium text-gray-700">Click để chọn ảnh</p>
                    <p className="text-xs text-gray-500 mt-1">JPG, PNG, GIF, WEBP (tối đa 5MB)</p>
                  </div>
                </>
              )}
            </button>
          ) : (
            <div className="relative w-full max-w-3xl">
              <img 
                src={thumbnailPreview} 
                alt="Preview" 
                className="w-full h-80 object-contain rounded-lg border-2 border-gray-200 bg-gray-50"
              />
              <button
                type="button"
                onClick={handleRemoveThumbnail}
                className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full hover:bg-red-600 transition-colors shadow-lg"
              >
                <FaTrash />
              </button>
            </div>
          )}
        </div>

        {/* Tags */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Tags (Nhãn)
          </label>
          <div className="space-y-3">
            <TextField
              fullWidth
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={handleAddTag}
              placeholder="Nhập tag và nhấn Enter (vd: chó, mèo, chăm sóc...)"
              variant="outlined"
              size="small"
              helperText="Nhấn Enter để thêm tag. Tags giúp phân loại và tìm kiếm bài viết."
            />
            {form.tags && form.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {form.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center gap-2 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium"
                  >
                    #{tag}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="hover:text-red-600 transition-colors"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Content */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Nội dung bài viết <span className="text-red-500">*</span>
          </label>
          <textarea
            value={form.content}
            onChange={(e) => setForm({ ...form, content: e.target.value })}
            placeholder="Viết nội dung chi tiết bài viết tại đây..."
            rows={20}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-y font-mono text-sm"
          />
          <p className="text-xs text-gray-500 mt-2">
            Hỗ trợ HTML: &lt;h1&gt;, &lt;h2&gt;, &lt;h3&gt;, &lt;p&gt;, &lt;strong&gt;, &lt;em&gt;, &lt;ul&gt;, &lt;li&gt;, &lt;a&gt;, &lt;img&gt;, &lt;br&gt;
          </p>
        </div>
      </div>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert 
          onClose={() => setSnackbar({ ...snackbar, open: false })} 
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </div>
  );
};

export default EditBlog;
