import React from 'react';
import ReactDOM from 'react-dom/client';
import AdminApp from './components/AdminApp';
import DashboardApp from './components/DashboardApp';
import SettingsApp from './components/SettingsApp';
import WelcomeApp from './components/WelcomeApp';
import DocsApp from './components/DocsApp';
import SavedShortcodesApp from './components/SavedShortcodesApp';
import DocsSettingsApp from './components/DocsSettingsApp';
import './index.css'; // Reuse main styles or create admin specific

// Helper to get initial tab from URL or passed settings
const getInitialTab = (defaultTab, paramName = 'view') => {
    // Try to get from PHP passed data first
    if (window.rmssAdminSettings?.currentScreen?.[paramName]) {
        return window.rmssAdminSettings.currentScreen[paramName];
    }
    // Fallback to parsing URL directly if PHP data is missing/stale
    const params = new URLSearchParams(window.location.search);
    return params.get(paramName) || defaultTab;
};

// Shortcode Creator Root
const adminRoot = document.getElementById('rmss-admin-root');
if (adminRoot) {
    ReactDOM.createRoot(adminRoot).render(
        <React.StrictMode>
            <AdminApp />
        </React.StrictMode>
    );
}

// Dashboard Root (ShelfSage Landing)
const dashboardRoot = document.getElementById('rmss-dashboard-root');
if (dashboardRoot) {
    ReactDOM.createRoot(dashboardRoot).render(
        <React.StrictMode>
            <DashboardApp initialTab={getInitialTab('home', 'view')} />
        </React.StrictMode>
    );
}

// Library Root (Taxonomy Management Hub) — always default to 'overview' so the page loads
const libraryRoot = document.getElementById('rmss-library-root');
if (libraryRoot) {
    const libraryTab = getInitialTab('overview', 'view') || 'overview';
    ReactDOM.createRoot(libraryRoot).render(
        <React.StrictMode>
            <DashboardApp initialTab={libraryTab} />
        </React.StrictMode>
    );
}

// Docs Root
const docsRoot = document.getElementById('rmss-docs-root');
if (docsRoot) {
    ReactDOM.createRoot(docsRoot).render(
        <React.StrictMode>
            <DocsApp />
        </React.StrictMode>
    );
}

// Settings Root
const settingsRoot = document.getElementById('rmss-settings-root');
if (settingsRoot) {
    ReactDOM.createRoot(settingsRoot).render(
        <React.StrictMode>
            <SettingsApp initialTab={getInitialTab('general', 'tab')} />
        </React.StrictMode>
    );
}

// Welcome Root
const welcomeRoot = document.getElementById('rmss-welcome-root');
if (welcomeRoot) {
    ReactDOM.createRoot(welcomeRoot).render(
        <React.StrictMode>
            <WelcomeApp />
        </React.StrictMode>
    );
}

// Saved Shortcodes Root
const savedShortcodesRoot = document.getElementById('rmss-saved-shortcodes-root');
if (savedShortcodesRoot) {
    ReactDOM.createRoot(savedShortcodesRoot).render(
        <React.StrictMode>
            <SavedShortcodesApp />
        </React.StrictMode>
    );
}

// Docs & Settings Root
const docsSettingsRoot = document.getElementById('rmss-docs-settings-root');
if (docsSettingsRoot) {
    ReactDOM.createRoot(docsSettingsRoot).render(
        <React.StrictMode>
            <DocsSettingsApp />
        </React.StrictMode>
    );
}
