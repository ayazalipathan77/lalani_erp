import React, { useState, useEffect } from 'react';
import { Search, Plus, FileText, Check, Trash2, Calendar, User, ChevronLeft, Edit2, Undo2 } from 'lucide-react';
import { useLoading } from '../../components/LoadingContext';
import { useNotification } from '../../components/NotificationContext';
import { api } from '../../services/api';
import { SalesReturn, SalesReturnItem, SalesInvoice, Product, Customer } from '../../types';
import { formatTableDate } from '../../src/utils/dateUtils';
import MobileTable from '../../components/MobileTable';

const SalesReturns: React.FC = () => {
    const [view, setView] = useState<'list' | 'create'>('list');
    const [returns, setReturns] = useState<SalesReturn[]>([]);
    const [invoices, setInvoices] = useState<SalesInvoice[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const { showLoader, hideLoader } = useLoading();
    const { showNotification } = useNotification();

    // Create Return State
    const [selectedInvoice, setSelectedInvoice] = useState('');
    const [returnDate, setReturnDate] = useState(new Date().toISOString().split('T')[0]);
    const [returnItems, setReturnItems] = useState<SalesReturnItem[]>([]);
    const [selectedProduct, setSelectedProduct] = useState('');
    const [qty, setQty] = useState(1);

    // Edit state
    const [editingReturn, setEditingReturn] = useState<SalesReturn | null>(null);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const [returnsResponse, invsResponse, prodsResponse, custsResponse] = await Promise.all([
                api.salesReturns.getAll(1, 50),
                api.invoices.getAll(1, 100),
                api.products.getAll(1, 100),
                api.customers.getAll(1, 100)
            ]);
            setReturns(Array.isArray(returnsResponse.data) ? returnsResponse.data : []);
            setInvoices(Array.isArray(invsResponse.data) ? invsResponse.data : []);
            setProducts(Array.isArray(prodsResponse.data) ? prodsResponse.data : []);
            setCustomers(Array.isArray(custsResponse.data) ? custsResponse.data : []);
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
    const subtotal = returnItems.reduce((acc, item) => acc + item.line_total, 0);
    const tax = subtotal * 0.05; // 5% tax example
    const total = subtotal + tax;

    const handleAddItem = () => {
        if (!selectedProduct || qty <= 0) return;
        const product = products.find(p => p.prod_code === selectedProduct);
        if (!product) return;

        // Check if product was in original invoice
        const invoice = invoices.find(inv => inv.inv_number === selectedInvoice);
        if (!invoice) {
            showNotification("Please select an invoice first", "error");
            return;
        }

        const originalItem = invoice.items?.find(item => item.prod_code === product.prod_code);
        if (!originalItem) {
            showNotification("This product was not in the original invoice", "error");
            return;
        }

        // Check if return quantity exceeds original quantity
        const existingReturnItem = returnItems.find(item => item.prod_code === product.prod_code);
        const totalReturnQty = (existingReturnItem?.quantity || 0) + qty;

        if (totalReturnQty > originalItem.quantity) {
            showNotification(`Cannot return more than original quantity (${originalItem.quantity})`, "error");
            return;
        }

        const newItem: SalesReturnItem = {
            prod_code: product.prod_code,
            prod_name: product.prod_name,
            quantity: qty,
            unit_price: originalItem.unit_price,
            line_total: originalItem.unit_price * qty
        };

        setReturnItems([...returnItems, newItem]);
        setSelectedProduct('');
        setQty(1);
    };

    const handleRemoveItem = (index: number) => {
        const newItems = [...returnItems];
        newItems.splice(index, 1);
        setReturnItems(newItems);
    };

    const handleFinalizeReturn = async () => {
        if (!selectedInvoice || returnItems.length === 0) return;

        try {
            showLoader(editingReturn ? 'Updating return...' : 'Creating return...');

            const invoice = invoices.find(inv => inv.inv_number === selectedInvoice);
            if (!invoice) {
                showNotification("Selected invoice not found", "error");
                return;
            }

            if (editingReturn) {
                // Update logic would go here
                showNotification("Return update not yet implemented", "warning");
            } else {
                await api.salesReturns.create({
                    inv_id: invoice.inv_id,
                    items: returnItems,
                    return_date: returnDate
                });
                showNotification("Return Created Successfully!", "success");
            }

            // Reset
            setReturnItems([]);
            setSelectedInvoice('');
            setEditingReturn(null);
            setView('list');
            await fetchData(); // Refresh list
        } catch (error) {
            console.error("Failed to save return", error);
            showNotification("Failed to save return. Please try again.", "error");
        } finally {
            hideLoader();
        }
    };

    const handleEditReturn = (returnItem: SalesReturn) => {
        setEditingReturn(returnItem);
        const invoice = invoices.find(inv => inv.inv_id === returnItem.inv_id);
        if (invoice) {
            setSelectedInvoice(invoice.inv_number);
        }
        setReturnDate(returnItem.return_date.split('T')[0]);
        setReturnItems(returnItem.items || []);
        setView('create');
    };

    // Helper function to get customer name from code
    const getCustomerName = (custCode: string) => {
        const customer = customers.find(c => c.cust_code === custCode);
        return customer ? customer.cust_name : custCode;
    };

    // Helper function to get invoice number from ID
    const getInvoiceNumber = (invId: number) => {
        const invoice = invoices.find(inv => inv.inv_id === invId);
        return invoice ? invoice.inv_number : `INV-${invId}`;
    };

    const filteredReturns = (Array.isArray(returns) ? returns : []).filter(ret =>
        ret.return_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        getCustomerName(ret.cust_code).toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-4 lg:space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Sales Returns</h1>
                    <p className="text-slate-500">Manage customer returns and refunds.</p>
                </div>
                {view === 'list' && (
                    <button
                        onClick={() => setView('create')}
                        className="bg-brand-600 text-white px-4 py-2 rounded-lg flex items-center hover:bg-brand-700 transition-colors shadow-sm"
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        New Return
                    </button>
                )}
            </div>

            {view === 'list' ? (
                /* RETURNS LIST VIEW */
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="p-3 lg:p-4 border-b border-slate-200 bg-slate-50 flex flex-col sm:flex-row gap-4 justify-between items-center">
                        <div className="relative w-full sm:w-96">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Search className="h-5 w-5 text-slate-400" />
                            </div>
                            <input
                                type="text"
                                className="block w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg leading-5 bg-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 sm:text-sm"
                                placeholder="Search returns..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="overflow-x-auto hidden lg:block">
                        <table className="min-w-full divide-y divide-slate-200">
                            <thead className="bg-slate-50">
                                <tr>
                                    <th className="px-3 lg:px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Return #</th>
                                    <th className="px-3 lg:px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Date</th>
                                    <th className="px-3 lg:px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Invoice</th>
                                    <th className="px-3 lg:px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Customer</th>
                                    <th className="px-3 lg:px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Amount</th>
                                    <th className="px-3 lg:px-6 py-3 text-center text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
                                    <th className="relative px-6 py-3">
                                        <span className="sr-only">Actions</span>
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-slate-200">
                                {isLoading ? (
                                    <tr><td colSpan={8} className="text-center py-8 text-slate-500">Loading returns...</td></tr>
                                ) : filteredReturns.length === 0 ? (
                                    <tr><td colSpan={8} className="text-center py-8 text-slate-500">No returns found.</td></tr>
                                ) : filteredReturns.map((ret) => (
                                    <tr key={ret.return_id} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-3 lg:px-6 py-4 whitespace-nowrap text-sm font-medium text-brand-600">{ret.return_number}</td>
                                        <td className="px-3 lg:px-6 py-4 whitespace-nowrap text-sm text-slate-500">{formatTableDate(ret.return_date)}</td>
                                        <td className="px-3 lg:px-6 py-4 whitespace-nowrap text-sm text-brand-600">{getInvoiceNumber(ret.inv_id)}</td>
                                        <td className="px-3 lg:px-6 py-4 whitespace-nowrap text-sm text-slate-900">{getCustomerName(ret.cust_code)}</td>
                                        <td className="px-3 lg:px-6 py-4 whitespace-nowrap text-sm text-right font-mono">{ret.total_amount.toLocaleString()}</td>
                                        <td className="px-3 lg:px-6 py-4 whitespace-nowrap text-center">
                                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full
                        ${ret.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                                                    ret.status === 'PENDING' ? 'bg-blue-100 text-blue-800' :
                                                        'bg-red-100 text-red-800'}`}>
                                                {ret.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <button
                                                onClick={() => handleEditReturn(ret)}
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
                        data={filteredReturns}
                        columns={[
                            {
                                key: 'return_number',
                                label: 'Return #',
                                render: (value) => <span className="font-medium text-brand-600">{value}</span>
                            },
                            {
                                key: 'return_date',
                                label: 'Date',
                                render: (value) => formatTableDate(value)
                            },
                            {
                                key: 'inv_id',
                                label: 'Invoice',
                                render: (value) => getInvoiceNumber(value)
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
                                key: 'status',
                                label: 'Status',
                                render: (value) => (
                                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full
                              ${value === 'COMPLETED' ? 'bg-green-100 text-green-800' :
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
                /* CREATE RETURN VIEW */
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6 overflow-hidden">
                    <div className="lg:col-span-2 space-y-6">
                        {/* Product Selection Card */}
                        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 lg:p-6">
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-lg font-bold text-slate-900">Add Return Items</h2>
                                <button onClick={() => setView('list')} className="text-sm text-slate-500 hover:text-slate-800 flex items-center">
                                    <ChevronLeft className="w-4 h-4 mr-1" /> Back to List
                                </button>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 mb-4">
                                <div className="sm:col-span-4">
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Select Invoice</label>
                                    <select
                                        className="block w-full border-slate-300 rounded-lg shadow-sm focus:ring-brand-500 focus:border-brand-500 sm:text-sm p-2.5 border"
                                        value={selectedInvoice}
                                        onChange={(e) => setSelectedInvoice(e.target.value)}
                                    >
                                        <option value="">-- Choose Invoice --</option>
                                        {invoices.map(inv => (
                                            <option key={inv.inv_id} value={inv.inv_number}>
                                                {inv.inv_number} - {getCustomerName(inv.cust_code)}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div className="sm:col-span-3">
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Select Product</label>
                                    <select
                                        className="block w-full border-slate-300 rounded-lg shadow-sm focus:ring-brand-500 focus:border-brand-500 sm:text-sm p-2.5 border"
                                        value={selectedProduct}
                                        onChange={(e) => setSelectedProduct(e.target.value)}
                                        disabled={!selectedInvoice}
                                    >
                                        <option value="">-- Choose Product --</option>
                                        {selectedInvoice && products.map(p => {
                                            const invoice = invoices.find(inv => inv.inv_number === selectedInvoice);
                                            const hasProduct = invoice?.items?.some(item => item.prod_code === p.prod_code);
                                            return hasProduct ? (
                                                <option key={p.prod_code} value={p.prod_code}>
                                                    {p.prod_name}
                                                </option>
                                            ) : null;
                                        })}
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
                                <div className="sm:col-span-3 flex items-end">
                                    <button
                                        onClick={handleAddItem}
                                        disabled={!selectedProduct || qty <= 0}
                                        className="w-full bg-slate-900 text-white px-4 py-2.5 rounded-lg hover:bg-slate-800 transition-colors flex items-center justify-center disabled:opacity-50"
                                    >
                                        <Plus className="w-4 h-4 mr-2" />
                                        Add to Return
                                    </button>
                                </div>
                            </div>

                            {/* Return Items Table */}
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
                                        {returnItems.length === 0 ? (
                                            <tr>
                                                <td colSpan={5} className="px-4 py-8 text-center text-slate-400 text-sm">
                                                    No items added yet.
                                                </td>
                                            </tr>
                                        ) : (
                                            returnItems.map((item, idx) => (
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
                                data={returnItems}
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

                    {/* Sidebar Return Details */}
                    <div className="space-y-6">
                        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 lg:p-6">
                            <h2 className="text-lg font-bold text-slate-900 mb-4">Return Details</h2>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center">
                                        <Calendar className="w-4 h-4 mr-2 text-slate-400" /> Date
                                    </label>
                                    <input
                                        type="date"
                                        className="block w-full border-slate-300 rounded-lg shadow-sm focus:ring-brand-500 focus:border-brand-500 sm:text-sm p-2.5 border"
                                        value={returnDate}
                                        onChange={(e) => setReturnDate(e.target.value)}
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
                                    <span>Total Refund</span>
                                    <span>PKR {total.toLocaleString()}</span>
                                </div>
                            </div>

                            <button
                                onClick={handleFinalizeReturn}
                                className={`w-full mt-6 py-3 px-4 rounded-lg font-medium shadow-lg transition-all flex items-center justify-center
                        ${returnItems.length > 0 && selectedInvoice ? 'bg-brand-600 text-white hover:bg-brand-700 shadow-brand-500/30' : 'bg-slate-100 text-slate-400 cursor-not-allowed'}`}
                                disabled={returnItems.length === 0 || !selectedInvoice}
                            >
                                <Check className="w-4 h-4 mr-2" />
                                {editingReturn ? 'Update Return' : 'Finalize Return'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SalesReturns;