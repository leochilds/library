import { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type Book } from './db';
import { Search as SearchIcon, PlusCircle, CheckCircle } from 'lucide-react';

export default function SearchScreen() {
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');

  // Debounce the search input so we don't query the DB on every keystroke
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  // Query the global books table using Dexie
  const searchResults = useLiveQuery(() => {
    if (!debouncedQuery) return [];
    
    // Convert query to lowercase for case-insensitive partial matching
    const lowerQuery = debouncedQuery.toLowerCase();
    
    return db.books
      .filter((book) => 
        book.title.toLowerCase().includes(lowerQuery) || 
        book.author.toLowerCase().includes(lowerQuery)
      )
      .limit(50)
      .toArray();
  }, [debouncedQuery], []);

  // Fetch all library entries to quickly check for duplicates
  const libraryEntries = useLiveQuery(() => db.library.toArray(), [], []);
  const libraryBookIds = new Set(libraryEntries.map(e => e.bookId));

  const addToLibrary = async (bookId: number) => {
    if (libraryBookIds.has(bookId)) return;
    
    await db.library.add({
      bookId,
      dateAdded: Date.now()
    });
  };

  return (
    <div className="flex flex-col h-full">
      <div className="sticky top-0 bg-white p-4 shadow-sm z-10">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <SearchIcon className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-xl leading-5 bg-gray-50 placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 sm:text-sm transition-shadow"
            placeholder="Search books by title or author..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
        {!debouncedQuery ? (
          <div className="text-center text-gray-500 mt-10 px-4">
            <SearchIcon className="mx-auto h-12 w-12 text-gray-300 mb-4" />
            <p className="text-lg font-medium">Find your next book</p>
            <p className="text-sm mt-1">Start typing to search through the global catalog.</p>
          </div>
        ) : searchResults.length === 0 ? (
          <div className="text-center text-gray-500 mt-10">
            <p>No books found matching "{debouncedQuery}"</p>
          </div>
        ) : (
          <div className="space-y-4 pb-20">
            {searchResults.map((book) => {
              const inLibrary = book.id ? libraryBookIds.has(book.id) : false;
              
              return (
                <div key={book.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
                  {book.coverUrl ? (
                    <img src={book.coverUrl} alt={book.title} className="w-16 h-24 object-cover rounded shadow-sm bg-gray-200" />
                  ) : (
                    <div className="w-16 h-24 bg-indigo-50 text-indigo-200 rounded flex flex-col justify-center items-center shadow-sm shrink-0 border border-indigo-100">
                      <BookMarked size={24} />
                    </div>
                  )}
                  
                  <div className="flex-1 min-w-0">
                    <h3 className="text-base font-semibold text-gray-900 truncate leading-tight mb-1">{book.title}</h3>
                    <p className="text-sm text-gray-600 truncate">{book.author}</p>
                    {book.description && (
                      <p className="text-xs text-gray-500 mt-2 line-clamp-2">{book.description}</p>
                    )}
                  </div>
                  
                  <button
                    onClick={() => book.id && addToLibrary(book.id)}
                    disabled={inLibrary}
                    className={`shrink-0 p-2 rounded-full transition-colors ${
                      inLibrary 
                        ? 'text-green-500 bg-green-50' 
                        : 'text-blue-600 bg-blue-50 hover:bg-blue-100 active:bg-blue-200'
                    }`}
                    aria-label={inLibrary ? 'In library' : 'Add to library'}
                  >
                    {inLibrary ? <CheckCircle size={28} /> : <PlusCircle size={28} />}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// Re-import BookMarked that was accidentally omitted in the generated template
import { BookMarked } from 'lucide-react';