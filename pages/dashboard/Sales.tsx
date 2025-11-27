import React, { useState, useEffect } from 'react';
import { Search, Plus, FileText, Check, Trash2, Calendar, User, ChevronLeft } from 'lucide-react';
import { api } from '../../services/api';
import { SalesInvoiceItem, SalesInvoice, Product, Customer } from '../../types';
import { formatTableDate } from '../../src/utils/dateUtils';
import MobileTable from '../../components/MobileTable';

const Sales: React.FC = () => {
    const [view, setView] = useState<'list' | 'create'>('list');
    const [invoices, setInvoices] = useState<SalesInvoice[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [isLoading, setIsLoading] = useState(true);

    // Create Invoice State
    const [selectedCustomer, setSelectedCustomer] = useState('');
    const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split('T')[0]);
    const [paymentStatus, setPaymentStatus] = useState<'PENDING' | 'PAID'>('PENDING');
    const [cartItems, setCartItems] = useState<SalesInvoiceItem[]>([]);
    const [selectedProduct, setSelectedProduct] = useState('');
    const [qty, setQty] = useState(1);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const [invsResponse, prodsResponse, custsResponse] = await Promise.all([
                api.invoices.getAll(1, 50), // Get more invoices for sales page
                api.products.getAll(1, 100), // Get all products for dropdown
                api.customers.getAll(1, 100) // Get all customers for dropdown
            ]);
            setInvoices(invsResponse.data);
            setProducts(prodsResponse.data);
            setCustomers(custsResponse.data);
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
        if (!selectedProduct || qty <= 0) return;
        const product = products.find(p => p.prod_code === selectedProduct);
        if (!product) return;

        // Check Stock
        if (product.current_stock < qty) {
            alert(`Insufficient stock! Available: ${product.current_stock}`);
            return;
        }

        const newItem: SalesInvoiceItem = {
            prod_code: product.prod_code,
            prod_name: product.prod_name,
            quantity: qty,
            unit_price: product.unit_price,
            line_total: product.unit_price * qty
        };

        setCartItems([...cartItems, newItem]);
        setSelectedProduct('');
        setQty(1);
    };

    const handleRemoveItem = (index: number) => {
        const newItems = [...cartItems];
        newItems.splice(index, 1);
        setCartItems(newItems);
    };

    const handleFinalizeInvoice = async () => {
        if (!selectedCustomer || cartItems.length === 0) return;

        try {
            await api.invoices.create({
                cust_code: selectedCustomer,
                items: cartItems,
                date: invoiceDate,
                status: paymentStatus
            });

            alert("Invoice Created Successfully!");

            // Reset
            setCartItems([]);
            setSelectedCustomer('');
            setView('list');
            fetchData(); // Refresh list
        } catch (error) {
            console.error("Failed to create invoice", error);
        }
    };

    const filteredInvoices = invoices.filter(inv =>
        inv.inv_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        inv.cust_code.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-4 lg:space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Sales & Invoicing</h1>
                    <p className="text-slate-500">Create invoices, manage returns, and track sales performance.</p>
                </div>
                {view === 'list' && (
                    <button
                        onClick={() => setView('create')}
                        className="bg-brand-600 text-white px-4 py-2 rounded-lg flex items-center hover:bg-brand-700 transition-colors shadow-sm"
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        New Invoice
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
                                placeholder="Search invoices..."
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
                                    <th className="px-3 lg:px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Customer</th>
                                    <th className="px-3 lg:px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Amount</th>
                                    <th className="px-3 lg:px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Balance</th>
                                    <th className="px-3 lg:px-6 py-3 text-center text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-slate-200">
                                {isLoading ? (
                                    <tr><td colSpan={7} className="text-center py-8 text-slate-500">Loading invoices...</td></tr>
                                ) : filteredInvoices.length === 0 ? (
                                    <tr><td colSpan={7} className="text-center py-8 text-slate-500">No invoices found.</td></tr>
                                ) : filteredInvoices.map((inv) => (
                                    <tr key={inv.inv_id} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-3 lg:px-6 py-4 whitespace-nowrap text-sm font-medium text-brand-600">{inv.inv_number}</td>
                                        <td className="px-3 lg:px-6 py-4 whitespace-nowrap text-sm text-slate-500">{formatTableDate(inv.inv_date)}</td>
                                        <td className="px-3 lg:px-6 py-4 whitespace-nowrap text-sm text-slate-900">{inv.cust_code}</td>
                                        <td className="px-3 lg:px-6 py-4 whitespace-nowrap text-sm text-right font-mono">{inv.total_amount.toLocaleString()}</td>
                                        <td className="px-3 lg:px-6 py-4 whitespace-nowrap text-sm text-right font-mono text-slate-500">{inv.balance_due.toLocaleString()}</td>
                                        <td className="px-3 lg:px-6 py-4 whitespace-nowrap text-center">
                                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full 
                        ${inv.status === 'PAID' ? 'bg-green-100 text-green-800' :
                                                    inv.status === 'PENDING' ? 'bg-blue-100 text-blue-800' :
                                                        'bg-red-100 text-red-800'}`}>
                                                {inv.status}
                                            </span>
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
                                key: 'inv_number',
                                label: 'Invoice #',
                                render: (value) => <span className="font-medium text-brand-600">{value}</span>
                            },
                            {
                                key: 'inv_date',
                                label: 'Date',
                                render: (value) => formatTableDate(value)
                            },
                            {
                                key: 'cust_code',
                                label: 'Customer'
                            },
                            {
                                key: 'total_amount',
                                label: 'Amount',
                                render: (value) => value.toLocaleString()
                            },
                            {
                                key: 'balance_due',
                                label: 'Balance',
                                render: (value) => value.toLocaleString()
                            },
                            {
                                key: 'status',
                                label: 'Status',
                                render: (value) => (
                                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full
                              ${value === 'PAID' ? 'bg-green-100 text-green-800' :
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
                                <h2 className="text-lg font-bold text-slate-900">Add Items</h2>
                                <button onClick={() => setView('list')} className="text-sm text-slate-500 hover:text-slate-800 flex items-center">
                                    <ChevronLeft className="w-4 h-4 mr-1" /> Back to List
                                </button>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 mb-4">
                                <div className="sm:col-span-8">
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Select Product</label>
                                    <select
                                        className="block w-full border-slate-300 rounded-lg shadow-sm focus:ring-brand-500 focus:border-brand-500 sm:text-sm p-2.5 border"
                                        value={selectedProduct}
                                        onChange={(e) => setSelectedProduct(e.target.value)}
                                    >
                                        <option value="">-- Choose Product --</option>
                                        {products.map(p => (
                                            <option key={p.prod_code} value={p.prod_code} disabled={p.current_stock <= 0}>
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
                                <div className="sm:col-span-2 flex items-end">
                                    <button
                                        onClick={handleAddItem}
                                        disabled={!selectedProduct}
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
                                data={filteredInvoices}
                                columns={[
                                    {
                                        key: 'inv_number',
                                        label: 'Invoice #',
                                        render: (value) => <span className="font-medium text-brand-600">{value}</span>
                                    },
                                    {
                                        key: 'inv_date',
                                        label: 'Date',
                                        render: (value) => formatTableDate(value)
                                    },
                                    {
                                        key: 'cust_code',
                                        label: 'Customer'
                                    },
                                    {
                                        key: 'total_amount',
                                        label: 'Amount',
                                        render: (value) => `PKR ${value.toLocaleString()}`
                                    },
                                    {
                                        key: 'balance_due',
                                        label: 'Balance',
                                        render: (value) => `PKR ${value.toLocaleString()}`
                                    },
                                    {
                                        key: 'status',
                                        label: 'Status',
                                        render: (value) => (
                                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full
                                      ${value === 'PAID' ? 'bg-green-100 text-green-800' :
                                                    value === 'PENDING' ? 'bg-blue-100 text-blue-800' :
                                                        'bg-red-100 text-red-800'}`}>
                                                {value}
                                            </span>
                                        )
                                    }
                                ]}
                            />
                        </div>
                    </div>

                    {/* Sidebar Invoice Details */}
                    <div className="space-y-6">
                        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 lg:p-6">
                            <h2 className="text-lg font-bold text-slate-900 mb-4">Invoice Details</h2>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center">
                                        <User className="w-4 h-4 mr-2 text-slate-400" /> Customer
                                    </label>
                                    <select
                                        className="block w-full border-slate-300 rounded-lg shadow-sm focus:ring-brand-500 focus:border-brand-500 sm:text-sm p-2.5 border"
                                        value={selectedCustomer}
                                        onChange={(e) => setSelectedCustomer(e.target.value)}
                                    >
                                        <option value="">Select Customer</option>
                                        {customers.map(c => (
                                            <option key={c.cust_code} value={c.cust_code}>{c.cust_name}</option>
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

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
                                    <select
                                        className="block w-full border-slate-300 rounded-lg shadow-sm focus:ring-brand-500 focus:border-brand-500 sm:text-sm p-2.5 border"
                                        value={paymentStatus}
                                        onChange={(e) => setPaymentStatus(e.target.value as any)}
                                    >
                                        <option value="PENDING">Credit (Pending)</option>
                                        <option value="PAID">Cash (Paid)</option>
                                    </select>
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
                        ${cartItems.length > 0 && selectedCustomer ? 'bg-brand-600 text-white hover:bg-brand-700 shadow-brand-500/30' : 'bg-slate-100 text-slate-400 cursor-not-allowed'}`}
                                disabled={cartItems.length === 0 || !selectedCustomer}
                            >
                                <Check className="w-4 h-4 mr-2" />
                                Finalize Invoice
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Sales;