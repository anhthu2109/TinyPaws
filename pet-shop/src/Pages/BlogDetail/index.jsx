import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { FaCalendar, FaUser, FaClock, FaArrowLeft, FaSpinner, FaSearch } from 'react-icons/fa';
import axios from 'axios';
import './style.css';
import { CONFIG } from '../../constants/config';

const API_BASE_URL = CONFIG.API.BASE_URL;

const BlogDetail = () => {
    const { id } = useParams();
    const [blog, setBlog] = useState(null);
    const [relatedBlogs, setRelatedBlogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchBlogDetail();
    }, [id]);

    const fetchBlogDetail = async () => {
        try {
            setLoading(true);
            const response = await axios.get(`${API_BASE_URL}/api/blogs/${id}`);
            
            if (response.data.success) {
                setBlog(response.data.data.blog);
                setRelatedBlogs(response.data.data.relatedBlogs || []);
            }
        } catch (err) {
            setError('Không thể tải bài viết');
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (date) => {
        return new Date(date).toLocaleDateString('vi-VN', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const handleSearch = (e) => {
        e.preventDefault();
        if (searchTerm.trim()) {
            window.location.href = `/blog?search=${encodeURIComponent(searchTerm)}`;
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <FaSpinner className="animate-spin text-5xl text-[#013b22]" />
            </div>
        );
    }

    if (error || !blog) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center">
                <p className="text-xl text-gray-600 mb-4">{error || 'Không tìm thấy bài viết'}</p>
                <Link to="/blog" className="text-[#013b22] hover:underline">
                    ← Quay lại danh sách blog
                </Link>
            </div>
        );
    }

    return (
        <div className="blog-detail-page py-6">
            <div className="container">
                {/* Breadcrumb */}
                <div className="breadcrumb mb-4 text-[14px]">
                    <Link to="/" className="text-gray-500 hover:text-[#013b22]">Trang chủ</Link>
                    <span className="mx-2">/</span>
                    <Link to="/blog" className="text-gray-500 hover:text-[#013b22]">Blog</Link>
                    <span className="mx-2">/</span>
                    <span className="text-[#013b22] font-semibold">{blog.title}</span>
                </div>

                <div className="flex gap-6">
                    {/* Main Content */}
                    <div className="main-content flex-1">
                        {/* Back Button
                        <Link 
                            to="/blog" 
                            className="inline-flex items-center gap-2 text-[#013b22] hover:underline mb-4"
                        >
                            <FaArrowLeft /> Quay lại danh sách
                        </Link> */}

                        {/* Article */}
                        <article className="bg-white rounded-lg shadow-sm p-6">
                            {/* Header */}
                            <header className="mb-6">
                                <h1 className="text-[36px] font-bold mb-4 leading-tight">
                                    {blog.title}
                                </h1>
                                
                                {/* Meta Info */}
                                <div className="flex flex-wrap items-center gap-4 text-[14px] text-gray-600 pb-4 border-b">
                                    <div className="flex items-center gap-2">
                                        <FaUser className="text-[#013b22]" />
                                        <span>{blog.author?.full_name || 'Admin'}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <FaCalendar className="text-[#013b22]" />
                                        <span>{formatDate(blog.createdAt)}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <FaClock className="text-[#013b22]" />
                                        <span>{blog.reading_time || 5} phút đọc</span>
                                    </div>
                                </div>
                            </header>

                            {/* Featured Image */}
                            {blog.featured_image && (
                                <div className="featured-image mb-6 bg-gray-50 rounded-lg">
                                    <img 
                                        src={blog.featured_image} 
                                        alt={blog.title}
                                        className="w-full h-[500px] object-contain rounded-lg"
                                    />
                                </div>
                            )}

                            {/* Content */}
                            <div 
                                className="blog-content text-[16px] leading-relaxed text-gray-700"
                                dangerouslySetInnerHTML={{ __html: blog.content }}
                            />

                            {/* Tags */}
                            {blog.tags && blog.tags.length > 0 && (
                                <div className="tags mt-8 pt-6 border-t">
                                    <h3 className="text-[16px] font-semibold mb-3">Tags:</h3>
                                    <div className="flex flex-wrap gap-2">
                                        {blog.tags.map((tag, index) => (
                                            <span 
                                                key={index}
                                                className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-[13px] hover:bg-[#013b22] hover:text-white transition cursor-pointer"
                                            >
                                                #{tag}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </article>
                    </div>

                    {/* Sidebar */}
                    <div className="sidebar w-[300px] hidden lg:block">
                        {/* Related Posts by Tags */}
                        {relatedBlogs.length > 0 && (
                            <div className="widget bg-white rounded-lg shadow-sm p-4">
                                <h3 className="text-[18px] font-bold mb-4">Bài viết liên quan</h3>
                                <ul className="space-y-4">
                                    {relatedBlogs.map((post) => (
                                        <li key={post._id} className="flex gap-3 pb-4 border-b last:border-0">
                                            <Link to={`/blog/${post._id}`} className="flex-shrink-0">
                                                <img 
                                                    src={post.featured_image || 'https://via.placeholder.com/80'} 
                                                    alt={post.title}
                                                    className="w-[80px] h-[80px] object-cover rounded"
                                                />
                                            </Link>
                                            <div className="flex-1">
                                                <Link to={`/blog/${post._id}`}>
                                                    <h4 className="text-[14px] font-semibold mb-1 line-clamp-2 hover:text-[#013b22] transition">
                                                        {post.title}
                                                    </h4>
                                                </Link>
                                                <p className="text-[12px] text-gray-500">
                                                    {formatDate(post.createdAt)}
                                                </p>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BlogDetail;
