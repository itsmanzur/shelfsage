import React, { useState, useEffect } from 'react';
import SearchBar from './components/SearchBar';
import FilterSidebar from './components/FilterSidebar';
import BookCard from './components/BookCard';
import SkeletonLoader from './components/SkeletonLoader';
import MobileDrawer from './components/MobileDrawer';
import axios from 'axios';
import Masonry from 'react-masonry-css';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';

// Layout Switcher Component
const LayoutSwitcher = ({ activeLayout, onChange, isPro, onUnlock }) => {
    const layouts = [
        {
            id: 'grid', icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"></path></svg>
            ), label: 'Grid', free: true
        },
        {
            id: 'masonry', icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 5a1 1 0 011-1h4a1 1 0 011 1v5a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v3a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v3a1 1 0 01-1 1H5a1 1 0 01-1-1v-3zM14 13a1 1 0 011-1h4a1 1 0 011 1v5a1 1 0 01-1 1h-4a1 1 0 01-1-1v-5z"></path></svg>
            ), label: 'Masonry', free: false
        },
        {
            id: 'list', icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path></svg>
            ), label: 'List', free: false
        },
        {
            id: 'slider', icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2"></path></svg>
            ), label: 'Slider', free: true
        },
    ];

    return (
        <div className="flex items-center bg-gray-100 rounded-lg p-1 space-x-1">
            {layouts.map(layout => {
                const isLocked = !layout.free && !isPro;
                return (
                    <button
                        key={layout.id}
                        onClick={() => isLocked ? onUnlock() : onChange(layout.id)}
                        className={`p-2 rounded-md transition-all duration-200 flex items-center gap-2 relative group ${activeLayout === layout.id
                            ? 'bg-white text-blue-600 shadow-sm'
                            : isLocked ? 'text-gray-400 cursor-not-allowed bg-gray-50' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200'
                            }`}
                        title={isLocked ? `${layout.label} (Pro)` : layout.label}
                    >
                        {layout.icon}
                        <span className="hidden lg:inline text-xs font-medium">{layout.label}</span>
                        {isLocked && (
                            <span className="absolute -top-2 -right-2 bg-yellow-400 text-white text-[8px] px-1 rounded-full shadow-sm font-bold border border-white">
                                PRO
                            </span>
                        )}
                    </button>
                );
            })}
        </div>
    );
};

// Unlock Premium Modal
const UnlockModal = ({ isOpen, onClose }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden transform transition-all scale-100">
                <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 text-white text-center">
                    <h2 className="text-2xl font-bold mb-2">Unlock Pro Features</h2>
                    <p className="text-blue-100">Get access to premium layouts and more!</p>
                </div>
                <div className="p-8">
                    <ul className="space-y-4 mb-8">
                        <li className="flex items-center gap-3 text-gray-700">
                            <span className="w-6 h-6 rounded-full bg-green-100 text-green-600 flex items-center justify-center">✓</span>
                            <span>Masonry & List Layouts</span>
                        </li>
                        <li className="flex items-center gap-3 text-gray-700">
                            <span className="w-6 h-6 rounded-full bg-green-100 text-green-600 flex items-center justify-center">✓</span>
                            <span>Advanced Filter Options</span>
                        </li>
                        <li className="flex items-center gap-3 text-gray-700">
                            <span className="w-6 h-6 rounded-full bg-green-100 text-green-600 flex items-center justify-center">✓</span>
                            <span>Visual Profiles for Authors</span>
                        </li>
                    </ul>
                    <div className="flex gap-4">
                        <button onClick={onClose} className="flex-1 py-3 px-4 rounded-xl border border-gray-200 text-gray-600 font-semibold hover:bg-gray-50 transition">
                            Maybe Later
                        </button>
                        <a href="https://shelfsage.com/pricing" target="_blank" className="flex-1 py-3 px-4 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 transition text-center shadow-lg hover:shadow-xl transform hover:-translate-y-1">
                            Upgrade Now
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
};

import BookListItem from './components/BookListItem';

// Simple In-Memory Cache
const requestCache = {};

const App = () => {
    const [books, setBooks] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [layout, setLayout] = useState('grid');
    const [filtersData, setFiltersData] = useState({ authors: [], publishers: [], genres: [] });
    const [selectedFilters, setSelectedFilters] = useState({
        author: [],
        publisher: [],
        genre: [],
        term: ''
    });
    const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);
    const [showUnlockModal, setShowUnlockModal] = useState(false);

    // Get Settings from WP
    const apiUrl = window.rmssSettings?.apiUrl || '/wp-json/shelfsage/v1';
    const nonce = window.rmssSettings?.nonce || '';
    const isPro = window.rmssSettings?.isPro || false; // Get Pro Status

    // Fetch Filters on Mount
    useEffect(() => {
        const fetchFilters = async () => {
            const cacheKey = 'filters';
            if (requestCache[cacheKey]) {
                setFiltersData(requestCache[cacheKey]);
                return;
            }

            try {
                const res = await axios.get(`${apiUrl}/filters`, { headers: { 'X-WP-Nonce': nonce } });
                requestCache[cacheKey] = res.data;
                setFiltersData(res.data);
            } catch (err) {
                console.error('Error fetching filters:', err);
            }
        };
        fetchFilters();
    }, [apiUrl, nonce]);

    // Fetch Books when Filters Change
    useEffect(() => {
        const fetchBooks = async () => {
            setIsLoading(true);

            // Build Query Params
            const params = new URLSearchParams();
            if (selectedFilters.term) params.append('term', selectedFilters.term);
            if (selectedFilters.author.length) params.append('author', selectedFilters.author.join(','));
            if (selectedFilters.publisher.length) params.append('publisher', selectedFilters.publisher.join(','));
            if (selectedFilters.genre.length) params.append('genre', selectedFilters.genre.join(','));

            const queryString = params.toString();
            const cacheKey = `search_${queryString}`;

            if (requestCache[cacheKey]) {
                setBooks(requestCache[cacheKey]);
                setIsLoading(false);
                return;
            }

            try {
                const res = await axios.get(`${apiUrl}/search?${queryString}`, { headers: { 'X-WP-Nonce': nonce } });
                requestCache[cacheKey] = res.data;
                setBooks(res.data);
            } catch (err) {
                console.error('Error fetching books:', err);
            } finally {
                setIsLoading(false);
            }
        };

        // Debounce Search Term
        const timer = setTimeout(() => {
            fetchBooks();
        }, 300);

        return () => clearTimeout(timer);
    }, [selectedFilters, apiUrl, nonce]);

    const handleFilterChange = (type, values) => {
        setSelectedFilters(prev => ({ ...prev, [type]: values }));
    };

    const handleSearch = (term) => {
        setSelectedFilters(prev => ({ ...prev, term: typeof term === 'string' ? term : '' }));
    };

    // Masonry Breakpoints
    const masonryBreakpoints = {
        default: 4,
        1100: 3,
        700: 2,
        500: 1
    };

    const renderContent = () => {
        if (isLoading) return <SkeletonLoader count={8} />;

        if (books.length === 0) {
            return (
                <div className="text-center py-20 bg-white rounded-lg shadow-sm border border-gray-100">
                    <p className="text-gray-500 text-lg">No books found matching your criteria.</p>
                    <button
                        onClick={() => setSelectedFilters({ author: [], publisher: [], genre: [], term: '' })}
                        className="mt-4 px-6 py-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition font-semibold"
                    >
                        Clear Filters
                    </button>
                </div>
            );
        }

        switch (layout) {
            case 'masonry':
                return (
                    <Masonry
                        breakpointCols={masonryBreakpoints}
                        className="flex w-auto -ml-6"
                        columnClassName="pl-6 bg-clip-padding"
                    >
                        {books.map(book => (
                            <div key={book.id} className="mb-6">
                                <BookCard book={book} />
                            </div>
                        ))}
                    </Masonry>
                );

            case 'list':
                return (
                    <div className="space-y-4">
                        {books.map(book => (
                            <BookListItem key={book.id} book={book} />
                        ))}
                    </div>
                );

            case 'slider':
                return (
                    <Swiper
                        modules={[Navigation, Pagination]}
                        spaceBetween={20}
                        slidesPerView={1}
                        navigation
                        pagination={{ clickable: true }}
                        breakpoints={{
                            640: { slidesPerView: 2 },
                            768: { slidesPerView: 3 },
                            1024: { slidesPerView: 4 },
                        }}
                        className="pb-10"
                    >
                        {books.map(book => (
                            <SwiperSlide key={book.id} className="pb-8">
                                <BookCard book={book} />
                            </SwiperSlide>
                        ))}
                    </Swiper>
                );

            case 'grid':
            default:
                return (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                        {books.map(book => (
                            <BookCard key={book.id} book={book} />
                        ))}
                    </div>
                );
        }
    };

    return (
        <div className="bg-gray-50 min-h-screen p-4 font-sans text-gray-900">
            <div className="max-w-7xl mx-auto flex flex-col md:flex-row gap-8">

                {/* Sidebar (Desktop) */}
                <aside className="hidden md:block w-72 flex-shrink-0 sticky top-4 h-[calc(100vh-2rem)] overflow-y-auto custom-scrollbar">
                    <FilterSidebar
                        filters={filtersData}
                        selected={selectedFilters}
                        onChange={handleFilterChange}
                    />
                </aside>

                {/* Main Content */}
                <main className="flex-1 min-w-0">
                    {/* Header */}
                    <div className="bg-white p-4 rounded-lg shadow-sm mb-6 flex flex-col lg:flex-row items-center justify-between gap-4 border border-gray-100">
                        <div className="text-xl font-bold text-blue-600 flex items-center gap-2">
                            <span className="text-2xl">📚</span> ShelfSage
                        </div>

                        <div className="flex-1 w-full flex flex-col sm:flex-row gap-4 items-center">
                            <div className="flex-1 w-full">
                                <SearchBar onSearch={handleSearch} />
                            </div>

                            <LayoutSwitcher
                                activeLayout={layout}
                                onChange={setLayout}
                                isPro={isPro}
                                onUnlock={() => setShowUnlockModal(true)}
                            />

                            {/* Mobile Filter Toggle */}
                            <button
                                className="md:hidden px-4 py-2 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700 transition flex items-center gap-2"
                                onClick={() => setIsMobileFilterOpen(true)}
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"></path></svg>
                                Filters
                            </button>
                        </div>
                    </div>

                    {/* Results */}
                    <div className="min-h-[400px]">
                        {renderContent()}
                    </div>
                </main>
            </div>

            {/* Mobile Drawer */}
            <MobileDrawer
                isOpen={isMobileFilterOpen}
                onClose={() => setIsMobileFilterOpen(false)}
                filters={filtersData}
                selected={selectedFilters}
                onChange={handleFilterChange}
            />

            <UnlockModal isOpen={showUnlockModal} onClose={() => setShowUnlockModal(false)} />
        </div>
    );
};

export default App;
