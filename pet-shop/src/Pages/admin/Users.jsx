import { useState, useEffect } from 'react';
import { FaSearch, FaEye, FaTrash } from 'react-icons/fa';
import axios from 'axios';
import { CONFIG } from '../../constants/config';

// API Base URL
const API_URL = `${CONFIG.API.BASE_URL}/api`;

const Users = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [userToDelete, setUserToDelete] = useState(null);
    const [isDeletingUser, setIsDeletingUser] = useState(false);

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            setLoading(true);

            // Get token from localStorage
            const token = localStorage.getItem('token');

            if (!token) {
                setUsers([]);
                setLoading(false);
                return;
            }

            // Try to fetch from API with auth token
            try {
                const response = await axios.get(`${API_URL}/users`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });


                // Handle response structure: { success: true, data: { users: [...], pagination: {...} } }
                if (response.data.success && response.data.data) {
                    const usersData = response.data.data.users || response.data.data;
                    if (Array.isArray(usersData)) {
                        setUsers(usersData);
                    } else {
                        setUsers([]);
                    }
                } else {
                    setUsers([]);
                }
            } catch (apiError) {

                if (apiError.response?.status === 401) {
                    localStorage.removeItem('token');
                    window.location.href = '/dang-nhap';
                } else {
                }
                setUsers([]);
            }
        } catch (error) {
            setUsers([]);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteUser = (user) => {
        setUserToDelete(user);
    };

    const closeDeleteModal = () => {
        if (!isDeletingUser) {
            setUserToDelete(null);
        }
    };

    const confirmDeleteUser = async () => {
        if (!userToDelete) return;

        try {
            setIsDeletingUser(true);
            const token = localStorage.getItem('token');
            await axios.delete(`${API_URL}/users/${userToDelete._id}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            await fetchUsers();
            setUserToDelete(null);
        } catch (error) {
        } finally {
            setIsDeletingUser(false);
        }
    };

    const filteredUsers = users.filter(user => {
        const searchLower = searchTerm.toLowerCase();
        return (
            user.email?.toLowerCase().includes(searchLower) ||
            user.full_name?.toLowerCase().includes(searchLower)
        );
    });

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h2 className="text-2xl font-bold text-gray-800">Users</h2>
            </div>

            {/* Search Box */}
            <div className="bg-white rounded-lg shadow-sm p-4">
                <div className="relative">
                    <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Tìm kiếm người dùng"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    />
                </div>
            </div>

            {/* Users Table */}
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">

                {loading ? (
                    <div className="flex items-center justify-center py-12">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                        <span className="ml-2 text-gray-600">Loading...</span>
                    </div>
                ) : filteredUsers.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                        Không tìm thấy người dùng nào
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 border-b border-gray-200">
                                <tr>
                                    <th className="px-6 py-3 text-left text-sm font-medium text-gray-600">Id</th>
                                    <th className="px-6 py-3 text-left text-sm font-medium text-gray-600">Email</th>
                                    <th className="px-6 py-3 text-left text-sm font-medium text-gray-600">First Name</th>
                                    <th className="px-6 py-3 text-left text-sm font-medium text-gray-600">Last Name</th>
                                    <th className="px-6 py-3 text-left text-sm font-medium text-gray-600">City</th>
                                    <th className="px-6 py-3 text-left text-sm font-medium text-gray-600">Role</th>
                                    <th className="px-6 py-3 text-left text-sm font-medium text-gray-600">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {filteredUsers.map((user, index) => {
                                    const nameParts = user.full_name?.split(' ') || ['', ''];
                                    const firstName = nameParts[0] || '';
                                    const lastName = nameParts.slice(1).join(' ') || '';

                                    return (
                                        <tr key={user._id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 text-sm text-gray-900">{index + 1}</td>
                                            <td className="px-6 py-4 text-sm text-gray-900">{user.email}</td>
                                            <td className="px-6 py-4 text-sm text-gray-900">{firstName}</td>
                                            <td className="px-6 py-4 text-sm text-gray-900">{lastName}</td>
                                            <td className="px-6 py-4 text-sm text-gray-900">{user.city || '-'}</td>
                                            <td className="px-6 py-4 text-sm">
                                                <span className={`px-2 py-1 rounded text-xs font-medium ${user.role === 'admin'
                                                    ? 'bg-purple-100 text-purple-800'
                                                    : 'bg-blue-100 text-blue-800'
                                                    }`}>
                                                    {user.role || 'user'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-sm">
                                                <div className="flex items-center space-x-2">
                                                    <button
                                                        onClick={() => handleDeleteUser(user)}
                                                        className="text-red-600 hover:text-red-800 p-1"
                                                        title="Delete"
                                                    >
                                                        <FaTrash size={16} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {userToDelete && (
                <div className="fixed inset-0 z-[100000] flex items-center justify-center bg-black/50 px-4">
                    <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
                        <h3 className="text-lg font-semibold text-center text-gray-900">Xác nhận xóa người dùng</h3>
                        <p className="mt-3 text-sm text-gray-600">
                            Bạn có chắc chắn muốn xóa
                            <span className="font-semibold text-gray-900"> "{userToDelete.full_name || userToDelete.email}"</span>? Hành động này không thể hoàn tác.
                        </p>
                        <div className="mt-6 flex items-center justify-between gap-3">
                            <button
                                type="button"
                                onClick={closeDeleteModal}
                                disabled={isDeletingUser}
                                className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-70"
                            >
                                Hủy bỏ
                            </button>
                            <button
                                type="button"
                                onClick={confirmDeleteUser}
                                disabled={isDeletingUser}
                                className="rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-70"
                            >
                                {isDeletingUser ? 'Đang xóa...' : 'Xóa'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Users;
