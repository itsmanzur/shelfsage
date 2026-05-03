import React from 'react';

const PremiumLockedOverlay = ({
    isPro,
    children,
    featureName = "Premium Feature",
    mode = 'overlay',
    customCta = "Upgrade to Pro Now",
    lockIcon = "🔒"
}) => {
    // If user is Pro, just render the content normally
    if (isPro) {
        return <>{children}</>;
    }

    return (
        <div className="relative group overflow-hidden rounded-xl w-full h-full">
            {/* The underlying content - blurred */}
            {mode !== 'replacement' && (
                <div className="filter blur-sm select-none pointer-events-none opacity-50 transition-all duration-300">
                    {children}
                </div>
            )}

            {/* The Overlay */}
            <div className={`absolute inset-0 z-50 flex flex-col items-center justify-center p-6 text-center transition-all duration-500
                bg-white/60 dark:bg-gray-900/60 backdrop-blur-md border border-white/20 dark:border-gray-700/50 rounded-xl
                ${mode === 'replacement' ? 'relative bg-gray-50 dark:bg-gray-800' : ''}`}>

                {/* Floating Bubbles / Glow Effect Background */}
                <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
                    <div className="absolute top-[-50%] left-[-50%] w-[200%] h-[200%] bg-gradient-to-br from-amber-400/10 via-purple-500/10 to-blue-500/10 animate-spin-slow opacity-50"></div>
                </div>

                <div className="relative z-10 flex flex-col items-center max-w-sm mx-auto">
                    {/* Modern sleek lock icon with glow */}
                    <div className="relative mb-4 group-hover:scale-110 transition-transform duration-300">
                        <div className="absolute inset-0 bg-amber-400 blur-xl opacity-40 rounded-full animate-pulse"></div>
                        <div className="relative w-16 h-16 bg-gradient-to-br from-amber-300 to-orange-500 rounded-full flex items-center justify-center shadow-lg border-4 border-white dark:border-gray-800">
                            <svg className="w-8 h-8 text-white drop-shadow-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                        </div>
                    </div>

                    {/* Headline */}
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                        Unlock {featureName}
                    </h3>

                    <p className="text-sm text-gray-600 dark:text-gray-300 mb-6 font-medium">
                        Experience the Magic of Pro
                    </p>

                    {/* Feature List */}
                    <ul className="text-left text-xs text-gray-600 dark:text-gray-400 space-y-2 mb-6 w-full max-w-[200px] mx-auto">
                        <li className="flex items-center gap-2">
                            <span className="text-green-500 font-bold">✓</span> 3D Interactive Layouts
                        </li>
                        <li className="flex items-center gap-2">
                            <span className="text-green-500 font-bold">✓</span> Amazon & Google API Sync
                        </li>
                        <li className="flex items-center gap-2">
                            <span className="text-green-500 font-bold">✓</span> Unlimited Design Templates
                        </li>
                    </ul>

                    {/* CTA Button */}
                    <a
                        href="https://shelfsage.com/pricing"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="relative overflow-hidden group/btn px-8 py-3 rounded-full font-bold text-white shadow-lg shadow-purple-500/30 transition-all hover:scale-105 hover:shadow-purple-500/50"
                        style={{
                            background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 50%, #ec4899 100%)',
                            backgroundSize: '200% 200%',
                            animation: 'gradientMove 3s ease infinite'
                        }}
                    >
                        <span className="relative z-10 flex items-center gap-2">
                            {customCta} <span className="text-lg">→</span>
                        </span>
                        <div className="absolute inset-0 bg-white/20 translate-y-full group-hover/btn:translate-y-0 transition-transform duration-300 skew-y-12"></div>
                    </a>
                </div>
            </div>
        </div>
    );
};

export default PremiumLockedOverlay;
