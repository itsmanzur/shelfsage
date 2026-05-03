import React, { useEffect, useState } from 'react';
import axios from 'axios';
import BookCard from './BookCard';

const ShelfTalker = ({ publisherIds, currentProductId }) => {
    const [books, setBooks] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // publisherIds here are actually slugs (see frontend.php update)
    
    useEffect(() => {
        const fetchRelated = async () => {
            if (!publisherIds.length) return;
            
            const apiUrl = window.rmssSettings?.apiUrl || '/wp-json/shelfsage/v1';
            const nonce = window.rmssSettings?.nonce || '';
            
            try {
                const res = await axios.get(`${apiUrl}/search`, {
                    params: {
                        publisher: publisherIds.join(','),
                    },
                    headers: { 'X-WP-Nonce': nonce }
                });
                
                // Filter out current product
                const related = res.data.filter(b => b.id !== parseInt(currentProductId)).slice(0, 4);
                setBooks(related);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchRelated();
    }, [publisherIds, currentProductId]);

    if (loading) return null; // Don't show skeleton for shelf talker to avoid clutter if empty
    if (!books.length) return null;

    return (
        <div className="bg-blue-50 p-6 rounded-lg border border-blue-100">
            <h3 className="text-xl font-bold mb-4 text-blue-800 flex items-center gap-2">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path></svg>
                {window.rmssSettings?.labels?.related_books || 'Related Books'}
            </h3>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {books.map(book => (
                    <BookCard key={book.id} book={book} />
                ))}
            </div>
        </div>
    );
};

export default ShelfTalker;
