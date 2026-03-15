import { useState, useEffect, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type Book } from './db';
import { Search as SearchIcon, PlusCircle, CheckCircle, Loader2, BookMarked } from 'lucide-react';

export default function SearchScreen() {
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [apiResults, setApiResults] = useState<Book[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Debounce the search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, 500);
    return () => clearTimeout(timer);
  }, [query]);

  // Local database search
  const localSearchResults = useLiveQuery(() => {
    if (!debouncedQuery) return [];
    
    const lowerQuery = debouncedQuery.toLowerCase();
    
    return db.books
      .filter((book) => 
        book.title.toLowerCase().includes(lowerQuery) || 
        book.author.toLowerCase().includes(lowerQuery)
      )
      .limit(20)
      .toArray();
  }, [debouncedQuery], []);

  // Remote API search
  useEffect(() => {
    if (!debouncedQuery) {
      setApiResults([]);
      return;
    }

    let isMounted = true;
    
    const fetchApiBooks = async () => {
      setIsSearching(true);
      try {
        const [googleRes, olRes] = await Promise.allSettled([
          fetch(`https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(debouncedQuery)}&maxResults=20`),
          fetch(`https://openlibrary.org/search.json?q=${encodeURIComponent(debouncedQuery)}&limit=20`)
        ]);

        let googleBooks: Book[] = [];
        if (googleRes.status === 'fulfilled') {
          try {
            const data = await googleRes.value.json();
            googleBooks = (data.items || []).map((item: any) => ({
              title: item.volumeInfo.title || 'Unknown Title',
              author: item.volumeInfo.authors?.join(', ') || 'Unknown Author',
              coverUrl: item.volumeInfo.imageLinks?.thumbnail?.replace('http:', 'https:'),
              description: item.volumeInfo.description,
              externalId: `google_${item.id}`
            }));
          } catch (e) {
            console.error('Google Books API parsing error', e);
          }
        }

        let olBooks: Book[] = [];
        if (olRes.status === 'fulfilled') {
          try {
            const data = await olRes.value.json();
            olBooks = (data.docs || []).map((doc: any) => ({
              title: doc.title || 'Unknown Title',
              author: doc.author_name?.[0] || 'Unknown Author',
              coverUrl: doc.cover_i ? `https://covers.openlibrary.org/b/id/${doc.cover_i}-M.jpg` : undefined,
              externalId: `ol_${doc.key?.replace('/works/', '')}`
            }));
          } catch (e) {
            console.error('Open Library API parsing error', e);
          }
        }

        if (isMounted) {
          setApiResults([...googleBooks, ...olBooks]);
        }
      } catch (error) {
        console.error('API Search Error', error);
      } finally {
        if (isMounted) {
          setIsSearching(false);
        }
      }
    };

    fetchApiBooks();

    return () => {
      isMounted = false;
    };
  }, [debouncedQuery]);

  // Combine and deduplicate local and remote results
  const combinedResults = useMemo(() => {
    const results: Book[] = [...(localSearchResults || [])];
    const seen = new Set(results.map(b => `${b.title.toLowerCase()}|${b.author.toLowerCase()}`));

    for (const book of apiResults) {
      const key = `${book.title.toLowerCase()}|${book.author.toLowerCase()}`;
      if (!seen.has(key)) {
        seen.add(key);
        results.push(book);
      }
    }

    return results;
  }, [localSearchResults, apiResults]);

  // Fetch all library entries and their corresponding book details
  const libraryBookDetails = useLiveQuery(async () => {
    const entries = await db.library.toArray();
    const bookIds = entries.map(e => e.bookId);
    // Fetch all books that are in the library
    const books = await Promise.all(bookIds.map(id => db.books.get(id)));
    return books.filter(Boolean) as Book[];
  }, [], []);

  // Create a fast lookup set for books in the library
  const libraryKeys = useMemo(() => {
    const keys = new Set<string>();
    libraryBookDetails?.forEach(book => {
      if (book.id) keys.add(`id:${book.id}`);
      if (book.externalId) keys.add(`ext:${book.externalId}`);
      keys.add(`title_author:${book.title.toLowerCase()}|${book.author.toLowerCase()}`);
    });
    return keys;
  }, [libraryBookDetails]);

  const isInLibrary = (book: Book) => {
    if (book.id && libraryKeys.has(`id:${book.id}`)) return true;
    if (book.externalId && libraryKeys.has(`ext:${book.externalId}`)) return true;
    if (libraryKeys.has(`title_author:${book.title.toLowerCase()}|${book.author.toLowerCase()}`)) return true;
    return false;
  };

  const addToLibrary = async (book: Book) => {
    let bookId = book.id;
    
    // If book is from API, it won't have a local id yet
    if (!bookId) {
      // Double check if it was somehow added globally without being in localSearchResults
      const existing = await db.books
        .filter(b => 
          (book.externalId !== undefined && b.externalId === book.externalId) || 
          (b.title.toLowerCase() === book.title.toLowerCase() && b.author.toLowerCase() === book.author.toLowerCase())
        )
        .first();
        
      if (existing && existing.id) {
        bookId = existing.id;
      } else {
        // Save to local database
        bookId = await db.books.add({
          title: book.title,
          author: book.author,
          coverUrl: book.coverUrl,
          description: book.description,
          externalId: book.externalId
        });
      }
    }

    if (bookId) {
      // Check if it's already in the library table
      const existingEntry = await db.library.where({ bookId }).first();
      if (!existingEntry) {
        await db.library.add({
          bookId,
          dateAdded: Date.now()
        });
      }
    }
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
        ) : isSearching && combinedResults.length === 0 ? (
          <div className="flex flex-col items-center justify-center mt-10 text-gray-500">
            <Loader2 className="h-8 w-8 animate-spin mb-4 text-blue-500" />
            <p>Searching catalogs...</p>
          </div>
        ) : combinedResults.length === 0 ? (
          <div className="text-center text-gray-500 mt-10">
            <p>No books found matching "{debouncedQuery}"</p>
          </div>
        ) : (
          <div className="space-y-4 pb-20">
            {combinedResults.map((book, index) => {
              const inLibrary = isInLibrary(book);
              const key = book.id ? `id-${book.id}` : book.externalId ? `ext-${book.externalId}` : `idx-${index}`;
              
              return (
                <div key={key} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
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
                    onClick={() => addToLibrary(book)}
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
