import { useState, useEffect } from 'react';
import { Users as UsersIcon, Search, Filter, MoreHorizontal, Mail, Calendar, Eye, Edit, Trash2, Ban } from 'lucide-react';
import { useAuth } from '../components/AuthContext';
import { apiUrl } from '../utils/api';

interface User {
  id: string;
  email: string;
  username: string;
  role?: string;
  createdAt: string;
  joinDate?: string;
  lastLogin: string;
  status?: 'active' | 'inactive' | 'banned';
}

export default function Users() {
  const { token } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // First, try to login as admin if we don't have a token
      let adminToken = token;
      if (!adminToken) {
        try {
          const loginResponse = await fetch(apiUrl('/api/users/login'), {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              email: 'realpricetracker94@gmail.com',
              password: 'admin123' // You'll need to update this with the correct password
            }),
          });
          
          if (loginResponse.ok) {
            const loginData = await loginResponse.json();
            if (loginData.success && loginData.data?.token) {
              adminToken = loginData.data.token;
              console.log('Admin login successful');
            }
          }
        } catch (error) {
          console.warn('Admin login failed:', error);
        }
      }

      if (!adminToken) {
        throw new Error('No admin token available');
      }

      const response = await fetch(apiUrl('/api/users'), {
        headers: {
          'Authorization': `Bearer ${adminToken}`
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch users: ${response.status}`);
      }

      const data = await response.json();
      console.log('Users data:', data);

      if (data.success && data.users) {
        // Transform the data to match our interface
        const transformedUsers = data.users.map((user: any) => ({
          id: user.id,
          email: user.email,
          username: user.username,
          role: user.role || 'user',
          createdAt: user.createdAt,
          lastLogin: user.lastLogin,
          status: user.role === 'banned' ? 'banned' : 'active'
        }));
        setUsers(transformedUsers);
      } else {
        throw new Error('Invalid response format');
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch users');
      // Fallback to mock data for now
      const mockUsers: User[] = [
        {
          id: '1',
          email: 'admin@example.com',
          username: 'admin',
          role: 'admin',
          createdAt: '2024-01-15',
          lastLogin: '2024-01-20',
          status: 'active'
        }
      ];
      setUsers(mockUsers);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [token]);

  const filteredUsers = users.filter(user =>
    user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'inactive':
        return 'bg-gray-100 text-gray-800';
      case 'banned':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleActionClick = (action: string, userId: string) => {
    console.log(`${action} clicked for user ${userId}`);
    setOpenDropdown(null);
  };

  const toggleDropdown = (userId: string) => {
    setOpenDropdown(openDropdown === userId ? null : userId);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (openDropdown && !(event.target as Element).closest('.dropdown-container')) {
        setOpenDropdown(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [openDropdown]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Users</h1>
          <p className="text-gray-600">Manage user accounts and permissions</p>
        </div>
        <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors">
          Add User
        </button>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error loading users</h3>
              <div className="mt-2 text-sm text-red-700">{error}</div>
            </div>
          </div>
        </div>
      )}

      {/* Search and Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-colors"
          />
        </div>
        <button className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
          <Filter className="w-4 h-4" />
          Filter
        </button>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Join Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center mr-3">
                        <span className="text-blue-600 font-semibold text-sm">
                          {user.username.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900">{user.username}</div>
                        <div className="text-sm text-gray-500">ID: {user.id}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-sm text-gray-900">
                        <Mail className="w-4 h-4 text-gray-400" />
                        {user.email}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                          {user.role || 'user'}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(user.status || 'active')}`}>
                      {user.status || 'active'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      {new Date(user.createdAt).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium relative dropdown-container">
                    <button 
                      onClick={() => toggleDropdown(user.id)}
                      className="text-gray-400 hover:text-gray-600 p-1 rounded"
                    >
                      <MoreHorizontal className="w-4 h-4" />
                    </button>
                    
                    {openDropdown === user.id && (
                      <div className="absolute right-0 mt-2 w-48 bg-white border-0 shadow-lg rounded-lg z-10">
                        <div className="py-1">
                          <button
                            onClick={() => handleActionClick('view', user.id)}
                            className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-[#ECEEF2] focus:bg-[#ECEEF2] transition-colors"
                          >
                            <Eye className="w-4 h-4" />
                            View Details
                          </button>
                          <button
                            onClick={() => handleActionClick('edit', user.id)}
                            className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-[#ECEEF2] focus:bg-[#ECEEF2] transition-colors"
                          >
                            <Edit className="w-4 h-4" />
                            Edit User
                          </button>
                          <button
                            onClick={() => handleActionClick('ban', user.id)}
                            className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-[#ECEEF2] focus:bg-[#ECEEF2] transition-colors"
                          >
                            <Ban className="w-4 h-4" />
                            Ban User
                          </button>
                          <button
                            onClick={() => handleActionClick('delete', user.id)}
                            className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-[#ECEEF2] focus:bg-[#ECEEF2] transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                            Delete User
                          </button>
                        </div>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Users</p>
              <p className="text-2xl font-bold text-gray-900">{users.length}</p>
            </div>
            <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
              <UsersIcon className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Users</p>
              <p className="text-2xl font-bold text-gray-900">{users.filter(u => u.status === 'active').length}</p>
            </div>
            <div className="w-12 h-12 bg-green-50 rounded-lg flex items-center justify-center">
              <UsersIcon className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">New This Month</p>
              <p className="text-2xl font-bold text-gray-900">{users.filter(u => new Date(u.createdAt || u.joinDate || '').getMonth() === new Date().getMonth()).length}</p>
            </div>
            <div className="w-12 h-12 bg-purple-50 rounded-lg flex items-center justify-center">
              <UsersIcon className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 