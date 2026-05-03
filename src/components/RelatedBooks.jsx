import React, { useEffect, useState } from 'react';
import axios from 'axios';
import BookCard from './BookCard';

const RelatedBooks = ({ productId, limit = 6 }) => {
    const [books, setBooks] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchRelated = async () => {
            if (!productId) {
                setLoading(false);
                return;
            }
            const apiUrl = window.rmssSettings?.apiUrl || '/wp-json/shelfsage/v1';
            const nonce = window.rmssSettings?.nonce || '';
            try {
                const res = await axios.get(`${apiUrl}/related`, {
                    params: { product_id: productId, limit: limit || 6 },
                    headers: { 'X-WP-Nonce': nonce },
                });
                setBooks(Array.isArray(res.data) ? res.data : []);
            } catch (err) {
                console.error('ShelfSage related books:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchRelated();
    }, [productId, limit]);

    if (loading) return <div className="animate-pulse h-64 bg-gray-100 dark:bg-gray-700 rounded-lg" />;
    if (!books.length) return null;

    return (
        <div className="my-8">
            <h2 className="text-2xl font-bold mb-6 text-gray-800 dark:text-white border-l-4 border-blue-600 pl-4">
                {window.rmssSettings?.labels?.related_books || 'Related Books'}
            </h2>
            <div className="flex overflow-x-auto gap-6 pb-4 snap-x snap-mandatory scrollbar-hide">
                {books.map((book) => (
                    <div key={book.id} className="min-w-[200px] md:min-w-[240px] snap-start">
                        <BookCard
                            book={book}
                            settings={{
                                default_book_image: window.rmssSettings?.default_book_image || '',
                                isPro: window.rmssSettings?.isPro || false,
                                pdf_reader_style: window.rmssSettings?.pdf_reader_style || 'style-1',
                                look_inside_btn_position: window.rmssSettings?.look_inside_btn_position || 'bottom-left',
                            }}
                        />
                    </div>
                ))}
            </div>
        </div>
    );
};

export default RelatedBooks;
