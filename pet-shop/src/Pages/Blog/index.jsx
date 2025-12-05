import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaCalendar, FaUser, FaComment, FaArrowRight } from 'react-icons/fa';
import { Button } from '@mui/material';
import axios from 'axios';
import './style.css';
import { CONFIG } from '../../constants/config';

const API_BASE_URL = CONFIG.API.BASE_URL;

const Blog = () => {
    const navigate = useNavigate();
    const [blogPosts, setBlogPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedTag, setSelectedTag] = useState('');

    useEffect(() => {
        fetchBlogs();
    }, [currentPage, searchTerm, selectedTag]);

    const fetchBlogs = async () => {
        try {
            setLoading(true);
            
            // Build query params
            const params = new URLSearchParams({
                page: currentPage,
                limit: 6
            });
            
            if (searchTerm.trim()) {
                params.append('search', searchTerm.trim());
                console.log('🔍 Searching for:', searchTerm);
            }
            
            if (selectedTag) {
                params.append('tags', selectedTag);
                console.log('🏷️ Filtering by tag:', selectedTag);
            }
            
            const response = await axios.get(`${API_BASE_URL}/api/blogs?${params.toString()}`);
            
            if (response.data.success) {
                setBlogPosts(response.data.data.blogs);
                setTotalPages(response.data.data.pagination.totalPages);
                console.log('✅ Fetched blogs:', response.data.data.blogs.length);
            }
        } catch (error) {
            console.error('❌ Error fetching blogs:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (e) => {
        e.preventDefault();
        setCurrentPage(1); // Reset to first page on new search
        fetchBlogs();
    };

    const handleTagClick = (tag) => {
        setSelectedTag(tag === selectedTag ? '' : tag);
        setCurrentPage(1);
        console.log('🏷️ Tag clicked:', tag);
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('vi-VN');
    };

    // Keep static data for now as fallback
    const staticBlogPosts = [
        {
            id: 1,
            title: '10 Mẹo Chăm Sóc Chó Con Cho Người Mới Bắt Đầu',
            excerpt: 'Nuôi chó con là một trải nghiệm tuyệt vời nhưng cũng đầy thách thức. Dưới đây là những mẹo quan trọng giúp bạn chăm sóc chó con một cách tốt nhất...',
            image: 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=600',
            author: 'Nguyễn Văn A',
            date: '15/03/2025',
            comments: 24,
            category: 'Chăm sóc'
        },
        {
            id: 2,
            title: 'Cách Huấn Luyện Mèo Đi Vệ Sinh Đúng Nơi',
            excerpt: 'Huấn luyện mèo đi vệ sinh đúng nơi là một trong những kỹ năng quan trọng nhất. Hãy cùng tìm hiểu phương pháp hiệu quả nhất...',
            image: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=600',
            author: 'Trần Thị B',
            date: '12/03/2025',
            comments: 18,
            category: 'Huấn luyện'
        },
        {
            id: 3,
            title: 'Top 5 Thức Ăn Tốt Nhất Cho Chó Trưởng Thành',
            excerpt: 'Dinh dưỡng đóng vai trò quan trọng trong sức khỏe của chó. Cùng khám phá những loại thức ăn được đánh giá cao nhất...',
            image: 'https://images.unsplash.com/photo-1589924691995-400dc9ecc119?w=600',
            author: 'Lê Văn C',
            date: '10/03/2025',
            comments: 32,
            category: 'Dinh dưỡng'
        },
        {
            id: 4,
            title: 'Dấu Hiệu Nhận Biết Thú Cưng Bị Bệnh',
            excerpt: 'Việc phát hiện sớm dấu hiệu bệnh tật ở thú cưng rất quan trọng. Dưới đây là những triệu chứng bạn cần chú ý...',
            image: 'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=600',
            author: 'Phạm Thị D',
            date: '08/03/2025',
            comments: 45,
            category: 'Sức khỏe'
        },
        {
            id: 5,
            title: 'Cách Chọn Đồ Chơi An Toàn Cho Thú Cưng',
            excerpt: 'Đồ chơi không chỉ giúp thú cưng vui chơi mà còn phát triển trí tuệ. Tìm hiểu cách chọn đồ chơi an toàn và phù hợp...',
            image: 'https://images.unsplash.com/photo-1535294435445-d7249524ef2e?w=600',
            author: 'Hoàng Văn E',
            date: '05/03/2025',
            comments: 15,
            category: 'Phụ kiện'
        },
        {
            id: 6,
            title: 'Lịch Tiêm Phòng Cho Chó Mèo Đầy Đủ',
            excerpt: 'Tiêm phòng là biện pháp phòng bệnh quan trọng nhất. Cùng tìm hiểu lịch tiêm phòng chi tiết cho thú cưng của bạn...',
            image: 'https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?w=600',
            author: 'Vũ Thị F',
            date: '02/03/2025',
            comments: 28,
            category: 'Sức khỏe'
        }
    ];

    const categories = [
        { name: 'Tất cả', count: 156 },
        { name: 'Chăm sóc', count: 45 },
        { name: 'Huấn luyện', count: 32 },
        { name: 'Dinh dưỡng', count: 28 },
        { name: 'Sức khỏe', count: 38 },
        { name: 'Phụ kiện', count: 13 }
    ];

    const popularPosts = [
        {
            title: 'Cách chăm sóc lông cho chó Poodle',
            date: '20/03/2025',
            image: 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=200'
        },
        {
            title: 'Thức ăn nào tốt cho mèo Ba Tư?',
            date: '18/03/2025',
            image: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=200'
        },
        {
            title: 'Huấn luyện chó ngồi và nằm cơ bản',
            date: '16/03/2025',
            image: 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=200'
        }
    ];

    return (
        <div className="blog-page py-6">
            <div className="container">
                <div className="breadcrumb mb-4 text-[14px]">
                    <span className="text-gray-500">Trang chủ</span>
                    <span className="mx-2">/</span>
                    <span className="text-[#013b22] font-semibold">Blog</span>
                </div>

                <div className="page-header mb-10 bg-[#f3fbf7] rounded-2xl">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                        
                        {/* Left: Title & Description - SÁT LỀ TRÁI */}
                        <div className="flex-shrink-0">
                            <h1 className="text-[32px] font-bold text-[#013b22] mb-2">
                                Blog Chăm Sóc Thú Cưng
                            </h1>
                            <p className="text-[15px] text-gray-600">
                                Chia sẻ kiến thức và kinh nghiệm chăm sóc thú cưng
                            </p>
                        </div>

                        {/* Right: Search Bar - SÁT LỀ PHẢI */}
                        <div className="flex-shrink-0 w-full md:w-auto">
                            <form
                                onSubmit={handleSearch}
                                className="flex gap-3 items-center justify-end"
                            >
                                <input
                                    type="text"
                                    placeholder="Tìm kiếm bài viết theo từ khóa hoặc tags..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full md:w-[320px] px-5 py-3 border border-gray-300 rounded-md 
                                            text-sm focus:outline-none focus:ring-2 focus:ring-[#013b22] focus:border-transparent"
                                />
                                <button
                                    type="submit"
                                    className="px-8 py-3 bg-[#013b22] text-white rounded-md 
                                             hover:bg-[#4d7f6a] transition-all font-semibold whitespace-nowrap"
                                >
                                    Tìm kiếm
                                </button>
                            </form>
                        </div>
                    </div>

                    {/* Filter Tag */}
                    {(searchTerm || selectedTag) && (
                        <div className="mt-4">
                            <span className="inline-flex items-center gap-2 px-4 py-1.5 bg-[#013b22] text-white rounded-full text-sm">
                                Lọc theo: #{selectedTag || searchTerm}
                                <button
                                    onClick={() => {
                                        setSearchTerm('');
                                        setSelectedTag('');
                                    }}
                                    className="ml-1 font-bold hover:text-gray-200 transition"
                                >
                                    ×
                                </button>
                            </span>
                        </div>
                    )}
                </div>



                {/* Main Content - Full Width */}
                <div className="main-content w-full">
                        {loading ? (
                            <div className="flex justify-center items-center py-20">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#013b22]"></div>
                            </div>
                        ) : blogPosts.length === 0 ? (
                            <div className="text-center py-20">
                                <p className="text-gray-500">Chưa có bài viết nào</p>
                            </div>
                        ) : (
                            <div className="blog-grid grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                {blogPosts.map((post) => (
                                    <div 
                                        key={post._id || post.id} 
                                        className="blog-card bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer"
                                        onClick={() => navigate(`/blog/${post._id}`)}
                                    >
                                        <div className="image-wrapper h-[280px] overflow-hidden bg-gray-100 rounded-t-lg">
                                            <img 
                                                src={post.featured_image || post.image || 'https://images.unsplash.com/photo-1450778869180-41d0601e046e?w=600'} 
                                                alt={post.title}
                                                className="w-full h-full object-contain"
                                            />
                                        </div>
                                        <div className="content p-4">
                                            <div className="meta flex items-center justify-between mb-3 text-[12px] text-gray-700">
                                                <span className="category px-2 py-1 bg-[#013b22] text-white rounded font-semibold">
                                                    {post.status === 'published' ? 'Đã xuất bản' : 'Nháp'}
                                                </span>
                                                <div className="flex items-center gap-4 font-semibold">
                                                    <span className="flex items-center gap-1">
                                                    <FaCalendar /> {formatDate(post.createdAt || post.date)}
                                                    </span>
                                                    <span className="flex items-center gap-1">
                                                    <FaComment /> {post.views || 0}
                                                    </span>
                                                </div>
                                            </div>
                                            <h3 className="text-[18px] font-bold mb-2 hover:text-[#013b22] transition cursor-pointer line-clamp-2">
                                                {post.title}
                                            </h3>
                                            <p className="text-[14px] text-gray-600 mb-3 line-clamp-3">
                                                {post.excerpt}
                                            </p>
                                            
                                            {/* Tags */}
                                            {post.tags && post.tags.length > 0 && (
                                                <div className="flex flex-wrap gap-2 mb-3">
                                                    {post.tags.slice(0, 3).map((tag, idx) => (
                                                        <span
                                                            key={idx}
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleTagClick(tag);
                                                            }}
                                                            className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs hover:bg-[#013b22] hover:text-white transition cursor-pointer"
                                                        >
                                                            #{tag}
                                                        </span>
                                                    ))}
                                                </div>
                                            )}
                                            
                                            <div className="flex items-center justify-between">
                                                <div className="author flex items-center gap-2 text-[13px]">
                                                    {/* <FaUser className="text-gray-400" /> */}
                                                    {/* <span>{post.author?.full_name || post.author || 'Admin'}</span> */}
                                                </div>
                                                <Button className="!text-[#013b22] !text-[13px] !font-semibold">
                                                    Đọc thêm <FaArrowRight className="ml-1" />
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Pagination */}
                        {!loading && blogPosts.length > 0 && totalPages > 1 && (
                            <div className="pagination flex justify-center items-center gap-2 mt-8">
                                <Button 
                                    className="!min-w-[40px] !h-[40px] !border !border-gray-300"
                                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                    disabled={currentPage === 1}
                                >
                                    «
                                </Button>
                                {[...Array(totalPages)].map((_, index) => (
                                    <Button 
                                        key={index + 1}
                                        className={`!min-w-[40px] !h-[40px] ${
                                            currentPage === index + 1 
                                                ? '!bg-[#013b22] !text-white' 
                                                : '!border !border-gray-300'
                                        }`}
                                        onClick={() => setCurrentPage(index + 1)}
                                    >
                                        {index + 1}
                                    </Button>
                                ))}
                                <Button 
                                    className="!min-w-[40px] !h-[40px] !border !border-gray-300"
                                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                    disabled={currentPage === totalPages}
                                >
                                    »
                                </Button>
                            </div>
                        )}
                </div>
            </div>
        </div>
    );
};

export default Blog;
