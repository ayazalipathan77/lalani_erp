import React from 'react';

interface FullScreenLoaderProps {
    isVisible: boolean;
    message?: string;
}

const FullScreenLoader: React.FC<FullScreenLoaderProps> = ({ isVisible, message = "Loading..." }) => {
    if (!isVisible) return null;

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-white/95 backdrop-blur-sm">
            {/* Ambient gray square background */}
            <div className="relative">
                {/* Large ambient gray square */}
                <div className="w-32 h-32 bg-slate-100 rounded-2xl shadow-2xl shadow-slate-200/50 flex items-center justify-center">
                    {/* Logo container */}
                    <div className="relative w-16 h-16 flex items-center justify-center bg-gradient-to-br from-brand-500 to-brand-700 rounded-xl shadow-lg shadow-brand-900/40">
                        <div className="absolute inset-0 rounded-xl border border-white/10"></div>
                        <span className="font-display font-bold text-white text-2xl tracking-tight">LT</span>
                    </div>
                </div>

                {/* Animated loading dots */}
                <div className="flex justify-center mt-6 space-x-1">
                    <div className="w-2 h-2 bg-brand-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-2 h-2 bg-brand-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-2 h-2 bg-brand-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                </div>

                {/* Loading message */}
                <div className="text-center mt-4">
                    <p className="text-slate-600 font-medium text-sm">{message}</p>
                </div>
            </div>
        </div>
    );
};

export default FullScreenLoader;