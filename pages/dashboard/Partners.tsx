import React, { useState, useEffect } from 'react';
import { Search, Plus, MapPin, Phone, Building2, User, Edit2, Trash2, X } from 'lucide-react';
import { api } from '../../services/api';
import { Customer, Supplier } from '../../types';

const Partners: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'customers' | 'suppliers'>('customers');
  const [searchTerm, setSearchTerm] = useState('');
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  // Dynamic Form Data
  const [formData, setFormData] = useState<any>({});

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [custsResponse, suppsResponse] = await Promise.all([
        api.customers.getAll(1, 100), // Get all customers for partners page
        api.suppliers.getAll(1, 100) // Get all suppliers for partners page
      ]);
      setCustomers(custsResponse.data);
      setSuppliers(suppsResponse.data);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenModal = (data?: any) => {
    setEditingId(data ? (activeTab === 'customers' ? data.cust_id : data.supplier_id) : null);
    if (data) {
      setFormData(data);
    } else {
      // Init empty form based on tab
      if (activeTab === 'customers') {
        setFormData({
          cust_code: '', cust_name: '', city: '', phone: '', credit_limit: 0, outstanding_balance: 0
        });
      } else {
        setFormData({
          supplier_code: '', supplier_name: '', contact_person: '', city: '', phone: '', outstanding_balance: 0
        });
      }
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
      if (activeTab === 'customers') {
        if (editingId) await api.customers.update(editingId, formData);
        else await api.customers.create(formData);
      } else {
        if (editingId) await api.suppliers.update(editingId, formData);
        else await api.suppliers.create(formData);
      }
      handleCloseModal();
      fetchData();
    } catch (error) {
      console.error("Save error", error);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm(`Are you sure you want to delete this ${activeTab === 'customers' ? 'customer' : 'supplier'}?`)) return;
    try {
      if (activeTab === 'customers') await api.customers.delete(id);
      else await api.suppliers.delete(id);
      fetchData();
    } catch (error) {
      console.error(error);
    }
  };

  const filteredCustomers = customers.filter(c =>
    c.cust_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.city.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredSuppliers = suppliers.filter(s =>
    s.supplier_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.city.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Partners & Stakeholders</h1>
          <p className="text-slate-500">Manage your network of customers and vendors.</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="bg-brand-600 text-white px-4 py-2 rounded-lg flex items-center hover:bg-brand-700 transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add New {activeTab === 'customers' ? 'Customer' : 'Supplier'}
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {/* Tabs */}
        <div className="flex border-b border-slate-200">
          <button
            onClick={() => setActiveTab('customers')}
            className={`flex-1 py-4 text-sm font-medium text-center transition-colors ${activeTab === 'customers'
              ? 'text-brand-600 border-b-2 border-brand-600 bg-brand-50/50'
              : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
              }`}
          >
            Customers ({customers.length})
          </button>
          <button
            onClick={() => setActiveTab('suppliers')}
            className={`flex-1 py-4 text-sm font-medium text-center transition-colors ${activeTab === 'suppliers'
              ? 'text-brand-600 border-b-2 border-brand-600 bg-brand-50/50'
              : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
              }`}
          >
            Suppliers ({suppliers.length})
          </button>
        </div>

        {/* Search Bar */}
        <div className="p-4 border-b border-slate-200 bg-slate-50">
          <div className="relative max-w-md">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-slate-400" />
            </div>
            <input
              type="text"
              className="block w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg leading-5 bg-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 sm:text-sm"
              placeholder={`Search ${activeTab}...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Content List */}
        <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6 overflow-hidden">
          {isLoading ? (
            <div className="col-span-full text-center py-12 text-slate-400">Loading data...</div>
          ) : activeTab === 'customers' ? (
            filteredCustomers.map(customer => (
              <div key={customer.cust_id} className="bg-white border border-slate-200 rounded-xl p-5 hover:shadow-md transition-shadow group relative">
                <div className="absolute top-4 right-4 flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => handleOpenModal(customer)} className="p-1 text-slate-400 hover:text-brand-600"><Edit2 className="w-4 h-4" /></button>
                  <button onClick={() => handleDelete(customer.cust_id)} className="p-1 text-slate-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
                </div>
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold mr-3">
                      {customer.cust_name.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900">{customer.cust_name}</h3>
                      <span className="text-xs text-slate-500">{customer.cust_code}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2 text-sm text-slate-600 mb-4">
                  <div className="flex items-center">
                    <MapPin className="w-4 h-4 mr-2 text-slate-400" />
                    {customer.city}
                  </div>
                  <div className="flex items-center">
                    <Phone className="w-4 h-4 mr-2 text-slate-400" />
                    {customer.phone || 'N/A'}
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 flex justify-between items-center text-sm">
                  <span className="text-slate-500">Balance:</span>
                  <span className={`font-bold font-mono ${customer.outstanding_balance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                    PKR {customer.outstanding_balance.toLocaleString()}
                  </span>
                </div>
              </div>
            ))
          ) : (
            filteredSuppliers.map(supplier => (
              <div key={supplier.supplier_id} className="bg-white border border-slate-200 rounded-xl p-5 hover:shadow-md transition-shadow group relative">
                <div className="absolute top-4 right-4 flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => handleOpenModal(supplier)} className="p-1 text-slate-400 hover:text-brand-600"><Edit2 className="w-4 h-4" /></button>
                  <button onClick={() => handleDelete(supplier.supplier_id)} className="p-1 text-slate-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
                </div>
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center text-purple-600 font-bold mr-3">
                      {supplier.supplier_name.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900">{supplier.supplier_name}</h3>
                      <span className="text-xs text-slate-500">{supplier.supplier_code}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2 text-sm text-slate-600 mb-4">
                  <div className="flex items-center">
                    <User className="w-4 h-4 mr-2 text-slate-400" />
                    {supplier.contact_person}
                  </div>
                  <div className="flex items-center">
                    <Phone className="w-4 h-4 mr-2 text-slate-400" />
                    {supplier.phone}
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 flex justify-between items-center text-sm">
                  <span className="text-slate-500">Payable:</span>
                  <span className="font-bold font-mono text-slate-900">PKR {supplier.outstanding_balance.toLocaleString()}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Shared Modal for Customer/Supplier */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="flex justify-between items-center p-6 border-b border-slate-100">
              <h3 className="text-xl font-bold text-slate-900">
                {editingId ? 'Edit' : 'Add New'} {activeTab === 'customers' ? 'Customer' : 'Supplier'}
              </h3>
              <button onClick={handleCloseModal} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {/* Common Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Code</label>
                  <input
                    type="text" required
                    className="w-full border border-slate-300 rounded-lg p-2"
                    value={activeTab === 'customers' ? formData.cust_code : formData.supplier_code}
                    onChange={e => setFormData({ ...formData, [activeTab === 'customers' ? 'cust_code' : 'supplier_code']: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">City</label>
                  <input
                    type="text" required
                    className="w-full border border-slate-300 rounded-lg p-2"
                    value={formData.city}
                    onChange={e => setFormData({ ...formData, city: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Name</label>
                <input
                  type="text" required
                  className="w-full border border-slate-300 rounded-lg p-2"
                  value={activeTab === 'customers' ? formData.cust_name : formData.supplier_name}
                  onChange={e => setFormData({ ...formData, [activeTab === 'customers' ? 'cust_name' : 'supplier_name']: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Phone</label>
                <input
                  type="text"
                  className="w-full border border-slate-300 rounded-lg p-2"
                  value={formData.phone}
                  onChange={e => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>

              {/* Specific Fields */}
              {activeTab === 'customers' && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Credit Limit</label>
                  <input
                    type="number"
                    className="w-full border border-slate-300 rounded-lg p-2"
                    value={formData.credit_limit}
                    onChange={e => setFormData({ ...formData, credit_limit: Number(e.target.value) })}
                  />
                </div>
              )}
              {activeTab === 'suppliers' && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Contact Person</label>
                  <input
                    type="text"
                    className="w-full border border-slate-300 rounded-lg p-2"
                    value={formData.contact_person}
                    onChange={e => setFormData({ ...formData, contact_person: e.target.value })}
                  />
                </div>
              )}

              <button
                type="submit"
                className="w-full bg-brand-600 text-white py-2 rounded-lg hover:bg-brand-700 mt-4"
              >
                Save Record
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Partners;