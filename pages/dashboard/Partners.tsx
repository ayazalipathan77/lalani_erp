import React, { useState } from 'react';
import { Search, Plus, MapPin, Phone, Building2, User } from 'lucide-react';
import { mockCustomers, mockSuppliers } from '../../services/mockData';

const Partners: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'customers' | 'suppliers'>('customers');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredCustomers = mockCustomers.filter(c => 
    c.cust_name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.city.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredSuppliers = mockSuppliers.filter(s => 
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
        <button className="bg-brand-600 text-white px-4 py-2 rounded-lg flex items-center hover:bg-brand-700 transition-colors shadow-sm">
          <Plus className="w-4 h-4 mr-2" />
          Add New {activeTab === 'customers' ? 'Customer' : 'Supplier'}
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {/* Tabs */}
        <div className="flex border-b border-slate-200">
          <button
            onClick={() => setActiveTab('customers')}
            className={`flex-1 py-4 text-sm font-medium text-center transition-colors ${
              activeTab === 'customers'
                ? 'text-brand-600 border-b-2 border-brand-600 bg-brand-50/50'
                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
            }`}
          >
            Customers ({mockCustomers.length})
          </button>
          <button
            onClick={() => setActiveTab('suppliers')}
            className={`flex-1 py-4 text-sm font-medium text-center transition-colors ${
              activeTab === 'suppliers'
                ? 'text-brand-600 border-b-2 border-brand-600 bg-brand-50/50'
                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
            }`}
          >
            Suppliers ({mockSuppliers.length})
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
        <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {activeTab === 'customers' ? (
            filteredCustomers.map(customer => (
              <div key={customer.cust_id} className="bg-white border border-slate-200 rounded-xl p-5 hover:shadow-md transition-shadow group">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold mr-3">
                      {customer.cust_name.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 group-hover:text-brand-600 transition-colors">{customer.cust_name}</h3>
                      <span className="text-xs text-slate-500">{customer.cust_code}</span>
                    </div>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full ${customer.outstanding_balance > 0 ? 'bg-amber-100 text-amber-800' : 'bg-green-100 text-green-800'}`}>
                    {customer.outstanding_balance > 0 ? 'Due' : 'Clear'}
                  </span>
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
                  <span className="font-bold font-mono text-slate-900">PKR {customer.outstanding_balance.toLocaleString()}</span>
                </div>
                <div className="mt-2 text-xs text-slate-400 text-right">
                  Limit: {customer.credit_limit.toLocaleString()}
                </div>
              </div>
            ))
          ) : (
            filteredSuppliers.map(supplier => (
              <div key={supplier.supplier_id} className="bg-white border border-slate-200 rounded-xl p-5 hover:shadow-md transition-shadow group">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center text-purple-600 font-bold mr-3">
                      {supplier.supplier_name.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 group-hover:text-brand-600 transition-colors">{supplier.supplier_name}</h3>
                      <span className="text-xs text-slate-500">{supplier.supplier_code}</span>
                    </div>
                  </div>
                  <Building2 className="w-4 h-4 text-slate-400" />
                </div>
                
                <div className="space-y-2 text-sm text-slate-600 mb-4">
                   <div className="flex items-center">
                    <User className="w-4 h-4 mr-2 text-slate-400" />
                    {supplier.contact_person}
                  </div>
                  <div className="flex items-center">
                    <MapPin className="w-4 h-4 mr-2 text-slate-400" />
                    {supplier.city}
                  </div>
                  <div className="flex items-center">
                    <Phone className="w-4 h-4 mr-2 text-slate-400" />
                    {supplier.phone}
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 flex justify-between items-center text-sm">
                  <span className="text-slate-500">Payable:</span>
                  <span className="font-bold font-mono text-red-600">PKR {supplier.outstanding_balance.toLocaleString()}</span>
                </div>
              </div>
            ))
          )}
        </div>
        
        {((activeTab === 'customers' && filteredCustomers.length === 0) || 
          (activeTab === 'suppliers' && filteredSuppliers.length === 0)) && (
          <div className="p-12 text-center text-slate-500">
            No {activeTab} found matching your search.
          </div>
        )}
      </div>
    </div>
  );
};

export default Partners;