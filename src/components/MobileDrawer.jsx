import React from 'react';
import FilterSidebar from './FilterSidebar';

const MobileDrawer = ({ isOpen, onClose, filters, selected, onChange }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex">
            {/* Backdrop */}
            <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" onClick={onClose}></div>

            {/* Panel */}
            <div className="relative w-80 max-w-full bg-white h-full shadow-2xl flex flex-col transform transition-transform duration-300 ease-in-out translate-x-0">
                <div className="p-4 border-b flex justify-between items-center bg-gray-50">
                    <h2 className="text-lg font-bold text-gray-800">Filters</h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-800 focus:outline-none">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                    </button>
                </div>
                
                <div className="flex-1 overflow-y-auto p-4">
                    {/* Reuse Sidebar Component but stripped of container styles if needed, or just wrapper */}
                    <div className="filter-content">
                        {/* We manually render content here or pass props to a simplified view. 
                            Reusing FilterSidebar is easiest but it has its own container styles. 
                            Let's just use it, the double padding is fine or we can refactor later. 
                        */}
                        <FilterSidebar filters={filters} selected={selected} onChange={onChange} />
                    </div>
                </div>

                <div className="p-4 border-t bg-gray-50">
                    <button 
                        onClick={onClose}
                        className="w-full py-3 bg-blue-600 text-white rounded-lg font-bold shadow-lg hover:bg-blue-700 transition"
                    >
                        Show Results
                    </button>
                </div>
            </div>
        </div>
    );
};

export default MobileDrawer;
