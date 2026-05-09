import React, { useState } from 'react';

const DocsApp = () => {
    const [activeSection, setActiveSection] = useState('introduction');
    const [searchQuery, setSearchQuery] = useState('');

    const sections = [
        { id: 'introduction', title: 'Introduction' },
        { id: 'setup', title: 'Setup & Installation' },
        { id: 'taxonomies', title: 'Taxonomies' },
        { id: 'shortcodes', title: 'Shortcodes' },
        { id: 'faq', title: 'FAQ' },
    ];

    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text);
        alert('Copied to clipboard!');
    };

    const renderContent = () => {
        switch (activeSection) {
            case 'introduction':
                return (
                    <div className="prose max-w-none text-gray-700 animate-fade-in">
                        <h1 className="text-3xl font-bold text-gray-900 mb-4">Welcome to ShelfSage</h1>
                        <p className="text-lg mb-6">
                            ShelfSage transforms your WooCommerce store into a powerful, specialized bookstore engine. 
                            Manage authors, publishers, and book metadata with ease, and display them using beautiful, responsive layouts.
                        </p>
                        
                        <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6 rounded-r-lg">
                            <div className="flex">
                                <div className="flex-shrink-0">
                                    <span className="dashicons dashicons-info text-blue-500 text-xl"></span>
                                </div>
                                <div className="ml-3">
                                    <p className="text-sm text-blue-700">
                                        <strong>Tip:</strong> Use the "Welcome" wizard to quickly set up your taxonomies and import sample data.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                );
            case 'setup':
                return (
                    <div className="prose max-w-none text-gray-700 animate-fade-in">
                        <h1 className="text-3xl font-bold text-gray-900 mb-4">Setup & Installation</h1>
                        <h3 className="text-xl font-bold text-gray-800 mt-6 mb-2">1. Activation</h3>
                        <p className="mb-4">Upon activation, you will be redirected to the Setup Wizard. Follow the steps to configure your preferences.</p>
                        
                        <h3 className="text-xl font-bold text-gray-800 mt-6 mb-2">2. Adding Books</h3>
                        <p className="mb-4">ShelfSage uses WooCommerce products. To add a book:</p>
                        <ol className="list-decimal pl-5 space-y-2 mb-6">
                            <li>Go to <strong>Products &gt; Add New</strong>.</li>
                            <li>Enter the book title and description.</li>
                            <li>In the right sidebar, assign <strong>Authors</strong>, <strong>Publishers</strong>, and <strong>Genres</strong>.</li>
                            <li>Scroll down to the <strong>Book Details</strong> tab to add ISBN, Page Count, and Language.</li>
                        </ol>
                    </div>
                );
            case 'taxonomies':
                return (
                    <div className="prose max-w-none text-gray-700 animate-fade-in">
                        <h1 className="text-3xl font-bold text-gray-900 mb-4">Taxonomies</h1>
                        <p className="text-lg mb-6">
                            ShelfSage adds professional library-grade taxonomies to WooCommerce: Authors, Publishers, Translators, and Series.
                        </p>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                            <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                                <h3 className="text-lg font-bold text-gray-900 mb-2 flex items-center gap-2">
                                    <span className="dashicons dashicons-businessman text-purple-600"></span> Authors & Publishers
                                </h3>
                                <p className="text-sm text-gray-600">
                                    Add detailed bios, photos, and logos for every author and publisher. These create dedicated archive pages automatically.
                                </p>
                            </div>
                            <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                                <h3 className="text-lg font-bold text-gray-900 mb-2 flex items-center gap-2">
                                    <span className="dashicons dashicons-translation text-green-600"></span> Translators & Series
                                </h3>
                                <p className="text-sm text-gray-600">
                                    Perfect for organizing translated works and multi-volume book collections or trilogies.
                                </p>
                            </div>
                        </div>

                        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6 rounded-r-lg">
                            <div className="flex">
                                <div className="flex-shrink-0">
                                    <span className="dashicons dashicons-lightbulb text-yellow-500 text-xl"></span>
                                </div>
                                <div className="ml-3">
                                    <p className="text-sm text-yellow-700">
                                        <strong>Usage Tip:</strong> You can assign these taxonomies directly from the product edit screen sidebar or use the bulk importer for large catalogs.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                );
            case 'shortcodes':
                return (
                    <div className="prose max-w-none text-gray-700 animate-fade-in">
                        <h1 className="text-3xl font-bold text-gray-900 mb-4">Shortcodes</h1>
                        <p className="mb-6">Use these shortcodes to display books and taxonomies anywhere on your site.</p>

                        <div className="mb-8">
                            <h3 className="text-xl font-bold text-gray-800 mb-2">Display Books</h3>
                            <p className="text-sm text-gray-500 mb-3">Displays a grid or list of books.</p>
                            <div className="bg-gray-900 rounded-lg p-4 relative group">
                                <code className="text-green-400 font-mono text-sm">[shelfsage_books limit="12" layout="grid"]</code>
                                <button 
                                    onClick={() => copyToClipboard('[shelfsage_books limit="12" layout="grid"]')}
                                    className="absolute top-2 right-2 bg-gray-700 hover:bg-gray-600 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                    Copy
                                </button>
                            </div>
                        </div>

                        <div className="mb-8">
                            <h3 className="text-xl font-bold text-gray-800 mb-2">Display Authors</h3>
                            <p className="text-sm text-gray-500 mb-3">Displays a list of all book authors.</p>
                            <div className="bg-gray-900 rounded-lg p-4 relative group">
                                <code className="text-green-400 font-mono text-sm">[shelfsage_authors]</code>
                                <button 
                                    onClick={() => copyToClipboard('[shelfsage_authors]')}
                                    className="absolute top-2 right-2 bg-gray-700 hover:bg-gray-600 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                    Copy
                                </button>
                            </div>
                        </div>
                    </div>
                );
            case 'faq':
                return <FAQSection searchQuery={searchQuery} />;
            default:
                return <p>Select a section to view details.</p>;
        }
    };

    return (
        <div className="flex h-screen bg-gray-50 font-sans -m-5">
            {/* Sidebar */}
            <div className="w-64 bg-white border-r border-gray-200 flex-shrink-0 overflow-y-auto">
                <div className="p-6">
                    <h2 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
                        <span className="text-blue-600">📖</span> Docs
                    </h2>
                </div>
                <nav className="px-4 space-y-1">
                    {sections.map(section => (
                        <button
                            key={section.id}
                            onClick={() => setActiveSection(section.id)}
                            className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                                activeSection === section.id 
                                ? 'bg-blue-50 text-blue-700' 
                                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                            }`}
                        >
                            {section.title}
                        </button>
                    ))}
                </nav>
                
                <div className="p-6 mt-8 border-t border-gray-100">
                    <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Support</h3>
                    <div className="space-y-3">
                        <a href="#" className="flex items-center text-sm text-gray-600 hover:text-blue-600">
                            <span className="dashicons dashicons-video-alt3 mr-2"></span> Video Tutorials
                        </a>
                        <a href="#" className="flex items-center text-sm text-gray-600 hover:text-blue-600">
                            <span className="dashicons dashicons-facebook mr-2"></span> Join Community
                        </a>
                        <a href="#" className="flex items-center text-sm text-gray-600 hover:text-blue-600">
                            <span className="dashicons dashicons-email mr-2"></span> Contact Support
                        </a>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 overflow-y-auto">
                {/* Search Header */}
                <div className="bg-white border-b border-gray-200 px-8 py-4 sticky top-0 z-10 flex items-center justify-between">
                    <div className="relative w-full max-w-md">
                        <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <span className="dashicons dashicons-search text-gray-400"></span>
                        </span>
                        <input 
                            type="text" 
                            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg leading-5 bg-gray-50 placeholder-gray-500 focus:outline-none focus:bg-white focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                            placeholder="Search documentation..."
                            value={searchQuery}
                            onChange={(e) => {
                                setSearchQuery(e.target.value);
                                if(activeSection !== 'faq' && e.target.value) setActiveSection('faq');
                            }}
                        />
                    </div>
                    <div className="text-sm text-gray-500">
                        ShelfSage v1.0.0
                    </div>
                </div>

                {/* Content Body */}
                <div className="max-w-4xl mx-auto px-8 py-12">
                    {renderContent()}
                </div>
            </div>
        </div>
    );
};

const FAQSection = ({ searchQuery }) => {
    const [openIndex, setOpenIndex] = useState(null);

    const faqs = [
        { q: "Does this work with any WooCommerce theme?", a: "Yes, ShelfSage is designed to work with any WooCommerce-compatible theme. It injects its own content into standard hooks but inherits your theme's fonts and colors where possible." },
        { q: "How do I import existing books?", a: "Use the built-in 'Sample Data Import' tool in the Welcome Wizard to get started. For your own inventory, you can use the standard WooCommerce CSV importer which supports our custom taxonomies." },
        { q: "Does it support Live Search?", a: "Yes, the Shortcode Generator includes an option to enable a live search bar above your book grid." },
        { q: "Can I change the 'Add to Cart' label?", a: "Absolutely. Go to Settings > Custom Labels to rename buttons like 'Add to Cart', 'View Details', or 'Read More'." },
        { q: "What is the 'Look Inside' feature?", a: "This feature allows customers to preview a few pages of the book (PDF or Images) before purchasing. You can enable this in Settings." },
        { q: "Is it SEO friendly?", a: "Yes, ShelfSage automatically outputs JSON-LD Schema for Books, Authors, and Publishers, helping Google understand your content better." },
        { q: "Can I delete the sample data later?", a: "Yes, you can manually delete the sample products from the Products menu. We tag them for easy identification." },
        { q: "Does it support Dark Mode?", a: "Yes, our frontend components are fully dark-mode compatible. They respect the user's system preference or your theme's dark mode toggle." },
        { q: "Where are the extra book fields?", a: "You'll find new fields like ISBN, Pages, and Language in the 'Book Details' tab within the Product Data meta box when editing a product." },
        { q: "How do Affiliate Buttons work?", a: "In the product edit page, you can add external links (e.g., Amazon, Rokomari). These will appear as buttons on the single product page." },
    ];

    const filteredFaqs = faqs.filter(f => 
        f.q.toLowerCase().includes(searchQuery.toLowerCase()) || 
        f.a.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="prose max-w-none animate-fade-in">
            <h1 className="text-3xl font-bold text-gray-900 mb-6">Frequently Asked Questions</h1>
            
            <div className="space-y-4">
                {filteredFaqs.length > 0 ? filteredFaqs.map((faq, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg overflow-hidden">
                        <button 
                            className="w-full flex items-center justify-between p-4 bg-white hover:bg-gray-50 transition-colors text-left focus:outline-none"
                            onClick={() => setOpenIndex(openIndex === index ? null : index)}
                        >
                            <span className="font-semibold text-gray-800">{faq.q}</span>
                            <span className={`dashicons dashicons-arrow-down-alt2 transform transition-transform ${openIndex === index ? 'rotate-180' : ''}`}></span>
                        </button>
                        {openIndex === index && (
                            <div className="p-4 bg-gray-50 border-t border-gray-200 text-gray-600 text-sm">
                                {faq.a}
                            </div>
                        )}
                    </div>
                )) : (
                    <p className="text-gray-500">No matching questions found.</p>
                )}
            </div>
        </div>
    );
};

export default DocsApp;
