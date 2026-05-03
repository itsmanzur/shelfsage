import React, { useState, useCallback } from 'react';
import Papa from 'papaparse';

const VAULT_FIELDS = [
    { key: 'title', label: 'Book Title', required: true, aliases: ['title', 'name', 'booktitle'] },
    { key: 'subtitle', label: 'Subtitle', required: false, aliases: ['subtitle'] },
    { key: 'author', label: 'Author', required: false, aliases: ['author', 'authors'] },
    { key: 'publisher', label: 'Publisher', required: false, aliases: ['publisher', 'publishing'] },
    { key: 'isbn', label: 'ISBN', required: false, aliases: ['isbn', 'isbn13'] },
    { key: 'edition', label: 'Edition', required: false, aliases: ['edition'] },
    { key: 'pub_date', label: 'Publication Date', required: false, aliases: ['pubdate', 'publicationdate', 'year'] },
    { key: 'pages', label: 'Pages', required: false, aliases: ['pages', 'pagecount'] },
    { key: 'category', label: 'Category / Genre', required: false, aliases: ['category', 'genre'] },
    { key: 'price', label: 'Price', required: false, aliases: ['price'] },
    { key: 'rating', label: 'Rating', required: false, aliases: ['rating'] },
    { key: 'ribbon', label: 'Ribbon / Badge', required: false, aliases: ['ribbon', 'badge'] },
    { key: 'link', label: 'Affiliate Link', required: false, aliases: ['link', 'buylink', 'url'] },
    { key: 'look_inside_url', label: 'Look Inside URL', required: false, aliases: ['lookinside', 'sampleurl'] },
    { key: 'description', label: 'Description', required: false, aliases: ['description', 'summary'] },
    { key: 'cover_url', label: 'Cover Image URL', required: false, aliases: ['cover', 'imageurl', 'coverurl'] },
];

const CsvImportModal = ({ isOpen, onClose, onImportComplete, apiUrl, nonce }) => {
    const [step, setStep] = useState(1); // 1: upload, 2: mapping, 3: importing
    const [file, setFile] = useState(null);
    const [parsedData, setParsedData] = useState({ headers: [], rows: [] });
    const initialMapping = VAULT_FIELDS.reduce((acc, f) => ({ ...acc, [f.key]: '' }), {});
    const [mapping, setMapping] = useState(initialMapping);
    const [progress, setProgress] = useState(0);
    const [status, setStatus] = useState(''); // 'idle' | 'importing' | 'done' | 'error'
    const [error, setError] = useState('');
    const [importedCount, setImportedCount] = useState(0);
    const [isDragging, setIsDragging] = useState(false);

    const reset = useCallback(() => {
        setStep(1);
        setFile(null);
        setParsedData({ headers: [], rows: [] });
        setMapping(VAULT_FIELDS.reduce((acc, f) => ({ ...acc, [f.key]: '' }), {}));
        setProgress(0);
        setStatus('idle');
        setError('');
        setImportedCount(0);
    }, []);

    const handleClose = () => {
        reset();
        onClose();
    };

    const handleFile = (fileList) => {
        const f = fileList?.[0];
        if (!f || !f.name?.toLowerCase().endsWith('.csv')) {
            setError('Please select a .csv file.');
            return;
        }
        setError('');
        setFile(f);
        Papa.parse(f, {
            header: true,
            skipEmptyLines: true,
            complete: (result) => {
                if (result.errors?.length && !result.data?.length) {
                    setError('Could not parse CSV. ' + (result.errors[0]?.message || ''));
                    setFile(null);
                    return;
                }
                const headers = result.meta?.fields || Object.keys(result.data[0] || {});
                const rows = (result.data || []).slice(0, 1000); // cap at 1000
                setParsedData({ headers, rows });
                // Auto-map by matching header names (case-insensitive) or aliases
                const norm = s => (s || '').toLowerCase().replace(/[\s-_]/g, '');
                const autoMap = {};
                VAULT_FIELDS.forEach(({ key, aliases = [] }) => {
                    const targets = [key, ...aliases].map(norm);
                    const found = headers.find(h => {
                        const nh = norm(h);
                        return nh && targets.some(t => nh.includes(t) || t.includes(nh));
                    });
                    if (found) autoMap[key] = found;
                });
                setMapping(prev => ({ ...prev, ...autoMap }));
                setStep(2);
            }
        });
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragging(false);
        handleFile(e.dataTransfer?.files);
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = () => setIsDragging(false);

    const handleFileInput = (e) => {
        handleFile(e.target?.files);
        e.target.value = '';
    };

    const buildRowsForImport = () => {
        const { headers, rows } = parsedData;
        return rows.map(row => {
            const obj = {};
            VAULT_FIELDS.forEach(({ key }) => {
                const col = mapping[key];
                obj[key] = col && row[col] != null ? String(row[col]).trim() : '';
            });
            return obj;
        });
    };

    const runImport = async () => {
        const rows = buildRowsForImport();
        if (!rows.length) {
            setError('No rows to import.');
            return;
        }
        if (!mapping.title) {
            setError('Book Title column mapping is required.');
            return;
        }

        setStep(3);
        setStatus('importing');
        setError('');
        setProgress(0);
        setImportedCount(0);

        const BATCH_SIZE = 10;
        const batches = [];
        for (let i = 0; i < rows.length; i += BATCH_SIZE) {
            batches.push(rows.slice(i, i + BATCH_SIZE));
        }
        let totalImported = 0;

        try {
            for (let i = 0; i < batches.length; i++) {
                const batch = batches[i];
                const res = await fetch(`${apiUrl}/import-books`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-WP-Nonce': nonce
                    },
                    body: JSON.stringify({ rows: batch })
                });
                const data = await res.json();
                if (!res.ok) {
                    throw new Error(data?.message || data?.code || 'Import failed');
                }
                totalImported += data?.imported ?? batch.length;
                setImportedCount(totalImported);
                setProgress(Math.round(((i + 1) / batches.length) * 100));
            }
            setStatus('done');
            setProgress(100);
            if (typeof onImportComplete === 'function') {
                onImportComplete(totalImported);
            }
        } catch (err) {
            setStatus('error');
            setError(err.message || 'Import failed');
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div
                className="bg-white rounded-3xl shadow-2xl border border-purple-100 w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-8 py-6 border-b border-purple-100 bg-gradient-to-r from-purple-50 to-indigo-50">
                    <h3 className="text-xl font-black text-gray-900">Import CSV to Vault</h3>
                    <button
                        onClick={handleClose}
                        className="w-10 h-10 rounded-xl bg-white border border-purple-200 text-gray-500 hover:text-purple-600 hover:border-purple-300 transition-all flex items-center justify-center"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-8 space-y-6">
                    {/* Step 1: Upload */}
                    {step === 1 && (
                        <div
                            onDrop={handleDrop}
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            className={`border-2 border-dashed rounded-2xl p-12 text-center transition-all ${isDragging ? 'border-purple-500 bg-purple-50' : 'border-purple-200 hover:border-purple-300 bg-gray-50/50'}`}
                        >
                            <div className="w-16 h-16 bg-purple-100 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-4">📄</div>
                            <p className="text-gray-600 font-medium mb-2">Drop your CSV file here or</p>
                            <label className="inline-flex items-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-xl font-bold hover:bg-purple-700 cursor-pointer transition-colors">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                                Choose File
                                <input type="file" accept=".csv" onChange={handleFileInput} className="hidden" />
                            </label>
                            <p className="text-xs text-gray-400 mt-4">Supports: Title, Subtitle, Author, Publisher, ISBN, Edition, Pub Date, Pages, Category, Price, Rating, Ribbon, Affiliate Link, Look Inside URL, Description, Cover URL</p>
                        </div>
                    )}

                    {/* Step 2: Mapping */}
                    {step === 2 && (
                        <>
                            <p className="text-sm text-gray-600">Match your CSV columns to Vault fields. <strong>Book Title</strong> is required.</p>
                            <div className="rounded-2xl border border-purple-100 overflow-hidden">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="bg-purple-50">
                                            <th className="text-left px-4 py-3 font-bold text-gray-700">Vault Field</th>
                                            <th className="text-left px-4 py-3 font-bold text-gray-700">CSV Column</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {VAULT_FIELDS.map(({ key, label, required }) => (
                                            <tr key={key} className="border-t border-purple-50">
                                                <td className="px-4 py-3 font-medium text-gray-800">
                                                    {label} {required && <span className="text-purple-600">*</span>}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <select
                                                        value={mapping[key] || ''}
                                                        onChange={(e) => setMapping(prev => ({ ...prev, [key]: e.target.value }))}
                                                        className="w-full rounded-xl border border-purple-200 px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                                                    >
                                                        <option value="">— Skip —</option>
                                                        {parsedData.headers.map(h => (
                                                            <option key={h} value={h}>{h}</option>
                                                        ))}
                                                    </select>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            <div className="rounded-2xl border border-purple-100 overflow-hidden">
                                <h4 className="px-4 py-2 bg-purple-50 font-bold text-gray-700 text-sm">Preview (first 2 rows)</h4>
                                <div className="overflow-x-auto max-h-32">
                                    <table className="w-full text-xs">
                                        <thead>
                                            <tr className="bg-gray-50">
                                                {parsedData.headers.map(h => (
                                                    <th key={h} className="px-3 py-2 text-left font-semibold text-gray-600 truncate max-w-[120px]">{h}</th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {parsedData.rows.slice(0, 2).map((row, ri) => (
                                                <tr key={ri} className="border-t border-gray-100">
                                                    {parsedData.headers.map(h => (
                                                        <td key={h} className="px-3 py-2 text-gray-700 truncate max-w-[120px]" title={row[h]}>{row[h] ?? '—'}</td>
                                                    ))}
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                            <div className="flex gap-3">
                                <button onClick={() => { setStep(1); setFile(null); setParsedData({ headers: [], rows: [] }); }} className="px-5 py-2.5 rounded-xl border border-purple-200 text-purple-600 font-bold hover:bg-purple-50 transition-colors">Back</button>
                                <button onClick={runImport} className="flex-1 px-6 py-3 bg-purple-600 text-white rounded-xl font-bold hover:bg-purple-700 shadow-lg shadow-purple-200 transition-all">Import {parsedData.rows.length} rows</button>
                            </div>
                        </>
                    )}

                    {/* Step 3: Progress */}
                    {step === 3 && (
                        <div className="space-y-6">
                            {status === 'importing' && (
                                <>
                                    <div className="flex items-center justify-between">
                                        <p className="font-bold text-gray-800">Importing...</p>
                                        <span className="text-sm text-purple-600 font-bold">{importedCount} imported</span>
                                    </div>
                                    <div className="h-3 bg-purple-100 rounded-full overflow-hidden">
                                        <div className="h-full bg-gradient-to-r from-purple-500 to-indigo-600 rounded-full transition-all duration-300" style={{ width: `${progress}%` }} />
                                    </div>
                                </>
                            )}
                            {status === 'done' && (
                                <div className="text-center py-8">
                                    <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center text-4xl mx-auto mb-4">✓</div>
                                    <h4 className="text-xl font-bold text-gray-900 mb-2">Import complete!</h4>
                                    <p className="text-gray-600">{importedCount} books added to your Vault.</p>
                                    <button onClick={handleClose} className="mt-6 px-8 py-3 bg-purple-600 text-white rounded-xl font-bold hover:bg-purple-700">Done</button>
                                </div>
                            )}
                            {status === 'error' && (
                                <div className="text-center py-6">
                                    <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center text-3xl mx-auto mb-4">⚠</div>
                                    <p className="text-red-600 font-medium mb-4">{error}</p>
                                    <button onClick={() => setStep(2)} className="px-6 py-2.5 rounded-xl border border-purple-200 text-purple-600 font-bold hover:bg-purple-50">Try Again</button>
                                </div>
                            )}
                        </div>
                    )}

                    {error && step < 3 && (
                        <p className="text-red-600 text-sm font-medium">{error}</p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CsvImportModal;
