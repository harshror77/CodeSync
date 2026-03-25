import React from 'react';

const Loading = () => {
    return (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-gray-900 text-white">
            {/* Simple CSS Spinner */}
            <div className="relative w-16 h-16 mb-4">
                <div className="absolute inset-0 border-4 border-blue-500/20 rounded-full"></div>
                <div className="absolute inset-0 border-4 border-t-blue-500 rounded-full animate-spin"></div>
            </div>

            {/* Logo and Text */}
            <h1 className="text-3xl font-bold mb-2">
                Code<span className="text-blue-400">Haven</span>
            </h1>
            
            <p className="text-gray-400 animate-pulse text-sm">
                Setting up your workspace...
            </p>
        </div>
    );
};

export default Loading;