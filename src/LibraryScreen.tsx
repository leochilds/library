import { useLiveQuery } from 'dexie-react-hooks';
import { Link } from 'react-router-dom';
import { db, type Book } from './db';
import { BookMarked, Trash2 } from 'lucide-react';

interface LibraryBook extends Book {
  libraryId: number;
  dateAdded: number;
}

export default function LibraryScreen() {
  // Query the library table and join with the books table
  const libraryBooks = useLiveQuery(async () => {
    const entries = await db.library.orderBy('dateAdded').reverse().toArray();
    
    // Fetch all corresponding book details
    const booksWithDetails: LibraryBook[] = [];
    
    for (const entry of entries) {
      const bookDetail = await db.books.get(entry.bookId);
      if (bookDetail) {
        booksWithDetails.push({
          ...bookDetail,
          libraryId: entry.id!,
          dateAdded: entry.dateAdded
        });
      }
    }
    
    return booksWithDetails;
  }, [], []);

  const removeFromLibrary = async (e: React.MouseEvent, libraryId: number) => {
    e.preventDefault();
    e.stopPropagation();
    if (confirm('Are you sure you want to remove this book from your library?')) {
      await db.library.delete(libraryId);
    }
  };

  if (!libraryBooks) {
    return <div className="p-4 text-center text-gray-500">Loading library...</div>;
  }

  return (
    <div className="flex flex-col h-full bg-gray-50">
      <div className="sticky top-0 bg-white p-4 shadow-sm z-10">
        <h2 className="text-lg font-semibold text-gray-800">My Saved Books</h2>
        <p className="text-sm text-gray-500">{libraryBooks.length} {libraryBooks.length === 1 ? 'book' : 'books'} in your collection</p>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {libraryBooks.length === 0 ? (
          <div className="text-center text-gray-500 mt-10 px-4">
            <BookMarked className="mx-auto h-12 w-12 text-gray-300 mb-4" />
            <p className="text-lg font-medium">Your library is empty</p>
            <p className="text-sm mt-1">Go to the Search tab to find and add books to your collection.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pb-20">
            {libraryBooks.map((book) => (
              <Link 
                key={book.libraryId} 
                to={`/book/${book.id}`}
                className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col relative group hover:shadow-md transition-shadow"
              >
                <button
                  onClick={(e) => removeFromLibrary(e, book.libraryId)}
                  className="absolute top-2 right-2 p-1.5 bg-white/80 backdrop-blur-sm text-red-500 rounded-full shadow-sm hover:bg-red-50 transition-colors z-10"
                  title="Remove from library"
                >
                  <Trash2 size={16} />
                </button>
                
                <div className="aspect-[2/3] w-full bg-gray-100 relative">
                  {book.coverUrl ? (
                    <img 
                      src={book.coverUrl} 
                      alt={book.title} 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col justify-center items-center text-indigo-200 bg-indigo-50">
                      <BookMarked size={32} />
                    </div>
                  )}
                </div>
                
                <div className="p-3 flex-1 flex flex-col">
                  <h3 className="text-sm font-semibold text-gray-900 line-clamp-2 leading-tight mb-1" title={book.title}>
                    {book.title}
                  </h3>
                  <p className="text-xs text-gray-600 line-clamp-1 mb-2" title={book.author}>
                    {book.author}
                  </p>
                  <p className="text-[10px] text-gray-400 mt-auto">
                    Added {new Date(book.dateAdded).toLocaleDateString()}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
