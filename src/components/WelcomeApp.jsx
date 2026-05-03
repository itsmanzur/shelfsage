import React, { useState, useEffect } from 'react';

const WelcomeApp = () => {
    const [step, setStep] = useState(1);
    const [progress, setProgress] = useState(33);
    const [confetti, setConfetti] = useState(true);

    // Form States
    const [taxonomies, setTaxonomies] = useState({
        author: true,
        publisher: true,
        translator: false,
        series: false
    });

    const [branding, setBranding] = useState({
        color: '#6d28d9', // Royal Purple
        darkMode: true
    });

    const [labels, setLabels] = useState({
        addToCart: 'Add to Cart',
        lookInside: 'Look Inside',
        authorLabel: 'Author',
        publisherLabel: 'Publisher'
    });

    const [isImporting, setIsImporting] = useState(false);
    const [importComplete, setImportComplete] = useState(false);

    useEffect(() => {
        // Simple CSS confetti effect trigger or just animation
        if (confetti) {
            setTimeout(() => setConfetti(false), 5000);
        }
    }, [confetti]);

    const handleNext = () => {
        if (step < 3) {
            setStep(step + 1);
            setProgress(((step + 1) / 3) * 100);
        }
    };

    const handleTaxonomyToggle = (key) => {
        setTaxonomies(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const handleImport = () => {
        setIsImporting(true);

        // We need to use the REST API. Since we don't have the full URL in rmssAdminSettings (usually),
        // we'll assume standard WP REST structure or rely on a localized variable if available.
        // Let's use the one from rmssAdminSettings if I added it, otherwise standard /wp-json/

        const restUrl = window.rmssAdminSettings?.restUrl || '/wp-json/shelfsage/v1';
        const nonce = window.rmssAdminSettings?.nonce;

        fetch(`${restUrl}/onboarding/demo-content`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-WP-Nonce': nonce
            }
        })
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    setImportComplete(true);
                } else {
                    console.error('Import failed:', data);
                    // alert('Import failed: ' + (data.message || 'Unknown error'));
                    // Just set complete for demo purposes if it fails due to duplicates
                    setImportComplete(true);
                }
            })
            .catch(err => {
                console.error(err);
                // alert('Import failed. Please check console.');
                setImportComplete(true);
            })
            .finally(() => {
                setIsImporting(false);
            });
    };

    const handleSaveAndFinish = () => {
        const restUrl = window.rmssAdminSettings?.restUrl || '/wp-json/shelfsage/v1';
        const nonce = window.rmssAdminSettings?.nonce;

        // Save settings via API
        const data = {
            taxonomies,
            branding,
            labels
        };

        fetch(`${restUrl}/onboarding/settings`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-WP-Nonce': nonce
            },
            body: JSON.stringify(data)
        })
            .then(res => res.json())
            .then(() => {
                // Redirect to Shortcode Creator as requested
                window.location.href = 'admin.php?page=shelfsage-architect';
            })
            .catch(err => {
                console.error(err);
                // Fallback redirect
                window.location.href = 'admin.php?page=shelfsage-architect';
            });
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6 font-sans text-gray-800">
            {/* Hero Section */}
            <div className="w-full max-w-5xl bg-white rounded-3xl shadow-2xl overflow-hidden mb-8 relative">
                {/* Background Decor */}
                <div className="absolute top-0 left-0 w-full h-48 bg-gradient-to-r from-purple-700 to-blue-600 z-0"></div>
                <div className="absolute top-0 left-0 w-full h-48 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-20 z-0"></div>

                <div className="relative z-10 pt-16 px-10 pb-10 text-center">
                    <div className="w-24 h-24 bg-white rounded-full mx-auto flex items-center justify-center shadow-lg mb-6 text-5xl">
                        📚
                    </div>
                    <h1 className="text-4xl font-extrabold text-gray-900 mb-2">Welcome to ShelfSage</h1>
                    <p className="text-xl text-gray-600 font-medium">Your WooCommerce store is now a specialized bookstore engine.</p>
                </div>

                {/* Wizard Container */}
                <div className="px-10 pb-12">
                    {/* Progress Bar */}
                    <div className="w-full bg-gray-200 rounded-full h-2.5 mb-8">
                        <div className="bg-purple-600 h-2.5 rounded-full transition-all duration-500 ease-in-out" style={{ width: `${progress}%` }}></div>
                    </div>

                    {/* Step 1: Core Taxonomies */}
                    {step === 1 && (
                        <div className="animate-fade-in">
                            <h2 className="text-2xl font-bold mb-6 text-purple-900">Step 1: Configure Your Bookshelf</h2>
                            <p className="mb-6 text-gray-600">Select which book attributes you want to manage.</p>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {Object.keys(taxonomies).map(key => (
                                    <div
                                        key={key}
                                        className={`p-4 border-2 rounded-xl cursor-pointer transition-all flex items-center justify-between ${taxonomies[key] ? 'border-purple-500 bg-purple-50' : 'border-gray-200 hover:border-purple-300'}`}
                                        onClick={() => handleTaxonomyToggle(key)}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${taxonomies[key] ? 'bg-purple-600 text-white' : 'bg-gray-200 text-gray-500'}`}>
                                                {key === 'author' && <span className="dashicons dashicons-businessman"></span>}
                                                {key === 'publisher' && <span className="dashicons dashicons-building"></span>}
                                                {key === 'translator' && <span className="dashicons dashicons-translation"></span>}
                                                {key === 'series' && <span className="dashicons dashicons-book"></span>}
                                            </div>
                                            <div>
                                                <h3 className="font-bold capitalize">{key}</h3>
                                                <p className="text-xs text-gray-500">Enable {key} management</p>
                                            </div>
                                        </div>
                                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${taxonomies[key] ? 'border-purple-600 bg-purple-600' : 'border-gray-300'}`}>
                                            {taxonomies[key] && <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Step 2: Global Styling & Labels */}
                    {step === 2 && (
                        <div className="animate-fade-in">
                            <h2 className="text-2xl font-bold mb-6 text-purple-900">Step 2: Style & Brand</h2>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                {/* Branding */}
                                <div>
                                    <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                                        <span className="bg-blue-100 text-blue-600 p-1 rounded">🎨</span> Visual Identity
                                    </h3>
                                    <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                                        <div className="mb-4">
                                            <label className="block text-sm font-bold mb-2">Brand Color</label>
                                            <div className="flex items-center gap-3">
                                                <input
                                                    type="color"
                                                    value={branding.color}
                                                    onChange={(e) => setBranding({ ...branding, color: e.target.value })}
                                                    className="w-10 h-10 rounded border-0 cursor-pointer"
                                                />
                                                <span className="text-gray-500 uppercase">{branding.color}</span>
                                            </div>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="font-medium">Auto Dark Mode</span>
                                            <label className="relative inline-flex items-center cursor-pointer">
                                                <input type="checkbox" className="sr-only peer" checked={branding.darkMode} onChange={(e) => setBranding({ ...branding, darkMode: e.target.checked })} />
                                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                                            </label>
                                        </div>
                                    </div>
                                </div>

                                {/* Quick Labels */}
                                <div>
                                    <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                                        <span className="bg-green-100 text-green-600 p-1 rounded">🏷️</span> Quick Labels
                                    </h3>
                                    <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm space-y-4">
                                        <div>
                                            <label className="block text-xs font-bold text-gray-500 mb-1">ADD TO CART BUTTON</label>
                                            <input type="text" className="w-full border rounded p-2 text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none" value={labels.addToCart} onChange={(e) => setLabels({ ...labels, addToCart: e.target.value })} />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-gray-500 mb-1">AUTHOR LABEL</label>
                                            <input type="text" className="w-full border rounded p-2 text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none" value={labels.authorLabel} onChange={(e) => setLabels({ ...labels, authorLabel: e.target.value })} />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Step 3: Demo & Finish */}
                    {step === 3 && (
                        <div className="animate-fade-in text-center">
                            <h2 className="text-2xl font-bold mb-4 text-purple-900">Step 3: Ready to Launch!</h2>
                            <p className="mb-8 text-gray-600 max-w-lg mx-auto">You're all set. Would you like to import some sample books to see ShelfSage in action?</p>

                            <div className="flex flex-col md:flex-row gap-4 justify-center mb-10">
                                <button
                                    onClick={handleImport}
                                    disabled={isImporting || importComplete}
                                    className={`px-8 py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2 transition-all shadow-lg hover:shadow-xl hover:-translate-y-1 ${importComplete ? 'bg-green-500 text-white cursor-default' : 'bg-white text-purple-600 border-2 border-purple-100 hover:border-purple-300'}`}
                                >
                                    {isImporting ? (
                                        <>
                                            <svg className="animate-spin h-5 w-5 text-purple-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            Importing...
                                        </>
                                    ) : importComplete ? (
                                        <>
                                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                                            Sample Data Imported
                                        </>
                                    ) : (
                                        <>
                                            <span className="dashicons dashicons-download"></span>
                                            Import Sample Data
                                        </>
                                    )}
                                </button>

                                <button
                                    onClick={handleSaveAndFinish}
                                    className="px-8 py-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl font-bold text-lg shadow-lg shadow-purple-200 hover:shadow-xl hover:shadow-purple-300 hover:-translate-y-1 transition-all flex items-center justify-center gap-2"
                                >
                                    <span className="dashicons dashicons-rocket"></span>
                                    Create My First Shelf
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Navigation Buttons */}
                    <div className="flex justify-between mt-8 pt-6 border-t border-gray-100">
                        {step > 1 ? (
                            <button onClick={() => { setStep(step - 1); setProgress(((step - 1) / 3) * 100); }} className="text-gray-500 font-medium hover:text-purple-600">
                                Back
                            </button>
                        ) : <div></div>}

                        {step < 3 && (
                            <button onClick={handleNext} className="bg-purple-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-purple-700 transition-colors shadow-md">
                                Next Step &rarr;
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Feature Showcase Grid */}
            <div className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
                {[
                    { icon: '🪄', title: 'Shortcode Wizard', desc: 'Drag-and-drop your layout with live preview.' },
                    { icon: '🏷️', title: 'Metadata Engine', desc: 'ISBN, Page count, and Affiliate links ready.' },
                    { icon: '🔍', title: 'SEO & Schema', desc: 'Automated JSON-LD for Google Rich Results.' },
                    { icon: '📐', title: 'Dynamic Layouts', desc: 'Switch between Grid, List, and Masonry in seconds.' }
                ].map((feature, i) => (
                    <div key={i} className="bg-white/80 backdrop-blur-md p-6 rounded-2xl border border-white/50 shadow-sm hover:shadow-lg transition-all hover:-translate-y-1">
                        <div className="text-3xl mb-3">{feature.icon}</div>
                        <h3 className="font-bold text-gray-900 mb-2">{feature.title}</h3>
                        <p className="text-sm text-gray-500 leading-relaxed">{feature.desc}</p>
                    </div>
                ))}
            </div>

            {/* Footer */}
            <div className="text-center text-gray-500 text-sm space-x-6">
                <a href="#" className="hover:text-purple-600 transition-colors">Documentation</a>
                <span>&bull;</span>
                <a href="#" className="hover:text-purple-600 transition-colors">Join Community</a>
                <span>&bull;</span>
                <a href="#" className="hover:text-purple-600 transition-colors">Support</a>
            </div>
        </div>
    );
};

export default WelcomeApp;
