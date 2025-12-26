import React, { useState, useEffect } from 'react';
import { Download, Upload, Plus, AlertTriangle, CheckCircle, Clock, Database, HardDrive } from 'lucide-react';
import { api } from '../../services/api';
import { SystemBackup } from '../../types';
import MobileTable from '../../components/MobileTable';
import { useNotification } from '../../components/NotificationContext';

const SystemBackups: React.FC = () => {
    const [backups, setBackups] = useState<SystemBackup[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isCreatingBackup, setIsCreatingBackup] = useState(false);
    const [isRestoring, setIsRestoring] = useState<number | null>(null);

    // Notification hook
    const { showNotification } = useNotification();

    const fetchBackups = async () => {
        setIsLoading(true);
        try {
            const data = await api.systemBackups.getAll();
            setBackups(data);
        } catch (error: any) {
            showNotification('Failed to load backups', 'error');
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchBackups();
    }, []);

    const handleCreateBackup = async () => {
        if (window.confirm('Are you sure you want to create a new database backup? This may take a few moments.')) {
            setIsCreatingBackup(true);
            try {
                const newBackup = await api.systemBackups.create();
                setBackups(prev => [newBackup, ...prev]);
                showNotification('Backup created successfully!', 'success');
            } catch (error: any) {
                showNotification(error.message || 'Failed to create backup', 'error');
            } finally {
                setIsCreatingBackup(false);
            }
        }
    };

    const handleDownloadBackup = async (backupId: number) => {
        try {
            await api.systemBackups.download(backupId);
            showNotification('Backup download started', 'success');
        } catch (error: any) {
            showNotification(error.message || 'Failed to download backup', 'error');
        }
    };

    const handleRestoreBackup = async (backupId: number) => {
        const backup = backups.find(b => b.backup_id === backupId);
        if (!backup) return;

        const confirmMessage = `Are you sure you want to restore the database from backup "${backup.file_path}"?\n\n⚠️ WARNING: This will overwrite all current data and cannot be undone!`;

        if (window.confirm(confirmMessage)) {
            setIsRestoring(backupId);
            try {
                await api.systemBackups.restore(backupId);
                showNotification('Database restored successfully! Please refresh the page.', 'success');
                // Refresh the backup list
                await fetchBackups();
            } catch (error: any) {
                showNotification(error.message || 'Failed to restore backup', 'error');
            } finally {
                setIsRestoring(null);
            }
        }
    };

    const formatFileSize = (bytes: number) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleString();
    };

    const getStatusIcon = (status: string) => {
        switch (status.toLowerCase()) {
            case 'completed':
                return <CheckCircle className="w-4 h-4 text-green-500" />;
            case 'restored':
                return <Upload className="w-4 h-4 text-blue-500" />;
            case 'failed':
                return <AlertTriangle className="w-4 h-4 text-red-500" />;
            default:
                return <Clock className="w-4 h-4 text-yellow-500" />;
        }
    };

    const getStatusColor = (status: string) => {
        switch (status.toLowerCase()) {
            case 'completed':
                return 'bg-green-100 text-green-800';
            case 'restored':
                return 'bg-blue-100 text-blue-800';
            case 'failed':
                return 'bg-red-100 text-red-800';
            default:
                return 'bg-yellow-100 text-yellow-800';
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">System Backups</h1>
                    <p className="text-slate-500">Create and manage database backups for system recovery.</p>
                </div>
                <button
                    onClick={handleCreateBackup}
                    disabled={isCreatingBackup}
                    className="bg-brand-600 text-white px-4 py-2 rounded-lg flex items-center hover:bg-brand-700 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <Plus className="w-4 h-4 mr-2" />
                    {isCreatingBackup ? 'Creating Backup...' : 'Create Backup'}
                </button>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-4 border-b border-slate-200 bg-slate-50">
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                        <Database className="w-4 h-4" />
                        <span>Database Backup Management</span>
                    </div>
                </div>

                <div className="overflow-x-auto hidden lg:block">
                    <table className="min-w-full divide-y divide-slate-200">
                        <thead className="bg-slate-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Backup Details</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Type</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Size</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Created</th>
                                <th className="relative px-6 py-3"><span className="sr-only">Actions</span></th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-slate-200">
                            {isLoading ? (
                                <tr><td colSpan={6} className="text-center py-8 text-slate-500">Loading backups...</td></tr>
                            ) : backups.length === 0 ? (
                                <tr><td colSpan={6} className="text-center py-8 text-slate-500">No backups found</td></tr>
                            ) : (
                                backups.map((backup) => (
                                    <tr key={backup.backup_id} className="hover:bg-slate-50">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <div className="flex-shrink-0 h-10 w-10 bg-slate-100 rounded-full flex items-center justify-center">
                                                    <Database className="w-5 h-5 text-slate-500" />
                                                </div>
                                                <div className="ml-4">
                                                    <div className="text-sm font-medium text-slate-900">{backup.file_path}</div>
                                                    <div className="text-sm text-slate-500">ID: {backup.backup_id}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-slate-100 text-slate-800">
                                                {backup.backup_type}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                                            {formatFileSize(backup.file_size)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(backup.status)}`}>
                                                {getStatusIcon(backup.status)}
                                                <span className="ml-1 capitalize">{backup.status}</span>
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                                            {formatDate(backup.backup_date)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <div className="flex justify-end space-x-3">
                                                <button
                                                    onClick={() => handleDownloadBackup(backup.backup_id)}
                                                    className="text-slate-400 hover:text-green-600"
                                                    title="Download backup file"
                                                >
                                                    <Download className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleRestoreBackup(backup.backup_id)}
                                                    disabled={isRestoring === backup.backup_id}
                                                    className="text-slate-400 hover:text-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                                                    title="Restore from this backup"
                                                >
                                                    <Upload className="w-4 h-4" />
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
                    data={backups}
                    columns={[
                        {
                            key: 'file_path',
                            label: 'Backup File',
                            render: (value, item) => (
                                <div>
                                    <div className="font-medium text-slate-900 text-sm">{value}</div>
                                    <div className="text-xs text-slate-500">ID: {item.backup_id}</div>
                                    <div className="mt-2 flex gap-2">
                                        <button
                                            onClick={() => handleDownloadBackup(item.backup_id)}
                                            className="text-xs text-green-600 hover:text-green-800"
                                            title="Download backup file"
                                        >
                                            <Download className="w-3 h-3 inline mr-1" />
                                            Download
                                        </button>
                                        <button
                                            onClick={() => handleRestoreBackup(item.backup_id)}
                                            disabled={isRestoring === item.backup_id}
                                            className="text-xs text-blue-600 hover:text-blue-800 disabled:opacity-50 disabled:cursor-not-allowed"
                                            title="Restore from this backup"
                                        >
                                            <Upload className="w-3 h-3 inline mr-1" />
                                            Restore
                                        </button>
                                    </div>
                                </div>
                            )
                        },
                        {
                            key: 'backup_type',
                            label: 'Type',
                            render: (value) => (
                                <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-slate-100 text-slate-800">
                                    {value}
                                </span>
                            )
                        },
                        {
                            key: 'file_size',
                            label: 'Size',
                            render: (value) => formatFileSize(value)
                        },
                        {
                            key: 'status',
                            label: 'Status',
                            render: (value) => (
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(value)}`}>
                                    {getStatusIcon(value)}
                                    <span className="ml-1 capitalize">{value}</span>
                                </span>
                            )
                        },
                        {
                            key: 'backup_date',
                            label: 'Created',
                            render: (value) => formatDate(value)
                        }
                    ]}
                />

                {backups.length > 0 && (
                    <div className="p-4 bg-amber-50 border-t border-amber-200">
                        <div className="flex items-start gap-3">
                            <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
                            <div className="text-sm text-amber-800">
                                <p className="font-medium">Important Warning</p>
                                <p className="mt-1">Restoring from a backup will completely replace all current data. This action cannot be undone. Always create a fresh backup before performing a restore operation.</p>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SystemBackups;