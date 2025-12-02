import React from 'react';

interface FullScreenLoaderProps {
    isVisible: boolean;
    message?: string;
}

const FullScreenLoader: React.FC<FullScreenLoaderProps> = ({ isVisible, message = "Loading..." }) => {
    if (!isVisible) return null;

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-white/95 backdrop-blur-sm">
            <div className="text-center">
                {/* Animated loading dots */}
                <div className="flex justify-center mb-6 space-x-1">
                    <div className="w-2 h-2 bg-brand-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-2 h-2 bg-brand-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-2 h-2 bg-brand-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                </div>

                {/* Loading message */}
                <div className="text-center">
                    <p className="text-slate-600 font-medium text-sm">{message}</p>
                </div>
            </div>
        </div>
    );
};

export default FullScreenLoader;