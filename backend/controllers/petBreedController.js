const PetBreed = require('../models/PetBreed');
const { validationResult } = require('express-validator');

// @desc    Get all pet breeds
// @route   GET /api/pet-breeds
// @access  Public
const getPetBreeds = async (req, res) => {
    try {
        const {
            search,
            pet_type,
            size,
            care_level,
            grooming_needs,
            is_popular,
            sortBy = 'name',
            sortOrder = 'asc',
            page = 1,
            limit = 12
        } = req.query;

        const options = {
            search,
            pet_type,
            size,
            care_level,
            grooming_needs,
            is_popular,
            sortBy,
            sortOrder: sortOrder === 'asc' ? 1 : -1,
            page: parseInt(page),
            limit: parseInt(limit)
        };

        const petBreeds = await PetBreed.searchBreeds(options);
        
        // Get total count for pagination
        const query = {};
        if (search) query.$text = { $search: search };
        if (pet_type && ['dog', 'cat'].includes(pet_type)) {
            query.$or = [
                { pet_type: pet_type },
                { pet_type: 'both' }
            ];
        }
        if (size) query.size = size;
        if (care_level) query.care_level = care_level;
        if (grooming_needs) query.grooming_needs = grooming_needs;
        if (is_popular !== undefined) query.is_popular = is_popular === 'true';

        const total = await PetBreed.countDocuments(query);
        const totalPages = Math.ceil(total / options.limit);

        res.json({
            success: true,
            data: {
                petBreeds,
                pagination: {
                    currentPage: options.page,
                    totalPages,
                    totalBreeds: total,
                    hasNextPage: options.page < totalPages,
                    hasPrevPage: options.page > 1
                }
            }
        });
    } catch (error) {
        console.error('Get pet breeds error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server',
            error: error.message
        });
    }
};

// @desc    Get popular pet breeds
// @route   GET /api/pet-breeds/popular
// @access  Public
const getPopularBreeds = async (req, res) => {
    try {
        const { pet_type, limit = 10 } = req.query;
        
        const petBreeds = await PetBreed.getPopularBreeds(pet_type, parseInt(limit));

        res.json({
            success: true,
            data: {
                petBreeds,
                total: petBreeds.length
            }
        });
    } catch (error) {
        console.error('Get popular breeds error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server',
            error: error.message
        });
    }
};

// @desc    Get pet breed by ID
// @route   GET /api/pet-breeds/:id
// @access  Public
const getPetBreedById = async (req, res) => {
    try {
        const petBreed = await PetBreed.findById(req.params.id);
        
        if (!petBreed) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy giống thú cưng'
            });
        }

        // Get related breeds (same pet type or size)
        const relatedBreeds = await PetBreed.find({
            _id: { $ne: petBreed._id },
            $or: [
                { pet_type: petBreed.pet_type },
                { size: petBreed.size }
            ]
        })
        .select('name image_url pet_type size')
        .limit(4);

        res.json({
            success: true,
            data: {
                petBreed,
                relatedBreeds
            }
        });
    } catch (error) {
        console.error('Get pet breed by ID error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server',
            error: error.message
        });
    }
};

// @desc    Create new pet breed
// @route   POST /api/admin/pet-breeds
// @access  Private/Admin
const createPetBreed = async (req, res) => {
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
            name,
            description,
            image_url,
            origin,
            pet_type,
            size,
            temperament,
            life_span,
            weight_range,
            care_level,
            is_popular,
            health_issues,
            grooming_needs
        } = req.body;

        // Check if breed name already exists
        const existingBreed = await PetBreed.findOne({ 
            name: { $regex: new RegExp(`^${name}$`, 'i') } 
        });
        
        if (existingBreed) {
            return res.status(400).json({
                success: false,
                message: 'Tên giống đã tồn tại'
            });
        }

        const petBreed = new PetBreed({
            name,
            description,
            image_url,
            origin,
            pet_type,
            size,
            temperament: temperament || [],
            life_span,
            weight_range,
            care_level,
            is_popular: is_popular || false,
            health_issues: health_issues || [],
            grooming_needs
        });

        await petBreed.save();

        res.status(201).json({
            success: true,
            message: 'Tạo giống thú cưng thành công',
            data: {
                petBreed
            }
        });
    } catch (error) {
        console.error('Create pet breed error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server',
            error: error.message
        });
    }
};

// @desc    Update pet breed
// @route   PUT /api/admin/pet-breeds/:id
// @access  Private/Admin
const updatePetBreed = async (req, res) => {
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

        const petBreed = await PetBreed.findById(req.params.id);
        if (!petBreed) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy giống thú cưng'
            });
        }

        const {
            name,
            description,
            image_url,
            origin,
            pet_type,
            size,
            temperament,
            life_span,
            weight_range,
            care_level,
            is_popular,
            health_issues,
            grooming_needs
        } = req.body;

        // Check if new name already exists (excluding current breed)
        if (name && name !== petBreed.name) {
            const existingBreed = await PetBreed.findOne({ 
                name: { $regex: new RegExp(`^${name}$`, 'i') },
                _id: { $ne: req.params.id }
            });
            
            if (existingBreed) {
                return res.status(400).json({
                    success: false,
                    message: 'Tên giống đã tồn tại'
                });
            }
        }

        const updateData = {};
        if (name) updateData.name = name;
        if (description) updateData.description = description;
        if (image_url) updateData.image_url = image_url;
        if (origin !== undefined) updateData.origin = origin;
        if (pet_type) updateData.pet_type = pet_type;
        if (size) updateData.size = size;
        if (temperament) updateData.temperament = temperament;
        if (life_span) updateData.life_span = life_span;
        if (weight_range) updateData.weight_range = weight_range;
        if (care_level) updateData.care_level = care_level;
        if (is_popular !== undefined) updateData.is_popular = is_popular;
        if (health_issues) updateData.health_issues = health_issues;
        if (grooming_needs) updateData.grooming_needs = grooming_needs;

        const updatedPetBreed = await PetBreed.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true, runValidators: true }
        );

        res.json({
            success: true,
            message: 'Cập nhật giống thú cưng thành công',
            data: {
                petBreed: updatedPetBreed
            }
        });
    } catch (error) {
        console.error('Update pet breed error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server',
            error: error.message
        });
    }
};

// @desc    Delete pet breed
// @route   DELETE /api/admin/pet-breeds/:id
// @access  Private/Admin
const deletePetBreed = async (req, res) => {
    try {
        const petBreed = await PetBreed.findById(req.params.id);
        
        if (!petBreed) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy giống thú cưng'
            });
        }

        await PetBreed.findByIdAndDelete(req.params.id);

        res.json({
            success: true,
            message: 'Xóa giống thú cưng thành công'
        });
    } catch (error) {
        console.error('Delete pet breed error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server',
            error: error.message
        });
    }
};

// @desc    Get all pet breeds for admin
// @route   GET /api/admin/pet-breeds
// @access  Private/Admin
const getAdminPetBreeds = async (req, res) => {
    try {
        const {
            search,
            pet_type,
            size,
            is_popular,
            sortBy = 'createdAt',
            sortOrder = 'desc',
            page = 1,
            limit = 20
        } = req.query;

        const query = {};
        
        if (search) {
            query.$text = { $search: search };
        }
        
        if (pet_type) {
            query.pet_type = pet_type;
        }
        
        if (size) {
            query.size = size;
        }
        
        if (is_popular !== undefined) {
            query.is_popular = is_popular === 'true';
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);
        const sort = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

        const petBreeds = await PetBreed.find(query)
            .sort(sort)
            .skip(skip)
            .limit(parseInt(limit));

        const total = await PetBreed.countDocuments(query);
        const totalPages = Math.ceil(total / parseInt(limit));

        res.json({
            success: true,
            data: {
                petBreeds,
                pagination: {
                    currentPage: parseInt(page),
                    totalPages,
                    totalBreeds: total,
                    hasNextPage: parseInt(page) < totalPages,
                    hasPrevPage: parseInt(page) > 1
                }
            }
        });
    } catch (error) {
        console.error('Get admin pet breeds error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server',
            error: error.message
        });
    }
};

// @desc    Toggle pet breed popular status
// @route   PATCH /api/admin/pet-breeds/:id/popular
// @access  Private/Admin
const togglePopular = async (req, res) => {
    try {
        const petBreed = await PetBreed.findById(req.params.id);
        
        if (!petBreed) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy giống thú cưng'
            });
        }

        await petBreed.togglePopular();

        res.json({
            success: true,
            message: `${petBreed.is_popular ? 'Đã thêm vào' : 'Đã xóa khỏi'} danh sách phổ biến`,
            data: {
                petBreed
            }
        });
    } catch (error) {
        console.error('Toggle popular error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server',
            error: error.message
        });
    }
};

module.exports = {
    getPetBreeds,
    getPopularBreeds,
    getPetBreedById,
    createPetBreed,
    updatePetBreed,
    deletePetBreed,
    getAdminPetBreeds,
    togglePopular
};
