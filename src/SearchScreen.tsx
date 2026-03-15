import { useState, useEffect, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type Book } from './db';
import { Search as SearchIcon, PlusCircle, CheckCircle, Loader2, BookMarked, SlidersHorizontal, X } from 'lucide-react';

export type SortField = 'title' | 'author' | 'publisher' | 'publishYear' | 'isbn';
export interface SortOption {
  field: SortField;
  direction: 'asc' | 'desc';
}

export interface SearchFilters {
  query: string;
  title: string;
  author: string;
  publisher: string;
  subject: string;
  isbn: string;
  publishYear: string;
}

const defaultFilters: SearchFilters = {
  query: '',
  title: '',
  author: '',
  publisher: '',
  subject: '',
  isbn: '',
  publishYear: ''
};

export default function SearchScreen() {
  const [filters, setFilters] = useState<SearchFilters>(defaultFilters);
  const [sorts, setSorts] = useState<SortOption[]>([]);
  const [debouncedFilters, setDebouncedFilters] = useState<SearchFilters>(defaultFilters);
  const [apiResults, setApiResults] = useState<Book[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Debounce the search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedFilters(filters);
    }, 500);
    return () => clearTimeout(timer);
  }, [filters]);

  const hasActiveFilters = useMemo(() => {
    return Object.values(debouncedFilters).some(v => v.trim() !== '');
  }, [debouncedFilters]);

  // Local database search
  const localSearchResults = useLiveQuery(() => {
    if (!hasActiveFilters) return [];
    
    return db.books
      .filter((book) => {
        let match = true;
        
        if (debouncedFilters.query) {
           const lowerQuery = debouncedFilters.query.toLowerCase();
           match = match && (book.title.toLowerCase().includes(lowerQuery) || book.author.toLowerCase().includes(lowerQuery));
        }
        if (debouncedFilters.title) {
           match = match && book.title.toLowerCase().includes(debouncedFilters.title.toLowerCase());
        }
        if (debouncedFilters.author) {
           match = match && book.author.toLowerCase().includes(debouncedFilters.author.toLowerCase());
        }
        if (debouncedFilters.publisher) {
           match = match && !!book.publisher && book.publisher.toLowerCase().includes(debouncedFilters.publisher.toLowerCase());
        }
        if (debouncedFilters.subject) {
           match = match && !!book.subject && book.subject.toLowerCase().includes(debouncedFilters.subject.toLowerCase());
        }
        if (debouncedFilters.isbn) {
           match = match && !!book.isbn && book.isbn.toLowerCase().includes(debouncedFilters.isbn.toLowerCase());
        }
        if (debouncedFilters.publishYear) {
           match = match && !!book.publishYear && book.publishYear.includes(debouncedFilters.publishYear);
        }
        
        return match;
      })
      .limit(20)
      .toArray();
  }, [debouncedFilters, hasActiveFilters], []);

  // Remote API search
  useEffect(() => {
    if (!hasActiveFilters) {
      setApiResults([]);
      return;
    }

    let isMounted = true;
    
    const fetchApiBooks = async () => {
      setIsSearching(true);
      try {
        // Build Google Books Query
        const gbParts = [];
        const baseQuery = debouncedFilters.query + (debouncedFilters.publishYear ? ` ${debouncedFilters.publishYear}` : '');
        if (baseQuery.trim()) gbParts.push(baseQuery.trim());
        if (debouncedFilters.title) gbParts.push(`intitle:${debouncedFilters.title}`);
        if (debouncedFilters.author) gbParts.push(`inauthor:${debouncedFilters.author}`);
        if (debouncedFilters.publisher) gbParts.push(`inpublisher:${debouncedFilters.publisher}`);
        if (debouncedFilters.subject) gbParts.push(`subject:${debouncedFilters.subject}`);
        if (debouncedFilters.isbn) gbParts.push(`isbn:${debouncedFilters.isbn}`);
        const gbQuery = encodeURIComponent(gbParts.join('+'));

        // Build Open Library Query
        const olParams = new URLSearchParams();
        if (debouncedFilters.query) olParams.append('q', debouncedFilters.query);
        if (debouncedFilters.title) olParams.append('title', debouncedFilters.title);
        if (debouncedFilters.author) olParams.append('author', debouncedFilters.author);
        if (debouncedFilters.publisher) olParams.append('publisher', debouncedFilters.publisher);
        if (debouncedFilters.subject) olParams.append('subject', debouncedFilters.subject);
        if (debouncedFilters.isbn) olParams.append('isbn', debouncedFilters.isbn);
        if (debouncedFilters.publishYear) olParams.append('publish_year', debouncedFilters.publishYear);
        olParams.append('limit', '20');

        const [googleRes, olRes] = await Promise.allSettled([
          gbQuery ? fetch(`https://www.googleapis.com/books/v1/volumes?q=${gbQuery}&maxResults=20`) : Promise.resolve(new Response(JSON.stringify({items: []}))),
          fetch(`https://openlibrary.org/search.json?${olParams.toString()}`)
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
              externalId: `google_${item.id}`,
              publisher: item.volumeInfo.publisher,
              subject: item.volumeInfo.categories?.join(', '),
              isbn: item.volumeInfo.industryIdentifiers?.find((id: any) => id.type === 'ISBN_13' || id.type === 'ISBN_10')?.identifier,
              publishYear: item.volumeInfo.publishedDate?.substring(0, 4)
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
              externalId: `ol_${doc.key?.replace('/works/', '')}`,
              publisher: doc.publisher?.[0],
              subject: doc.subject?.[0],
              isbn: doc.isbn?.[0],
              publishYear: doc.first_publish_year?.toString() || doc.publish_year?.[0]?.toString()
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
  }, [debouncedFilters, hasActiveFilters]);

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

    if (sorts.length > 0) {
      results.sort((a, b) => {
        for (const sort of sorts) {
          let valA = a[sort.field as keyof Book];
          let valB = b[sort.field as keyof Book];
          
          if (!valA && valB) return 1;
          if (valA && !valB) return -1;
          if (!valA && !valB) continue;
          
          if (sort.field === 'publishYear' || sort.field === 'isbn') {
            let numA, numB;
            if (sort.field === 'isbn') {
              numA = Number(String(valA).replace(/\D/g, ''));
              numB = Number(String(valB).replace(/\D/g, ''));
            } else {
              numA = parseInt(String(valA), 10);
              numB = parseInt(String(valB), 10);
            }

            const validA = !isNaN(numA);
            const validB = !isNaN(numB);

            if (validA && validB && numA !== numB) {
              return sort.direction === 'asc' ? numA - numB : numB - numA;
            }
            if (!validA && validB) return 1;
            if (validA && !validB) return -1;
          }
          
          valA = String(valA).toLowerCase();
          valB = String(valB).toLowerCase();
          
          if (valA < valB) return sort.direction === 'asc' ? -1 : 1;
          if (valA > valB) return sort.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }

    return results;
  }, [localSearchResults, apiResults, sorts]);

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
          externalId: book.externalId,
          publisher: book.publisher,
          subject: book.subject,
          isbn: book.isbn,
          publishYear: book.publishYear
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
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <SearchIcon className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-xl leading-5 bg-gray-50 placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 sm:text-sm transition-shadow"
              placeholder="Search global catalog..."
              value={filters.query}
              onChange={(e) => setFilters(prev => ({ ...prev, query: e.target.value }))}
            />
          </div>
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className={`p-3 rounded-xl border transition-colors ${
              showAdvanced || hasActiveFilters && filters.query === ''
                ? 'bg-blue-50 border-blue-200 text-blue-600' 
                : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
            }`}
            aria-label="Toggle advanced search"
          >
            {showAdvanced ? <X className="h-5 w-5" /> : <SlidersHorizontal className="h-5 w-5" />}
          </button>
        </div>

        {showAdvanced && (
          <div className="mt-4 p-4 bg-gray-50 rounded-xl border border-gray-200 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Title</label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-blue-500 focus:border-blue-500"
                value={filters.title}
                onChange={(e) => setFilters(prev => ({ ...prev, title: e.target.value }))}
                placeholder="e.g. Harry Potter"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Author</label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-blue-500 focus:border-blue-500"
                value={filters.author}
                onChange={(e) => setFilters(prev => ({ ...prev, author: e.target.value }))}
                placeholder="e.g. J.K. Rowling"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Publisher</label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-blue-500 focus:border-blue-500"
                value={filters.publisher}
                onChange={(e) => setFilters(prev => ({ ...prev, publisher: e.target.value }))}
                placeholder="e.g. Bloomsbury"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Subject</label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-blue-500 focus:border-blue-500"
                value={filters.subject}
                onChange={(e) => setFilters(prev => ({ ...prev, subject: e.target.value }))}
                placeholder="e.g. Fantasy"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">ISBN</label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-blue-500 focus:border-blue-500"
                value={filters.isbn}
                onChange={(e) => setFilters(prev => ({ ...prev, isbn: e.target.value }))}
                placeholder="e.g. 9780545010221"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Publish Year</label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-blue-500 focus:border-blue-500"
                value={filters.publishYear}
                onChange={(e) => setFilters(prev => ({ ...prev, publishYear: e.target.value }))}
                placeholder="e.g. 1997"
              />
            </div>
            <div className="col-span-1 sm:col-span-2 border-t border-gray-200 pt-4 mt-2">
              <h3 className="text-sm font-medium text-gray-700 mb-2">Sort Results By</h3>
              {sorts.map((sort, index) => (
                <div key={index} className="flex flex-wrap gap-2 mb-2 items-center">
                  <span className="text-sm text-gray-500 w-16">{index === 0 ? 'Sort by' : 'Then by'}</span>
                  <select
                    value={sort.field}
                    onChange={(e) => {
                      const newSorts = [...sorts];
                      newSorts[index].field = e.target.value as SortField;
                      setSorts(newSorts);
                    }}
                    className="border border-gray-300 rounded-lg text-sm px-2 py-1 bg-white focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="title">Title</option>
                    <option value="author">Author</option>
                    <option value="publishYear">Publish Year</option>
                    <option value="publisher">Publisher</option>
                    <option value="isbn">ISBN</option>
                  </select>
                  <select
                    value={sort.direction}
                    onChange={(e) => {
                      const newSorts = [...sorts];
                      newSorts[index].direction = e.target.value as 'asc' | 'desc';
                      setSorts(newSorts);
                    }}
                    className="border border-gray-300 rounded-lg text-sm px-2 py-1 bg-white focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="asc">
                      {sort.field === 'publishYear' ? 'Oldest first' :
                       ['title', 'author', 'publisher'].includes(sort.field) ? 'A to Z' :
                       'Lowest to Highest'}
                    </option>
                    <option value="desc">
                      {sort.field === 'publishYear' ? 'Newest first' :
                       ['title', 'author', 'publisher'].includes(sort.field) ? 'Z to A' :
                       'Highest to Lowest'}
                    </option>
                  </select>
                  <button
                    onClick={() => {
                      const newSorts = [...sorts];
                      newSorts.splice(index, 1);
                      setSorts(newSorts);
                    }}
                    className="text-red-500 hover:text-red-700 p-1 rounded-full hover:bg-red-50 transition-colors"
                    title="Remove sort"
                  >
                    <X size={16} />
                  </button>
                </div>
              ))}
              {sorts.length < 5 && (
                <button
                  onClick={() => setSorts([...sorts, { field: 'publishYear', direction: 'desc' }])}
                  className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1 mt-2 font-medium"
                >
                  <PlusCircle size={14} /> Add Sort
                </button>
              )}
            </div>

            <div className="col-span-1 sm:col-span-2 flex justify-end mt-2">
              <button
                onClick={() => {
                  setFilters(defaultFilters);
                  setSorts([]);
                }}
                className="text-sm text-gray-500 hover:text-gray-700 px-3 py-1 font-medium"
              >
                Clear All
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
        {!hasActiveFilters ? (
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
            <p>No books found matching your criteria</p>
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
                    <div className="flex flex-wrap gap-2 mt-1">
                      {book.publishYear && (
                        <span className="inline-block px-2 py-0.5 bg-gray-100 text-gray-600 text-[10px] rounded-full">
                          {book.publishYear}
                        </span>
                      )}
                      {book.publisher && (
                        <span className="inline-block px-2 py-0.5 bg-gray-100 text-gray-600 text-[10px] rounded-full truncate max-w-[120px]">
                          {book.publisher}
                        </span>
                      )}
                      {book.isbn && (
                        <span className="inline-block px-2 py-0.5 bg-gray-100 text-gray-600 text-[10px] rounded-full">
                          ISBN: {book.isbn}
                        </span>
                      )}
                    </div>
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
