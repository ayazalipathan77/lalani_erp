import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Wallet, TrendingUp, TrendingDown, Search, FileText } from 'lucide-react';
import { useCompany } from '../../components/CompanyContext';
import { api } from '../../services/api';
import {
    SalesInvoice,
    SalesReturn,
    PurchaseInvoice,
    PaymentReceipt,
    SupplierPayment,
    Expense,
    CashTransaction,
    DiscountVoucher,
    LoanTaken,
    LoanReturn
} from '../../types';
import { formatTableDate } from '../../src/utils/dateUtils';
import MobileTable from '../../components/MobileTable';

interface VoucherTransaction {
    id: string;
    voucher_no: string;
    date: string;
    type: string;
    amount: number;
    description: string;
    link: string;
}

const VoucherSearch: React.FC = () => {
    const { selectedCompany } = useCompany();
    const [transactions, setTransactions] = useState<VoucherTransaction[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    // Financial summary
    const [currentBalance, setCurrentBalance] = useState(0);
    const [totalMoneyIn, setTotalMoneyIn] = useState(0);
    const [totalMoneyOut, setTotalMoneyOut] = useState(0);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            // Fetch all transaction types
            const [
                salesRes,
                returnsRes,
                purchasesRes,
                receiptsRes,
                paymentsRes,
                expensesRes,
                cashRes,
                loansRes
            ] = await Promise.all([
                api.invoices.getAll(1, 1000), // Large limit to get all
                Promise.resolve({ data: [] }), // salesReturns - placeholder
                api.purchaseInvoices.getAll(1, 1000),
                api.paymentReceipts.getAll(1, 1000),
                api.supplierPayments.getAll(1, 1000),
                api.finance.getExpenses(1, 1000),
                api.finance.getTransactions(1, 1000),
                api.finance.getLoans(1, 1000)
            ]);

            const voucherList: VoucherTransaction[] = [];

            // Process sales invoices
            salesRes.data.forEach((inv: SalesInvoice) => {
                voucherList.push({
                    id: `sales-${inv.inv_id}`,
                    voucher_no: inv.inv_number,
                    date: inv.inv_date,
                    type: 'Sales Invoice',
                    amount: inv.total_amount,
                    description: `Sale to ${inv.cust_code}`,
                    link: `/dashboard/sales/${inv.inv_id}`
                });
            });

            // Process sales returns
            returnsRes.data.forEach((ret: SalesReturn) => {
                voucherList.push({
                    id: `return-${ret.return_id}`,
                    voucher_no: ret.return_number,
                    date: ret.return_date,
                    type: 'Sales Return',
                    amount: ret.total_amount,
                    description: `Return from ${ret.cust_code}`,
                    link: `/dashboard/sales-returns/${ret.return_id}`
                });
            });

            // Process purchase invoices
            purchasesRes.data.forEach((pur: PurchaseInvoice) => {
                voucherList.push({
                    id: `purchase-${pur.purchase_id}`,
                    voucher_no: pur.purchase_number,
                    date: pur.purchase_date,
                    type: 'Purchase Invoice',
                    amount: pur.total_amount,
                    description: `Purchase from ${pur.supplier_code}`,
                    link: `/dashboard/purchase-invoices/${pur.purchase_id}`
                });
            });

            // Process payment receipts
            receiptsRes.data.forEach((rec: PaymentReceipt) => {
                voucherList.push({
                    id: `receipt-${rec.receipt_id}`,
                    voucher_no: rec.receipt_number,
                    date: rec.receipt_date,
                    type: 'Payment Receipt',
                    amount: rec.amount,
                    description: `Receipt from ${rec.cust_code}`,
                    link: `/dashboard/receipts/${rec.receipt_id}`
                });
            });

            // Process supplier payments
            paymentsRes.data.forEach((pay: SupplierPayment) => {
                voucherList.push({
                    id: `payment-${pay.payment_id}`,
                    voucher_no: pay.payment_number,
                    date: pay.payment_date,
                    type: 'Supplier Payment',
                    amount: pay.amount,
                    description: `Payment to ${pay.supplier_code}`,
                    link: `/dashboard/payments/${pay.payment_id}`
                });
            });

            // Process expenses
            expensesRes.data.forEach((exp: Expense) => {
                voucherList.push({
                    id: `expense-${exp.expense_id}`,
                    voucher_no: `EXP-${exp.expense_id}`,
                    date: exp.expense_date,
                    type: 'Expense',
                    amount: exp.amount,
                    description: exp.remarks,
                    link: `/dashboard/expenses/${exp.expense_id}`
                });
            });

            // Process cash transactions
            cashRes.data.forEach((cash: CashTransaction) => {
                const amount = cash.debit_amount || cash.credit_amount;
                voucherList.push({
                    id: `cash-${cash.trans_id}`,
                    voucher_no: `CB-${cash.trans_id}`,
                    date: cash.trans_date,
                    type: cash.trans_type,
                    amount: amount,
                    description: cash.description,
                    link: `/dashboard/finance/${cash.trans_id}`
                });
            });

            // Process loans
            loansRes.data.forEach((loan: LoanTaken) => {
                voucherList.push({
                    id: `loan-${loan.loan_id}`,
                    voucher_no: loan.loan_number,
                    date: loan.loan_date,
                    type: 'Loan Taken',
                    amount: loan.amount,
                    description: `Loan from ${loan.lender_name}`,
                    link: `/dashboard/finance/${loan.loan_id}` // Note: loans might not have a dedicated page, using finance for now
                });
            });

            // Sort by date descending
            voucherList.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

            setTransactions(voucherList);

            // Calculate financial summary from cash transactions
            const debit = cashRes.data.reduce((acc: number, t: CashTransaction) => acc + (t.debit_amount || 0), 0);
            const credit = cashRes.data.reduce((acc: number, t: CashTransaction) => acc + (t.credit_amount || 0), 0);
            setTotalMoneyIn(debit);
            setTotalMoneyOut(credit);
            setCurrentBalance(debit - credit);

        } catch (error) {
            console.error('Error fetching voucher data:', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [selectedCompany]);

    const filteredTransactions = transactions.filter(t =>
        t.voucher_no.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.description.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const formatNumber = (num: number): string => {
        if (num >= 1000000000) {
            return `PKR ${(num / 1000000000).toFixed(1)}B`;
        } else if (num >= 1000000) {
            return `PKR ${(num / 1000000).toFixed(1)}M`;
        } else if (num >= 1000) {
            return `PKR ${(num / 1000).toFixed(1)}K`;
        } else {
            return `PKR ${num.toLocaleString('en-PK', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Voucher Search</h1>
                    <p className="text-slate-500">Search and view all financial transactions and vouchers.</p>
                </div>
            </div>

            {/* Financial Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6 overflow-hidden">
                <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl p-6 text-white shadow-lg">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-white/10 rounded-lg">
                            <Wallet className="w-6 h-6 text-white" />
                        </div>
                        <span className="text-xs font-medium bg-white/20 px-2 py-1 rounded">Current Balance</span>
                    </div>
                    <p className="text-slate-300 text-sm">Net Cash Position</p>
                    <h3 className="text-3xl font-bold mt-1 font-mono">{formatNumber(currentBalance)}</h3>
                </div>

                <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-green-50 rounded-lg">
                            <TrendingUp className="w-6 h-6 text-green-600" />
                        </div>
                    </div>
                    <p className="text-slate-500 text-sm">Total Money In</p>
                    <h3 className="text-2xl font-bold mt-1 text-slate-900 font-mono">{formatNumber(totalMoneyIn)}</h3>
                </div>

                <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-red-50 rounded-lg">
                            <TrendingDown className="w-6 h-6 text-red-600" />
                        </div>
                    </div>
                    <p className="text-slate-500 text-sm">Total Money Out</p>
                    <h3 className="text-2xl font-bold mt-1 text-slate-900 font-mono">{formatNumber(totalMoneyOut)}</h3>
                </div>
            </div>

            {/* Search */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                <div className="flex items-center space-x-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                        <input
                            type="text"
                            placeholder="Search by voucher number, type, or description..."
                            className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            {/* Transactions Table */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-6 border-b border-slate-200">
                    <h3 className="text-lg font-bold text-slate-900">All Transactions ({filteredTransactions.length})</h3>
                </div>
                {isLoading ? (
                    <div className="p-8 text-center text-slate-500">Loading transactions...</div>
                ) : (
                    <>
                        <div className="overflow-x-auto hidden lg:block">
                            <table className="min-w-full divide-y divide-slate-200">
                                <thead className="bg-slate-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Date</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Voucher No</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Type</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Description</th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase">Amount</th>
                                        <th className="relative px-6 py-3">
                                            <span className="sr-only">Actions</span>
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-slate-200">
                                    {filteredTransactions.map((t) => (
                                        <tr key={t.id} className="hover:bg-slate-50">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{formatTableDate(t.date)}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">{t.voucher_no}</td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                                                    {t.type}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-slate-900">{t.description}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium text-slate-900">
                                                PKR {t.amount.toLocaleString('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                <Link
                                                    to={t.link}
                                                    className="text-brand-600 hover:text-brand-800 transition-colors flex items-center"
                                                >
                                                    <FileText className="w-4 h-4 mr-1" />
                                                    View
                                                </Link>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <MobileTable
                            data={filteredTransactions}
                            columns={[
                                {
                                    key: 'date',
                                    label: 'Date',
                                    render: (value) => formatTableDate(value)
                                },
                                {
                                    key: 'voucher_no',
                                    label: 'Voucher No'
                                },
                                {
                                    key: 'type',
                                    label: 'Type',
                                    render: (value) => (
                                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                                            {value}
                                        </span>
                                    )
                                },
                                {
                                    key: 'description',
                                    label: 'Description'
                                },
                                {
                                    key: 'amount',
                                    label: 'Amount',
                                    render: (value) => `PKR ${value.toLocaleString('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                                }
                            ]}
                        />
                    </>
                )}
            </div>
        </div>
    );
};

export default VoucherSearch;