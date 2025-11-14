import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button, Snackbar, Alert } from "@mui/material";
import { FaEdit, FaTrash } from "react-icons/fa";
import axios from "axios";
import { CONFIG } from "../../constants/config";

const API_BASE_URL = `${CONFIG.API.BASE_URL}/api`;

const BlogManagement = () => {
  const navigate = useNavigate();
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const showMessage = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  const fetchBlogs = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API_BASE_URL}/blogs/admin/all`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (res.data.success) {
        setBlogs(res.data.data.blogs);
      }
    } catch (error) {
      showMessage("Không thể tải danh sách blog", "error");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBlogs();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm("Xóa bài viết này?")) return;
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_BASE_URL}/blogs/admin/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      showMessage("Đã xóa bài viết");
      fetchBlogs();
    } catch (error) {
      showMessage("Lỗi khi xóa", "error");
      console.error(error);
    }
  };

  const handlePublish = async (id) => {
    try {
      const token = localStorage.getItem('token');
      await axios.patch(`${API_BASE_URL}/blogs/admin/${id}/publish`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      showMessage("Đã xuất bản bài viết");
      fetchBlogs();
    } catch (error) {
      showMessage("Lỗi khi xuất bản", "error");
    }
  };

  const handleToggleStatus = async (blog) => {
    try {
      const token = localStorage.getItem('token');
      const newStatus = blog.status === 'published' ? 'draft' : 'published';
      
      await axios.put(`${API_BASE_URL}/blogs/admin/${blog._id}`, 
        { ...blog, status: newStatus }, 
        { headers: { Authorization: `Bearer ${token}` }}
      );
      
      showMessage(newStatus === 'published' ? 'Đã kích hoạt blog' : 'Đã tạm dừng blog');
      fetchBlogs();
    } catch (error) {
      showMessage("Lỗi khi thay đổi trạng thái", "error");
    }
  };

  const getStatusBadge = (status) => {
    const colors = {
      published: { bg: 'bg-green-100', text: 'text-green-800', label: 'Published' },
      draft: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Draft' },
      archived: { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Archived' }
    };
    const config = colors[status] || colors.draft;
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
        {config.label}
      </span>
    );
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Quản lý Blog</h2>
        <Button 
          variant="contained" 
          onClick={() => navigate('/admin/blogs/new')}
        >
          + Thêm bài viết
        </Button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : blogs.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-500">Chưa có bài viết nào</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tiêu đề
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tác giả
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ảnh
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ngày tạo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Trạng thái
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Thao tác
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {blogs.map((blog) => (
                  <tr key={blog._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900 max-w-xs truncate">
                        {blog.title}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {blog.author?.full_name || 'N/A'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {blog.featured_image ? (
                        <img 
                          src={blog.featured_image} 
                          alt="blog" 
                          className="w-12 h-12 object-cover rounded"
                        />
                      ) : (
                        <span className="text-gray-400 text-xs">No image</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {formatDate(blog.createdAt)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={blog.status === 'published'}
                            onChange={() => handleToggleStatus(blog)}
                            className="sr-only peer"
                          />
                          <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-green-500"></div>
                        </label>
                        <span className={`ml-2 text-xs font-medium ${
                          blog.status === 'published' ? 'text-green-600' : 'text-gray-500'
                        }`}>
                          {blog.status === 'published' ? 'Hoạt động' : 'Tạm dừng'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                        <button
                          onClick={() => navigate(`/admin/blogs/edit/${blog._id}`)}
                          className="text-blue-600 hover:text-blue-900 p-2 rounded-full hover:bg-blue-50"
                          title="Chỉnh sửa"
                        >
                          <FaEdit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(blog._id)}
                          className="text-red-600 hover:text-red-900 p-2 rounded-full hover:bg-red-50"
                          title="Xóa"
                        >
                          <FaTrash className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Snackbar for notifications */}
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

export default BlogManagement;
