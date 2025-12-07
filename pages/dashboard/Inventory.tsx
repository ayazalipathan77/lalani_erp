import React, { useState, useEffect } from 'react';
import { Search, Plus, Filter, AlertTriangle, Edit2, Trash2, X } from 'lucide-react';
import { api } from '../../services/api';
import { Product, Category, TaxRate } from '../../types';
import MobileTable from '../../components/MobileTable';
import Pagination from '../../components/Pagination';
import { useCompany } from '../../components/CompanyContext';

const Inventory: React.FC = () => {
  const { selectedCompany } = useCompany();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [taxRates, setTaxRates] = useState<TaxRate[]>([]);
  const [pagination, setPagination] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Form State
  const [formData, setFormData] = useState<Partial<Product>>({
    prod_code: '',
    prod_name: '',
    category_code: '',
    unit_price: 0,
    current_stock: 0,
    min_stock_level: 0,
    tax_code: '',
    tax_rate: 0
  });

  const fetchData = async (page: number = currentPage) => {
    setIsLoading(true);
    try {
      const [prodsResponse, cats, taxRatesData] = await Promise.all([
        api.products.getAll(page, 8),
        api.categories.getAll(),
        api.taxRates.getAll()
      ]);
      setProducts(Array.isArray(prodsResponse.data) ? prodsResponse.data : []);
      setPagination(prodsResponse.pagination);
      setCategories(Array.isArray(cats) ? cats : []);
      setTaxRates(Array.isArray(taxRatesData) ? taxRatesData : []);
    } catch (error) {
      console.error("Failed to fetch inventory", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedCompany]); // Refetch when company changes

  const handleOpenModal = (product?: Product) => {
    if (product) {
      setEditingProduct(product);
      setFormData(product);
    } else {
      setEditingProduct(null);
      setFormData({
        prod_code: '',
        prod_name: '',
        category_code: categories[0]?.category_code || '',
        unit_price: 0,
        current_stock: 0,
        min_stock_level: 10,
        tax_code: taxRates[0]?.tax_code || '',
        tax_rate: taxRates[0]?.tax_rate || 0
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingProduct(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingProduct) {
        await api.products.update(editingProduct.prod_id, formData);
      } else {
        await api.products.create(formData as Product);
      }
      handleCloseModal();
      fetchData();
    } catch (error) {
      console.error("Error saving product", error);
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm("Are you sure you want to delete this product?")) {
      try {
        await api.products.delete(id);
        fetchData();
      } catch (error) {
        console.error("Error deleting product", error);
      }
    }
  };

  const filteredProducts = (Array.isArray(products) ? products : []).filter(p =>
    p.prod_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.prod_code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    fetchData(page);
  };

  return (
    <div className="space-y-6 relative">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Inventory Management</h1>
          <p className="text-slate-500">Track stock levels, prices, and product categories.</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="bg-brand-600 text-white px-4 py-2 rounded-lg flex items-center hover:bg-brand-700 transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Product
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex flex-col sm:flex-row gap-4 justify-between items-center">
          <div className="relative w-full sm:w-96">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-slate-400" />
            </div>
            <input
              type="text"
              className="block w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg leading-5 bg-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 sm:text-sm"
              placeholder="Search by name or code..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button className="flex items-center px-4 py-2 border border-slate-300 rounded-lg bg-white hover:bg-slate-50 text-slate-700">
            <Filter className="w-4 h-4 mr-2" />
            Filters
          </button>
        </div>

        <div className="overflow-x-auto hidden lg:block">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Code</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Name</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Category</th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Price (PKR)</th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Stock</th>
                <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
                <th scope="col" className="relative px-6 py-3">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-500">Loading inventory...</td>
                </tr>
              ) : filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-500">No products found.</td>
                </tr>
              ) : (
                filteredProducts.map((product) => (
                  <tr key={product.prod_id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-brand-600">
                      {product.prod_code}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                      {product.prod_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800">
                        {product.category_code}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900 text-right font-mono">
                      {product.unit_price.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900 text-right">
                      <div className="flex items-center justify-end">
                        {product.current_stock <= product.min_stock_level && (
                          <AlertTriangle className="w-4 h-4 text-amber-500 mr-2" />
                        )}
                        {product.current_stock}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      {product.current_stock <= product.min_stock_level ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                          Low Stock
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          In Stock
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                        <button
                          onClick={() => handleOpenModal(product)}
                          className="text-slate-400 hover:text-brand-600 transition-colors"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(product.prod_id)}
                          className="text-slate-400 hover:text-red-600 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Table View */}
        <MobileTable
          data={filteredProducts}
          columns={[
            {
              key: 'prod_code',
              label: 'Code',
              render: (value) => <span className="font-medium text-brand-600">{value}</span>
            },
            {
              key: 'prod_name',
              label: 'Name'
            },
            {
              key: 'category_code',
              label: 'Category',
              render: (value) => (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800">
                  {value}
                </span>
              )
            },
            {
              key: 'unit_price',
              label: 'Price',
              render: (value) => `PKR ${value.toLocaleString()}`
            },
            {
              key: 'current_stock',
              label: 'Stock',
              render: (value, item) => (
                <div className="flex items-center justify-end">
                  {value <= item.min_stock_level && (
                    <AlertTriangle className="w-4 h-4 text-amber-500 mr-2" />
                  )}
                  {value}
                </div>
              )
            },
            {
              key: 'stock_status',
              label: 'Status',
              render: (value, item) => (
                item.current_stock <= item.min_stock_level ? (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                    Low Stock
                  </span>
                ) : (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    In Stock
                  </span>
                )
              )
            }
          ]}
        />

        {pagination && (
          <Pagination
            currentPage={pagination.page}
            totalPages={pagination.totalPages}
            onPageChange={handlePageChange}
          />
        )}
      </div>

      {/* Add/Edit Product Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden">
            <div className="flex justify-between items-center p-6 border-b border-slate-100">
              <h3 className="text-xl font-bold text-slate-900">
                {editingProduct ? 'Edit Product' : 'Add New Product'}
              </h3>
              <button onClick={handleCloseModal} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Product Code</label>
                  <input
                    type="text"
                    required
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-brand-500 focus:border-brand-500"
                    value={formData.prod_code}
                    onChange={e => setFormData({ ...formData, prod_code: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Category</label>
                  <select
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-brand-500 focus:border-brand-500"
                    value={formData.category_code}
                    onChange={e => setFormData({ ...formData, category_code: e.target.value })}
                  >
                    <option value="">Select Category</option>
                    {categories.map(c => (
                      <option key={c.category_id} value={c.category_code}>{c.category_name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Tax Rate</label>
                <select
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-brand-500 focus:border-brand-500"
                  value={formData.tax_code}
                  onChange={e => {
                    const selectedTax = taxRates.find(t => t.tax_code === e.target.value);
                    setFormData({
                      ...formData,
                      tax_code: e.target.value,
                      tax_rate: selectedTax ? selectedTax.tax_rate : 0
                    });
                  }}
                >
                  <option value="">Select Tax Rate</option>
                  {taxRates.map(t => (
                    <option key={t.tax_id} value={t.tax_code}>{t.tax_name} ({t.tax_rate}%)</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Product Name</label>
                <input
                  type="text"
                  required
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-brand-500 focus:border-brand-500"
                  value={formData.prod_name}
                  onChange={e => setFormData({ ...formData, prod_name: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Price (PKR)</label>
                  <input
                    type="number"
                    required
                    min="0"
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-brand-500 focus:border-brand-500"
                    value={formData.unit_price}
                    onChange={e => setFormData({ ...formData, unit_price: Number(e.target.value) })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Stock</label>
                  <input
                    type="number"
                    required
                    min="0"
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-brand-500 focus:border-brand-500"
                    value={formData.current_stock}
                    onChange={e => setFormData({ ...formData, current_stock: Number(e.target.value) })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Min Level</label>
                  <input
                    type="number"
                    required
                    min="0"
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-brand-500 focus:border-brand-500"
                    value={formData.min_stock_level}
                    onChange={e => setFormData({ ...formData, min_stock_level: Number(e.target.value) })}
                  />
                </div>
              </div>

              <div className="pt-4 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 shadow-lg shadow-brand-500/30"
                >
                  {editingProduct ? 'Save Changes' : 'Create Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Inventory;