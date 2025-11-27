import React from 'react';

interface MobileTableProps {
    data: any[];
    columns: {
        key: string;
        label: string;
        render?: (value: any, item: any) => React.ReactNode;
    }[];
    onRowClick?: (item: any) => void;
    className?: string;
}

const MobileTable: React.FC<MobileTableProps> = ({
    data,
    columns,
    onRowClick,
    className = ''
}) => {
    return (
        <div className={`lg:hidden space-y-3 ${className}`}>
            {data.map((item, index) => (
                <div
                    key={index}
                    onClick={() => onRowClick?.(item)}
                    className={`bg-white rounded-lg border border-slate-200 p-4 shadow-sm hover:shadow-md transition-shadow cursor-pointer ${onRowClick ? 'hover:bg-slate-50' : ''
                        }`}
                >
                    {columns.map((column) => (
                        <div key={column.key} className="flex justify-between items-center py-1">
                            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                                {column.label}:
                            </span>
                            <span className="text-sm text-slate-900 font-medium">
                                {column.render ? column.render(item[column.key], item) : item[column.key]}
                            </span>
                        </div>
                    ))}
                </div>
            ))}
            {data.length === 0 && (
                <div className="text-center py-8 text-slate-500">
                    No data available
                </div>
            )}
        </div>
    );
};

export default MobileTable;