import React, { useState, useEffect } from 'react';
import { CheckCircle, AlertTriangle, Info, X } from 'lucide-react';

type NotificationType = 'success' | 'error' | 'warning' | 'info';

interface NotificationProps {
    message: string;
    type?: NotificationType;
    onClose: () => void;
    autoClose?: boolean;
    duration?: number;
}

const Notification: React.FC<NotificationProps> = ({
    message,
    type = 'info',
    onClose,
    autoClose = true,
    duration = 5000
}) => {
    useEffect(() => {
        if (autoClose) {
            const timer = setTimeout(() => {
                onClose();
            }, duration);
            return () => clearTimeout(timer);
        }
    }, [autoClose, duration, onClose]);

    const getNotificationStyles = () => {
        switch (type) {
            case 'success':
                return {
                    bg: 'bg-green-50',
                    border: 'border-green-200',
                    text: 'text-green-800',
                    icon: <CheckCircle className="w-5 h-5 text-green-600" />
                };
            case 'error':
                return {
                    bg: 'bg-red-50',
                    border: 'border-red-200',
                    text: 'text-red-800',
                    icon: <AlertTriangle className="w-5 h-5 text-red-600" />
                };
            case 'warning':
                return {
                    bg: 'bg-yellow-50',
                    border: 'border-yellow-200',
                    text: 'text-yellow-800',
                    icon: <AlertTriangle className="w-5 h-5 text-yellow-600" />
                };
            case 'info':
            default:
                return {
                    bg: 'bg-blue-50',
                    border: 'border-blue-200',
                    text: 'text-blue-800',
                    icon: <Info className="w-5 h-5 text-blue-600" />
                };
        }
    };

    const styles = getNotificationStyles();

    return (
        <div className={`fixed top-4 right-4 z-[10000] ${styles.bg} border ${styles.border} rounded-lg shadow-lg p-4 max-w-sm animate-in fade-in slide-in-from-top-2`}>
            <div className="flex items-start">
                <div className="flex-shrink-0 mr-3">
                    {styles.icon}
                </div>
                <div className="flex-1">
                    <p className={`text-sm font-medium ${styles.text}`}>
                        {message}
                    </p>
                </div>
                <button
                    onClick={onClose}
                    className={`ml-3 text-${styles.text.replace('text-', '')}-400 hover:text-${styles.text.replace('text-', '')}-600`}
                >
                    <X className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
};

export default Notification;