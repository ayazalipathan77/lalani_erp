
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
          { label: 'Total Revenue', value: formatCompactCurrency(`PKR ${totalSales}`) },
          { label: 'Cash Collected', value: formatCompactCurrency(`PKR ${paidSales}`) },
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
          { label: 'Total Inventory Value', value: formatCompactCurrency(`PKR ${totalStockValue}`) },
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
          { label: 'Total Receivables', value: formatCompactCurrency(`PKR ${totalReceivables}`) },
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
          { label: 'Total Payables', value: formatCompactCurrency(`PKR ${totalPayables}`) },
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
          { label: 'Total Expenses', value: formatCompactCurrency(`PKR ${totalExpenses}`) },
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
          { label: 'Total Inflow', value: formatCompactCurrency(`PKR ${totDeb}`) },
          { label: 'Total Outflow', value: formatCompactCurrency(`PKR ${totCred}`) },
          { label: 'Net Change', value: formatCompactCurrency(`PKR ${Math.abs(netChange)}`) + (netChange < 0 ? ' (Dr)' : ' (Cr)') }
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

  // PDF Generation using jsPDF with modern styling
  const handleDownloadPDF = async () => {
    setIsGeneratingPdf(true);
    try {
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
      });

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 15;
      let yPosition = margin;

      // Helper function to add background rectangle
      const addBackground = (x: number, y: number, width: number, height: number, color: [number, number, number]) => {
        pdf.setFillColor(color[0], color[1], color[2]);
        pdf.rect(x, y, width, height, 'F');
      };

      // Helper function to add border
      const addBorder = (x: number, y: number, width: number, height: number, color: [number, number, number] = [0, 0, 0]) => {
        pdf.setDrawColor(color[0], color[1], color[2]);
        pdf.setLineWidth(0.2);
        pdf.rect(x, y, width, height);
      };

      // Header section with branding
      addBackground(margin, yPosition - 5, pageWidth - 2 * margin, 25, [64, 64, 64]); // Dark grey header
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(18);
      pdf.setFont('helvetica', 'bold');
      pdf.text('LALANI TRADERS', margin + 5, yPosition + 5);

      // Report title - place below for better fit
      const reportTitle = getReportTitle();
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.text(reportTitle, margin + 5, yPosition + 15);

      yPosition += 25;

      // Reset text color
      pdf.setTextColor(0, 0, 0);

      // Generation info
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      const genText = `Generated on: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`;
      pdf.text(genText, margin, yPosition);
      yPosition += 6;

      // Add date range if applicable
      if (startDate && endDate && ['SALES_SUMMARY', 'EXPENSE_BREAKDOWN', 'SALES_BY_PRODUCT', 'TRANSACTION_HISTORY'].includes(reportType)) {
        addBackground(margin, yPosition - 2, pageWidth - 2 * margin, 8, [248, 250, 252]); // Light gray background
        addBorder(margin, yPosition - 2, pageWidth - 2 * margin, 8);
        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'bold');
        pdf.text(`Date Range: ${startDate} to ${endDate}`, margin + 3, yPosition + 3);
        yPosition += 12;
      }

      // Summary Metrics Cards
      if (summaryMetrics.length > 0) {
        pdf.setFontSize(14);
        pdf.setFont('helvetica', 'bold');
        pdf.text('Summary Metrics', margin, yPosition);
        yPosition += 10;

        const metricsPerRow = 3;
        const metricWidth = (pageWidth - 2 * margin - 10) / metricsPerRow;
        const metricHeight = 15;

        summaryMetrics.forEach((metric, index) => {
          const row = Math.floor(index / metricsPerRow);
          const col = index % metricsPerRow;
          const x = margin + col * (metricWidth + 3.33);
          const y = yPosition + row * (metricHeight + 5);

          // Metric card background
          addBackground(x, y, metricWidth, metricHeight, [255, 255, 255]);
          addBorder(x, y, metricWidth, metricHeight, [226, 232, 240]);

          // Metric label
          pdf.setFontSize(8);
          pdf.setFont('helvetica', 'bold');
          pdf.setTextColor(71, 85, 105);
          pdf.text(metric.label, x + 3, y + 5);

          // Metric value
          pdf.setFontSize(11);
          pdf.setFont('helvetica', 'bold');
          pdf.setTextColor(30, 58, 138);
          const valueText = metric.value;
          const maxWidth = metricWidth - 6;
          if (pdf.getTextWidth(valueText) > maxWidth) {
            const truncated = valueText.substring(0, Math.floor(maxWidth / 3)) + '...';
            pdf.text(truncated, x + 3, y + 12);
          } else {
            pdf.text(valueText, x + 3, y + 12);
          }
        });

        yPosition += Math.ceil(summaryMetrics.length / metricsPerRow) * (metricHeight + 5) + 10;
      }

      // Detailed Report Table
      if (reportData.length > 0) {
        pdf.setFontSize(14);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(0, 0, 0);
        pdf.text('Detailed Report', margin, yPosition);
        yPosition += 10;

        const colWidth = (pageWidth - 2 * margin) / columns.length;
        const rowHeight = 8;
        const headerHeight = 10;

        // Table headers
        addBackground(margin, yPosition, pageWidth - 2 * margin, headerHeight, [64, 64, 64]); // Dark grey header
        pdf.setTextColor(255, 255, 255);
        pdf.setFontSize(9);
        pdf.setFont('helvetica', 'bold');

        let xPosition = margin + 2;
        columns.forEach((col, index) => {
          const headerText = col.header.length > 15 ? col.header.substring(0, 12) + '...' : col.header;
          pdf.text(headerText, xPosition, yPosition + 6);
          xPosition += colWidth;
        });

        yPosition += headerHeight;

        // Table rows
        pdf.setTextColor(0, 0, 0);
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(8);

        reportData.forEach((row, rowIndex) => {
          // Alternate row background
          if (rowIndex % 2 === 0) {
            addBackground(margin, yPosition, pageWidth - 2 * margin, rowHeight, [248, 250, 252]);
          }

          xPosition = margin + 2;
          columns.forEach((col, colIndex) => {
            const cellValue = formatValue(row[col.accessor], col.format);
            const truncatedValue = cellValue.length > 20 ? cellValue.substring(0, 17) + '...' : cellValue;
            pdf.text(truncatedValue, xPosition, yPosition + 5);
            xPosition += colWidth;
          });

          // Row border
          addBorder(margin, yPosition, pageWidth - 2 * margin, rowHeight, [226, 232, 240]);
          yPosition += rowHeight;

          // Add page break if needed
          if (yPosition > pageHeight - 25) {
            pdf.addPage();
            yPosition = margin;

            // Repeat headers on new page
            addBackground(margin, yPosition, pageWidth - 2 * margin, headerHeight, [64, 64, 64]);
            pdf.setTextColor(255, 255, 255);
            pdf.setFontSize(9);
            pdf.setFont('helvetica', 'bold');

            xPosition = margin + 2;
            columns.forEach((col, index) => {
              const headerText = col.header.length > 15 ? col.header.substring(0, 12) + '...' : col.header;
              pdf.text(headerText, xPosition, yPosition + 6);
              xPosition += colWidth;
            });

            yPosition += headerHeight;
            pdf.setTextColor(0, 0, 0);
            pdf.setFont('helvetica', 'normal');
            pdf.setFontSize(8);
          }
        });

        // Table border
        addBorder(margin, yPosition - reportData.length * rowHeight - headerHeight, pageWidth - 2 * margin, reportData.length * rowHeight + headerHeight, [64, 64, 64]);
      }

      // Footer
      const footerY = pageHeight - 15;
      addBackground(margin, footerY - 3, pageWidth - 2 * margin, 12, [248, 250, 252]);
      addBorder(margin, footerY - 3, pageWidth - 2 * margin, 12, [226, 232, 240]);

      pdf.setFontSize(8);
      pdf.setFont('helvetica', 'italic');
      pdf.setTextColor(107, 114, 128);
      pdf.text('This is a computer-generated report and does not require a signature.', margin + 3, footerY);
      pdf.text('Lalani Traders - Plot 44, SITE Area, Karachi', margin + 3, footerY + 4);

      pdf.save(`Lalani_${reportType}_${new Date().toISOString().split('T')[0]}.pdf`);
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

  const formatCompactCurrency = (value: string) => {
    // Extract number from "PKR 12345.67"
    const match = value.match(/PKR\s+([\d,]+\.?\d*)/);
    if (!match) return value;

    const num = parseFloat(match[1].replace(/,/g, ''));
    if (isNaN(num)) return value;

    if (num >= 1000000) {
      return `PKR ${(num / 1000000).toFixed(1)}M`;
    } else if (num >= 1000) {
      return `PKR ${(num / 1000).toFixed(1)}K`;
    } else {
      return `PKR ${num.toFixed(0)}`;
    }
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
