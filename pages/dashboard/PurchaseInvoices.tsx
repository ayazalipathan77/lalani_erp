import React, { useState, useEffect } from 'react';
import { Search, Plus, FileText, Check, Trash2, Calendar, User, ChevronLeft, Edit2, ShoppingCart } from 'lucide-react';
import { useLoading } from '../../components/LoadingContext';
import { useNotification } from '../../components/NotificationContext';
import { api } from '../../services/api';
import { PurchaseInvoice, PurchaseInvoiceItem, Product, Supplier } from '../../types';
import { formatTableDate } from '../../src/utils/dateUtils';
import MobileTable from '../../components/MobileTable';

const PurchaseInvoices: React.FC = () => {
    const [view, setView] = useState<'list' | 'create'>('list');
    const [invoices, setInvoices] = useState<PurchaseInvoice[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const { showLoader, hideLoader } = useLoading();
    const { showNotification } = useNotification();

    // Create Invoice State
    const [selectedSupplier, setSelectedSupplier] = useState('');
    const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split('T')[0]);
    const [cartItems, setCartItems] = useState<PurchaseInvoiceItem[]>([]);
    const [selectedProduct, setSelectedProduct] = useState('');
    const [qty, setQty] = useState(1);
    const [unitPrice, setUnitPrice] = useState(0);

    // Edit state
    const [editingInvoice, setEditingInvoice] = useState<PurchaseInvoice | null>(null);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const [invsResponse, prodsResponse, suppsResponse] = await Promise.all([
                api.purchaseInvoices.getAll(1, 50),
                api.products.getAll(1, 100),
                api.suppliers.getAll(1, 100)
            ]);
            setInvoices(Array.isArray(invsResponse.data) ? invsResponse.data : []);
            setProducts(Array.isArray(prodsResponse.data) ? prodsResponse.data : []);
            setSuppliers(Array.isArray(suppsResponse.data) ? suppsResponse.data : []);
        } catch (e) {
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    // Calculations
    const subtotal = cartItems.reduce((acc, item) => acc + item.line_total, 0);
    const tax = subtotal * 0.05; // 5% tax example
    const total = subtotal + tax;

    const handleAddItem = () => {
        if (!selectedProduct || qty <= 0 || unitPrice <= 0) return;
        const product = products.find(p => p.prod_code === selectedProduct);
        if (!product) return;

        const newItem: PurchaseInvoiceItem = {
            prod_code: product.prod_code,
            prod_name: product.prod_name,
            quantity: qty,
            unit_price: unitPrice,
            line_total: unitPrice * qty
        };

        setCartItems([...cartItems, newItem]);
        setSelectedProduct('');
        setQty(1);
        setUnitPrice(0);
    };

    const handleRemoveItem = (index: number) => {
        const newItems = [...cartItems];
        newItems.splice(index, 1);
        setCartItems(newItems);
    };

    const handleFinalizeInvoice = async () => {
        if (!selectedSupplier || cartItems.length === 0) return;

        try {
            showLoader(editingInvoice ? 'Updating invoice...' : 'Creating invoice...');

            if (editingInvoice) {
                // Update logic would go here
                showNotification("Purchase invoice update not yet implemented", "warning");
            } else {
                await api.purchaseInvoices.create({
                    supplier_code: selectedSupplier,
                    items: cartItems,
                    purchase_date: invoiceDate
                });
                showNotification("Purchase Invoice Created Successfully!", "success");
            }

            // Reset
            setCartItems([]);
            setSelectedSupplier('');
            setEditingInvoice(null);
            setView('list');
            await fetchData(); // Refresh list
        } catch (error) {
            console.error("Failed to save invoice", error);
            showNotification("Failed to save invoice. Please try again.", "error");
        } finally {
            hideLoader();
        }
    };

    const handleEditInvoice = (invoice: PurchaseInvoice) => {
        setEditingInvoice(invoice);
        setSelectedSupplier(invoice.supplier_code);
        setInvoiceDate(invoice.purchase_date.split('T')[0]);
        setCartItems(invoice.items || []);
        setView('create');
    };

    // Helper function to get supplier name from code
    const getSupplierName = (supplierCode: string) => {
        const supplier = suppliers.find(s => s.supplier_code === supplierCode);
        return supplier ? supplier.supplier_name : supplierCode;
    };

    const filteredInvoices = (Array.isArray(invoices) ? invoices : []).filter(inv =>
        inv.purchase_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        getSupplierName(inv.supplier_code).toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-4 lg:space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Purchase Invoices</h1>
                    <p className="text-slate-500">Create purchase invoices and manage supplier transactions.</p>
                </div>
                {view === 'list' && (
                    <button
                        onClick={() => setView('create')}
                        className="bg-brand-600 text-white px-4 py-2 rounded-lg flex items-center hover:bg-brand-700 transition-colors shadow-sm"
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        New Purchase Invoice
                    </button>
                )}
            </div>

            {view === 'list' ? (
                /* INVOICE LIST VIEW */
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="p-3 lg:p-4 border-b border-slate-200 bg-slate-50 flex flex-col sm:flex-row gap-4 justify-between items-center">
                        <div className="relative w-full sm:w-96">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Search className="h-5 w-5 text-slate-400" />
                            </div>
                            <input
                                type="text"
                                className="block w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg leading-5 bg-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 sm:text-sm"
                                placeholder="Search purchase invoices..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="overflow-x-auto hidden lg:block">
                        <table className="min-w-full divide-y divide-slate-200">
                            <thead className="bg-slate-50">
                                <tr>
                                    <th className="px-3 lg:px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Invoice #</th>
                                    <th className="px-3 lg:px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Date</th>
                                    <th className="px-3 lg:px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Supplier</th>
                                    <th className="px-3 lg:px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Amount</th>
                                    <th className="px-3 lg:px-6 py-3 text-center text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
                                    <th className="relative px-6 py-3">
                                        <span className="sr-only">Actions</span>
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-slate-200">
                                {isLoading ? (
                                    <tr><td colSpan={8} className="text-center py-8 text-slate-500">Loading invoices...</td></tr>
                                ) : filteredInvoices.length === 0 ? (
                                    <tr><td colSpan={8} className="text-center py-8 text-slate-500">No purchase invoices found.</td></tr>
                                ) : filteredInvoices.map((inv) => (
                                    <tr key={inv.purchase_id} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-3 lg:px-6 py-4 whitespace-nowrap text-sm font-medium text-brand-600">{inv.purchase_number}</td>
                                        <td className="px-3 lg:px-6 py-4 whitespace-nowrap text-sm text-slate-500">{formatTableDate(inv.purchase_date)}</td>
                                        <td className="px-3 lg:px-6 py-4 whitespace-nowrap text-sm text-slate-900">{getSupplierName(inv.supplier_code)}</td>
                                        <td className="px-3 lg:px-6 py-4 whitespace-nowrap text-sm text-right font-mono">{inv.total_amount.toLocaleString()}</td>
                                        <td className="px-3 lg:px-6 py-4 whitespace-nowrap text-center">
                                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full
                        ${inv.status === 'RECEIVED' ? 'bg-green-100 text-green-800' :
                                                    inv.status === 'PENDING' ? 'bg-blue-100 text-blue-800' :
                                                        'bg-red-100 text-red-800'}`}>
                                                {inv.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <button
                                                onClick={() => handleEditInvoice(inv)}
                                                className="text-slate-400 hover:text-brand-600 transition-colors"
                                            >
                                                <Edit2 className="w-4 h-4" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Mobile Table View */}
                    <MobileTable
                        data={filteredInvoices}
                        columns={[
                            {
                                key: 'purchase_number',
                                label: 'Invoice #',
                                render: (value) => <span className="font-medium text-brand-600">{value}</span>
                            },
                            {
                                key: 'purchase_date',
                                label: 'Date',
                                render: (value) => formatTableDate(value)
                            },
                            {
                                key: 'supplier_code',
                                label: 'Supplier',
                                render: (value) => getSupplierName(value)
                            },
                            {
                                key: 'total_amount',
                                label: 'Amount',
                                render: (value) => value.toLocaleString()
                            },
                            {
                                key: 'status',
                                label: 'Status',
                                render: (value) => (
                                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full
                              ${value === 'RECEIVED' ? 'bg-green-100 text-green-800' :
                                            value === 'PENDING' ? 'bg-blue-100 text-blue-800' :
                                                'bg-red-100 text-red-800'}`}>
                                        {value}
                                    </span>
                                )
                            }
                        ]}
                    />
                </div>
            ) : (
                /* CREATE INVOICE VIEW */
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6 overflow-hidden">
                    <div className="lg:col-span-2 space-y-6">
                        {/* Product Selection Card */}
                        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 lg:p-6">
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-lg font-bold text-slate-900">Add Purchase Items</h2>
                                <button onClick={() => setView('list')} className="text-sm text-slate-500 hover:text-slate-800 flex items-center">
                                    <ChevronLeft className="w-4 h-4 mr-1" /> Back to List
                                </button>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 mb-4">
                                <div className="sm:col-span-6">
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Select Product</label>
                                    <select
                                        className="block w-full border-slate-300 rounded-lg shadow-sm focus:ring-brand-500 focus:border-brand-500 sm:text-sm p-2.5 border"
                                        value={selectedProduct}
                                        onChange={(e) => {
                                            const product = products.find(p => p.prod_code === e.target.value);
                                            setSelectedProduct(e.target.value);
                                            if (product) {
                                                setUnitPrice(product.purchase_price || product.unit_price || 0);
                                            }
                                        }}
                                    >
                                        <option value="">-- Choose Product --</option>
                                        {products.map(p => (
                                            <option key={p.prod_code} value={p.prod_code}>
                                                {p.prod_name} - (Stk: {p.current_stock})
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div className="sm:col-span-2">
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Quantity</label>
                                    <input
                                        type="number"
                                        min="1"
                                        className="block w-full border-slate-300 rounded-lg shadow-sm focus:ring-brand-500 focus:border-brand-500 sm:text-sm p-2.5 border"
                                        value={qty}
                                        onChange={(e) => setQty(parseInt(e.target.value))}
                                    />
                                </div>
                                <div className="sm:col-span-2">
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Unit Price</label>
                                    <input
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        className="block w-full border-slate-300 rounded-lg shadow-sm focus:ring-brand-500 focus:border-brand-500 sm:text-sm p-2.5 border"
                                        value={unitPrice}
                                        onChange={(e) => setUnitPrice(parseFloat(e.target.value))}
                                    />
                                </div>
                                <div className="sm:col-span-2 flex items-end">
                                    <button
                                        onClick={handleAddItem}
                                        disabled={!selectedProduct || unitPrice <= 0}
                                        className="w-full bg-slate-900 text-white px-4 py-2.5 rounded-lg hover:bg-slate-800 transition-colors flex items-center justify-center disabled:opacity-50"
                                    >
                                        <Plus className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>

                            {/* Cart Table */}
                            <div className="mt-6 border rounded-lg overflow-hidden hidden lg:block">
                                <table className="min-w-full divide-y divide-slate-200">
                                    <thead className="bg-slate-50">
                                        <tr>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Product</th>
                                            <th className="px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase">Qty</th>
                                            <th className="px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase">Price</th>
                                            <th className="px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase">Total</th>
                                            <th className="px-4 py-3"></th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-200 bg-white">
                                        {cartItems.length === 0 ? (
                                            <tr>
                                                <td colSpan={5} className="px-4 py-8 text-center text-slate-400 text-sm">
                                                    No items added yet.
                                                </td>
                                            </tr>
                                        ) : (
                                            cartItems.map((item, idx) => (
                                                <tr key={idx}>
                                                    <td className="px-4 py-3 text-sm text-slate-900">{item.prod_name}</td>
                                                    <td className="px-4 py-3 text-sm text-slate-900 text-right">{item.quantity}</td>
                                                    <td className="px-4 py-3 text-sm text-slate-500 text-right">{item.unit_price.toLocaleString()}</td>
                                                    <td className="px-4 py-3 text-sm font-medium text-slate-900 text-right">{item.line_total.toLocaleString()}</td>
                                                    <td className="px-4 py-3 text-right">
                                                        <button onClick={() => handleRemoveItem(idx)} className="text-red-400 hover:text-red-600">
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            {/* Mobile Table View */}
                            <MobileTable
                                data={cartItems}
                                columns={[
                                    {
                                        key: 'prod_name',
                                        label: 'Product',
                                        render: (value) => <span className="font-medium">{value}</span>
                                    },
                                    {
                                        key: 'quantity',
                                        label: 'Qty',
                                        render: (value) => value
                                    },
                                    {
                                        key: 'unit_price',
                                        label: 'Price',
                                        render: (value) => `PKR ${value.toLocaleString()}`
                                    },
                                    {
                                        key: 'line_total',
                                        label: 'Total',
                                        render: (value) => `PKR ${value.toLocaleString()}`
                                    }
                                ]}
                            />
                        </div>
                    </div>

                    {/* Sidebar Invoice Details */}
                    <div className="space-y-6">
                        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 lg:p-6">
                            <h2 className="text-lg font-bold text-slate-900 mb-4">Purchase Invoice Details</h2>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center">
                                        <User className="w-4 h-4 mr-2 text-slate-400" /> Supplier
                                    </label>
                                    <select
                                        className="block w-full border-slate-300 rounded-lg shadow-sm focus:ring-brand-500 focus:border-brand-500 sm:text-sm p-2.5 border"
                                        value={selectedSupplier}
                                        onChange={(e) => setSelectedSupplier(e.target.value)}
                                    >
                                        <option value="">Select Supplier</option>
                                        {suppliers.map(s => (
                                            <option key={s.supplier_code} value={s.supplier_code}>{s.supplier_name}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center">
                                        <Calendar className="w-4 h-4 mr-2 text-slate-400" /> Date
                                    </label>
                                    <input
                                        type="date"
                                        className="block w-full border-slate-300 rounded-lg shadow-sm focus:ring-brand-500 focus:border-brand-500 sm:text-sm p-2.5 border"
                                        value={invoiceDate}
                                        onChange={(e) => setInvoiceDate(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="mt-8 border-t border-slate-200 pt-4 space-y-2">
                                <div className="flex justify-between text-sm text-slate-600">
                                    <span>Subtotal</span>
                                    <span>PKR {subtotal.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between text-sm text-slate-600">
                                    <span>Tax (5%)</span>
                                    <span>PKR {tax.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between text-lg font-bold text-slate-900 pt-2 border-t border-slate-100 mt-2">
                                    <span>Total</span>
                                    <span>PKR {total.toLocaleString()}</span>
                                </div>
                            </div>

                            <button
                                onClick={handleFinalizeInvoice}
                                className={`w-full mt-6 py-3 px-4 rounded-lg font-medium shadow-lg transition-all flex items-center justify-center
                        ${cartItems.length > 0 && selectedSupplier ? 'bg-brand-600 text-white hover:bg-brand-700 shadow-brand-500/30' : 'bg-slate-100 text-slate-400 cursor-not-allowed'}`}
                                disabled={cartItems.length === 0 || !selectedSupplier}
                            >
                                <Check className="w-4 h-4 mr-2" />
                                {editingInvoice ? 'Update Invoice' : 'Finalize Purchase'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PurchaseInvoices;