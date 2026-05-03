import React, { useState, useEffect } from 'react';
import axios from 'axios';

const FilterApp = () => {
    const [products, setProducts] = useState([]);
    const [filters, setFilters] = useState({
        authors: [],
        publishers: [],
        genres: []
    });
    const [selectedFilters, setSelectedFilters] = useState({
        author: [],
        publisher: [],
        genre: []
    });
    const [loading, setLoading] = useState(true);
    const [filtering, setFiltering] = useState(false);

    // Fetch Filter Terms (Authors, Publishers, Genres)
    useEffect(() => {
        const fetchFilters = async () => {
            try {
                const response = await axios.get(`${window.rmssSettings.apiUrl}/filters`);
                setFilters(response.data);
            } catch (error) {
                console.error("Error fetching filters:", error);
            }
        };
        fetchFilters();
    }, []);

    // Fetch Products (Initial & Filtered)
    useEffect(() => {
        const fetchProducts = async () => {
            setFiltering(true);
            try {
                const params = new URLSearchParams();
                if (selectedFilters.author.length) params.append('author', selectedFilters.author.join(','));
                if (selectedFilters.publisher.length) params.append('publisher', selectedFilters.publisher.join(','));
                if (selectedFilters.genre.length) params.append('genre', selectedFilters.genre.join(','));

                const response = await axios.get(`${window.rmssSettings.apiUrl}/search?${params.toString()}`);
                setProducts(response.data);
            } catch (error) {
                console.error("Error fetching products:", error);
            } finally {
                setLoading(false);
                setFiltering(false);
            }
        };

        // Debounce slightly to avoid rapid requests
        const timeout = setTimeout(fetchProducts, 300);
        return () => clearTimeout(timeout);
    }, [selectedFilters]);

    const handleCheckboxChange = (type, slug) => {
        setSelectedFilters(prev => {
            const current = prev[type];
            const updated = current.includes(slug) 
                ? current.filter(s => s !== slug) 
                : [...current, slug];
            return { ...prev, [type]: updated };
        });
    };

    return (
        <div className="rmss-filter-container flex flex-col md:flex-row gap-8 max-w-7xl mx-auto p-4">
            {/* Sidebar */}
            <aside className="w-full md:w-1/4 lg:w-1/5 space-y-8">
                {/* Authors Filter */}
                {filters.authors.length > 0 && (
                    <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
                        <h3 className="font-bold text-lg mb-4 text-gray-800 border-b pb-2">Authors</h3>
                        <div className="space-y-2 max-h-60 overflow-y-auto custom-scrollbar">
                            {filters.authors.map(term => (
                                <label key={term.id} className="flex items-center space-x-3 cursor-pointer group">
                                    <input 
                                        type="checkbox" 
                                        className="form-checkbox h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500 transition duration-150 ease-in-out"
                                        checked={selectedFilters.author.includes(term.slug)}
                                        onChange={() => handleCheckboxChange('author', term.slug)}
                                    />
                                    <span className="text-gray-600 group-hover:text-blue-600 transition-colors text-sm">{term.name}</span>
                                    <span className="text-xs text-gray-400 ml-auto bg-gray-50 px-2 py-0.5 rounded-full">{term.count}</span>
                                </label>
                            ))}
                        </div>
                    </div>
                )}

                {/* Publishers Filter */}
                {filters.publishers.length > 0 && (
                    <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
                        <h3 className="font-bold text-lg mb-4 text-gray-800 border-b pb-2">Publishers</h3>
                        <div className="space-y-2 max-h-60 overflow-y-auto custom-scrollbar">
                            {filters.publishers.map(term => (
                                <label key={term.id} className="flex items-center space-x-3 cursor-pointer group">
                                    <input 
                                        type="checkbox" 
                                        className="form-checkbox h-4 w-4 text-purple-600 rounded border-gray-300 focus:ring-purple-500 transition duration-150 ease-in-out"
                                        checked={selectedFilters.publisher.includes(term.slug)}
                                        onChange={() => handleCheckboxChange('publisher', term.slug)}
                                    />
                                    <span className="text-gray-600 group-hover:text-purple-600 transition-colors text-sm">{term.name}</span>
                                    <span className="text-xs text-gray-400 ml-auto bg-gray-50 px-2 py-0.5 rounded-full">{term.count}</span>
                                </label>
                            ))}
                        </div>
                    </div>
                )}

                {/* Genres Filter */}
                {filters.genres.length > 0 && (
                    <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
                        <h3 className="font-bold text-lg mb-4 text-gray-800 border-b pb-2">Genres</h3>
                        <div className="space-y-2 max-h-60 overflow-y-auto custom-scrollbar">
                            {filters.genres.map(term => (
                                <label key={term.id} className="flex items-center space-x-3 cursor-pointer group">
                                    <input 
                                        type="checkbox" 
                                        className="form-checkbox h-4 w-4 text-green-600 rounded border-gray-300 focus:ring-green-500 transition duration-150 ease-in-out"
                                        checked={selectedFilters.genre.includes(term.slug)}
                                        onChange={() => handleCheckboxChange('genre', term.slug)}
                                    />
                                    <span className="text-gray-600 group-hover:text-green-600 transition-colors text-sm">{term.name}</span>
                                    <span className="text-xs text-gray-400 ml-auto bg-gray-50 px-2 py-0.5 rounded-full">{term.count}</span>
                                </label>
                            ))}
                        </div>
                    </div>
                )}
            </aside>

            {/* Product Grid */}
            <main className="flex-1">
                <div className="mb-6 flex justify-between items-center">
                    <h2 className="text-2xl font-bold text-gray-800">
                        {loading ? 'Loading Books...' : `${products.length} Books Found`}
                    </h2>
                    {/* Optional: Sort dropdown could go here */}
                </div>

                <div className={`grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 transition-opacity duration-300 ${filtering ? 'opacity-50' : 'opacity-100'}`}>
                    {products.length > 0 ? (
                        products.map((product, index) => (
                            <div 
                                key={product.id} 
                                className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 flex flex-col h-full animate-fade-in"
                                style={{ animationDelay: `${index * 50}ms` }}
                            >
                                <div className="relative aspect-[2/3] bg-gray-100 overflow-hidden group">
                                    <a href={product.permalink}>
                                        <img 
                                            src={product.thumbnail} 
                                            alt={product.title} 
                                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                        />
                                    </a>
                                    {product.is_on_sale && (
                                        <span className="absolute top-2 right-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded shadow-sm">SALE</span>
                                    )}
                                </div>
                                
                                <div className="p-4 flex-1 flex flex-col">
                                    <div className="text-xs text-blue-500 mb-1 font-medium truncate" dangerouslySetInnerHTML={{ __html: product.genre }}></div>
                                    <h3 className="text-base font-bold text-gray-900 mb-1 leading-tight line-clamp-2 min-h-[2.5rem]">
                                        <a href={product.permalink} className="hover:text-blue-600 transition-colors">
                                            {product.title}
                                        </a>
                                    </h3>
                                    <div className="text-xs text-gray-500 mb-2">{product.authors}</div>
                                    
                                    <div className="mt-auto pt-3 border-t border-gray-100 flex items-center justify-between">
                                        <div className="text-lg font-bold text-gray-900" dangerouslySetInnerHTML={{ __html: product.price }}></div>
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        !loading && (
                            <div className="col-span-full text-center py-12 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                                <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path></svg>
                                <p className="text-gray-500 text-lg">No books found matching your selection.</p>
                                <button 
                                    onClick={() => setSelectedFilters({ author: [], publisher: [], genre: [] })}
                                    className="mt-4 text-blue-600 hover:underline font-medium"
                                >
                                    Clear all filters
                                </button>
                            </div>
                        )
                    )}
                </div>
            </main>
        </div>
    );
};

export default FilterApp;
