import React, { useMemo, useState, useCallback } from 'react';

const COMMON_FIELDS = [
    { key: 'title', label: 'Book Title', required: true, aliases: ['title', 'name', 'booktitle', 'productname'] },
    { key: 'subtitle', label: 'Subtitle', required: false, aliases: ['subtitle'] },
    { key: 'author', label: 'Author', required: false, aliases: ['author', 'authors', 'authorlf'] },
    { key: 'publisher', label: 'Publisher', required: false, aliases: ['publisher', 'publishing'] },
    { key: 'isbn', label: 'ISBN / ISBN-10', required: false, aliases: ['isbn', 'isbn10'] },
    { key: 'isbn13', label: 'ISBN-13', required: false, aliases: ['isbn13', 'ean'] },
    { key: 'edition', label: 'Edition', required: false, aliases: ['edition'] },
    { key: 'pub_date', label: 'Publication Date', required: false, aliases: ['pubdate', 'publicationdate', 'year', 'yearpublished', 'originalpublicationyear'] },
    { key: 'pages', label: 'Pages', required: false, aliases: ['pages', 'pagecount', 'numberofpages'] },
    { key: 'binding', label: 'Binding', required: false, aliases: ['binding', 'format'] },
    { key: 'category', label: 'Category', required: false, aliases: ['category', 'categories', 'productcategory'] },
    { key: 'genre', label: 'Genre', required: false, aliases: ['genre', 'genres', 'bookshelves'] },
    { key: 'price', label: 'Regular Price', required: false, aliases: ['price', 'regularprice'] },
    { key: 'sale_price', label: 'Sale Price', required: false, aliases: ['saleprice', 'discountprice'] },
    { key: 'rating', label: 'Rating', required: false, aliases: ['rating', 'myrating'] },
    { key: 'ribbon', label: 'Ribbon / Badge', required: false, aliases: ['ribbon', 'badge'] },
    { key: 'look_inside_url', label: 'Look Inside URL', required: false, aliases: ['lookinside', 'sampleurl', 'pdf'] },
    { key: 'description', label: 'Description', required: false, aliases: ['description', 'summary', 'content', 'myreview'] },
    { key: 'short_description', label: 'Short Description', required: false, aliases: ['shortdescription', 'excerpt'] },
    { key: 'cover_url', label: 'Cover Image URL', required: false, aliases: ['cover', 'imageurl', 'coverurl', 'thumbnail'] },
];

const isGoodreadsHeaders = (headers) => {
    if (!Array.isArray(headers)) return false;
    const lc = headers.map(h => String(h || '').toLowerCase().trim());
    const signature = ['book id', 'exclusive shelf', 'bookshelves', 'my rating', 'date added', 'date read', 'additional authors'];
    let matches = 0;
    for (const s of signature) {
        if (lc.includes(s)) matches++;
        if (matches >= 2) return true;
    }
    return false;
};

const stripExcelFormulaIsbn = (value) => {
    const str = String(value == null ? '' : value).trim();
    const m = str.match(/^="([^"]*)"$/);
    return m ? m[1].trim() : str;
};

const TARGET_EXTRA_FIELDS = {
    vault: [
        { key: 'link', label: 'Affiliate Link', required: false, aliases: ['link', 'buylink', 'url'] },
        { key: 'stock_status', label: 'Stock Status', required: false, aliases: ['stockstatus', 'stock'] },
        { key: 'stock_quantity', label: 'Stock Quantity', required: false, aliases: ['stockquantity', 'quantity', 'qty'] },
    ],
    woocommerce: [
        { key: 'sku', label: 'SKU', required: false, aliases: ['sku'] },
        { key: 'stock_status', label: 'Stock Status', required: false, aliases: ['stockstatus', 'stock'] },
        { key: 'stock_quantity', label: 'Stock Quantity', required: false, aliases: ['stockquantity', 'quantity', 'qty'] },
        { key: 'status', label: 'Product Status', required: false, aliases: ['status', 'poststatus'] },
    ],
};

const makeInitialMapping = (fields) => fields.reduce((acc, f) => ({ ...acc, [f.key]: '' }), {});
const normalizeHeader = (s) => (s || '').toLowerCase().replace(/[\s_\-/.()]+/g, '');

const buildApiUrl = (apiUrl, endpoint) => {
    const base = apiUrl || '/wp-json/shelfsage/v1';
    const path = `/${String(endpoint).replace(/^\/+/, '')}`;
    if (base.includes('rest_route=')) {
        try {
            const url = new URL(base, window.location.origin);
            const route = (url.searchParams.get('rest_route') || '/shelfsage/v1').replace(/\/+$/, '');
            url.searchParams.set('rest_route', `${route}${path}`);
            return url.toString();
        } catch (_) {
            return `${base}${path}`;
        }
    }
    return `${base.replace(/\/+$/, '')}${path}`;
};

const CsvImportModal = ({ isOpen, onClose, onImportComplete, apiUrl, nonce }) => {
    const [target, setTarget] = useState('vault');
    const activeFields = useMemo(() => [...COMMON_FIELDS, ...TARGET_EXTRA_FIELDS[target]], [target]);
    const [step, setStep] = useState(1);
    const [file, setFile] = useState(null);
    const [parsedData, setParsedData] = useState({ headers: [], rows: [] });
    const [goodreadsDetected, setGoodreadsDetected] = useState(false);
    const [mapping, setMapping] = useState(makeInitialMapping(activeFields));
    const [progress, setProgress] = useState(0);
    const [status, setStatus] = useState('idle');
    const [error, setError] = useState('');
    const [summary, setSummary] = useState({ imported: 0, created: 0, updated: 0, skipped: 0, errors: [] });
    const [isDragging, setIsDragging] = useState(false);

    const reset = useCallback(() => {
        setStep(1);
        setFile(null);
        setParsedData({ headers: [], rows: [] });
        setGoodreadsDetected(false);
        setMapping(makeInitialMapping([...COMMON_FIELDS, ...TARGET_EXTRA_FIELDS[target]]));
        setProgress(0);
        setStatus('idle');
        setError('');
        setSummary({ imported: 0, created: 0, updated: 0, skipped: 0, errors: [] });
    }, [target]);

    const handleTargetChange = (nextTarget) => {
        setTarget(nextTarget);
        const nextFields = [...COMMON_FIELDS, ...TARGET_EXTRA_FIELDS[nextTarget]];
        setMapping(prev => ({ ...makeInitialMapping(nextFields), ...prev }));
    };

    const handleClose = () => {
        reset();
        onClose();
    };

    const autoMapHeaders = (headers, fields) => {
        const autoMap = {};
        fields.forEach(({ key, aliases = [] }) => {
            const targets = [key, ...aliases].map(normalizeHeader);
            const found = headers.find(h => {
                const normalized = normalizeHeader(h);
                return normalized && targets.some(t => normalized === t || normalized.includes(t) || t.includes(normalized));
            });
            if (found) autoMap[key] = found;
        });
        return autoMap;
    };

    const handleFile = (fileList) => {
        const f = fileList?.[0];
        if (!f || !/\.(csv|tsv|xlsx|xls)$/i.test(f.name || '')) {
            setError('Please select a .csv, .tsv, .xlsx, or .xls file.');
            return;
        }
        setError('');
        setFile(f);
        const reader = new FileReader();
        reader.onload = async (event) => {
            try {
                const XLSX = await import('xlsx');
                const workbook = XLSX.read(event.target.result, { type: 'array' });
                const firstSheetName = workbook.SheetNames[0];
                const sheet = workbook.Sheets[firstSheetName];
                const jsonRows = XLSX.utils.sheet_to_json(sheet, { defval: '', raw: false });
                if (!jsonRows.length) {
                    setError('No rows found in the selected file.');
                    setFile(null);
                    return;
                }
                const headers = Object.keys(jsonRows[0] || {});
                const rows = jsonRows.slice(0, 2000);
                setParsedData({ headers, rows });
                setGoodreadsDetected(isGoodreadsHeaders(headers));
                setMapping(prev => ({ ...prev, ...autoMapHeaders(headers, activeFields) }));
                setStep(2);
            } catch (err) {
                setError('Could not parse file. Please check the format and try again.');
                setFile(null);
            }
        };
        reader.onerror = () => {
            setError('Could not read the selected file.');
            setFile(null);
        };
        reader.readAsArrayBuffer(f);
    };

    const buildRowsForImport = () => {
        // Goodreads CSV has too many specialised columns ("Additional Authors",
        // "Owned Copies", "Bookshelves", "My Review", …) for the canonical
        // mapping UI to express. When detected, hand the raw rows to the
        // server-side normaliser instead so nothing is lost in translation.
        if (goodreadsDetected) {
            return parsedData.rows;
        }
        return parsedData.rows.map(row => {
            const obj = {};
            activeFields.forEach(({ key }) => {
                const col = mapping[key];
                let value = col && row[col] != null ? String(row[col]).trim() : '';
                if ((key === 'isbn' || key === 'isbn13') && value) {
                    value = stripExcelFormulaIsbn(value);
                }
                obj[key] = value;
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
        if (!goodreadsDetected && !mapping.title) {
            setError('Book Title column mapping is required.');
            return;
        }

        setStep(3);
        setStatus('importing');
        setError('');
        setProgress(0);
        setSummary({ imported: 0, created: 0, updated: 0, skipped: 0, errors: [] });

        const batchSize = target === 'woocommerce' ? 8 : 12;
        const batches = [];
        for (let i = 0; i < rows.length; i += batchSize) {
            batches.push(rows.slice(i, i + batchSize));
        }

        const totals = { imported: 0, created: 0, updated: 0, skipped: 0, errors: [] };
        try {
            for (let i = 0; i < batches.length; i++) {
                const res = await fetch(buildApiUrl(apiUrl, '/import-books'), {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-WP-Nonce': nonce
                    },
                    body: JSON.stringify({ target, rows: batches[i], format: goodreadsDetected ? 'goodreads' : 'auto' })
                });
                const data = await res.json();
                if (!res.ok) {
                    throw new Error(data?.message || data?.code || 'Import failed');
                }
                totals.imported += data?.imported || 0;
                totals.created += data?.created || 0;
                totals.updated += data?.updated || 0;
                totals.skipped += data?.skipped || 0;
                totals.errors = [...totals.errors, ...(data?.errors || [])].slice(0, 20);
                setSummary({ ...totals });
                setProgress(Math.round(((i + 1) / batches.length) * 100));
            }
            setStatus('done');
            setProgress(100);
            if (typeof onImportComplete === 'function') {
                onImportComplete(totals.imported, target, totals);
            }
        } catch (err) {
            setStatus('error');
            setError(err.message || 'Import failed');
        }
    };

    const downloadTemplate = () => {
        const headers = activeFields.map(field => field.label.replace(/\s*\/\s*/g, ' '));
        const example = activeFields.map(field => {
            const samples = {
                title: 'Example Book',
                author: 'Jane Author',
                publisher: 'ShelfSage Press',
                isbn: '9781234567890',
                category: 'Fiction',
                genre: 'Mystery',
                price: '19.99',
                sale_price: '14.99',
                stock_status: 'instock',
                stock_quantity: '25',
                status: 'publish',
                sku: 'BOOK-001',
                cover_url: 'https://example.com/cover.jpg',
                look_inside_url: 'https://example.com/sample.pdf',
                description: 'Long book description',
                short_description: 'Short product summary',
            };
            return samples[field.key] || '';
        });
        const csv = [headers, example]
            .map(row => row.map(value => `"${String(value).replace(/"/g, '""')}"`).join(','))
            .join('\n');
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `shelfsage-${target}-import-template.csv`;
        document.body.appendChild(link);
        link.click();
        link.remove();
        URL.revokeObjectURL(url);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-3xl shadow-2xl border border-purple-100 w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between px-8 py-6 border-b border-purple-100 bg-gradient-to-r from-purple-50 to-indigo-50">
                    <div>
                        <h3 className="text-xl font-black text-gray-900">Import Books</h3>
                        <p className="text-xs text-gray-500 mt-1">CSV, TSV, XLSX, or XLS bulk import</p>
                    </div>
                    <button onClick={handleClose} className="w-10 h-10 rounded-xl bg-white border border-purple-200 text-gray-500 hover:text-purple-600 hover:border-purple-300 transition-all flex items-center justify-center" aria-label="Close">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-8 space-y-6">
                    {step === 1 && (
                        <>
                            <div className="grid sm:grid-cols-2 gap-3">
                                {[
                                    { id: 'vault', title: 'ShelfSage Vault', desc: 'Create or update Vault book assets.' },
                                    { id: 'woocommerce', title: 'WooCommerce Products', desc: 'Create or update store products.' },
                                ].map(item => (
                                    <button
                                        key={item.id}
                                        type="button"
                                        onClick={() => handleTargetChange(item.id)}
                                        className={`text-left rounded-2xl border p-4 transition-all ${target === item.id ? 'border-purple-500 bg-purple-50 shadow-sm' : 'border-gray-200 bg-white hover:border-purple-200'}`}
                                    >
                                        <span className="block text-sm font-black text-gray-900">{item.title}</span>
                                        <span className="block text-xs text-gray-500 mt-1">{item.desc}</span>
                                    </button>
                                ))}
                            </div>
                            <div className="flex justify-end">
                                <button type="button" onClick={downloadTemplate} className="inline-flex items-center gap-2 text-xs font-bold text-purple-700 hover:text-purple-900">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v10m0 0l-4-4m4 4l4-4M4 20h16" /></svg>
                                    Download {target === 'woocommerce' ? 'WooCommerce' : 'Vault'} CSV template
                                </button>
                            </div>
                            <div
                                onDrop={(e) => { e.preventDefault(); setIsDragging(false); handleFile(e.dataTransfer?.files); }}
                                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                                onDragLeave={() => setIsDragging(false)}
                                className={`border-2 border-dashed rounded-2xl p-12 text-center transition-all ${isDragging ? 'border-purple-500 bg-purple-50' : 'border-purple-200 hover:border-purple-300 bg-gray-50/50'}`}
                            >
                                <div className="w-16 h-16 bg-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                    <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17v-6m3 6V7m3 10v-4M5 5h14v14H5z" /></svg>
                                </div>
                                <p className="text-gray-600 font-medium mb-2">Drop your file here or</p>
                                <label className="inline-flex items-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-xl font-bold hover:bg-purple-700 cursor-pointer transition-colors">
                                    Choose File
                                    <input type="file" accept=".csv,.tsv,.xlsx,.xls" onChange={(e) => { handleFile(e.target?.files); e.target.value = ''; }} className="hidden" />
                                </label>
                                {file && <p className="text-xs text-gray-500 mt-3">{file.name}</p>}
                            </div>
                        </>
                    )}

                    {step === 2 && (
                        <>
                            <div className="flex items-center justify-between gap-4">
                                <p className="text-sm text-gray-600">Map file columns to <strong>{target === 'woocommerce' ? 'WooCommerce product' : 'Vault'}</strong> fields. Book Title is required.</p>
                                <span className="text-xs font-bold text-purple-700 bg-purple-50 px-3 py-1 rounded-full">{parsedData.rows.length} rows</span>
                            </div>
                            {goodreadsDetected && (
                                <div className="rounded-2xl border-2 border-emerald-200 bg-emerald-50 p-4 flex items-start gap-3">
                                    <span className="text-2xl leading-none">📚</span>
                                    <div className="flex-1">
                                        <p className="text-sm font-bold text-emerald-900 mb-0.5">Goodreads Library Export detected</p>
                                        <p className="text-xs text-emerald-800">Column mapping below is optional — ShelfSage will read the original Goodreads columns server-side and merge <em>Author + Additional Authors</em>, unwrap <code className="bg-white px-1 rounded">="ISBN"</code> formula values, convert <em>Owned Copies</em> to stock quantity, and turn <em>Bookshelves</em> into genres automatically.</p>
                                    </div>
                                </div>
                            )}
                            <div className="rounded-2xl border border-purple-100 overflow-hidden">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="bg-purple-50">
                                            <th className="text-left px-4 py-3 font-bold text-gray-700">Field</th>
                                            <th className="text-left px-4 py-3 font-bold text-gray-700">Column</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {activeFields.map(({ key, label, required }) => (
                                            <tr key={key} className="border-t border-purple-50">
                                                <td className="px-4 py-3 font-medium text-gray-800">{label} {required && <span className="text-purple-600">*</span>}</td>
                                                <td className="px-4 py-3">
                                                    <select value={mapping[key] || ''} onChange={(e) => setMapping(prev => ({ ...prev, [key]: e.target.value }))} className="w-full rounded-xl border border-purple-200 px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500">
                                                        <option value="">Skip</option>
                                                        {parsedData.headers.map(h => <option key={h} value={h}>{h}</option>)}
                                                    </select>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            <div className="rounded-2xl border border-purple-100 overflow-hidden">
                                <h4 className="px-4 py-2 bg-purple-50 font-bold text-gray-700 text-sm">Preview</h4>
                                <div className="overflow-x-auto max-h-36">
                                    <table className="w-full text-xs">
                                        <thead><tr className="bg-gray-50">{parsedData.headers.map(h => <th key={h} className="px-3 py-2 text-left font-semibold text-gray-600 truncate max-w-[140px]">{h}</th>)}</tr></thead>
                                        <tbody>
                                            {parsedData.rows.slice(0, 3).map((row, ri) => (
                                                <tr key={ri} className="border-t border-gray-100">{parsedData.headers.map(h => <td key={h} className="px-3 py-2 text-gray-700 truncate max-w-[140px]" title={row[h]}>{row[h] || '-'}</td>)}</tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                            <div className="flex gap-3">
                                <button onClick={() => { setStep(1); setFile(null); setParsedData({ headers: [], rows: [] }); }} className="px-5 py-2.5 rounded-xl border border-purple-200 text-purple-600 font-bold hover:bg-purple-50 transition-colors">Back</button>
                                <button onClick={runImport} className="flex-1 px-6 py-3 bg-purple-600 text-white rounded-xl font-bold hover:bg-purple-700 shadow-lg shadow-purple-200 transition-all">Import to {target === 'woocommerce' ? 'WooCommerce' : 'Vault'}</button>
                            </div>
                        </>
                    )}

                    {step === 3 && (
                        <div className="space-y-6">
                            {status === 'importing' && (
                                <>
                                    <div className="flex items-center justify-between">
                                        <p className="font-bold text-gray-800">Importing...</p>
                                        <span className="text-sm text-purple-600 font-bold">{summary.imported} processed</span>
                                    </div>
                                    <div className="h-3 bg-purple-100 rounded-full overflow-hidden"><div className="h-full bg-gradient-to-r from-purple-500 to-indigo-600 rounded-full transition-all duration-300" style={{ width: `${progress}%` }} /></div>
                                </>
                            )}
                            {status === 'done' && (
                                <div className="text-center py-8">
                                    <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 text-green-600 font-black text-3xl">OK</div>
                                    <h4 className="text-xl font-bold text-gray-900 mb-2">Import complete</h4>
                                    <p className="text-gray-600">{summary.created} created, {summary.updated} updated, {summary.skipped} skipped.</p>
                                    {summary.errors.length > 0 && <p className="text-xs text-amber-600 mt-3">{summary.errors[0]}</p>}
                                    <button onClick={handleClose} className="mt-6 px-8 py-3 bg-purple-600 text-white rounded-xl font-bold hover:bg-purple-700">Done</button>
                                </div>
                            )}
                            {status === 'error' && (
                                <div className="text-center py-6">
                                    <p className="text-red-600 font-medium mb-4">{error}</p>
                                    <button onClick={() => setStep(2)} className="px-6 py-2.5 rounded-xl border border-purple-200 text-purple-600 font-bold hover:bg-purple-50">Try Again</button>
                                </div>
                            )}
                        </div>
                    )}

                    {error && step < 3 && <p className="text-red-600 text-sm font-medium">{error}</p>}
                </div>
            </div>
        </div>
    );
};

export default CsvImportModal;
