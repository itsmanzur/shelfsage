import React from 'react';

const FilterSidebar = ({ filters, selected, onChange }) => {
    
    const handleCheck = (type, value) => {
        const current = selected[type] || [];
        const newValues = current.includes(value) 
            ? current.filter(item => item !== value)
            : [...current, value];
        onChange(type, newValues);
    };

    return (
        <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-100">
            <h2 className="font-bold text-lg mb-6 text-gray-800 border-b pb-2">Filters</h2>

            {/* Genres */}
            <div className="mb-6">
                <h3 className="font-semibold text-sm mb-3 text-gray-600 uppercase tracking-wide">Genres</h3>
                <div className="space-y-2 max-h-60 overflow-y-auto custom-scrollbar">
                    {filters.genres.map(genre => (
                        <label key={genre.id} className="flex items-center space-x-3 cursor-pointer group">
                            <input 
                                type="checkbox" 
                                checked={selected.genre.includes(genre.slug)}
                                onChange={() => handleCheck('genre', genre.slug)}
                                className="rounded text-blue-600 focus:ring-blue-500 border-gray-300 transition" 
                            />
                            <span className="text-sm text-gray-700 group-hover:text-blue-600 transition">{genre.name}</span>
                            <span className="text-xs text-gray-400 ml-auto bg-gray-100 px-2 py-0.5 rounded-full">{genre.count}</span>
                        </label>
                    ))}
                </div>
            </div>

            {/* Publishers (With Logos) */}
            <div className="mb-6">
                <h3 className="font-semibold text-sm mb-3 text-gray-600 uppercase tracking-wide">
                    {window.rmssSettings?.labels?.publisher ? window.rmssSettings.labels.publisher + 's' : 'Publishers'}
                </h3>
                <div className="space-y-3 max-h-60 overflow-y-auto custom-scrollbar">
                    {filters.publishers.map(pub => (
                        <label key={pub.id} className="flex items-center space-x-3 cursor-pointer group">
                            <input 
                                type="checkbox" 
                                checked={selected.publisher.includes(pub.slug)}
                                onChange={() => handleCheck('publisher', pub.slug)}
                                className="rounded text-blue-600 focus:ring-blue-500 border-gray-300" 
                            />
                            {pub.image ? (
                                <img src={pub.image} alt={pub.name} className="w-8 h-8 object-contain border border-gray-100 rounded bg-white p-0.5" />
                            ) : (
                                <div className="w-8 h-8 bg-gray-100 rounded flex items-center justify-center text-xs text-gray-400 font-bold">
                                    {pub.name.charAt(0)}
                                </div>
                            )}
                            <span className="text-sm text-gray-700 group-hover:text-blue-600 transition flex-1">{pub.name}</span>
                        </label>
                    ))}
                </div>
            </div>

            {/* Authors (With Avatars) */}
            <div>
                <h3 className="font-semibold text-sm mb-3 text-gray-600 uppercase tracking-wide">
                    {window.rmssSettings?.labels?.author ? window.rmssSettings.labels.author + 's' : 'Authors'}
                </h3>
                <div className="space-y-3 max-h-60 overflow-y-auto custom-scrollbar">
                    {filters.authors.map(author => (
                        <label key={author.id} className="flex items-center space-x-3 cursor-pointer group">
                            <input 
                                type="checkbox" 
                                checked={selected.author.includes(author.slug)}
                                onChange={() => handleCheck('author', author.slug)}
                                className="rounded text-blue-600 focus:ring-blue-500 border-gray-300" 
                            />
                             {author.image ? (
                                <img src={author.image} alt={author.name} className="w-8 h-8 object-cover rounded-full border border-gray-100" />
                            ) : (
                                <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center text-xs text-gray-500 font-bold">
                                    {author.name.charAt(0)}
                                </div>
                            )}
                            <span className="text-sm text-gray-700 group-hover:text-blue-600 transition flex-1">{author.name}</span>
                        </label>
                    ))}
                </div>
            </div>

        </div>
    );
};

export default FilterSidebar;
