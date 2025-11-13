const Blog = require('../models/Blog');
const User = require('../models/User');
const { validationResult } = require('express-validator');

// @desc    Get all published blogs
// @route   GET /api/blogs
// @access  Public
const getBlogs = async (req, res) => {
    try {
        const {
            search,
            tags,
            author,
            sortBy = 'createdAt',
            sortOrder = 'desc',
            page = 1,
            limit = 10,
            featured
        } = req.query;

        const options = {
            search,
            tags: tags ? tags.split(',') : undefined,
            author,
            sortBy,
            sortOrder: sortOrder === 'asc' ? 1 : -1,
            page: parseInt(page),
            limit: parseInt(limit),
            featured: featured === 'true'
        };

        const blogs = await Blog.getPublishedBlogs(options);
        
        // Get total count for pagination
        const query = { status: 'published' };
        if (search) query.$text = { $search: search };
        if (tags) query.tags = { $in: options.tags };
        if (author) query.author = author;
        if (featured === 'true') query.is_featured = true;

        const total = await Blog.countDocuments(query);
        const totalPages = Math.ceil(total / options.limit);

        res.json({
            success: true,
            data: {
                blogs,
                pagination: {
                    currentPage: options.page,
                    totalPages,
                    totalBlogs: total,
                    hasNextPage: options.page < totalPages,
                    hasPrevPage: options.page > 1
                }
            }
        });
    } catch (error) {
        console.error('Get blogs error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server',
            error: error.message
        });
    }
};

// @desc    Get featured blogs
// @route   GET /api/blogs/featured
// @access  Public
const getFeaturedBlogs = async (req, res) => {
    try {
        const { limit = 5 } = req.query;
        
        const blogs = await Blog.getFeaturedBlogs(parseInt(limit));

        res.json({
            success: true,
            data: {
                blogs,
                total: blogs.length
            }
        });
    } catch (error) {
        console.error('Get featured blogs error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server',
            error: error.message
        });
    }
};

// @desc    Get blog by ID
// @route   GET /api/blogs/:id
// @access  Public
const getBlogById = async (req, res) => {
    try {
        const blog = await Blog.findById(req.params.id)
            .populate('author', 'full_name email role');
        
        if (!blog || blog.status !== 'published') {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy bài viết'
            });
        }

        // Increment views
        await blog.incrementViews();

        // Get related blogs from same author or similar tags
        const relatedBlogs = await Blog.find({
            _id: { $ne: blog._id },
            status: 'published',
            $or: [
                { author: blog.author._id },
                { tags: { $in: blog.tags } }
            ]
        })
        .populate('author', 'full_name')
        .select('title excerpt featured_image createdAt reading_time')
        .limit(3);

        res.json({
            success: true,
            data: {
                blog,
                relatedBlogs
            }
        });
    } catch (error) {
        console.error('Get blog by ID error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server',
            error: error.message
        });
    }
};

// @desc    Create new blog
// @route   POST /api/admin/blogs
// @access  Private/Admin
const createBlog = async (req, res) => {
    try {
        // Check for validation errors
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Dữ liệu không hợp lệ',
                errors: errors.array()
            });
        }

        const {
            title,
            content,
            excerpt,
            featured_image,
            tags,
            status,
            is_featured
        } = req.body;

        const blog = new Blog({
            title,
            content,
            author: req.user._id, // Get from authenticated user
            excerpt,
            featured_image,
            tags: tags || [],
            status: status || 'draft',
            is_featured: is_featured || false
        });

        await blog.save();
        await blog.populate('author', 'full_name email');

        res.status(201).json({
            success: true,
            message: 'Tạo bài viết thành công',
            data: {
                blog
            }
        });
    } catch (error) {
        console.error('Create blog error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server',
            error: error.message
        });
    }
};

// @desc    Update blog
// @route   PUT /api/admin/blogs/:id
// @access  Private/Admin
const updateBlog = async (req, res) => {
    try {
        // Check for validation errors
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Dữ liệu không hợp lệ',
                errors: errors.array()
            });
        }

        const blog = await Blog.findById(req.params.id);
        if (!blog) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy bài viết'
            });
        }

        const {
            title,
            content,
            excerpt,
            featured_image,
            tags,
            status,
            is_featured
        } = req.body;

        const updateData = {};
        if (title) updateData.title = title;
        if (content) updateData.content = content;
        if (excerpt !== undefined) updateData.excerpt = excerpt;
        if (featured_image !== undefined) updateData.featured_image = featured_image;
        if (tags) updateData.tags = tags;
        if (status) updateData.status = status;
        if (is_featured !== undefined) updateData.is_featured = is_featured;

        const updatedBlog = await Blog.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true, runValidators: true }
        ).populate('author', 'full_name email');

        res.json({
            success: true,
            message: 'Cập nhật bài viết thành công',
            data: {
                blog: updatedBlog
            }
        });
    } catch (error) {
        console.error('Update blog error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server',
            error: error.message
        });
    }
};

// @desc    Delete blog
// @route   DELETE /api/admin/blogs/:id
// @access  Private/Admin
const deleteBlog = async (req, res) => {
    try {
        const blog = await Blog.findById(req.params.id);
        
        if (!blog) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy bài viết'
            });
        }

        await Blog.findByIdAndDelete(req.params.id);

        res.json({
            success: true,
            message: 'Xóa bài viết thành công'
        });
    } catch (error) {
        console.error('Delete blog error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server',
            error: error.message
        });
    }
};

// @desc    Get all blogs for admin (including drafts)
// @route   GET /api/admin/blogs
// @access  Private/Admin
const getAdminBlogs = async (req, res) => {
    try {
        const {
            search,
            status,
            author,
            sortBy = 'createdAt',
            sortOrder = 'desc',
            page = 1,
            limit = 20
        } = req.query;

        const query = {};
        
        if (search) {
            query.$text = { $search: search };
        }
        
        if (status) {
            query.status = status;
        }
        
        if (author) {
            query.author = author;
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);
        const sort = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

        const blogs = await Blog.find(query)
            .populate('author', 'full_name email')
            .sort(sort)
            .skip(skip)
            .limit(parseInt(limit));

        const total = await Blog.countDocuments(query);
        const totalPages = Math.ceil(total / parseInt(limit));

        res.json({
            success: true,
            data: {
                blogs,
                pagination: {
                    currentPage: parseInt(page),
                    totalPages,
                    totalBlogs: total,
                    hasNextPage: parseInt(page) < totalPages,
                    hasPrevPage: parseInt(page) > 1
                }
            }
        });
    } catch (error) {
        console.error('Get admin blogs error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server',
            error: error.message
        });
    }
};

// @desc    Toggle blog featured status
// @route   PATCH /api/admin/blogs/:id/featured
// @access  Private/Admin
const toggleFeatured = async (req, res) => {
    try {
        const blog = await Blog.findById(req.params.id);
        
        if (!blog) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy bài viết'
            });
        }

        await blog.toggleFeatured();

        res.json({
            success: true,
            message: `${blog.is_featured ? 'Đã thêm vào' : 'Đã xóa khỏi'} danh sách nổi bật`,
            data: {
                blog
            }
        });
    } catch (error) {
        console.error('Toggle featured error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server',
            error: error.message
        });
    }
};

// @desc    Publish blog
// @route   PATCH /api/admin/blogs/:id/publish
// @access  Private/Admin
const publishBlog = async (req, res) => {
    try {
        const blog = await Blog.findById(req.params.id);
        
        if (!blog) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy bài viết'
            });
        }

        await blog.publish();

        res.json({
            success: true,
            message: 'Đã xuất bản bài viết',
            data: {
                blog
            }
        });
    } catch (error) {
        console.error('Publish blog error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server',
            error: error.message
        });
    }
};

module.exports = {
    getBlogs,
    getFeaturedBlogs,
    getBlogById,
    createBlog,
    updateBlog,
    deleteBlog,
    getAdminBlogs,
    toggleFeatured,
    publishBlog
};
