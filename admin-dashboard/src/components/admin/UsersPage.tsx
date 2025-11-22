import { useState, useEffect } from "react";
import { Search, Filter, UserPlus, Ban, Shield, User, MoreHorizontal } from "lucide-react";
import { useAuth } from "../AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "../ui/dropdown-menu";
import { Avatar, AvatarFallback } from "../ui/avatar";

interface User {
  id: string;
  name?: string;
  email: string;
  role: string;
  trackedProducts?: number;
  createdAt: string;
  status: string;
  lastActive?: string;
}

export function UsersPage() {
  const { token } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [_loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showUserDetails, setShowUserDetails] = useState(false);
  const [showEditUser, setShowEditUser] = useState(false);
  const [showAddUser, setShowAddUser] = useState(false);

  useEffect(() => {
    if (token) {
      fetchUsers();
    }
  }, [token]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/users', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }

      const data = await response.json();
      const usersData = data.users || data.data || [];

      // Transform user data to match our interface
      // Get products data to count tracked products per user
      const productsResponse = await fetch('/api/products/all', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      const productsData = await productsResponse.json();
      const products = productsData.data || [];

      // Count products per user
      const userProductCounts: { [key: string]: number } = {};
      products.forEach((product: any) => {
        const userId = product.userId || product.user;
        if (userId) {
          userProductCounts[userId] = (userProductCounts[userId] || 0) + 1;
        }
      });

      const transformedUsers: User[] = usersData.map((user: any) => ({
        id: user.id || user._id,
        name: user.name || user.email.split('@')[0],
        email: user.email,
        role: user.role || 'user',
        trackedProducts: userProductCounts[user.id || user._id] || 0,
        createdAt: user.createdAt || new Date().toISOString(),
        status: user.role === 'banned' ? 'banned' : (user.status || 'active'),
        lastActive: user.lastActive || 'Recently'
      }));

      setUsers(transformedUsers);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBanUser = async (userId: string) => {
    try {
      const user = users.find(u => u.id === userId);
      if (!user) return;

      const endpoint = user.status === 'banned' ? 'unban' : 'ban';
      const response = await fetch(`/api/users/${userId}/${endpoint}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update user status');
      }

      // Update local state - sync with backend role
      setUsers(users.map(user => 
        user.id === userId 
          ? { 
              ...user, 
              status: user.status === 'banned' ? 'active' : 'banned',
              role: user.status === 'banned' ? 'user' : 'banned'
            }
          : user
      ));
      
      // Show success message
      const action = user.status === 'banned' ? 'unbanned' : 'banned';
      const userEmail = user.email;
      alert(`User ${userEmail} has been ${action} successfully!`);
    } catch (error) {
      console.error('Error updating user status:', error);
      alert(error instanceof Error ? error.message : 'Failed to update user status');
    }
  };

  const handleDeleteUser = async (userId: string) => {
    try {
      const response = await fetch(`/api/users/${userId}/delete`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete user');
      }

      // Update local state
      setUsers(users.filter(user => user.id !== userId));
      
      // Show success message
      const userEmail = users.find(u => u.id === userId)?.email || 'User';
      alert(`User ${userEmail} has been deleted successfully!`);
    } catch (error) {
      console.error('Error deleting user:', error);
      alert(error instanceof Error ? error.message : 'Failed to delete user');
    }
  };

  const handleViewDetails = (user: User) => {
    setSelectedUser(user);
    setShowUserDetails(true);
  };

  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    setShowEditUser(true);
  };

  const handleUpdateUser = async (updatedUser: User) => {
    try {
      const response = await fetch(`/api/users/${updatedUser.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updatedUser)
      });

      if (!response.ok) {
        throw new Error('Failed to update user');
      }

      // Update local state
      setUsers(users.map(user => 
        user.id === updatedUser.id ? updatedUser : user
      ));
      setShowEditUser(false);
      setSelectedUser(null);
    } catch (error) {
      console.error('Error updating user:', error);
    }
  };

  const handleAddUser = async (userData: { email: string; password: string; name?: string; role: string }) => {
    try {
      const response = await fetch('/api/users/signup', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(userData)
      });

      if (!response.ok) {
        throw new Error('Failed to create user');
      }

      const data = await response.json();
      
      // Add new user to local state
      const newUser: User = {
        id: data.data.user.id,
        name: userData.name || userData.email.split('@')[0],
        email: userData.email,
        role: userData.role,
        trackedProducts: 0,
        createdAt: new Date().toISOString(),
        status: 'active',
        lastActive: 'Recently'
      };

      setUsers([...users, newUser]);
      setShowAddUser(false);
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = (user.name?.toLowerCase().includes(searchTerm.toLowerCase()) || false) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === "all" || user.role === roleFilter;
    const matchesStatus = statusFilter === "all" || user.status === statusFilter;
    
    return matchesSearch && matchesRole && matchesStatus;
  });

  const getInitials = (name: string | undefined) => {
    if (!name) return '??';
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-[#DBFCE7] text-[#016630]';
      case 'inactive': return 'bg-[#FEF9C2] text-[#C5A464]';
      case 'banned': return 'bg-[#FFE2E2] text-[#9F0712]';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">User Management</h2>
          <p style={{ color: '#717182' }}>Manage users, roles, and permissions</p>
        </div>
        <Button 
          className="flex items-center gap-2 bg-black hover:bg-black/90 text-white"
          onClick={() => setShowAddUser(true)}
        >
          <UserPlus size={16} />
          Add User
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 [&_*]:border-[#E5E5E5]">
        <Card className="border-[#E5E5E5]">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium" style={{ color: '#717182' }}>Total Users</p>
                <p className="text-2xl font-bold">{users.length}</p>
              </div>
              <User className="w-8 h-8" style={{ color: '#717182' }} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium" style={{ color: '#717182' }}>Active Users</p>
                <p className="text-2xl font-bold text-green-600">
                  {users.filter(u => u.status === 'active').length}
                </p>
              </div>
              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                <User className="w-4 h-4 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium" style={{ color: '#717182' }}>Admins</p>
                <p className="text-2xl font-bold text-blue-600">
                  {users.filter(u => u.role === 'admin').length}
                </p>
              </div>
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <Shield className="w-4 h-4 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium" style={{ color: '#717182' }}>Banned Users</p>
                <p className="text-2xl font-bold text-red-600">
                  {users.filter(u => u.status === 'banned').length}
                </p>
              </div>
              <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                <Ban className="w-4 h-4 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="border-[#E5E5E5]">
        <CardHeader>
          <CardTitle>Users</CardTitle>
        </CardHeader>
        <CardContent className="[&_*]:border-[#E5E5E5]">
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={16} />
              <Input
                placeholder="Search users by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 placeholder:text-[#717182] border-[#E5E5E5]"
                style={{ backgroundColor: '#F3F3F5' }}
              />
            </div>
            
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-full sm:w-48" style={{ backgroundColor: '#F3F3F5' }}>
                <Filter size={16} className="mr-2" />
                <SelectValue placeholder="Filter by role" />
              </SelectTrigger>
              <SelectContent className="bg-white border-0 shadow-lg rounded-lg">
                <SelectItem value="all" className="hover:bg-[#ECEEF2] focus:bg-[#ECEEF2]">All Roles</SelectItem>
                <SelectItem value="admin" className="hover:bg-[#ECEEF2] focus:bg-[#ECEEF2]">Admin</SelectItem>
                <SelectItem value="user" className="hover:bg-[#ECEEF2] focus:bg-[#ECEEF2]">User</SelectItem>
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-48" style={{ backgroundColor: '#F3F3F5' }}>
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent className="bg-white border-0 shadow-lg rounded-lg">
                <SelectItem value="all" className="hover:bg-[#ECEEF2] focus:bg-[#ECEEF2]">All Status</SelectItem>
                <SelectItem value="active" className="hover:bg-[#ECEEF2] focus:bg-[#ECEEF2]">Active</SelectItem>
                <SelectItem value="inactive" className="hover:bg-[#ECEEF2] focus:bg-[#ECEEF2]">Inactive</SelectItem>
                <SelectItem value="banned" className="hover:bg-[#ECEEF2] focus:bg-[#ECEEF2]">Banned</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Users Table */}
          <div className="rounded-lg [&_*]:border-[#E5E5E5]">
            <Table className="border" style={{ borderColor: '#E5E5E5' }}>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Products Tracked</TableHead>
                  <TableHead>Join Date</TableHead>
                  <TableHead>Last Active</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="w-8 h-8">
                          <AvatarFallback className="text-xs">
                            {getInitials(user.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{user.name}</p>
                          <p className="text-sm text-muted-foreground">{user.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        className={user.role === 'admin' ? 'bg-black text-white' : 'bg-secondary text-secondary-foreground'}
                      >
                        {user.role === 'admin' ? 'Admin' : 'User'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(user.status)}>
                        {user.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium">{user.trackedProducts}</TableCell>
                    <TableCell>{new Date(user.createdAt).toLocaleDateString()}</TableCell>
                    <TableCell className="text-muted-foreground">{user.lastActive}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal size={16} />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-white border-0 shadow-lg rounded-lg">
                          <DropdownMenuItem onClick={() => handleViewDetails(user)} className="hover:bg-[#ECEEF2] focus:bg-[#ECEEF2]">
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleEditUser(user)} className="hover:bg-[#ECEEF2] focus:bg-[#ECEEF2]">
                            Edit User
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleBanUser(user.id)}
                            className={`${user.status === 'banned' ? 'text-green-600' : 'text-orange-600'} hover:bg-[#ECEEF2] focus:bg-[#ECEEF2]`}
                          >
                            {user.status === 'banned' ? 'Unban User' : 'Ban User'}
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleDeleteUser(user.id)}
                            className="text-red-600 hover:bg-[#ECEEF2] focus:bg-[#ECEEF2]"
                          >
                            Delete User
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {filteredUsers.length === 0 && (
            <div className="text-center py-12">
              <User className="mx-auto text-muted-foreground mb-4" size={48} />
              <h3 className="font-medium text-foreground mb-2">No users found</h3>
              <p className="text-muted-foreground">
                {searchTerm ? "Try adjusting your search or filter criteria." : "No users match your current filters."}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* User Details Modal */}
      {showUserDetails && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">User Details</h3>
              <button 
                onClick={() => setShowUserDetails(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Name</label>
                <p className="text-gray-900">{selectedUser.name || 'N/A'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Email</label>
                <p className="text-gray-900">{selectedUser.email}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Role</label>
                <p className="text-gray-900 capitalize">{selectedUser.role}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Status</label>
                <p className="text-gray-900 capitalize">{selectedUser.status}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Tracked Products</label>
                <p className="text-gray-900">{selectedUser.trackedProducts || 0}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Join Date</label>
                <p className="text-gray-900">{new Date(selectedUser.createdAt).toLocaleDateString()}</p>
              </div>
            </div>
            <div className="mt-6 flex justify-end">
              <Button 
                onClick={() => setShowUserDetails(false)}
                className="bg-gray-500 hover:bg-gray-600"
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {showEditUser && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Edit User</h3>
              <button 
                onClick={() => setShowEditUser(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              const updatedUser = {
                ...selectedUser,
                name: formData.get('name') as string,
                email: formData.get('email') as string,
                role: formData.get('role') as string,
                status: formData.get('status') as string
              };
              handleUpdateUser(updatedUser);
            }}>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">Name</label>
                  <input
                    name="name"
                    defaultValue={selectedUser.name || ''}
                    className="w-full p-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Email</label>
                  <input
                    name="email"
                    defaultValue={selectedUser.email}
                    className="w-full p-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Role</label>
                  <select
                    name="role"
                    defaultValue={selectedUser.role}
                    className="w-full p-2 border border-gray-300 rounded-md"
                  >
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Status</label>
                  <select
                    name="status"
                    defaultValue={selectedUser.status}
                    className="w-full p-2 border border-gray-300 rounded-md"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="banned">Banned</option>
                  </select>
                </div>
              </div>
              <div className="mt-6 flex justify-end gap-2">
                <Button 
                  type="button"
                  onClick={() => setShowEditUser(false)}
                  className="bg-gray-500 hover:bg-gray-600"
                >
                  Cancel
                </Button>
                <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                  Save Changes
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add User Modal */}
      {showAddUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Add New User</h3>
              <button 
                onClick={() => setShowAddUser(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            <form onSubmit={async (e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              const userData = {
                email: formData.get('email') as string,
                password: formData.get('password') as string,
                name: formData.get('name') as string,
                role: formData.get('role') as string
              };
              
              try {
                await handleAddUser(userData);
                // Show success message
                const successNotification = document.createElement('div');
                successNotification.style.cssText = `
                  position: fixed;
                  top: 20px;
                  right: 20px;
                  background: #10b981;
                  color: white;
                  padding: 12px 16px;
                  border-radius: 8px;
                  font-size: 14px;
                  font-weight: 500;
                  z-index: 1001;
                  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
                `;
                successNotification.textContent = 'User created successfully!';
                document.body.appendChild(successNotification);
                setTimeout(() => {
                  document.body.removeChild(successNotification);
                }, 3000);
              } catch (error) {
                // Show error message
                const errorNotification = document.createElement('div');
                errorNotification.style.cssText = `
                  position: fixed;
                  top: 20px;
                  right: 20px;
                  background: #ef4444;
                  color: white;
                  padding: 12px 16px;
                  border-radius: 8px;
                  font-size: 14px;
                  font-weight: 500;
                  z-index: 1001;
                  box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);
                `;
                errorNotification.textContent = 'Failed to create user. Please try again.';
                document.body.appendChild(errorNotification);
                setTimeout(() => {
                  document.body.removeChild(errorNotification);
                }, 3000);
              }
            }}>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">Name (Optional)</label>
                  <input
                    name="name"
                    type="text"
                    placeholder="Enter user's name"
                    className="w-full p-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Email *</label>
                  <input
                    name="email"
                    type="email"
                    required
                    placeholder="Enter user's email"
                    className="w-full p-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Password *</label>
                  <input
                    name="password"
                    type="password"
                    required
                    placeholder="Enter password"
                    className="w-full p-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Role *</label>
                  <select
                    name="role"
                    required
                    defaultValue="user"
                    className="w-full p-2 border border-gray-300 rounded-md"
                  >
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
              </div>
              <div className="mt-6 flex justify-end gap-2">
                <Button 
                  type="button"
                  onClick={() => setShowAddUser(false)}
                  className="bg-gray-500 hover:bg-gray-600"
                >
                  Cancel
                </Button>
                <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                  Create User
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}