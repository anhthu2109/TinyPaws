import { useState, useEffect } from 'react';
import { FaPlus, FaEdit, FaTrash, FaSearch, FaFilter, FaEye } from 'react-icons/fa';
import axios from 'axios';
import { CONFIG } from '../../constants/config';

const Content = () => {
    const [blogs, setBlogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [stats, setStats] = useState({});

    useEffect(() => {
        fetchBlogs();
        fetchBlogStats();
    }, [currentPage, searchTerm, statusFilter]);

    const fetchBlogs = async () => {
        try {
            setLoading(true);
            const params = {
                page: currentPage,
                limit: 10,
                ...(searchTerm && { search: searchTerm }),
                ...(statusFilter && { status: statusFilter })
            };
            
            const response = await axios.get(`${CONFIG.API.BASE_URL}/api/blogs`, { params });
            
            if (response.data.success) {
                setBlogs(response.data.data.blogs);
                setTotalPages(response.data.data.pagination.totalPages);
            }
        } catch (error) {
            console.error('Error fetching blogs:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchBlogStats = async () => {
        try {
            const response = await axios.get(`${CONFIG.API.BASE_URL}/api/blogs/admin/stats`);
            if (response.data.success) {
                setStats(response.data.data);
            }
        } catch (error) {
            console.error('Error fetching blog stats:', error);
        }
    };

    const deleteBlog = async (blogId) => {
        if (window.confirm('Bạn có chắc chắn muốn xóa bài viết này?')) {
            try {
                await axios.delete(`${CONFIG.API.BASE_URL}/api/blogs/${blogId}`);
                fetchBlogs(); // Refresh list
                fetchBlogStats(); // Refresh stats
            } catch (error) {
                console.error('Error deleting blog:', error);
                alert('Có lỗi xảy ra khi xóa bài viết');
            }
        }
    };

    const toggleBlogStatus = async (blogId, currentStatus) => {
        try {
            await axios.patch(`${CONFIG.API.BASE_URL}/api/blogs/${blogId}/status`, {
                status: currentStatus === 'published' ? 'draft' : 'published'
            });
            fetchBlogs(); // Refresh list
            fetchBlogStats(); // Refresh stats
        } catch (error) {
            console.error('Error updating blog status:', error);
            alert('Có lỗi xảy ra khi cập nhật trạng thái bài viết');
        }
    };

    const formatDate = (date) => {
        return new Date(date).toLocaleDateString('vi-VN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        });
    };

    const getStatusBadge = (status) => {
        const statusConfig = {
            published: { bg: 'bg-green-100', text: 'text-green-800', label: 'Đã xuất bản' },
            draft: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Nháp' },
            archived: { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Lưu trữ' }
        };
        
        const config = statusConfig[status] || statusConfig.draft;
        return (
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
                {config.label}
            </span>
        );
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold text-gray-800">Quản lý nội dung</h2>
                    <p className="text-gray-600 mt-2">Quản lý blog và bài viết trên website</p>
                </div>
                <button className="flex items-center space-x-2 px-4 py-2 bg-[#ff5252] text-white rounded-lg hover:bg-[#e53e3e] transition-colors">
                    <FaPlus />
                    <span>Thêm bài viết</span>
                </button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600 mb-1">Tổng bài viết</p>
                            <p className="text-3xl font-bold text-gray-800">{stats.totalBlogs || 0}</p>
                        </div>
                        <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center">
                            <FaEdit className="text-white text-xl" />
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600 mb-1">Đã xuất bản</p>
                            <p className="text-3xl font-bold text-green-600">{stats.publishedBlogs || 0}</p>
                        </div>
                        <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center">
                            <FaEye className="text-white text-xl" />
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600 mb-1">Bản nháp</p>
                            <p className="text-3xl font-bold text-yellow-600">{stats.draftBlogs || 0}</p>
                        </div>
                        <div className="w-12 h-12 bg-yellow-500 rounded-lg flex items-center justify-center">
                            <FaEdit className="text-white text-xl" />
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600 mb-1">Tổng lượt xem</p>
                            <p className="text-3xl font-bold text-purple-600">{stats.totalViews || 0}</p>
                        </div>
                        <div className="w-12 h-12 bg-purple-500 rounded-lg flex items-center justify-center">
                            <FaEye className="text-white text-xl" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Search */}
                    <div className="relative">
                        <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Tìm kiếm bài viết..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#ff5252] focus:border-transparent"
                        />
                    </div>

                    {/* Status Filter */}
                    <div className="relative">
                        <FaFilter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#ff5252] focus:border-transparent appearance-none"
                        >
                            <option value="">Tất cả trạng thái</option>
                            <option value="published">Đã xuất bản</option>
                            <option value="draft">Bản nháp</option>
                            <option value="archived">Lưu trữ</option>
                        </select>
                    </div>

                    {/* Reset Filters */}
                    <button
                        onClick={() => {
                            setSearchTerm('');
                            setStatusFilter('');
                            setCurrentPage(1);
                        }}
                        className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                        Đặt lại bộ lọc
                    </button>
                </div>
            </div>

            {/* Blogs Table */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                {loading ? (
                    <div className="flex items-center justify-center py-12">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#ff5252]"></div>
                        <span className="ml-2 text-gray-600">Đang tải...</span>
                    </div>
                ) : (
                    <>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Bài viết
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Tác giả
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Ngày tạo
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Lượt xem
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
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center">
                                                    <div className="flex-shrink-0 h-12 w-12">
                                                        <img
                                                            className="h-12 w-12 rounded-lg object-cover"
                                                            src={blog.featured_image || '/placeholder.jpg'}
                                                            alt={blog.title}
                                                        />
                                                    </div>
                                                    <div className="ml-4">
                                                        <div className="text-sm font-medium text-gray-900 line-clamp-2">
                                                            {blog.title}
                                                        </div>
                                                        <div className="text-sm text-gray-500">
                                                            {blog.reading_time} phút đọc
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                {blog.author?.full_name || 'Admin'}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                {formatDate(blog.createdAt)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                <span className="font-medium">{blog.views || 0}</span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                {getStatusBadge(blog.status)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                <div className="flex items-center space-x-2">
                                                    <button 
                                                        onClick={() => toggleBlogStatus(blog._id, blog.status)}
                                                        className={`px-3 py-1 rounded text-xs font-medium ${
                                                            blog.status === 'published' 
                                                                ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200' 
                                                                : 'bg-green-100 text-green-800 hover:bg-green-200'
                                                        }`}
                                                    >
                                                        {blog.status === 'published' ? 'Ẩn' : 'Xuất bản'}
                                                    </button>
                                                    <button className="text-blue-600 hover:text-blue-900 p-1">
                                                        <FaEye />
                                                    </button>
                                                    <button className="text-indigo-600 hover:text-indigo-900 p-1">
                                                        <FaEdit />
                                                    </button>
                                                    <button 
                                                        onClick={() => deleteBlog(blog._id)}
                                                        className="text-red-600 hover:text-red-900 p-1"
                                                    >
                                                        <FaTrash />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200">
                                <div className="flex-1 flex justify-between sm:hidden">
                                    <button
                                        onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                                        disabled={currentPage === 1}
                                        className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                                    >
                                        Trước
                                    </button>
                                    <button
                                        onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                                        disabled={currentPage === totalPages}
                                        className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                                    >
                                        Sau
                                    </button>
                                </div>
                                <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                                    <div>
                                        <p className="text-sm text-gray-700">
                                            Trang <span className="font-medium">{currentPage}</span> của{' '}
                                            <span className="font-medium">{totalPages}</span>
                                        </p>
                                    </div>
                                    <div>
                                        <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                                            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                                                <button
                                                    key={page}
                                                    onClick={() => setCurrentPage(page)}
                                                    className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                                                        page === currentPage
                                                            ? 'z-10 bg-[#ff5252] border-[#ff5252] text-white'
                                                            : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                                                    }`}
                                                >
                                                    {page}
                                                </button>
                                            ))}
                                        </nav>
                                    </div>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

export default Content;
