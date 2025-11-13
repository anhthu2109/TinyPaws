import { Button } from '@mui/material';
import { FaGift } from "react-icons/fa6";
import { Link, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import axios from 'axios';
import { CONFIG } from '../../../constants/config';

import './style.css';

const Navigation = () => {
    const location = useLocation();
    const [hoveredTarget, setHoveredTarget] = useState(null);
    const [categories, setCategories] = useState([]);

    // Ẩn Navigation ở trang admin
    const isAdminPage = location.pathname.startsWith('/admin');

    // Fetch categories
    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const res = await axios.get(`${CONFIG.API.BASE_URL}/api/categories`);
                if (res.data.success) {
                    setCategories(res.data.data);
                } else {
                    setCategories(res.data);
                }
            } catch (error) {
                console.error("❌ Fetch categories error:", error);
            }
        };
        fetchCategories();
    }, []);

    // Group subcategories by target
    const getSubcategoriesByTarget = (target) => {
        const result = [];
        categories.forEach(cat => {
            if (cat.subcategories && cat.subcategories.length > 0) {
                const filtered = cat.subcategories.filter(sub => 
                    sub.target === target || sub.target === 'both'
                );
                if (filtered.length > 0) {
                    result.push({
                        categoryName: cat.name,
                        subcategories: filtered
                    });
                }
            }
        });
        return result;
    };

    const dogCategories = getSubcategoriesByTarget('dog');
    const catCategories = getSubcategoriesByTarget('cat');

    // Không render Navigation nếu đang ở trang admin
    if (isAdminPage) {
        return null;
    }

    return (
        <>
            {/* Inline Navigation - No container wrapper */}
            <nav className='relative'>
                <ul className="flex items-center gap-1 nav justify-center">
                            <li className="list-none">
                                <Link to="/" className='link transition'>
                                    <Button className='link transition !font-[500] !text-[rgba(0,0,0,0.8)] hover:!text-[#ff5252] hover:!bg-[#ff5252]/5'>Trang chủ</Button>
                                </Link>
                            </li>

                            {/* Chó - with Mega Dropdown */}
                            <li
                              className="list-none relative group"
                              onMouseEnter={() => setHoveredTarget('dog')}
                              onMouseLeave={() => setHoveredTarget(null)}
                            >
                              <Link to="/products/category/cho" className="link transition">
                                <Button className="link transition !font-[500] !text-[rgba(0,0,0,0.8)] hover:!text-[#ff5252] hover:!bg-[#ff5252]/5">
                                  Chó
                                </Button>
                              </Link>

                              {/* {hoveredTarget === 'dog' && dogCategories.length > 0 && (
                                <>
                                  <div className="absolute left-0 right-0 top-full h-[50px]" />
                                  <div
                                    className="
                                      absolute left-1/2 -translate-x-1/2 top-[60px]
                                      w-[1000px] bg-white shadow-2xl border border-gray-100
                                      rounded-2xl p-8 grid grid-cols-4 gap-6 z-[9999]
                                      transition-all duration-300
                                    "
                                  >
                                    {dogCategories.map((cat, idx) => (
                                      <div key={idx}>
                                        <h4 className="font-semibold text-gray-800 text-[15px] mb-4 pb-2 border-b border-blue-100">
                                          {cat.categoryName}
                                        </h4>
                                        <ul className="space-y-2.5">
                                          {cat.subcategories.map((sub, subIdx) => (
                                            <li key={subIdx}>
                                              <Link
                                                to={`/products?category=${encodeURIComponent(sub.name)}&target=dog`}
                                                className="text-gray-600 text-[13px] hover:text-blue-600 hover:translate-x-1 transition-all duration-200 block py-1.5 px-2 rounded-md hover:bg-blue-50"
                                              >
                                                {sub.name}
                                              </Link>
                                            </li>
                                          ))}
                                        </ul>
                                      </div>
                                    ))}
                                  </div>
                                </>
                              )} */}
                            </li>

                            <li
                              className="list-none relative group"
                              onMouseEnter={() => setHoveredTarget('cat')}
                              onMouseLeave={() => setHoveredTarget(null)}
                            >
                              <Link to="/products/category/meo" className="link transition">
                                <Button className="link transition !font-[500] !text-[rgba(0,0,0,0.8)] hover:!text-[#ff5252] hover:!bg-[#ff5252]/5">
                                  Mèo
                                </Button>
                              </Link>

                              {/* {hoveredTarget === 'cat' && catCategories.length > 0 && (
                                <>
                                  <div className="absolute left-0 right-0 top-full h-[50px]" />
                                  <div
                                    className="
                                      absolute left-1/2 -translate-x-1/2 top-[60px]
                                      w-[1000px] bg-white shadow-2xl border border-gray-100
                                      rounded-2xl p-8 grid grid-cols-4 gap-6 z-[9999]
                                      transition-all duration-300
                                    "
                                  >
                                    {catCategories.map((cat, idx) => (
                                      <div key={idx}>
                                        <h4 className="font-semibold text-gray-800 text-[15px] mb-4 pb-2 border-b border-pink-100">
                                          {cat.categoryName}
                                        </h4>
                                        <ul className="space-y-2.5">
                                          {cat.subcategories.map((sub, subIdx) => (
                                            <li key={subIdx}>
                                              <Link
                                                to={`/products?category=${encodeURIComponent(sub.name)}&target=cat`}
                                                className="text-gray-600 text-[13px] hover:text-pink-600 hover:translate-x-1 transition-all duration-200 block py-1.5 px-2 rounded-md hover:bg-pink-50"
                                              >
                                                {sub.name}
                                              </Link>
                                            </li>
                                          ))}
                                        </ul>
                                      </div>
                                    ))}
                                  </div>
                                </>
                              )} */}
                            </li>
                            <li className="list-none">
                                <Link to="/blog" className='link transition'>
                                    <Button className='link transition !font-[500] !text-[rgba(0,0,0,0.8)] hover:!text-[#ff5252] hover:!bg-[#ff5252]/5'>Blog</Button>
                                </Link>
                            </li>
                            {/* <li className="list-none">
                                <Link to="/uu-dai" className='link transition'>
                                    <Button className='link transition !font-[500] !text-[rgba(0,0,0,0.8)] hover:!text-[#ff5252] hover:!bg-[#ff5252]/5'>
                                        Ưu đãi
                                    </Button>
                                </Link>
                            </li> */}
                            <li className="list-none">
                                <Link to="/lien-he" className='link transition'>
                                    <Button className='link transition !font-[500] !text-[rgba(0,0,0,0.8)] hover:!text-[#ff5252] hover:!bg-[#ff5252]/5'>Liên hệ</Button>
                                </Link>
                            </li>
                        </ul>
            </nav>
        </>
    )
}

export default Navigation;
