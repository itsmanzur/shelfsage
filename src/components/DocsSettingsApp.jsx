import React, { useState } from 'react';
import DocsApp from './DocsApp';
import SettingsApp from './SettingsApp';

const DocsSettingsApp = () => {
    const [activeTab, setActiveTab] = useState('settings');

    return (
        <div className="rmss-container font-sans">
            <div className="flex items-center justify-between mb-6 px-4 py-4 bg-white border-b border-gray-200">
                <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                    <span className="text-blue-600 text-3xl">⚙️</span>
                    Docs & Settings
                </h1>
                <div className="flex bg-gray-100 p-1 rounded-lg">
                    <button
                        onClick={() => setActiveTab('docs')}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'docs' ? 'bg-white shadow text-blue-600' : 'text-gray-600 hover:text-gray-900'}`}
                    >
                        Documentation
                    </button>
                    <button
                        onClick={() => setActiveTab('license')}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'license' ? 'bg-white shadow text-blue-600' : 'text-gray-600 hover:text-gray-900'}`}
                    >
                        License
                    </button>
                    <button
                        onClick={() => setActiveTab('settings')}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'settings' ? 'bg-white shadow text-blue-600' : 'text-gray-600 hover:text-gray-900'}`}
                    >
                        Settings
                    </button>
                </div>
            </div>

            <div className="p-4">
                {activeTab === 'docs' && (
                    <div className="-m-4">
                        <DocsApp />
                    </div>
                )}
                {activeTab === 'settings' && <SettingsApp />}
                {activeTab === 'license' && (
                    <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center mt-8">
                        <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-6">
                            <span className="dashicons dashicons-shield text-blue-600 text-3xl"></span>
                        </div>
                        <h2 className="text-2xl font-bold text-gray-800 mb-2">License Management</h2>
                        <p className="text-gray-500 max-w-md mx-auto">
                            Manage your ShelfSage Pro license key here. This feature is currently disabled in the development build.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};
export default DocsSettingsApp;
