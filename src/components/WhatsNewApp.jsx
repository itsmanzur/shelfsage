import React, { useState, useEffect } from 'react';
import { changelog, CURRENT_VERSION } from '../data/changelog';

const STORAGE_KEY = 'trsss_whats_new_seen_version';

const BADGE_STYLES = {
  NEW:      'bg-green-100 text-green-700 border border-green-200',
  IMPROVED: 'bg-blue-100 text-blue-700 border border-blue-200',
  FIX:      'bg-amber-100 text-amber-700 border border-amber-200',
  SECURITY: 'bg-red-100 text-red-700 border border-red-200',
  REMOVED:  'bg-gray-100 text-gray-500 border border-gray-200',
};

const CATEGORY_COLORS = {
  Feature:     'bg-purple-50 text-purple-700 border border-purple-100',
  Performance: 'bg-teal-50 text-teal-700 border border-teal-100',
  Security:    'bg-red-50 text-red-700 border border-red-100',
  UX:          'bg-blue-50 text-blue-700 border border-blue-100',
  Developer:   'bg-orange-50 text-orange-700 border border-orange-100',
};

const ALL_CATEGORIES = ['All', 'Feature', 'UX', 'Security', 'Performance', 'Developer'];

function FeatureCard({ feature, isNew }) {
  const [expanded, setExpanded] = useState(false);
  const badgeStyle = BADGE_STYLES[feature.badge] || BADGE_STYLES.NEW;
  const catStyle = CATEGORY_COLORS[feature.category] || 'bg-gray-50 text-gray-600';

  return (
    <div className={`group relative bg-white rounded-2xl border-2 transition-all duration-200 overflow-hidden
      ${isNew ? 'border-green-200 shadow-sm shadow-green-100' : 'border-gray-100 hover:border-gray-200'}
    `}>
      {isNew && (
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-green-400 to-emerald-500" />
      )}
      <div className="p-5">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-xl flex-shrink-0 border border-gray-100">
            {feature.icon}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <h4 className="font-bold text-gray-900 text-sm">{feature.title}</h4>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide ${badgeStyle}`}>
                {feature.badge}
              </span>
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${catStyle}`}>
                {feature.category}
              </span>
            </div>
            <p className="text-sm text-gray-600 leading-relaxed">{feature.summary}</p>
          </div>
        </div>

        {/* Usage toggle */}
        {feature.usage && (
          <div className="mt-3 ml-14">
            <button
              type="button"
              onClick={() => setExpanded(v => !v)}
              className="flex items-center gap-1.5 text-xs font-semibold text-purple-600 hover:text-purple-800 transition-colors"
            >
              <svg className={`w-3.5 h-3.5 transition-transform ${expanded ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" />
              </svg>
              {expanded ? 'Hide' : 'How to use'}
            </button>
            {expanded && (
              <div className="mt-2 px-3 py-2 bg-purple-50 border border-purple-100 rounded-xl text-xs text-purple-800 leading-relaxed font-medium">
                {feature.usage}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function VersionSection({ entry, isLatest, activeCategory }) {
  const filtered = activeCategory === 'All'
    ? entry.features
    : entry.features.filter(f => f.category === activeCategory);

  if (filtered.length === 0) return null;

  const date = new Date(entry.date).toLocaleDateString('en-GB', { year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <div className="space-y-4">
      {/* Version header */}
      <div className="flex items-center gap-3">
        <div className={`flex items-center gap-2 px-4 py-1.5 rounded-full font-bold text-sm
          ${isLatest ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-200'
                     : 'bg-gray-100 text-gray-700'}`}>
          {isLatest && <span className="w-1.5 h-1.5 rounded-full bg-white/70 animate-pulse" />}
          v{entry.version}
          {isLatest && <span className="text-[10px] font-semibold opacity-80 ml-1">CURRENT</span>}
        </div>
        <span className="text-xs text-gray-400 font-medium">{date}</span>
        <div className="flex-1 h-px bg-gray-100" />
        <span className="text-xs text-gray-400">{filtered.length} update{filtered.length !== 1 ? 's' : ''}</span>
      </div>

      {/* Feature cards */}
      <div className="grid grid-cols-1 gap-3 pl-1">
        {filtered.map((feature, i) => (
          <FeatureCard
            key={i}
            feature={feature}
            isNew={isLatest}
          />
        ))}
      </div>
    </div>
  );
}

export default function WhatsNewApp() {
  const [activeCategory, setActiveCategory] = useState('All');
  const [seenVersion, setSeenVersion] = useState(() =>
    localStorage.getItem(STORAGE_KEY) || ''
  );

  const hasNewFeatures = seenVersion !== CURRENT_VERSION;

  // Mark as seen when the user opens this tab
  useEffect(() => {
    if (hasNewFeatures) {
      localStorage.setItem(STORAGE_KEY, CURRENT_VERSION);
      setSeenVersion(CURRENT_VERSION);
    }
  }, []);

  // Count per category
  const allFeatures = changelog.flatMap(e => e.features);
  const categoryCounts = ALL_CATEGORIES.reduce((acc, cat) => {
    acc[cat] = cat === 'All' ? allFeatures.length : allFeatures.filter(f => f.category === cat).length;
    return acc;
  }, {});

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">

      {/* Header banner */}
      <div className="bg-gradient-to-br from-purple-700 via-indigo-700 to-blue-700 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-[-20%] right-[-10%] w-64 h-64 rounded-full bg-white" />
          <div className="absolute bottom-[-30%] left-[-5%] w-48 h-48 rounded-full bg-white" />
        </div>
        <div className="relative z-10 flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-2xl">🚀</span>
              <h2 className="text-xl font-bold">What's New in ShelfSage</h2>
            </div>
            <p className="text-purple-200 text-sm max-w-xl">
              Feature updates, improvements and fixes — with quick usage guides for each.
            </p>
          </div>
          <div className="text-right flex-shrink-0">
            <div className="bg-white/15 backdrop-blur px-3 py-1.5 rounded-xl">
              <p className="text-xs text-purple-200 font-medium">Current version</p>
              <p className="text-lg font-black">v{CURRENT_VERSION}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Category filter */}
      <div className="flex flex-wrap gap-2">
        {ALL_CATEGORIES.map(cat => {
          const count = categoryCounts[cat];
          if (count === 0) return null;
          const isActive = activeCategory === cat;
          return (
            <button
              key={cat}
              type="button"
              onClick={() => setActiveCategory(cat)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold transition-all
                ${isActive
                  ? 'bg-purple-600 text-white shadow-md shadow-purple-200'
                  : 'bg-white border border-gray-200 text-gray-600 hover:border-purple-300 hover:text-purple-700'
                }`}
            >
              {cat}
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full
                ${isActive ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'}`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Changelog entries */}
      {changelog.map((entry, idx) => (
        <VersionSection
          key={entry.version}
          entry={entry}
          isLatest={idx === 0}
          activeCategory={activeCategory}
        />
      ))}

      {/* Footer note */}
      <div className="text-center py-4 text-xs text-gray-400">
        <p>Feature suggestions? <a href="mailto:hello@shelfsage.com" className="text-purple-500 hover:underline">hello@shelfsage.com</a></p>
      </div>
    </div>
  );
}
