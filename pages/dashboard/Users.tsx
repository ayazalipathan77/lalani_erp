import React, { useState, useEffect } from 'react';
import { Search, Plus, Edit2, Trash2, X, Shield, ShieldAlert, User as UserIcon } from 'lucide-react';
import { api } from '../../services/api';
import { User } from '../../types';

const Users: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  
  // Form Data
  const [formData, setFormData] = useState<Partial<User>>({
    username: '',
    password: '',
    full_name: '',
    role: 'USER',
    is_active: 'Y'
  });

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const data = await api.users.getAll();
      setUsers(data);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenModal = (user?: User) => {
    if (user) {
      setEditingId(user.user_id);
      setFormData({ ...user, password: '' }); // Don't show password
    } else {
      setEditingId(null);
      setFormData({
        username: '',
        password: '',
        full_name: '',
        role: 'USER',
        is_active: 'Y'
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await api.users.update(editingId, formData);
      } else {
        if (!formData.password) {
            alert("Password is required for new users");
            return;
        }
        await api.users.create(formData as User);
      }
      handleCloseModal();
      fetchData();
    } catch (error: any) {
      alert(error.message);
    }
  };

  const handleDelete = async (id: number) => {
      if (window.confirm("Are you sure you want to delete this user?")) {
          try {
              await api.users.delete(id);
              fetchData();
          } catch (e) {
              console.error(e);
          }
      }
  };

  const filteredUsers = users.filter(u => 
    u.full_name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">User Management</h1>
          <p className="text-slate-500">Manage system access, roles, and permissions.</p>
        </div>
        <button 
          onClick={() => handleOpenModal()}
          className="bg-brand-600 text-white px-4 py-2 rounded-lg flex items-center hover:bg-brand-700 transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add User
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50">
           <div className="relative max-w-md">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-slate-400" />
            </div>
            <input
              type="text"
              className="block w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg leading-5 bg-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 sm:text-sm"
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">User Info</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Role</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
                <th className="relative px-6 py-3"><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {isLoading ? (
                  <tr><td colSpan={4} className="text-center py-8 text-slate-500">Loading users...</td></tr>
              ) : filteredUsers.map((user) => (
                <tr key={user.user_id} className="hover:bg-slate-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10 bg-slate-100 rounded-full flex items-center justify-center">
                         <UserIcon className="w-5 h-5 text-slate-500"/>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-slate-900">{user.full_name}</div>
                        <div className="text-sm text-slate-500">@{user.username}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {user.role === 'ADMIN' ? (
                         <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                             <ShieldAlert className="w-3 h-3 mr-1"/> Admin
                         </span>
                    ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                             <Shield className="w-3 h-3 mr-1"/> User
                        </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full 
                        ${user.is_active === 'Y' ? 'bg-green-100 text-green-800' : 'bg-slate-100 text-slate-600'}`}>
                        {user.is_active === 'Y' ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                     <div className="flex justify-end space-x-3">
                        <button onClick={() => handleOpenModal(user)} className="text-slate-400 hover:text-brand-600">
                            <Edit2 className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDelete(user.user_id)} className="text-slate-400 hover:text-red-600">
                            <Trash2 className="w-4 h-4" />
                        </button>
                     </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* User Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
           <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
                <div className="flex justify-between items-center p-6 border-b border-slate-100">
                    <h3 className="text-xl font-bold text-slate-900">
                        {editingId ? 'Edit User' : 'Create User'}
                    </h3>
                    <button onClick={handleCloseModal} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5"/></button>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
                        <input 
                            type="text" required 
                            className="w-full border border-slate-300 rounded-lg p-2 focus:ring-brand-500 focus:border-brand-500"
                            value={formData.full_name}
                            onChange={e => setFormData({...formData, full_name: e.target.value})}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Username</label>
                        <input 
                            type="text" required 
                            className="w-full border border-slate-300 rounded-lg p-2 focus:ring-brand-500 focus:border-brand-500"
                            value={formData.username}
                            onChange={e => setFormData({...formData, username: e.target.value})}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                            {editingId ? 'New Password (leave blank to keep current)' : 'Password'}
                        </label>
                        <input 
                            type="password" 
                            required={!editingId}
                            className="w-full border border-slate-300 rounded-lg p-2 focus:ring-brand-500 focus:border-brand-500"
                            value={formData.password}
                            onChange={e => setFormData({...formData, password: e.target.value})}
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                             <label className="block text-sm font-medium text-slate-700 mb-1">Role</label>
                             <select 
                                className="w-full border border-slate-300 rounded-lg p-2 focus:ring-brand-500 focus:border-brand-500"
                                value={formData.role}
                                onChange={e => setFormData({...formData, role: e.target.value as any})}
                             >
                                 <option value="USER">User</option>
                                 <option value="ADMIN">Admin</option>
                             </select>
                        </div>
                        <div>
                             <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
                             <select 
                                className="w-full border border-slate-300 rounded-lg p-2 focus:ring-brand-500 focus:border-brand-500"
                                value={formData.is_active}
                                onChange={e => setFormData({...formData, is_active: e.target.value as any})}
                             >
                                 <option value="Y">Active</option>
                                 <option value="N">Inactive</option>
                             </select>
                        </div>
                    </div>

                    <button type="submit" className="w-full bg-brand-600 text-white py-2 rounded-lg hover:bg-brand-700 mt-4 font-medium">
                        {editingId ? 'Update User' : 'Create Account'}
                    </button>
                </form>
           </div>
        </div>
      )}
    </div>
  );
};

export default Users;