import { SystemBackup } from '../../../types';
import { getAuthHeaders } from '../utils';

export const systemBackups = {
    getAll: async (): Promise<SystemBackup[]> => {
        const res = await fetch('/api/system/backups', {
            headers: getAuthHeaders()
        });
        if (!res.ok) throw new Error('Failed to fetch backups');
        return res.json();
    },

    create: async (backupType: string = 'FULL'): Promise<SystemBackup> => {
        const res = await fetch('/api/system/backups/create', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
            body: JSON.stringify({ backup_type: backupType })
        });
        if (!res.ok) throw new Error('Failed to create backup');
        return res.json();
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
        if (!res.ok) throw new Error('Failed to restore backup');
        return res.json();
    }
};