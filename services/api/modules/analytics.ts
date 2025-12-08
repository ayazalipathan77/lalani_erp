import { USE_MOCK, getAuthHeaders } from '../utils';

export const analytics = {
    getDashboardMetrics: async (): Promise<{
        totalRevenue: number;
        pendingReceivables: number;
        lowStockCount: number;
        customerCount: number;
        recentInvoices: any[];
        topProducts: any[];
        salesByCategory: any[];
    }> => {
        if (USE_MOCK) {
            return {
                totalRevenue: 2500000,
                pendingReceivables: 150000,
                lowStockCount: 5,
                customerCount: 25,
                recentInvoices: [],
                topProducts: [],
                salesByCategory: []
            };
        }
        const res = await fetch('/api/analytics/dashboard-metrics', {
            headers: getAuthHeaders()
        });
        return res.json();
    },
    getSalesTrends: async (): Promise<{ name: string; sales: number }[]> => {
        if (USE_MOCK) {
            return [
                { name: 'Jan', sales: 150000 },
                { name: 'Feb', sales: 180000 },
                { name: 'Mar', sales: 220000 },
                { name: 'Apr', sales: 190000 },
                { name: 'May', sales: 250000 },
                { name: 'Jun', sales: 280000 }
            ];
        }
        const res = await fetch('/api/analytics/sales-trends', {
            headers: getAuthHeaders()
        });
        return res.json();
    }
};