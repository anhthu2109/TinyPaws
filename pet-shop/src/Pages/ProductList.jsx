import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import ProductCard from '../components/ProductCard';
import { FaFilter, FaSort, FaSearch } from 'react-icons/fa';
import { FaTh, FaList } from 'react-icons/fa';
import { Button, Pagination } from '@mui/material';
import axios from 'axios';
import { CONFIG } from '../constants/config';

const CATEGORY_BATCH_SIZE = 12;
const BRAND_PREVIEW_LIMIT = 5;
const TAG_PREVIEW_LIMIT = 10;

const brandOptions = {
    cho: ['Royal Canin','Goodies', 'Orgo', 'SmartHeart', 'Ganador', 'ANF', 'Zenith', 'Pedigree', 'DoggyMan'],

    meo: ['Royal Canin', 'Whiskas', 'Me-O', 'Silver Spoon', 'Zoi Cat', 'Ciao', 'PetQ', 'MRVET', 'Wanpy '],

    'san-pham-ve-sinh': ['Yu', 'Maneki Neko'],

    'ca-cho-va-meo': ['Bioline', 'TaoTaoPets', 'Shizuka']
};

const normalizeTarget = (targetValue) => {
    const value = (targetValue || '').toString().toLowerCase();
    const targetMap = {
        'dog': 'dog',
        'cho': 'dog',
        'cat': 'cat',
        'meo': 'cat',
        'both': 'both',
        'all': 'both',
        'ca-cho-va-meo': 'both',
        'ca cho va meo': 'both'
    };
    return targetMap[value] || 'both';
};

const ProductList = () => {
    const { category } = useParams();
    const [searchParams, setSearchParams] = useSearchParams();
    const isPetCategoryPage = category === 'cho' || category === 'meo';
    
    const sortParam = searchParams.get('sort');
    const tagParam = searchParams.get('tag');
    
    const [products, setProducts] = useState([]);
    const [filteredProducts, setFilteredProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState('grid');
    const [currentPage, setCurrentPage] = useState(1);
    const [productsPerPage] = useState(CONFIG.APP.ITEMS_PER_PAGE);
    const [visibleProductsCount, setVisibleProductsCount] = useState(CATEGORY_BATCH_SIZE);

    const [sortBy, setSortBy] = useState('updatedAt');
    const [sortOrder, setSortOrder] = useState('desc');
    const [selectedBrands, setSelectedBrands] = useState([]);
    const [selectedCategories, setSelectedCategories] = useState([]);
    const [selectedTags, setSelectedTags] = useState([]);
    const [minPrice, setMinPrice] = useState('');
    const [maxPrice, setMaxPrice] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [showAllBrands, setShowAllBrands] = useState(false);
    const [showAllTags, setShowAllTags] = useState(false);

    const [categories, setCategories] = useState([]);
    const [allTags, setAllTags] = useState([]);

    const getPageTitle = () => {
        if (sortParam === 'bestseller') {
            return 'Sản phẩm bán chạy nhất';
        }
        
        if (tagParam === 'daily_deal') {
            return 'Ưu đãi trong ngày';
        }
        
        if (tagParam === 'featured') {
            return 'Sản phẩm nổi bật';
        }
        
        if (tagParam === 'new_arrivals' || tagParam === 'new') {
            return 'Sản phẩm mới';
        }
        
        const categoryTitles = {
            'noi-bat': 'Sản phẩm nổi bật',
            'cho': 'Sản phẩm cho chó',
            'meo': 'Sản phẩm cho mèo',
            'thuc-an-cho': 'Thức ăn cho chó',
            'thuc-an-meo': 'Thức ăn cho mèo',
            'do-choi': 'Đồ chơi thú cưng',
            'phu-kien': 'Phụ kiện thú cưng',
            've-sinh': 'Vệ sinh thú cưng'
        };
        
        return categoryTitles[category] || 'Tất cả sản phẩm';
    };

    useEffect(() => {
        const loadFilterData = async () => {
            try {
                const categoriesRes = await axios.get(`${CONFIG.API.BASE_URL}/api/categories`);
                if (categoriesRes.data.success) {
                    setCategories(categoriesRes.data.data);
                }
            } catch (error) {
            }
        };
        loadFilterData();
    }, []);

    useEffect(() => {
        setLoading(true);

        const loadProducts = async () => {
            console.log('Loading products with params:', { tagParam, sortParam, category });
            try {
                let apiUrl = `${CONFIG.API.BASE_URL}/api/products`;
                let apiParams = {
                    limit: isPetCategoryPage ? 120 : CONFIG.APP.ITEMS_PER_PAGE * 5
                };

                if (tagParam === 'featured') {
                    apiParams.tag = 'featured';
                    apiParams.limit = 100;
                }
                else if (sortParam === 'bestseller') {
                    apiParams.sort = 'bestseller';
                    apiParams.limit = 100;
                }
                else if (tagParam === 'new' || tagParam === 'new_arrivals') {
                    apiParams.sort = 'createdAt';
                    apiParams.limit = 100;
                }

                if (isPetCategoryPage) {
                    apiParams.limit = 500;
                }

                const response = await axios.get(apiUrl, { params: apiParams });
                
                if (response.data.success && response.data.data.products) {
                    let allProducts = response.data.data.products;

                    const transformedProducts = allProducts.map(product => {
                        const normalizedTarget = normalizeTarget(product.target);
                        const fallbackBrand = product.brand?.trim();
                        return {
                        id: product._id,
                        name: product.name,
                        category: product.category?.name || 'Chưa phân loại',
                        brand: fallbackBrand,
                        price: product.sale_price ?? product.price,
                        oldPrice: product.sale_price ? product.price : null,
                        image: product.images?.[0] || 'https://placehold.co/400x400?text=No+Image',
                        rating: 4.5,
                        reviews: Math.floor(Math.random() * 200) + 10, // Random reviews for demo
                        stock: product.stock_quantity,
                        isNew: new Date(product.createdAt) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
                        target: normalizedTarget,
                        tags: product.tags || [], 
                        createdAt: product.createdAt, 
                        updatedAt: product.updatedAt || product.createdAt,
                        salesCount: product.sales_count || 0,
                        is_featured: product.is_featured || false
                    }});

                    let filteredProducts = transformedProducts;

                    if (tagParam === 'featured') {
                        console.log('Featured products count:', transformedProducts.length);
                        console.log('Featured products:', transformedProducts.map(p => ({ id: p.id, name: p.name, is_featured: p.is_featured })));
                    } else if (sortParam === 'bestseller') {
                    } else if (tagParam === 'new' || tagParam === 'new_arrivals') {
                        filteredProducts = transformedProducts.filter(product => {
                            return product.isNew === true;
                        });
                    } 
                    else if (category && category !== 'all') {
                        if (category === 'cho') {
                            const dogTargets = ['dog', 'both'];
                            filteredProducts = transformedProducts.filter(product => 
                                dogTargets.includes(product.target)
                            );
                        } else if (category === 'meo') {
                            const catTargets = ['cat', 'both'];
                            filteredProducts = transformedProducts.filter(product => 
                                catTargets.includes(product.target)
                            );
                        } else {
                            const categoryMap = {
                                'thuc-an': 'Thức ăn',
                                'phu-kien': 'Phụ kiện',
                                've-sinh': 'Vệ sinh & Làm đẹp',
                                'do-choi': 'Đồ chơi'
                            };
                            
                            const categoryName = categoryMap[category];
                            if (categoryName) {
                                filteredProducts = transformedProducts.filter(product => 
                                    product.category === categoryName
                                );
                            }
                        }
                    }
                    
                    setProducts(filteredProducts);
                    setFilteredProducts(filteredProducts);

                    const tags = new Set();
                    filteredProducts.forEach(product => {
                        if (product.tags && Array.isArray(product.tags)) {
                            product.tags.forEach(tag => {
                                if (tag && tag.trim()) {
                                    tags.add(tag.trim());
                                }
                            });
                        }
                    });
                    setAllTags([...tags]);
                } else {
                    setProducts([]);
                    setFilteredProducts([]);
                }
            } catch (error) {
                setProducts([]);
                setFilteredProducts([]);
            } finally {
                setLoading(false);
            }
        };
        
        loadProducts();
    }, [category, sortParam, tagParam, isPetCategoryPage]);

    useEffect(() => {
        let filtered = [...products];

        if (searchTerm) {
            filtered = filtered.filter(product =>
                product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                product.brand?.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        if (selectedCategories.length > 0) {
            filtered = filtered.filter(product => 
                selectedCategories.includes(product.category)
            );
        }

        const min = minPrice ? parseInt(minPrice) : 0;
        const max = maxPrice ? parseInt(maxPrice) : Infinity;
        filtered = filtered.filter(product =>
            product.price >= min && product.price <= max
        );

        if (selectedBrands.length > 0) {
            filtered = filtered.filter(product => 
                selectedBrands.includes(product.brand)
            );
        }
        
        if (selectedTags.length > 0) {
            filtered = filtered.filter(product => 
                product.tags && product.tags.some(tag => selectedTags.includes(tag))
            );
        }

        filtered.sort((a, b) => {
            let aValue = a[sortBy];
            let bValue = b[sortBy];
            
            if (sortBy === 'price' || sortBy === 'salesCount') {
                return sortOrder === 'asc' ? aValue - bValue : bValue - aValue;
            }
            
            if (sortBy === 'createdAt')
            if (sortBy === 'createdAt') {
                const dateA = new Date(aValue);
                const dateB = new Date(bValue);
                return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
            }
            
            if (sortOrder === 'asc') {
                return aValue > bValue ? 1 : -1;
            } else {
                return aValue < bValue ? 1 : -1;
            }
        });

        setFilteredProducts(filtered);
        setCurrentPage(1);
        if (isPetCategoryPage) {
            setVisibleProductsCount(CATEGORY_BATCH_SIZE);
        }
    }, [products, searchTerm, selectedCategories, minPrice, maxPrice, selectedBrands, selectedTags, sortBy, sortOrder, category, isPetCategoryPage]);

    const indexOfLastProduct = currentPage * productsPerPage;
    const indexOfFirstProduct = indexOfLastProduct - productsPerPage;
    const currentProducts = filteredProducts.slice(indexOfFirstProduct, indexOfLastProduct);
    const totalPages = Math.ceil(filteredProducts.length / productsPerPage);

    // Get unique brands (filter out null/undefined)
    let brands = [...new Set(products.map(product => product.brand).filter(Boolean))];
    
    // For cho/meo pages, filter brands by category
    if (isPetCategoryPage) {
        const validBrands = new Set([
            ...(brandOptions.cho || []),
            ...(brandOptions.meo || []),
            ...(brandOptions['ca-cho-va-meo'] || [])
        ]);
        brands = brands.filter(brand => validBrands.has(brand));
    }
    
    const hasMoreBrands = brands.length > BRAND_PREVIEW_LIMIT;
    const visibleBrands = showAllBrands || !hasMoreBrands
        ? brands
        : brands.slice(0, BRAND_PREVIEW_LIMIT);

    const hasMoreTags = allTags.length > TAG_PREVIEW_LIMIT;
    const visibleTags = showAllTags || !hasMoreTags
        ? allTags
        : allTags.slice(0, TAG_PREVIEW_LIMIT);

    const handlePageChange = (event, value) => {
        setCurrentPage(value);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleLoadMore = () => {
        setVisibleProductsCount(prev => Math.min(prev + CATEGORY_BATCH_SIZE, filteredProducts.length));
    };

    const resetFilters = () => {
        setSearchTerm('');
        setSelectedCategories([]);
        setMinPrice('');
        setMaxPrice('');
        setSelectedBrands([]);
        setSelectedTags([]);
        setSortBy('updatedAt');
        setSortOrder('desc');
        setShowAllBrands(false);
        setShowAllTags(false);
    };
    
    const toggleCategory = (categoryName) => {
        setSelectedCategories(prev => 
            prev.includes(categoryName) 
                ? prev.filter(c => c !== categoryName)
                : [...prev, categoryName]
        );
    };
    
    const toggleBrand = (brand) => {
        setSelectedBrands(prev => 
            prev.includes(brand) 
                ? prev.filter(b => b !== brand)
                : [...prev, brand]
        );
    };
    
    const toggleTag = (tag) => {
        setSelectedTags(prev => 
            prev.includes(tag) 
                ? prev.filter(t => t !== tag)
                : [...prev, tag]
        );
    };
    
    const applyPriceFilter = () => {
        setCurrentPage(1);
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500 mx-auto mb-4"></div>
                    <p className="text-gray-600">Đang tải sản phẩm...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white shadow-sm">
                <div className="container py-6">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div>
                            <h1 className="text-2xl md:text-3xl font-bold text-gray-800">
                                {getPageTitle()}
                            </h1>
                            <p className="text-gray-600 mt-1"></p>
                        </div>
                        
                        {/* View Mode Toggle */}
                        <div className="flex items-center gap-2">
                            <Button
                                variant={viewMode === 'grid' ? 'contained' : 'outlined'}
                                onClick={() => setViewMode('grid')}
                                className="!min-w-[40px] !w-[40px] !h-[40px]"
                            >
                                <FaTh />
                            </Button>
                            <Button
                                variant={viewMode === 'list' ? 'contained' : 'outlined'}
                                onClick={() => setViewMode('list')}
                                className="!min-w-[40px] !w-[40px] !h-[40px]"
                            >
                                <FaList />
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="container py-6">
                <div className="flex flex-col lg:flex-row gap-6">
                    {/* Sidebar Filters */}
                    <div className="lg:w-1/4">
                        <div className="bg-white rounded-lg shadow-sm p-4 sticky top-4">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-semibold flex items-center gap-2">
                                    <FaFilter className="text-red-500" />
                                    Bộ lọc
                                </h3>
                                <Button 
                                    size="small" 
                                    onClick={resetFilters}
                                    className="!text-red-500"
                                >
                                    Đặt lại
                                </Button>
                            </div>

                            {/* Category Filter - Checkbox List */}
                            <div className="mb-6">
                                <h4 className="text-sm font-semibold mb-3">Theo Danh Mục</h4>
                                <div className="space-y-2 max-h-48 overflow-y-auto">
                                    {categories.map(cat => (
                                        <label key={cat._id} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-1 rounded">
                                            <input
                                                type="checkbox"
                                                checked={selectedCategories.includes(cat.name)}
                                                onChange={() => toggleCategory(cat.name)}
                                                className="w-4 h-4 text-red-500 border-gray-300 rounded focus:ring-red-500"
                                            />
                                            <span className="text-sm text-gray-700">{cat.name}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            {/* Brand Filter - Checkbox List */}
                            <div className="mb-6">
                                <h4 className="text-sm font-semibold mb-3">Thương Hiệu</h4>
                                <div className="space-y-2">
                                    {visibleBrands.map(brand => (
                                        <label key={brand} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-1 rounded">
                                            <input
                                                type="checkbox"
                                                checked={selectedBrands.includes(brand)}
                                                onChange={() => toggleBrand(brand)}
                                                className="w-4 h-4 text-red-500 border-gray-300 rounded focus:ring-red-500"
                                            />
                                            <span className="text-sm text-gray-700">{brand}</span>
                                        </label>
                                    ))}
                                </div>
                                {hasMoreBrands && (
                                    <button
                                        onClick={() => setShowAllBrands(prev => !prev)}
                                        className="mt-3 text-sm font-medium text-red-500 hover:text-red-600"
                                    >
                                        {showAllBrands ? 'Thu gọn' : 'Thêm'}
                                    </button>
                                )}
                            </div>

                            {/* Tags Filter - Hashtag Pills */}
                            {allTags.length > 0 && (
                                <div className="mb-6">
                                    <h4 className="text-sm font-semibold mb-3">Filter By Tag</h4>
                                    <div className="flex flex-wrap gap-2">
                                        {visibleTags.map(tag => (
                                            <button
                                                key={tag}
                                                onClick={() => toggleTag(tag)}
                                                className={`px-2 py-1 text-xs rounded border transition ${
                                                    selectedTags.includes(tag)
                                                        ? 'bg-gray-800 text-white border-gray-800'
                                                        : 'bg-white text-gray-600 border-gray-300 hover:border-gray-800'
                                                }`}
                                            >
                                                #{tag}
                                            </button>
                                        ))}
                                    </div>
                                    {hasMoreTags && (
                                        <button
                                            onClick={() => setShowAllTags(prev => !prev)}
                                            className="mt-3 text-sm font-medium text-red-500 hover:text-red-600"
                                        >
                                            {showAllTags ? 'Thu gọn' : 'Xem thêm'}
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Products Grid/List */}
                    <div className="lg:w-3/4">
                        {(category === 'cho' || category === 'meo') && (
                            <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
                                <div className="flex items-center gap-2 flex-wrap">
                                    <span className="text-sm font-medium text-gray-700">Sắp xếp theo</span>
                                    <div className="flex gap-2 flex-wrap">
                                        <button
                                            onClick={() => {
                                                setSortBy('updatedAt');
                                                setSortOrder('desc');
                                            }}
                                            className={`px-4 py-2 text-sm rounded transition-all ${
                                                sortBy === 'updatedAt' && sortOrder === 'desc'
                                                    ? 'bg-[#ff5252] text-white'
                                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                            }`}
                                        >
                                            Mới nhất
                                        </button>
                                        <button
                                            onClick={() => {
                                                setSortBy('salesCount');
                                                setSortOrder('desc');
                                            }}
                                            className={`px-4 py-2 text-sm rounded transition-all ${
                                                sortBy === 'salesCount' && sortOrder === 'desc'
                                                    ? 'bg-[#ff5252] text-white'
                                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                            }`}
                                        >
                                            Bán chạy nhất
                                        </button>
                                        
                                        {/* Price dropdown */}
                                        <div className="relative">
                                            <select
                                                value={sortBy === 'price' ? sortOrder : ''}
                                                onChange={(e) => {
                                                    if (e.target.value) {
                                                        setSortBy('price');
                                                        setSortOrder(e.target.value);
                                                    }
                                                }}
                                                className={`px-4 py-2 text-sm rounded transition-all appearance-none cursor-pointer pr-8 bg-gray-100 hover:bg-gray-200 ${
                                                    sortBy === 'price'
                                                        ? 'text-[#ff5252] font-medium'
                                                        : 'text-gray-700'
                                                }`}
                                            >
                                                <option value="" disabled>Giá</option>
                                                <option value="asc" className="bg-white text-gray-700">Giá: Thấp đến Cao</option>
                                                <option value="desc" className="bg-white text-gray-700">Giá: Cao đến Thấp</option>
                                            </select>
                                            <svg 
                                                className={`absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 pointer-events-none ${
                                                    sortBy === 'price' ? 'text-[#ff5252]' : 'text-gray-700'
                                                }`}
                                                fill="none" 
                                                stroke="currentColor" 
                                                viewBox="0 0 24 24"
                                            >
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                            </svg>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                        
                        {currentProducts.length === 0 ? (
                            <div className="bg-white rounded-lg shadow-sm p-8 text-center">
                                <p className="text-gray-500 text-lg">Không tìm thấy sản phẩm nào</p>
                                <Button 
                                    onClick={resetFilters}
                                    className="!mt-4 !bg-red-500 !text-white"
                                >
                                    Đặt lại bộ lọc
                                </Button>
                            </div>
                        ) : (
                            <>
                                {/* Products */}
                                <div className={`grid gap-4 ${
                                    viewMode === 'grid' 
                                        ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' 
                                        : 'grid-cols-1'
                                }`}>
                                    {currentProducts.map(product => (
                                        <ProductCard 
                                            key={product.id} 
                                            product={product}
                                            viewMode={viewMode}
                                        />
                                    ))}
                                </div>

                                {/* Pagination */}
                                {totalPages > 1 && (
                                    <div className="flex justify-center mt-8">
                                        <Pagination
                                            count={totalPages}
                                            page={currentPage}
                                            onChange={handlePageChange}
                                            color="primary"
                                            size="large"
                                            showFirstButton
                                            showLastButton
                                        />
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProductList;
