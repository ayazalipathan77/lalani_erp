
import React, { useState, useEffect, useRef } from 'react';
import {
  FileText,
  Download,
  Printer,
  Calendar,
  Filter,
  BarChart3,
  PieChart,
  Package,
  Users,
  Loader2
} from 'lucide-react';
import { api } from '../../services/api';
import { Product, SalesInvoice, Customer, Supplier, Expense, CashTransaction } from '../../types';
import { formatTableDate } from '../../src/utils/dateUtils';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import MobileTable from '../../components/MobileTable';

type ReportType =
  | 'SALES_SUMMARY'
  | 'SALES_BY_PRODUCT'
  | 'INVENTORY_VALUATION'
  | 'LOW_STOCK'
  | 'CUSTOMER_BALANCES'
  | 'VENDOR_BALANCES'
  | 'EXPENSE_BREAKDOWN'
  | 'TRANSACTION_HISTORY';

interface ReportColumn {
  header: string;
  accessor: string; // key of data object
  format?: 'currency' | 'number' | 'date';
}

const Reports: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState<'SALES' | 'INVENTORY' | 'FINANCE' | 'PARTNERS'>('SALES');
  const [reportType, setReportType] = useState<ReportType>('SALES_SUMMARY');

  // Set default start date back to coverage of mock data (2023)
  const [startDate, setStartDate] = useState('2023-01-01');
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);

  // Data State
  const [reportData, setReportData] = useState<any[]>([]);
  const [columns, setColumns] = useState<ReportColumn[]>([]);
  const [summaryMetrics, setSummaryMetrics] = useState<{ label: string, value: string }[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  // Raw Data Cache
  const [rawProducts, setRawProducts] = useState<Product[]>([]);
  const [rawInvoices, setRawInvoices] = useState<SalesInvoice[]>([]);
  const [rawCustomers, setRawCustomers] = useState<Customer[]>([]);
  const [rawSuppliers, setRawSuppliers] = useState<Supplier[]>([]);
  const [rawExpenses, setRawExpenses] = useState<Expense[]>([]);
  const [rawTransactions, setRawTransactions] = useState<CashTransaction[]>([]);

  // Ref for PDF generation
  const reportContentRef = useRef<HTMLDivElement>(null);

  // Fetch initial data
  useEffect(() => {
    const loadData = async () => {
      try {
        const [pResponse, iResponse, cResponse, sResponse, eResponse, tResponse] = await Promise.all([
          api.products.getAll(1, 1000), // Get all products for reports
          api.invoices.getAll(1, 1000), // Get all invoices for reports
          api.customers.getAll(1, 1000), // Get all customers for reports
          api.suppliers.getAll(1, 1000), // Get all suppliers for reports
          api.finance.getExpenses(1, 1000), // Get all expenses for reports
          api.finance.getTransactions(1, 1000) // Get all transactions for reports
        ]);
        setRawProducts(pResponse.data);
        setRawInvoices(iResponse.data);
        setRawCustomers(cResponse.data);
        setRawSuppliers(sResponse.data);
        setRawExpenses(eResponse.data);
        setRawTransactions(tResponse.data);
      } catch (err) {
        console.error("Failed to load report data", err);
      }
    };
    loadData();
  }, []);

  // Generate Report Logic
  useEffect(() => {
    generateReport();
  }, [reportType, startDate, endDate, rawProducts, rawInvoices, rawTransactions]);

  const generateReport = () => {
    setIsLoading(true);
    let data: any[] = [];
    let cols: ReportColumn[] = [];
    let metrics: { label: string, value: string }[] = [];

    // Filter Helpers
    const dateFilter = (dateStr: string) => dateStr >= startDate && dateStr <= endDate;

    switch (reportType) {
      case 'SALES_SUMMARY':
        cols = [
          { header: 'Date', accessor: 'date', format: 'date' },
          { header: 'Invoice #', accessor: 'inv_number' },
          { header: 'Customer', accessor: 'cust_code' },
          { header: 'Status', accessor: 'status' },
          { header: 'Amount', accessor: 'amount', format: 'currency' },
        ];

        const filteredInvoices = rawInvoices.filter(i => dateFilter(i.inv_date));
        data = filteredInvoices.map(i => ({
          date: i.inv_date,
          inv_number: i.inv_number,
          cust_code: i.cust_code,
          status: i.status,
          amount: i.total_amount
        }));

        const totalSales = filteredInvoices.reduce((sum, i) => {
          const amount = typeof i.total_amount === 'string' ? parseFloat(i.total_amount) : Number(i.total_amount);
          return sum + (isNaN(amount) ? 0 : amount);
        }, 0);

        const paidSales = filteredInvoices.filter(i => i.status === 'PAID').reduce((sum, i) => {
          const amount = typeof i.total_amount === 'string' ? parseFloat(i.total_amount) : Number(i.total_amount);
          return sum + (isNaN(amount) ? 0 : amount);
        }, 0);

        metrics = [
          { label: 'Total Revenue', value: `PKR ${totalSales.toLocaleString('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` },
          { label: 'Cash Collected', value: `PKR ${paidSales.toLocaleString('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` },
          { label: 'Invoices Count', value: filteredInvoices.length.toString() }
        ];
        break;

      case 'SALES_BY_PRODUCT':
        cols = [
          { header: 'Product Code', accessor: 'code' },
          { header: 'Product Name', accessor: 'name' },
          { header: 'Qty Sold', accessor: 'qty', format: 'number' },
          { header: 'Total Revenue', accessor: 'revenue', format: 'currency' },
        ];

        // Aggregate items
        const productSales: Record<string, { name: string, qty: number, revenue: number }> = {};
        rawInvoices.filter(i => dateFilter(i.inv_date)).forEach(inv => {
          inv.items?.forEach(item => {
            if (!productSales[item.prod_code]) {
              productSales[item.prod_code] = { name: item.prod_name || item.prod_code, qty: 0, revenue: 0 };
            }
            productSales[item.prod_code].qty += item.quantity;
            productSales[item.prod_code].revenue += item.line_total;
          });
        });

        data = Object.keys(productSales).map(code => ({
          code,
          name: productSales[code].name,
          qty: productSales[code].qty,
          revenue: productSales[code].revenue
        })).sort((a, b) => b.revenue - a.revenue); // Sort by best seller

        metrics = [
          { label: 'Unique Products Sold', value: data.length.toString() },
          { label: 'Top Performer', value: data[0]?.name || 'N/A' }
        ];
        break;

      case 'INVENTORY_VALUATION':
        cols = [
          { header: 'Code', accessor: 'prod_code' },
          { header: 'Product Name', accessor: 'prod_name' },
          { header: 'Category', accessor: 'category_code' },
          { header: 'Stock Qty', accessor: 'current_stock', format: 'number' },
          { header: 'Unit Price', accessor: 'unit_price', format: 'currency' },
          { header: 'Total Value', accessor: 'total_value', format: 'currency' },
        ];

        data = rawProducts.map(p => ({
          ...p,
          total_value: p.current_stock * p.unit_price
        }));

        const totalStockValue = data.reduce((sum, p) => {
          const value = typeof p.total_value === 'string' ? parseFloat(p.total_value) : Number(p.total_value);
          return sum + (isNaN(value) ? 0 : value);
        }, 0);

        const totalItems = data.reduce((sum, p) => {
          const stock = typeof p.current_stock === 'string' ? parseFloat(p.current_stock) : Number(p.current_stock);
          return sum + (isNaN(stock) ? 0 : stock);
        }, 0);

        metrics = [
          { label: 'Total Inventory Value', value: `PKR ${totalStockValue.toLocaleString('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` },
          { label: 'Total Items in Stock', value: totalItems.toLocaleString('en-PK', { minimumFractionDigits: 0, maximumFractionDigits: 0 }) }
        ];
        break;

      case 'LOW_STOCK':
        cols = [
          { header: 'Code', accessor: 'prod_code' },
          { header: 'Product Name', accessor: 'prod_name' },
          { header: 'Current Stock', accessor: 'current_stock', format: 'number' },
          { header: 'Min Level', accessor: 'min_stock_level', format: 'number' },
          { header: 'Status', accessor: 'status' },
        ];

        data = rawProducts
          .filter(p => p.current_stock <= p.min_stock_level)
          .map(p => ({
            ...p,
            status: p.current_stock === 0 ? 'Out of Stock' : 'Low Stock'
          }));

        metrics = [
          { label: 'Products Requiring Attention', value: data.length.toString() }
        ];
        break;

      case 'CUSTOMER_BALANCES':
        cols = [
          { header: 'Customer', accessor: 'cust_name' },
          { header: 'Code', accessor: 'cust_code' },
          { header: 'City', accessor: 'city' },
          { header: 'Credit Limit', accessor: 'credit_limit', format: 'currency' },
          { header: 'Balance Due', accessor: 'outstanding_balance', format: 'currency' }
        ];

        data = rawCustomers.sort((a, b) => {
          const balanceA = typeof a.outstanding_balance === 'string' ? parseFloat(a.outstanding_balance) : Number(a.outstanding_balance);
          const balanceB = typeof b.outstanding_balance === 'string' ? parseFloat(b.outstanding_balance) : Number(b.outstanding_balance);
          return balanceB - balanceA;
        });

        const totalReceivables = data.reduce((sum, c) => {
          const balance = typeof c.outstanding_balance === 'string' ? parseFloat(c.outstanding_balance) : Number(c.outstanding_balance);
          return sum + (isNaN(balance) ? 0 : balance);
        }, 0);

        metrics = [
          { label: 'Total Receivables', value: `PKR ${totalReceivables.toLocaleString('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` },
          {
            label: 'Customers with Balance', value: data.filter(c => {
              const balance = typeof c.outstanding_balance === 'string' ? parseFloat(c.outstanding_balance) : Number(c.outstanding_balance);
              return balance > 0;
            }).length.toString()
          }
        ];
        break;

      case 'VENDOR_BALANCES':
        cols = [
          { header: 'Supplier', accessor: 'supplier_name' },
          { header: 'Code', accessor: 'supplier_code' },
          { header: 'Contact', accessor: 'contact_person' },
          { header: 'City', accessor: 'city' },
          { header: 'Payable Amount', accessor: 'outstanding_balance', format: 'currency' }
        ];

        data = rawSuppliers.sort((a, b) => {
          const balanceA = typeof a.outstanding_balance === 'string' ? parseFloat(a.outstanding_balance) : Number(a.outstanding_balance);
          const balanceB = typeof b.outstanding_balance === 'string' ? parseFloat(b.outstanding_balance) : Number(b.outstanding_balance);
          return balanceB - balanceA;
        });

        const totalPayables = data.reduce((sum, s) => {
          const balance = typeof s.outstanding_balance === 'string' ? parseFloat(s.outstanding_balance) : Number(s.outstanding_balance);
          return sum + (isNaN(balance) ? 0 : balance);
        }, 0);

        metrics = [
          { label: 'Total Payables', value: `PKR ${totalPayables.toLocaleString('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` },
          {
            label: 'Vendors to Pay', value: data.filter(s => {
              const balance = typeof s.outstanding_balance === 'string' ? parseFloat(s.outstanding_balance) : Number(s.outstanding_balance);
              return balance > 0;
            }).length.toString()
          }
        ];
        break;

      case 'EXPENSE_BREAKDOWN':
        cols = [
          { header: 'Date', accessor: 'expense_date', format: 'date' },
          { header: 'Head', accessor: 'head_code' },
          { header: 'Remarks', accessor: 'remarks' },
          { header: 'Amount', accessor: 'amount', format: 'currency' },
        ];

        const filteredExpenses = rawExpenses.filter(e => dateFilter(e.expense_date));
        data = filteredExpenses.map(e => e);

        const totalExpenses = filteredExpenses.reduce((sum, e) => {
          const amount = typeof e.amount === 'string' ? parseFloat(e.amount) : Number(e.amount);
          return sum + (isNaN(amount) ? 0 : amount);
        }, 0);

        metrics = [
          { label: 'Total Expenses', value: `PKR ${totalExpenses.toLocaleString('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` },
          { label: 'Count', value: filteredExpenses.length.toString() }
        ];
        break;

      case 'TRANSACTION_HISTORY':
        cols = [
          { header: 'Date', accessor: 'trans_date', format: 'date' },
          { header: 'Type', accessor: 'trans_type' },
          { header: 'Description', accessor: 'description' },
          { header: 'Debit (In)', accessor: 'debit_amount', format: 'currency' },
          { header: 'Credit (Out)', accessor: 'credit_amount', format: 'currency' },
        ];

        const filteredTrans = rawTransactions.filter(t => dateFilter(t.trans_date));
        data = filteredTrans;

        const totDeb = filteredTrans.reduce((sum, t) => {
          const debit = typeof t.debit_amount === 'string' ? parseFloat(t.debit_amount) : Number(t.debit_amount);
          return sum + (isNaN(debit) ? 0 : debit);
        }, 0);

        const totCred = filteredTrans.reduce((sum, t) => {
          const credit = typeof t.credit_amount === 'string' ? parseFloat(t.credit_amount) : Number(t.credit_amount);
          return sum + (isNaN(credit) ? 0 : credit);
        }, 0);

        const netChange = totDeb - totCred;

        metrics = [
          { label: 'Total Inflow', value: `PKR ${totDeb.toLocaleString('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` },
          { label: 'Total Outflow', value: `PKR ${totCred.toLocaleString('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` },
          { label: 'Net Change', value: `PKR ${netChange.toLocaleString('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` }
        ];
        break;
    }

    setReportData(data);
    setColumns(cols);
    setSummaryMetrics(metrics);
    setIsLoading(false);
  };

  // Direct Print (may be blocked in sandboxes)
  const handlePrint = () => {
    try {
      window.print();
    } catch (e) {
      console.warn("Printing blocked by sandbox", e);
      alert("Direct printing is blocked by the environment. Please use the 'Download PDF' button instead.");
    }
  };

  // PDF Generation using html2canvas + jspdf
  const handleDownloadPDF = async () => {
    if (!reportContentRef.current) return;
    setIsGeneratingPdf(true);
    try {
      const canvas = await html2canvas(reportContentRef.current, {
        scale: 2, // Higher resolution
        logging: false,
        useCORS: true,
        backgroundColor: '#ffffff'
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();

      const imgWidth = pdfWidth;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      // If image height is greater than page height, we might need multiple pages (simplified to 1 page fit for now)
      // For now, we scale to fit width.

      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
      pdf.save(`Lalani_${reportType}.pdf`);
    } catch (err) {
      console.error("PDF generation failed", err);
      alert("Failed to generate PDF. Please try again.");
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handleExportCSV = () => {
    if (reportData.length === 0) return;

    const headers = columns.map(c => c.header).join(',');
    const rows = reportData.map(row =>
      columns.map(col => {
        let val = row[col.accessor];
        // formatting for CSV
        if (typeof val === 'string' && val.includes(',')) val = `"${val}"`;
        return val;
      }).join(',')
    );

    const csvContent = "data:text/csv;charset=utf-8," + [headers, ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Lalani_${reportType}_${startDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatValue = (value: any, format?: string) => {
    if (format === 'currency') {
      const num = typeof value === 'string' ? parseFloat(value) : Number(value);
      return `PKR ${num.toLocaleString('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
    if (format === 'number') {
      const num = typeof value === 'string' ? parseFloat(value) : Number(value);
      return num.toLocaleString('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }
    if (format === 'date') return formatTableDate(value);
    return value;
  };

  const getReportTitle = () => {
    return reportType.replace(/_/g, ' ');
  };

  return (
    <div className="space-y-6">
      {/* Header - Hidden on Print */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 print:hidden">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-brand-600" />
            Reports & Analytics
          </h1>
          <p className="text-slate-500">Generate financial statements, inventory lists, and sales summaries.</p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleExportCSV}
            className="bg-white border border-slate-300 text-slate-700 px-4 py-2 rounded-lg flex items-center hover:bg-slate-50 transition-colors shadow-sm"
          >
            <Download className="w-4 h-4 mr-2" />
            Excel
          </button>
          <button
            type="button"
            onClick={handleDownloadPDF}
            disabled={isGeneratingPdf}
            className="bg-brand-600 text-white px-4 py-2 rounded-lg flex items-center hover:bg-brand-700 transition-colors shadow-sm disabled:opacity-70"
          >
            {isGeneratingPdf ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <FileText className="w-4 h-4 mr-2" />
            )}
            Download PDF
          </button>
          <button
            type="button"
            onClick={handlePrint}
            className="bg-slate-800 text-white px-4 py-2 rounded-lg flex items-center hover:bg-slate-900 transition-colors shadow-sm"
          >
            <Printer className="w-4 h-4 mr-2" />
            Print
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 lg:gap-6 print:block overflow-hidden">
        {/* Report Selector Sidebar - Hidden on Print */}
        <div className="lg:col-span-1 space-y-6 print:hidden">
          {/* Categories */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">Report Categories</h3>
            <div className="space-y-1">
              <button
                onClick={() => setActiveCategory('SALES')}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium flex items-center ${activeCategory === 'SALES' ? 'bg-brand-50 text-brand-700' : 'text-slate-600 hover:bg-slate-50'}`}
              >
                <BarChart3 className="w-4 h-4 mr-3" /> Sales Reports
              </button>
              <button
                onClick={() => setActiveCategory('INVENTORY')}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium flex items-center ${activeCategory === 'INVENTORY' ? 'bg-brand-50 text-brand-700' : 'text-slate-600 hover:bg-slate-50'}`}
              >
                <Package className="w-4 h-4 mr-3" /> Inventory Reports
              </button>
              <button
                onClick={() => setActiveCategory('FINANCE')}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium flex items-center ${activeCategory === 'FINANCE' ? 'bg-brand-50 text-brand-700' : 'text-slate-600 hover:bg-slate-50'}`}
              >
                <PieChart className="w-4 h-4 mr-3" /> Financial Reports
              </button>
              <button
                onClick={() => setActiveCategory('PARTNERS')}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium flex items-center ${activeCategory === 'PARTNERS' ? 'bg-brand-50 text-brand-700' : 'text-slate-600 hover:bg-slate-50'}`}
              >
                <Users className="w-4 h-4 mr-3" /> Partner Reports
              </button>
            </div>
          </div>

          {/* Specific Report Types based on Category */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">Select Report</h3>
            <div className="space-y-2">
              {activeCategory === 'SALES' && (
                <>
                  <button onClick={() => setReportType('SALES_SUMMARY')} className={`w-full text-left text-sm p-2 rounded text-slate-700 hover:text-slate-900 ${reportType === 'SALES_SUMMARY' ? 'bg-slate-100 font-bold text-slate-900' : 'hover:bg-slate-50'}`}>Sales Summary (Date Range)</button>
                  <button onClick={() => setReportType('SALES_BY_PRODUCT')} className={`w-full text-left text-sm p-2 rounded text-slate-700 hover:text-slate-900 ${reportType === 'SALES_BY_PRODUCT' ? 'bg-slate-100 font-bold text-slate-900' : 'hover:bg-slate-50'}`}>Product Performance</button>
                </>
              )}
              {activeCategory === 'INVENTORY' && (
                <>
                  <button onClick={() => setReportType('INVENTORY_VALUATION')} className={`w-full text-left text-sm p-2 rounded text-slate-700 hover:text-slate-900 ${reportType === 'INVENTORY_VALUATION' ? 'bg-slate-100 font-bold text-slate-900' : 'hover:bg-slate-50'}`}>Inventory Valuation</button>
                  <button onClick={() => setReportType('LOW_STOCK')} className={`w-full text-left text-sm p-2 rounded text-slate-700 hover:text-slate-900 ${reportType === 'LOW_STOCK' ? 'bg-slate-100 font-bold text-slate-900' : 'hover:bg-slate-50'}`}>Low Stock Alerts</button>
                </>
              )}
              {activeCategory === 'FINANCE' && (
                <>
                  <button onClick={() => setReportType('EXPENSE_BREAKDOWN')} className={`w-full text-left text-sm p-2 rounded text-slate-700 hover:text-slate-900 ${reportType === 'EXPENSE_BREAKDOWN' ? 'bg-slate-100 font-bold text-slate-900' : 'hover:bg-slate-50'}`}>Expense Breakdown</button>
                  <button onClick={() => setReportType('TRANSACTION_HISTORY')} className={`w-full text-left text-sm p-2 rounded text-slate-700 hover:text-slate-900 ${reportType === 'TRANSACTION_HISTORY' ? 'bg-slate-100 font-bold text-slate-900' : 'hover:bg-slate-50'}`}>Transaction Ledger (Cash Book)</button>
                </>
              )}
              {activeCategory === 'PARTNERS' && (
                <>
                  <button onClick={() => setReportType('CUSTOMER_BALANCES')} className={`w-full text-left text-sm p-2 rounded text-slate-700 hover:text-slate-900 ${reportType === 'CUSTOMER_BALANCES' ? 'bg-slate-100 font-bold text-slate-900' : 'hover:bg-slate-50'}`}>Customer Balances</button>
                  <button onClick={() => setReportType('VENDOR_BALANCES')} className={`w-full text-left text-sm p-2 rounded text-slate-700 hover:text-slate-900 ${reportType === 'VENDOR_BALANCES' ? 'bg-slate-100 font-bold text-slate-900' : 'hover:bg-slate-50'}`}>Vendor Payables</button>
                </>
              )}
            </div>
          </div>

          {/* Filters */}
          {(reportType === 'SALES_SUMMARY' || reportType === 'SALES_BY_PRODUCT' || reportType === 'EXPENSE_BREAKDOWN' || reportType === 'TRANSACTION_HISTORY') && (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4 flex items-center">
                <Filter className="w-3 h-3 mr-1" /> Date Filters
              </h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs text-slate-500 mb-1">Start Date</label>
                  <input type="date" className="w-full border border-slate-300 rounded p-2 text-sm" value={startDate} onChange={e => setStartDate(e.target.value)} />
                </div>
                <div>
                  <label className="block text-xs text-slate-500 mb-1">End Date</label>
                  <input type="date" className="w-full border border-slate-300 rounded p-2 text-sm" value={endDate} onChange={e => setEndDate(e.target.value)} />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Report Preview Area */}
        <div className="lg:col-span-3 print:w-full print:max-w-none">
          <div
            ref={reportContentRef}
            id="report-container"
            className="bg-white rounded-xl shadow-sm border border-slate-200 min-h-[600px] p-8 print:shadow-none print:border-none print:p-0 print:overflow-visible"
          >
            {/* Report Header */}
            <div className="text-center border-b border-slate-200 pb-6 mb-6">
              <h2 className="text-3xl font-display font-bold text-slate-900 uppercase tracking-wide">{getReportTitle()}</h2>
              <p className="text-slate-500 mt-2">Lalani Traders Distribution System</p>
              <p className="text-sm text-slate-400 mt-1">Generated on: {new Date().toLocaleDateString()} {new Date().toLocaleTimeString()}</p>
              {startDate && endDate && (['SALES_SUMMARY', 'EXPENSE_BREAKDOWN', 'SALES_BY_PRODUCT', 'TRANSACTION_HISTORY'].includes(reportType)) && (
                <div className="inline-flex items-center mt-3 bg-slate-100 px-3 py-1 rounded-full text-xs font-medium text-slate-600">
                  <Calendar className="w-3 h-3 mr-2" /> {startDate} to {endDate}
                </div>
              )}
            </div>

            {/* Metrics Summary */}
            {summaryMetrics.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 lg:gap-4 mb-8 overflow-hidden">
                {summaryMetrics.map((metric, idx) => (
                  <div key={idx} className="bg-slate-50 p-4 rounded-lg border border-slate-100 print:border-slate-300">
                    <p className="text-xs text-slate-500 uppercase font-bold">{metric.label}</p>
                    <p className="text-xl font-mono font-bold text-slate-900 mt-1">{metric.value}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Data Table */}
            <div className="overflow-x-auto hidden lg:block print:overflow-visible">
              <table className="min-w-full divide-y divide-slate-200 border border-slate-200 print:border-black">
                <thead className="bg-slate-50 print:bg-slate-100">
                  <tr>
                    {columns.map((col, idx) => (
                      <th key={idx} className="px-6 py-3 text-left text-xs font-bold text-slate-700 uppercase tracking-wider print:text-black border-r border-slate-200 last:border-r-0">
                        {col.header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-200">
                  {reportData.length === 0 ? (
                    <tr><td colSpan={columns.length} className="px-6 py-12 text-center text-slate-400">No data available for current selection</td></tr>
                  ) : reportData.map((row, rIdx) => (
                    <tr key={rIdx} className="hover:bg-slate-50 print:hover:bg-transparent">
                      {columns.map((col, cIdx) => (
                        <td key={cIdx} className="px-6 py-3 text-sm text-slate-700 whitespace-nowrap print:text-black border-r border-slate-200 last:border-r-0">
                          {formatValue(row[col.accessor], col.format)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Table View */}
            <MobileTable
              data={reportData}
              columns={columns.map(col => ({
                key: col.accessor,
                label: col.header,
                render: (value) => formatValue(value, col.format)
              }))}
            />

            <div className="mt-8 pt-8 border-t border-slate-200 text-center text-xs text-slate-400 print:block hidden">
              <p>This is a computer-generated report and does not require a signature.</p>
              <p>Lalani Traders - Plot 44, SITE Area, Karachi</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;
