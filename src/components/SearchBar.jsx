import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import debounce from 'lodash.debounce';

const SearchBar = ({ onSearch }) => {
  const [term, setTerm] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  // Debounced search function
  const debouncedSearch = useCallback(
    debounce(async (searchTerm) => {
      if (!searchTerm) {
        setResults([]);
        return;
      }
      setLoading(true);
      try {
        // Use the global variable rmssSettings passed from PHP
        const apiUrl = window.rmssSettings?.apiUrl || '/wp-json/shelfsage/v1/search';
        const response = await axios.get(apiUrl, {
          params: { term: searchTerm }
        });
        setResults(response.data);
        setShowDropdown(true);
      } catch (error) {
        console.error("Search error:", error);
      } finally {
        setLoading(false);
      }
    }, 500),
    []
  );

  const handleChange = (e) => {
    const value = e.target.value;
    setTerm(value);
    debouncedSearch(value);
  };

  const handleSelect = (book) => {
      onSearch(book); // Pass selected book to parent
      setShowDropdown(false);
      setTerm(book.title);
  };

  return (
    <div className="relative w-full">
      <div className="relative">
        <input
          type="text"
          className="w-full border border-gray-300 rounded-lg py-2 px-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Search by Title, Author, ISBN..."
          value={term}
          onChange={handleChange}
          onFocus={() => { if(results.length > 0) setShowDropdown(true); }}
          onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
        />
        {loading && (
          <div className="absolute right-3 top-2.5">
            <svg className="animate-spin h-5 w-5 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
        )}
      </div>

      {showDropdown && results.length > 0 && (
        <div className="absolute z-10 w-full bg-white border border-gray-200 rounded-lg shadow-xl mt-1 max-h-96 overflow-y-auto">
          {results.map((book) => (
            <div
              key={book.id}
              className="flex items-center p-3 hover:bg-gray-50 cursor-pointer border-b last:border-b-0"
              onClick={() => handleSelect(book)}
            >
              <div className="flex-shrink-0 h-12 w-12 bg-gray-200 rounded overflow-hidden">
                {book.thumbnail ? (
                  <img src={book.thumbnail} alt={book.title} className="h-full w-full object-cover" />
                ) : (
                   <span className="flex items-center justify-center h-full text-xs text-gray-500">No Img</span>
                )}
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-900">{book.title}</p>
                <p className="text-xs text-gray-500">{book.authors}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SearchBar;
