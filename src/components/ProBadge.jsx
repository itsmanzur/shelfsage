import React from 'react';

const ProBadge = ({ className = "" }) => {
    return (
        <span className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider
            bg-amber-400/10 text-amber-400 border border-amber-400/20 ${className}`}>
            <span className="text-[9px]">👑</span> PRO
        </span>
    );
};

export default ProBadge;
