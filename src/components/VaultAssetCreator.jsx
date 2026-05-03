import React, { useState, useEffect } from 'react';
import LookInsideModal from './LookInsideModal';

const VaultAssetCreator = ({ isOpen, onClose, onSave, editData = null }) => {
    const [step, setStep] = useState(1);
    const [isSaving, setIsSaving] = useState(false);
    const [lookInsideOpen, setLookInsideOpen] = useState(false);
    const [readerStyle, setReaderStyle] = useState(window.rmssAdminSettings?.pdf_reader_style || 'style-1');
    useEffect(() => {
        const handler = (e) => { if (e.detail?.pdf_reader_style) setReaderStyle(e.detail.pdf_reader_style); };
        window.addEventListener('shelfsage-settings-saved', handler);
        return () => window.removeEventListener('shelfsage-settings-saved', handler);
    }, []);

    const initialFormState = {
        title: '',
        subtitle: '',
        author: '',
        publisher: '',
        category: '',
        ribbon: '',
        edition: '',
        pub_date: '',
        isbn: '',
        pages: '',
        stock: 'instock',
        old_price: '',
        price: '',
        rating: 5,
        link: '',
        button_text: 'Buy Now',
        look_inside_url: '',
        cover_url: '',
        cover_id: null
    };

    // Form State
    const [formData, setFormData] = useState(initialFormState);

    // Sync form data with editData
    useEffect(() => {
        if (editData) {
            setFormData({
                title: editData.title?.rendered || editData.title || '',
                subtitle: editData.meta?._ss_vault_subtitle || '',
                author: editData.meta?._ss_vault_author || '',
                publisher: editData.meta?._ss_vault_publisher || '',
                category: editData.meta?._ss_vault_category || '',
                ribbon: editData.meta?._ss_vault_ribbon || '',
                edition: editData.meta?._ss_vault_edition || '',
                pub_date: editData.meta?._ss_vault_pub_date || '',
                isbn: editData.meta?._ss_vault_isbn || '',
                pages: editData.meta?._ss_vault_pages || '',
                stock: editData.meta?._ss_vault_stock || editData.meta?._ss_vault_stock_status || 'instock',
                old_price: editData.meta?._ss_vault_old_price || '',
                price: editData.meta?._ss_vault_price || '',
                rating: editData.meta?._ss_vault_rating || 5,
                link: editData.meta?._ss_vault_link || '',
                button_text: editData.meta?._ss_vault_button_text || 'Buy Now',
                look_inside_url: editData.meta?._ss_vault_look_inside_url || '',
                cover_url: editData._embedded?.['wp:featuredmedia']?.[0]?.source_url || '',
                cover_id: editData.featured_media || null
            });
            setStep(1);
        } else {
            setFormData(initialFormState);
            setStep(1);
        }
    }, [editData, isOpen]);

    if (!isOpen) return null;

    const handleNext = () => setStep(prev => Math.min(prev + 1, 3));
    const handleBack = () => setStep(prev => Math.max(prev - 1, 1));

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const openMediaUploader = () => {
        if (window.wp && window.wp.media) {
            const frame = window.wp.media({
                title: 'Select or Upload Book Cover',
                button: { text: 'Use this cover' },
                multiple: false
            });

            frame.on('select', () => {
                const attachment = frame.state().get('selection').first().toJSON();
                setFormData(prev => ({
                    ...prev,
                    cover_url: attachment.url,
                    cover_id: attachment.id
                }));
            });

            frame.open();
        }
    };

    const openLookInsideUploader = () => {
        if (window.wp && window.wp.media) {
            const frame = window.wp.media({
                title: 'Select PDF or Image for Look Inside',
                button: { text: 'Use this file' },
                multiple: false,
                library: {
                    type: ['image', 'application/pdf']
                }
            });

            frame.on('select', () => {
                const attachment = frame.state().get('selection').first().toJSON();
                setFormData(prev => ({
                    ...prev,
                    look_inside_url: attachment.url
                }));
            });

            frame.open();
        }
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const wpRestUrl = window.rmssAdminSettings?.wpRestUrl || '/wp-json/wp/v2';
            const nonce = window.rmssAdminSettings?.nonce;

            const isEditing = !!editData?.id;
            const url = isEditing
                ? `${wpRestUrl}/ss_vault_assets/${editData.id}`
                : `${wpRestUrl}/ss_vault_assets`;

            const response = await fetch(url, {
                method: isEditing ? 'PUT' : 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-WP-Nonce': nonce
                },
                body: JSON.stringify({
                    title: formData.title,
                    content: '', // Required by some WP versions for full schema
                    status: 'publish',
                    featured_media: formData.cover_id,
                    meta: {
                        _ss_vault_subtitle: formData.subtitle,
                        _ss_vault_author: formData.author,
                        _ss_vault_publisher: formData.publisher,
                        _ss_vault_category: formData.category,
                        _ss_vault_ribbon: formData.ribbon,
                        _ss_vault_edition: formData.edition,
                        _ss_vault_pub_date: formData.pub_date,
                        _ss_vault_isbn: formData.isbn,
                        _ss_vault_pages: parseInt(formData.pages) || 0,
                        _ss_vault_stock: formData.stock,
                        _ss_vault_old_price: formData.old_price,
                        _ss_vault_price: formData.price,
                        _ss_vault_link: formData.link,
                        _ss_vault_rating: parseInt(formData.rating) || 5,
                        _ss_vault_button_text: formData.button_text,
                        _ss_vault_look_inside_url: formData.look_inside_url,
                    }
                })
            });

            if (response.ok) {
                const message = isEditing ? 'Asset updated successfully' : 'Asset added to Vault';
                onSave(message);
                onClose();
            } else {
                const errorData = await response.json();
                console.error('Failed to save asset:', errorData);
            }
        } catch (error) {
            console.error('Error saving asset:', error);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <>
        <LookInsideModal
            isOpen={lookInsideOpen}
            onClose={() => setLookInsideOpen(false)}
            url={formData.look_inside_url}
            title={formData.title}
            thumbnail={formData.cover_url}
            authors={formData.author}
            readerStyle={readerStyle}
        />
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl flex overflow-hidden animate-in fade-in zoom-in duration-300">

                {/* Left Side: Live Preview */}
                <div className="w-1/3 bg-[#fdfbff] border-r border-gray-100 p-8 flex flex-col items-center">
                    <h3 className="text-sm font-bold text-purple-900/40 uppercase tracking-widest mb-8 flex items-center gap-2">
                        <svg className="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                        Live Preview
                    </h3>

                    {/* Book Cover Preview */}
                    <div className="w-full aspect-[2/3] bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden relative group">
                        {formData.cover_url ? (
                            <img src={formData.cover_url} className="w-full h-full object-cover" alt="Cover Preview" />
                        ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center text-gray-300 gap-4">
                                <span className="text-6xl">📚</span>
                                <p className="text-xs font-medium">No Cover Uploaded</p>
                            </div>
                        )}

                        {/* Ribbon badge on cover */}
                        {formData.ribbon && (
                            <div className="absolute top-3 left-0 bg-red-500 text-white text-[10px] font-extrabold uppercase tracking-wider px-3 py-1 shadow-md" style={{ clipPath: 'polygon(0 0, 100% 0, 90% 100%, 0 100%)' }}>
                                {formData.ribbon}
                            </div>
                        )}

                        <button
                            onClick={openMediaUploader}
                            className="absolute inset-0 bg-purple-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white font-bold gap-2 backdrop-blur-sm"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                            Upload Cover
                        </button>
                    </div>

                    <div className="mt-6 text-center w-full">
                        <h4 className="text-lg font-bold text-gray-900 line-clamp-1">{formData.title || 'Untitled Book'}</h4>
                        <p className="text-sm text-purple-600 font-medium mb-2">{formData.author || 'Author Name'}</p>
                        <div className="flex items-center justify-center gap-1 text-orange-400 mb-4">
                            {[...Array(5)].map((_, i) => (
                                <svg key={i} className={`w-4 h-4 ${i < formData.rating ? 'fill-current' : 'text-gray-200 fill-current'}`} viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                            ))}
                        </div>
                        <button className="w-full py-2 bg-purple-600 text-white rounded-lg font-bold shadow-lg shadow-purple-200">
                            {formData.button_text} —{' '}
                            {formData.old_price && (
                                <span className="line-through opacity-60 mr-1">{formData.old_price}</span>
                            )}
                            {formData.price || '$0.00'}
                        </button>

                        {/* Look Inside preview button */}
                        {formData.look_inside_url && (
                            <button
                                type="button"
                                onClick={() => setLookInsideOpen(true)}
                                className="w-full py-2 mt-2 border border-blue-200 bg-blue-50 text-blue-600 rounded-lg font-bold text-sm hover:bg-blue-100 transition-colors flex items-center justify-center gap-2"
                            >
                                <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                                Look Inside
                            </button>
                        )}
                    </div>
                </div>

                {/* Right Side: Form Steps */}
                <div className="flex-1 flex flex-col">
                    {/* Header */}
                    <div className="p-8 border-b border-gray-100 flex items-center justify-between">
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900">{editData ? 'Edit Asset' : 'Add to Vault'}</h2>
                            <p className="text-gray-500 text-sm">{editData ? 'Update your premium book asset.' : 'Create a premium asset for your library.'}</p>
                        </div>
                        <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full text-gray-400 transition-colors">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                    </div>

                    {/* Progress Bar */}
                    <div className="flex h-1.5 w-full bg-gray-100">
                        <div className={`h-full bg-purple-600 transition-all duration-500 ${step === 1 ? 'w-1/3' : step === 2 ? 'w-2/3' : 'w-full'}`}></div>
                    </div>

                    {/* Form Content */}
                    <div className="flex-1 overflow-y-auto p-10">
                        {step === 1 && (
                            <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                                <div className="grid grid-cols-2 gap-6">
                                    <div className="col-span-2">
                                        <label className="block text-sm font-bold text-gray-700 mb-2">Book Title</label>
                                        <input type="text" name="title" value={formData.title} onChange={handleInputChange} placeholder="e.g. The Great Gatsby" className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-purple-500 outline-none transition-all" />
                                    </div>
                                    <div className="col-span-2">
                                        <label className="block text-sm font-bold text-gray-700 mb-2">Subtitle</label>
                                        <input type="text" name="subtitle" value={formData.subtitle} onChange={handleInputChange} placeholder="e.g. A novel of the jazz age" className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-purple-500 outline-none transition-all" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-2">Author</label>
                                        <input type="text" name="author" value={formData.author} onChange={handleInputChange} placeholder="F. Scott Fitzgerald" className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-purple-500 outline-none transition-all" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-2">Publisher</label>
                                        <input type="text" name="publisher" value={formData.publisher} onChange={handleInputChange} placeholder="Scribner" className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-purple-500 outline-none transition-all" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-2">Category</label>
                                        <input type="text" name="category" value={formData.category} onChange={handleInputChange} placeholder="e.g. Islamic, Fiction" className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-purple-500 outline-none transition-all" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-2">Ribbon / Badge <span className="text-xs font-normal text-gray-400">(e.g. Best Seller)</span></label>
                                        <input type="text" name="ribbon" value={formData.ribbon} onChange={handleInputChange} placeholder="e.g. Hot, New, Sale" className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-purple-500 outline-none transition-all" />
                                    </div>
                                </div>
                            </div>
                        )}

                        {step === 2 && (
                            <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                                <div className="grid grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-2">Edition</label>
                                        <input type="text" name="edition" value={formData.edition} onChange={handleInputChange} placeholder="1st Edition" className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-purple-500 outline-none transition-all" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-2">Publish Date</label>
                                        <input type="date" name="pub_date" value={formData.pub_date} onChange={handleInputChange} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-purple-500 outline-none transition-all" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-2">ISBN</label>
                                        <input type="text" name="isbn" value={formData.isbn} onChange={handleInputChange} placeholder="978-3-16-148410-0" className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-purple-500 outline-none transition-all" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-2">Page Count</label>
                                        <input type="number" name="pages" value={formData.pages} onChange={handleInputChange} placeholder="180" className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-purple-500 outline-none transition-all" />
                                    </div>
                                    <div className="col-span-2">
                                        <label className="block text-sm font-bold text-gray-700 mb-2">Stock</label>
                                        <select name="stock" value={formData.stock} onChange={handleInputChange} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-purple-500 outline-none transition-all">
                                            <option value="instock">In Stock</option>
                                            <option value="outofstock">Out of Stock</option>
                                            <option value="onbackorder">Low Stock / On Backorder</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                        )}

                        {step === 3 && (
                            <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                                <div className="grid grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-2">Old Price <span className="text-xs font-normal text-gray-400">(original / crossed-out)</span></label>
                                        <input type="text" name="old_price" value={formData.old_price} onChange={handleInputChange} placeholder="$29.99" className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-purple-500 outline-none transition-all" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-2">Sale Price</label>
                                        <input type="text" name="price" value={formData.price} onChange={handleInputChange} placeholder="$19.99" className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-purple-500 outline-none transition-all" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-2">Rating</label>
                                        <select name="rating" value={formData.rating} onChange={handleInputChange} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-purple-500 outline-none transition-all appearance-none bg-no-repeat bg-[right_1rem_center] bg-[length:1em]">
                                            {[5, 4, 3, 2, 1].map(r => <option key={r} value={r}>{r} Stars</option>)}
                                        </select>
                                    </div>
                                    <div className="col-span-2">
                                        <label className="block text-sm font-bold text-gray-700 mb-2">Custom Buy URL</label>
                                        <input type="url" name="link" value={formData.link} onChange={handleInputChange} placeholder="https://amazon.com/..." className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-purple-500 outline-none transition-all" />
                                    </div>
                                    <div className="col-span-2">
                                        <label className="block text-sm font-bold text-gray-700 mb-2">Button Text</label>
                                        <input type="text" name="button_text" value={formData.button_text} onChange={handleInputChange} placeholder="Buy Now" className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-purple-500 outline-none transition-all" />
                                    </div>
                                    <div className="col-span-2">
                                        <label className="block text-sm font-bold text-gray-700 mb-2">
                                            Look Inside URL
                                            <span className="ml-2 text-xs font-normal text-blue-500 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100">PDF / Image</span>
                                        </label>
                                        <div className="relative">
                                            <input
                                                type="url"
                                                name="look_inside_url"
                                                value={formData.look_inside_url}
                                                onChange={handleInputChange}
                                                placeholder="https://example.com/book-preview.pdf"
                                                className="w-full pl-4 pr-24 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-400 outline-none transition-all"
                                            />
                                            <button
                                                type="button"
                                                onClick={openLookInsideUploader}
                                                className="absolute right-2 top-1/2 -translate-y-1/2 bg-gray-100 hover:bg-gray-200 text-gray-600 text-xs font-bold px-3 py-1.5 rounded-lg transition-colors z-10"
                                            >
                                                Upload
                                            </button>
                                        </div>
                                        <p className="text-xs text-gray-400 mt-1.5">Visitors can click "Look Inside" to read a preview. Uses the PDF reader style from Settings.</p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Footer Nav */}
                    <div className="p-8 border-t border-gray-50 flex items-center justify-between bg-gray-50/50">
                        <button
                            onClick={handleBack}
                            disabled={step === 1}
                            className={`px-6 py-2 font-bold text-sm rounded-lg transition-all ${step === 1 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-500 hover:bg-gray-200'}`}
                        >
                            Back
                        </button>

                        {step < 3 ? (
                            <button onClick={handleNext} className="px-8 py-3 bg-purple-600 text-white rounded-xl font-bold shadow-lg shadow-purple-100 hover:bg-purple-700 transition-all flex items-center gap-2">
                                Next Step
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
                            </button>
                        ) : (
                            <button
                                onClick={handleSave}
                                disabled={isSaving}
                                className="px-10 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl font-bold shadow-lg shadow-purple-200 hover:shadow-xl hover:-translate-y-0.5 transition-all flex items-center gap-2"
                            >
                                {isSaving ? (
                                    <>
                                        <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                        Saving...
                                    </>
                                ) : (
                                    <>
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
                                        {editData ? 'Update Asset' : 'Save to Vault'}
                                    </>
                                )}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
        </>
    );
};

export default VaultAssetCreator;
