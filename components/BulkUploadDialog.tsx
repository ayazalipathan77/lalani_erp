import React, { useState } from 'react';
import { Upload, Download, X, FileSpreadsheet, AlertCircle, CheckCircle } from 'lucide-react';

interface BulkUploadDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onUpload: (file: File) => Promise<{ message: string; results: any }>;
    onDownloadTemplate: () => Promise<Blob>;
    title: string;
    templateFileName: string;
}

export const BulkUploadDialog: React.FC<BulkUploadDialogProps> = ({
    isOpen,
    onClose,
    onUpload,
    onDownloadTemplate,
    title,
    templateFileName
}) => {
    const [file, setFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    const [result, setResult] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile) {
            // Check if it's an Excel file
            const validTypes = [
                'application/vnd.ms-excel',
                'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            ];
            if (!validTypes.includes(selectedFile.type) && !selectedFile.name.endsWith('.xlsx') && !selectedFile.name.endsWith('.xls')) {
                setError('Please select a valid Excel file (.xlsx or .xls)');
                return;
            }
            setFile(selectedFile);
            setError(null);
            setResult(null);
        }
    };

    const handleUpload = async () => {
        if (!file) {
            setError('Please select a file first');
            return;
        }

        setUploading(true);
        setError(null);

        try {
            const uploadResult = await onUpload(file);
            setResult(uploadResult.results);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Upload failed');
        } finally {
            setUploading(false);
        }
    };

    const handleDownloadTemplate = async () => {
        try {
            const blob = await onDownloadTemplate();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = templateFileName;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to download template');
        }
    };

    const handleClose = () => {
        setFile(null);
        setResult(null);
        setError(null);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-gray-800">{title}</h2>
                    <button
                        onClick={handleClose}
                        className="text-gray-500 hover:text-gray-700 transition-colors"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Instructions */}
                <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <h3 className="font-semibold text-blue-900 mb-2">Instructions:</h3>
                    <ol className="list-decimal list-inside text-sm text-blue-800 space-y-1">
                        <li>Download the Excel template using the button below</li>
                        <li>Fill in your data following the template structure</li>
                        <li>Upload the completed Excel file</li>
                        <li>Review the upload results</li>
                    </ol>
                </div>

                {/* Download Template Button */}
                <div className="mb-6">
                    <button
                        onClick={handleDownloadTemplate}
                        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    >
                        <Download className="w-5 h-5" />
                        Download Excel Template
                    </button>
                </div>

                {/* File Upload */}
                <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Select Excel File
                    </label>
                    <div className="flex items-center gap-4">
                        <label className="flex-1 flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-500 transition-colors">
                            <FileSpreadsheet className="w-5 h-5 text-gray-400" />
                            <span className="text-sm text-gray-600">
                                {file ? file.name : 'Choose Excel file...'}
                            </span>
                            <input
                                type="file"
                                accept=".xlsx,.xls"
                                onChange={handleFileChange}
                                className="hidden"
                            />
                        </label>
                    </div>
                </div>

                {/* Upload Button */}
                <button
                    onClick={handleUpload}
                    disabled={!file || uploading}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors mb-4"
                >
                    <Upload className="w-5 h-5" />
                    {uploading ? 'Uploading...' : 'Upload and Process'}
                </button>

                {/* Error Message */}
                {error && (
                    <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                        <div className="text-sm text-red-800">{error}</div>
                    </div>
                )}

                {/* Results */}
                {result && (
                    <div className="space-y-4">
                        <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                            <div className="flex items-center gap-2 mb-3">
                                <CheckCircle className="w-5 h-5 text-green-600" />
                                <h3 className="font-semibold text-green-900">Upload Complete</h3>
                            </div>
                            <div className="grid grid-cols-3 gap-4 text-sm">
                                <div>
                                    <div className="text-gray-600">Total Rows</div>
                                    <div className="text-2xl font-bold text-gray-900">{result.total}</div>
                                </div>
                                <div>
                                    <div className="text-gray-600">Created</div>
                                    <div className="text-2xl font-bold text-green-600">{result.created}</div>
                                </div>
                                <div>
                                    <div className="text-gray-600">Updated</div>
                                    <div className="text-2xl font-bold text-blue-600">{result.updated}</div>
                                </div>
                            </div>
                        </div>

                        {/* Errors */}
                        {result.errors && result.errors.length > 0 && (
                            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                                <h4 className="font-semibold text-yellow-900 mb-2">
                                    Errors ({result.errors.length})
                                </h4>
                                <div className="max-h-40 overflow-y-auto space-y-2">
                                    {result.errors.map((err: any, idx: number) => (
                                        <div key={idx} className="text-sm text-yellow-800">
                                            <span className="font-medium">Row {err.row}:</span> {err.error}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Close Button after upload */}
                        <button
                            onClick={handleClose}
                            className="w-full px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                        >
                            Close
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};
