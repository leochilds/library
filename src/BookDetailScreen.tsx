import { useParams, useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from './db';
import { ArrowLeft, BookMarked, Calendar, Building2, Tag, Hash, BookOpen } from 'lucide-react';

export default function BookDetailScreen() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const book = useLiveQuery(async () => {
    if (!id) return null;
    const bookId = parseInt(id, 10);
    if (isNaN(bookId)) return null;
    return await db.books.get(bookId);
  }, [id], null);

  if (!id || isNaN(parseInt(id, 10))) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-4 text-center text-gray-500">
        <p className="text-lg font-medium">Invalid book ID</p>
        <button
          onClick={() => navigate(-1)}
          className="mt-4 text-blue-600 hover:text-blue-800 font-medium"
        >
          Go Back
        </button>
      </div>
    );
  }

  if (book === null) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500">
        <p>Loading...</p>
      </div>
    );
  }

  if (book === undefined) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-4 text-center text-gray-500">
        <BookMarked className="h-12 w-12 text-gray-300 mb-4" />
        <p className="text-lg font-medium">Book not found</p>
        <button
          onClick={() => navigate(-1)}
          className="mt-4 text-blue-600 hover:text-blue-800 font-medium"
        >
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Header with back button */}
      <div className="sticky top-0 bg-white p-4 shadow-sm z-10 flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          aria-label="Go back"
        >
          <ArrowLeft size={24} className="text-gray-700" />
        </button>
        <h2 className="text-lg font-semibold text-gray-800">Book Details</h2>
      </div>

      {/* Book details content */}
      <div className="flex-1 overflow-y-auto p-4 pb-20">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden max-w-2xl mx-auto">
          {/* Cover image section */}
          <div className="flex justify-center p-6 bg-gradient-to-b from-gray-50 to-white">
            {book.coverUrl ? (
              <img
                src={book.coverUrl}
                alt={book.title}
                className="max-w-[200px] max-h-[300px] object-cover rounded-lg shadow-lg"
              />
            ) : (
              <div className="w-[200px] h-[300px] bg-indigo-50 text-indigo-200 rounded-lg shadow-lg flex flex-col justify-center items-center border border-indigo-100">
                <BookMarked size={64} />
                <p className="text-sm text-indigo-300 mt-4">No Cover</p>
              </div>
            )}
          </div>

          {/* Book information */}
          <div className="p-6 space-y-4">
            {/* Title */}
            <div>
              <h1 className="text-2xl font-bold text-gray-900 leading-tight mb-1">
                {book.title}
              </h1>
              <p className="text-lg text-gray-600">{book.author}</p>
            </div>

            {/* Metadata grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-4 border-t border-gray-200">
              {book.publishYear && (
                <div className="flex items-start gap-3">
                  <Calendar size={20} className="text-gray-400 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs text-gray-500 font-medium">Published</p>
                    <p className="text-sm text-gray-900">{book.publishYear}</p>
                  </div>
                </div>
              )}

              {book.publisher && (
                <div className="flex items-start gap-3">
                  <Building2 size={20} className="text-gray-400 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs text-gray-500 font-medium">Publisher</p>
                    <p className="text-sm text-gray-900">{book.publisher}</p>
                  </div>
                </div>
              )}

              {book.subject && (
                <div className="flex items-start gap-3">
                  <Tag size={20} className="text-gray-400 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs text-gray-500 font-medium">Subject</p>
                    <p className="text-sm text-gray-900">{book.subject}</p>
                  </div>
                </div>
              )}

              {book.isbn && (
                <div className="flex items-start gap-3">
                  <Hash size={20} className="text-gray-400 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs text-gray-500 font-medium">ISBN</p>
                    <p className="text-sm text-gray-900 font-mono">{book.isbn}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Description */}
            {book.description && (
              <div className="pt-4 border-t border-gray-200">
                <div className="flex items-center gap-2 mb-2">
                  <BookOpen size={20} className="text-gray-400" />
                  <p className="text-sm text-gray-500 font-medium">Description</p>
                </div>
                <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                  {book.description}
                </p>
              </div>
            )}

            {/* External ID (for debugging/admin purposes) */}
            {book.externalId && (
              <div className="pt-4 border-t border-gray-200">
                <p className="text-xs text-gray-400">
                  External ID: {book.externalId}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
