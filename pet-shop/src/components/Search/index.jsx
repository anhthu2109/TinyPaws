import "./style.css";
import { Button } from "@mui/material";
import { FaSearch } from "react-icons/fa";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

export const Search = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const navigate = useNavigate();

    const handleSearch = (e) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            handleSearch(e);
        }
    };

    return (
        <div className='searchBox w-full h-[40px] bg-[#ececec] relative'>
            <input 
                type='text' 
                placeholder='Tìm kiếm sản phẩm...'
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={handleKeyPress}
                className='w-full h-[40px] focus:outline-none bg-inherit p-2 pr-12 text-[13px] rounded-lg'
            />
            <Button 
                onClick={handleSearch}
                className="!absolute top-[5px] right-[5px] z-10 !w-[35px] !min-w-[35px] h-[30px]
                !rounded-full !text-black hover:!bg-gray-300 transition"
            >
                <FaSearch className="text-[#4e4e4e] text-[16px]"/>
            </Button>
        </div>
    )
}

export default Search;