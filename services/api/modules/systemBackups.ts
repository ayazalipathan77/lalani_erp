import { SystemBackup } from '../../../types';
import { getAuthHeaders, handleFetchResponse } from '../utils';

export const systemBackups = {
    getAll: async (): Promise<SystemBackup[]> => {
        const res = await fetch('/api/system/backups', {
            headers: getAuthHeaders()
        });
        return handleFetchResponse<SystemBackup[]>(res);
    },

    create: async (backupType: string = 'FULL'): Promise<SystemBackup> => {
        const res = await fetch('/api/system/backups/create', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
            body: JSON.stringify({ backup_type: backupType })
        });
        return handleFetchResponse<SystemBackup>(res);
    },

    download: async (backupId: number): Promise<void> => {
        const res = await fetch(`/api/system/backups/download/${backupId}`, {
            headers: getAuthHeaders()
        });
        if (!res.ok) throw new Error('Failed to download backup');

        // Create a download link for the file
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = res.headers.get('content-disposition')?.split('filename=')[1]?.replace(/"/g, '') || `backup_${backupId}.sql`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
    },

    restore: async (backupId: number): Promise<{ message: string; backup: SystemBackup }> => {
        const res = await fetch(`/api/system/backups/restore/${backupId}`, {
            method: 'POST',
            headers: getAuthHeaders()
        });
        return handleFetchResponse<{ message: string; backup: SystemBackup }>(res);
    }
};