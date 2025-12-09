import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Search, Plus, FileText, Check, Trash2, Calendar, User, ChevronLeft, Edit2 } from 'lucide-react';
import { useLoading } from '../../components/LoadingContext';
import { useNotification } from '../../components/NotificationContext';
import { useCompany } from '../../components/CompanyContext';
import { api } from '../../services/api';
import { SalesInvoiceItem, SalesInvoice, Product, Customer, SalesReturn, CashTransaction } from '../../types';
import { formatTableDate } from '../../src/utils/dateUtils';
import MobileTable from '../../components/MobileTable';

const Sales: React.FC = () => {
    const { selectedCompany } = useCompany();
    const { id } = useParams<{ id: string }>();
    const [view, setView] = useState<'list' | 'create' | 'view'>('list');
    const [invoices, setInvoices] = useState<SalesInvoice[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [taxRates, setTaxRates] = useState<any[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const { showLoader, hideLoader } = useLoading();
    const { showNotification } = useNotification();

    // View invoice state
    const [viewingInvoice, setViewingInvoice] = useState<SalesInvoice | null>(null);
    const [invoiceReturns, setInvoiceReturns] = useState<SalesReturn[]>([]);
    const [returnTransactions, setReturnTransactions] = useState<CashTransaction[]>([]);

    // Create Invoice State
    const [selectedCustomer, setSelectedCustomer] = useState('');
    const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split('T')[0]);
    const [paymentStatus, setPaymentStatus] = useState<'PENDING' | 'PAID'>('PENDING');
    const [cartItems, setCartItems] = useState<SalesInvoiceItem[]>([]);
    const [selectedProduct, setSelectedProduct] = useState('');
    const [qty, setQty] = useState(1);

    // Edit state
    const [editingInvoice, setEditingInvoice] = useState<SalesInvoice | null>(null);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const [invsResponse, prodsResponse, custsResponse, taxResponse] = await Promise.all([
                api.invoices.getAll(1, 50), // Get more invoices for sales page
                api.products.getAll(1, 100), // Get all products for dropdown
                api.customers.getAll(1, 100), // Get all customers for dropdown
                api.finance.getTaxRates() // Get all tax rates
            ]);
            setInvoices(Array.isArray(invsResponse.data) ? invsResponse.data : []);
            setProducts(Array.isArray(prodsResponse.data) ? prodsResponse.data : []);
            setCustomers(Array.isArray(custsResponse.data) ? custsResponse.data : []);
            setTaxRates(Array.isArray(taxResponse) ? taxResponse : []);
        } catch (e) {
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [selectedCompany]); // Refetch when company changes

    // Handle URL parameter for direct invoice viewing
    useEffect(() => {
        if (id && invoices.length > 0) {
            const invoice = invoices.find(inv => inv.inv_id.toString() === id);
            if (invoice) {
                handleViewInvoice(invoice);
            }
        }
    }, [id, invoices]);

    // Calculations
    const subtotal = cartItems.reduce((acc, item) => acc + item.line_total, 0);

    // Calculate tax dynamically based on product tax rates
    const calculateTax = () => {
        return cartItems.reduce((totalTax, item) => {
            const product = products.find(p => p.prod_code === item.prod_code);
            if (product && product.tax_code) {
                const taxRate = taxRates.find(tr => tr.tax_code === product.tax_code);
                if (taxRate) {
                    return totalTax + (item.line_total * (taxRate.tax_rate / 100));
                }
            }
            // Fallback to 5% if tax rate not found
            return totalTax + (item.line_total * 0.05);
        }, 0);
    };

    const tax = calculateTax();
    const total = subtotal + tax;

    const handleAddItem = () => {
        if (!selectedProduct || qty <= 0) return;
        const product = products.find(p => p.prod_code === selectedProduct);
        if (!product) return;

        // Check Stock
        if (product.current_stock < qty) {
            showNotification(`Insufficient stock! Available: ${product.current_stock}`, "error");
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
            showLoader(editingInvoice ? 'Updating invoice...' : 'Creating invoice...');
            if (editingInvoice) {
                await api.invoices.update(editingInvoice.inv_id, {
                    cust_code: selectedCustomer,
                    items: cartItems,
                    inv_date: invoiceDate,
                    status: paymentStatus
                });
                showNotification("Invoice Updated Successfully!", "success");
            } else {
                await api.invoices.create({
                    cust_code: selectedCustomer,
                    items: cartItems,
                    date: invoiceDate,
                    status: paymentStatus
                });
                showNotification("Invoice Created Successfully!", "success");
            }

            // Reset
            setCartItems([]);
            setSelectedCustomer('');
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

    const handleEditInvoice = (invoice: SalesInvoice) => {
        setEditingInvoice(invoice);
        setSelectedCustomer(invoice.cust_code);
        setInvoiceDate(invoice.inv_date.split('T')[0]);
        setPaymentStatus(invoice.status === 'PAID' ? 'PAID' : 'PENDING');
        setCartItems(invoice.items || []);
        setView('create');
    };

    const handleViewInvoice = async (invoice: SalesInvoice) => {
        setViewingInvoice(invoice);
        setIsLoading(true);

        try {
            // Fetch returns for this invoice
            const returnsResponse = await api.salesReturns.getAll(1, 100); // Get all returns, we'll filter client-side
            const returnsForInvoice = returnsResponse.data.filter((ret: SalesReturn) => ret.inv_id === invoice.inv_id);
            setInvoiceReturns(returnsForInvoice);

            // Fetch cash transactions related to returns
            const transactionsResponse = await api.finance.getTransactions(1, 100);
            const returnTransactions = transactionsResponse.data.filter((trans: CashTransaction) =>
                trans.description.includes('Return') ||
                trans.description.includes('RTN-') ||
                returnsForInvoice.some(ret => trans.description.includes(ret.return_number))
            );
            setReturnTransactions(returnTransactions);

        } catch (error) {
            console.error('Error fetching invoice details:', error);
            showNotification('Error loading invoice details', 'error');
        } finally {
            setIsLoading(false);
        }

        setView('view');
    };

    // Helper function to get customer name from code
    const getCustomerName = (custCode: string) => {
        const customer = customers.find(c => c.cust_code === custCode);
        return customer ? customer.cust_name : custCode;
    };

    const filteredInvoices = (Array.isArray(invoices) ? invoices : []).filter(inv =>
        inv.inv_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        getCustomerName(inv.cust_code).toLowerCase().includes(searchTerm.toLowerCase())
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

            {(() => {
                switch (view) {
                    case 'list':
                        return (
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
                                                <th className="relative px-6 py-3">
                                                    <span className="sr-only">Actions</span>
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-slate-200">
                                            {isLoading ? (
                                                <tr><td colSpan={8} className="text-center py-8 text-slate-500">Loading invoices...</td></tr>
                                            ) : filteredInvoices.length === 0 ? (
                                                <tr><td colSpan={8} className="text-center py-8 text-slate-500">No invoices found.</td></tr>
                                            ) : filteredInvoices.map((inv) => (
                                                <tr key={inv.inv_id} className="hover:bg-slate-50 transition-colors">
                                                    <td className="px-3 lg:px-6 py-4 whitespace-nowrap text-sm font-medium text-brand-600">{inv.inv_number}</td>
                                                    <td className="px-3 lg:px-6 py-4 whitespace-nowrap text-sm text-slate-500">{formatTableDate(inv.inv_date)}</td>
                                                    <td className="px-3 lg:px-6 py-4 whitespace-nowrap text-sm text-slate-900">{getCustomerName(inv.cust_code)}</td>
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
                                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                        <div className="flex items-center justify-end space-x-2">
                                                            <button
                                                                onClick={() => handleViewInvoice(inv)}
                                                                className="text-slate-400 hover:text-blue-600 transition-colors"
                                                                title="View Invoice"
                                                            >
                                                                <FileText className="w-4 h-4" />
                                                            </button>
                                                            <button
                                                                onClick={() => handleEditInvoice(inv)}
                                                                className="text-slate-400 hover:text-brand-600 transition-colors"
                                                                title="Edit Invoice"
                                                            >
                                                                <Edit2 className="w-4 h-4" />
                                                            </button>
                                                        </div>
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
                                            label: 'Customer',
                                            render: (value) => getCustomerName(value)
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
                        );

                    case 'create':
                        return (
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
                                                        <th className="px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase">Tax Rate</th>
                                                        <th className="px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase">Tax Amount</th>
                                                        <th className="px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase">Total</th>
                                                        <th className="px-4 py-3"></th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-200 bg-white">
                                                    {cartItems.length === 0 ? (
                                                        <tr>
                                                            <td colSpan={7} className="px-4 py-8 text-center text-slate-400 text-sm">
                                                                No items added yet.
                                                            </td>
                                                        </tr>
                                                    ) : (
                                                        cartItems.map((item, idx) => {
                                                            const product = products.find(p => p.prod_code === item.prod_code);
                                                            const taxRateInfo = product?.tax_code ? taxRates.find(tr => tr.tax_code === product.tax_code) : null;
                                                            const itemTaxRate = taxRateInfo ? taxRateInfo.tax_rate : 5; // Default to 5%
                                                            const itemTaxAmount = item.line_total * (itemTaxRate / 100);

                                                            return (
                                                                <tr key={idx}>
                                                                    <td className="px-4 py-3 text-sm text-slate-900">{item.prod_name}</td>
                                                                    <td className="px-4 py-3 text-sm text-slate-900 text-right">{item.quantity}</td>
                                                                    <td className="px-4 py-3 text-sm text-slate-500 text-right">{item.unit_price.toLocaleString()}</td>
                                                                    <td className="px-4 py-3 text-sm text-slate-500 text-right">{itemTaxRate}%</td>
                                                                    <td className="px-4 py-3 text-sm text-slate-500 text-right">{itemTaxAmount.toLocaleString()}</td>
                                                                    <td className="px-4 py-3 text-sm font-medium text-slate-900 text-right">{item.line_total.toLocaleString()}</td>
                                                                    <td className="px-4 py-3 text-right">
                                                                        <button onClick={() => handleRemoveItem(idx)} className="text-red-400 hover:text-red-600">
                                                                            <Trash2 className="w-4 h-4" />
                                                                        </button>
                                                                    </td>
                                                                </tr>
                                                            );
                                                        })
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
                                        <div className="flex justify-between items-center mb-4">
                                            <h2 className="text-lg font-bold text-slate-900">Invoice Details</h2>
                                            <button onClick={() => setView('list')} className="text-sm text-slate-500 hover:text-slate-800 flex items-center">
                                                <ChevronLeft className="w-4 h-4 mr-1" /> Back to List
                                            </button>
                                        </div>

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
                                                <span>Tax Amount</span>
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
                                            {editingInvoice ? 'Update Invoice' : 'Finalize Invoice'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );

                    case 'view':
                        return viewingInvoice ? (
                            /* VIEW INVOICE DETAILS */
                            <div className="space-y-6">
                                {/* Header */}
                                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 lg:p-6">
                                    <div className="flex justify-between items-center mb-6">
                                        <div>
                                            <h2 className="text-2xl font-bold text-slate-900">Invoice {viewingInvoice.inv_number}</h2>
                                            <p className="text-slate-500">Invoice details and related information</p>
                                        </div>
                                        <button onClick={() => setView('list')} className="text-sm text-slate-500 hover:text-slate-800 flex items-center">
                                            <ChevronLeft className="w-4 h-4 mr-1" /> Back to List
                                        </button>
                                    </div>

                                    {/* Invoice Summary */}
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                                        <div className="bg-slate-50 rounded-lg p-4">
                                            <h3 className="text-sm font-medium text-slate-500 mb-2">Invoice Details</h3>
                                            <div className="space-y-2">
                                                <div className="flex justify-between">
                                                    <span className="text-sm text-slate-600">Date:</span>
                                                    <span className="text-sm font-medium">{formatTableDate(viewingInvoice.inv_date)}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-sm text-slate-600">Customer:</span>
                                                    <span className="text-sm font-medium">{getCustomerName(viewingInvoice.cust_code)}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-sm text-slate-600">Status:</span>
                                                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full
                                                        ${viewingInvoice.status === 'PAID' ? 'bg-green-100 text-green-800' :
                                                            viewingInvoice.status === 'PENDING' ? 'bg-blue-100 text-blue-800' :
                                                                'bg-red-100 text-red-800'}`}>
                                                        {viewingInvoice.status}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="bg-slate-50 rounded-lg p-4">
                                            <h3 className="text-sm font-medium text-slate-500 mb-2">Financial Summary</h3>
                                            <div className="space-y-2">
                                                <div className="flex justify-between">
                                                    <span className="text-sm text-slate-600">Total Amount:</span>
                                                    <span className="text-sm font-medium">PKR {viewingInvoice.total_amount.toLocaleString()}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-sm text-slate-600">Balance Due:</span>
                                                    <span className="text-sm font-medium text-slate-500">PKR {viewingInvoice.balance_due.toLocaleString()}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-sm text-slate-600">Tax Amount:</span>
                                                    <span className="text-sm font-medium">PKR {(viewingInvoice.tax_amount || 0).toLocaleString()}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="bg-slate-50 rounded-lg p-4">
                                            <h3 className="text-sm font-medium text-slate-500 mb-2">Returns Summary</h3>
                                            <div className="space-y-2">
                                                <div className="flex justify-between">
                                                    <span className="text-sm text-slate-600">Total Returns:</span>
                                                    <span className="text-sm font-medium">{invoiceReturns.length}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-sm text-slate-600">Return Amount:</span>
                                                    <span className="text-sm font-medium">PKR {invoiceReturns.reduce((sum, ret) => sum + ret.total_amount, 0).toLocaleString()}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-sm text-slate-600">Cash Transactions:</span>
                                                    <span className="text-sm font-medium">{returnTransactions.length}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Invoice Items */}
                                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 lg:p-6">
                                    <h3 className="text-lg font-bold text-slate-900 mb-4">Invoice Items</h3>
                                    <div className="overflow-x-auto">
                                        <table className="min-w-full divide-y divide-slate-200">
                                            <thead className="bg-slate-50">
                                                <tr>
                                                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Product</th>
                                                    <th className="px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase">Qty</th>
                                                    <th className="px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase">Price</th>
                                                    <th className="px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase">Total</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-200 bg-white">
                                                {viewingInvoice.items?.map((item, idx) => (
                                                    <tr key={idx}>
                                                        <td className="px-4 py-3 text-sm text-slate-900">{item.prod_name}</td>
                                                        <td className="px-4 py-3 text-sm text-slate-900 text-right">{item.quantity}</td>
                                                        <td className="px-4 py-3 text-sm text-slate-500 text-right">PKR {item.unit_price.toLocaleString()}</td>
                                                        <td className="px-4 py-3 text-sm font-medium text-slate-900 text-right">PKR {item.line_total.toLocaleString()}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>

                                {/* Returns Section */}
                                {invoiceReturns.length > 0 && (
                                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 lg:p-6">
                                        <h3 className="text-lg font-bold text-slate-900 mb-4">Returns on this Invoice</h3>
                                        <div className="space-y-4">
                                            {invoiceReturns.map((ret) => (
                                                <div key={ret.return_id} className="border border-slate-200 rounded-lg overflow-hidden">
                                                    {/* Return Header */}
                                                    <div className="bg-slate-50 px-4 py-3 border-b border-slate-200">
                                                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                                            <div>
                                                                <span className="text-xs font-medium text-slate-500 uppercase">Return #</span>
                                                                <p className="text-sm font-medium text-brand-600">{ret.return_number}</p>
                                                            </div>
                                                            <div>
                                                                <span className="text-xs font-medium text-slate-500 uppercase">Date</span>
                                                                <p className="text-sm text-slate-900">{formatTableDate(ret.return_date)}</p>
                                                            </div>
                                                            <div>
                                                                <span className="text-xs font-medium text-slate-500 uppercase">Amount</span>
                                                                <p className="text-sm font-medium text-slate-900">PKR {ret.total_amount.toLocaleString()}</p>
                                                            </div>
                                                            <div>
                                                                <span className="text-xs font-medium text-slate-500 uppercase">Status</span>
                                                                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full
                                                                    ${ret.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                                                                        ret.status === 'PENDING' ? 'bg-blue-100 text-blue-800' :
                                                                            'bg-red-100 text-red-800'}`}>
                                                                    {ret.status}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Return Items */}
                                                    {ret.items && ret.items.length > 0 && (
                                                        <div className="p-4">
                                                            <h4 className="text-sm font-medium text-slate-700 mb-3">Returned Items</h4>
                                                            <div className="overflow-x-auto">
                                                                <table className="min-w-full divide-y divide-slate-200">
                                                                    <thead className="bg-slate-25">
                                                                        <tr>
                                                                            <th className="px-3 py-2 text-left text-xs font-medium text-slate-500 uppercase">Product</th>
                                                                            <th className="px-3 py-2 text-right text-xs font-medium text-slate-500 uppercase">Qty</th>
                                                                            <th className="px-3 py-2 text-right text-xs font-medium text-slate-500 uppercase">Price</th>
                                                                            <th className="px-3 py-2 text-right text-xs font-medium text-slate-500 uppercase">Total</th>
                                                                        </tr>
                                                                    </thead>
                                                                    <tbody className="divide-y divide-slate-200 bg-white">
                                                                        {ret.items.map((item, idx) => (
                                                                            <tr key={idx}>
                                                                                <td className="px-3 py-2 text-sm text-slate-900">{item.prod_name}</td>
                                                                                <td className="px-3 py-2 text-sm text-slate-900 text-right">{item.quantity}</td>
                                                                                <td className="px-3 py-2 text-sm text-slate-500 text-right">PKR {item.unit_price.toLocaleString()}</td>
                                                                                <td className="px-3 py-2 text-sm font-medium text-slate-900 text-right">PKR {item.line_total.toLocaleString()}</td>
                                                                            </tr>
                                                                        ))}
                                                                    </tbody>
                                                                </table>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Cash Balance Summary */}
                                {returnTransactions.length > 0 && (
                                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 lg:p-6">
                                        <h3 className="text-lg font-bold text-slate-900 mb-4">Cash Balance Summary (Returns)</h3>
                                        <div className="overflow-x-auto">
                                            <table className="min-w-full divide-y divide-slate-200">
                                                <thead className="bg-slate-50">
                                                    <tr>
                                                        <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Date</th>
                                                        <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Type</th>
                                                        <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Description</th>
                                                        <th className="px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase">Debit</th>
                                                        <th className="px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase">Credit</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-200 bg-white">
                                                    {returnTransactions.map((trans) => (
                                                        <tr key={trans.trans_id}>
                                                            <td className="px-4 py-3 text-sm text-slate-500">{formatTableDate(trans.trans_date)}</td>
                                                            <td className="px-4 py-3 text-sm text-slate-900">{trans.trans_type}</td>
                                                            <td className="px-4 py-3 text-sm text-slate-900">{trans.description}</td>
                                                            <td className="px-4 py-3 text-sm text-right font-medium text-green-600">
                                                                {trans.debit_amount > 0 ? `PKR ${trans.debit_amount.toLocaleString()}` : '-'}
                                                            </td>
                                                            <td className="px-4 py-3 text-sm text-right font-medium text-red-600">
                                                                {trans.credit_amount > 0 ? `PKR ${trans.credit_amount.toLocaleString()}` : '-'}
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="text-center py-8 text-slate-500">Loading invoice details...</div>
                        );

                    default:
                        return null;
                }
            })()}
        </div>
    );
};

export default Sales;