import { useState } from 'react';
import { db } from './db';
import { Database, Upload, AlertCircle, CheckCircle2 } from 'lucide-react';

// Some mock books to test with
const MOCK_DATA = [
  { title: "The Great Gatsby", author: "F. Scott Fitzgerald" },
  { title: "To Kill a Mockingbird", author: "Harper Lee" },
  { title: "1984", author: "George Orwell" },
  { title: "Pride and Prejudice", author: "Jane Austen" },
  { title: "The Catcher in the Rye", author: "J.D. Salinger" },
  { title: "The Hobbit", author: "J.R.R. Tolkien" },
  { title: "Fahrenheit 451", author: "Ray Bradbury" },
  { title: "Moby Dick", author: "Herman Melville" },
  { title: "War and Peace", author: "Leo Tolstoy" },
  { title: "The Odyssey", author: "Homer" },
  { title: "Crime and Punishment", author: "Fyodor Dostoevsky" },
  { title: "Brave New World", author: "Aldous Huxley" },
  { title: "The Lord of the Rings", author: "J.R.R. Tolkien" },
  { title: "Jane Eyre", author: "Charlotte Brontë" },
  { title: "Animal Farm", author: "George Orwell" },
  { title: "Wuthering Heights", author: "Emily Brontë" },
  { title: "The Grapes of Wrath", author: "John Steinbeck" },
  { title: "Frankenstein", author: "Mary Shelley" },
  { title: "Little Women", author: "Louisa May Alcott" },
  { title: "The Alchemist", author: "Paulo Coelho" },
  { title: "Harry Potter and the Sorcerer's Stone", author: "J.K. Rowling" },
  { title: "The Kite Runner", author: "Khaled Hosseini" },
  { title: "A Game of Thrones", author: "George R.R. Martin" },
  { title: "The Hunger Games", author: "Suzanne Collins" },
  { title: "Dune", author: "Frank Herbert" }
];

export default function ImportDataScreen() {
  const [isImporting, setIsImporting] = useState(false);
  const [importStatus, setImportStatus] = useState<{type: 'idle' | 'success' | 'error', message: string}>({
    type: 'idle',
    message: ''
  });

  const loadMockData = async () => {
    setIsImporting(true);
    setImportStatus({ type: 'idle', message: '' });
    
    try {
      // Clear existing first for a clean slate, or you could just add
      await db.books.clear();
      
      // Batch insert is faster for Dexie
      await db.books.bulkAdd(MOCK_DATA);
      
      setImportStatus({
        type: 'success',
        message: `Successfully loaded ${MOCK_DATA.length} mock books into the offline database.`
      });
    } catch (error) {
      console.error(error);
      setImportStatus({
        type: 'error',
        message: 'Failed to import data. Check console for details.'
      });
    } finally {
      setIsImporting(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    setImportStatus({ type: 'idle', message: '' });

    try {
      const text = await file.text();
      const parsedData = JSON.parse(text);
      
      if (!Array.isArray(parsedData)) {
        throw new Error("File must contain a JSON array of books.");
      }

      const validBooks = parsedData.filter(b => b.title && b.author).map(b => ({
        title: String(b.title),
        author: String(b.author),
        description: b.description ? String(b.description) : undefined,
        coverUrl: b.coverUrl ? String(b.coverUrl) : undefined
      }));

      await db.books.bulkAdd(validBooks);
      
      setImportStatus({
        type: 'success',
        message: `Successfully imported ${validBooks.length} books.`
      });
      
    } catch (error: any) {
      console.error(error);
      setImportStatus({
        type: 'error',
        message: error.message || 'Failed to parse JSON file. Ensure it is a valid format.'
      });
    } finally {
      setIsImporting(false);
      // reset file input
      if (event.target) event.target.value = '';
    }
  };

  const clearDatabase = async () => {
    if (confirm('Are you sure you want to clear ALL data? This will delete both the global catalog and your personal library.')) {
      try {
        await db.books.clear();
        await db.library.clear();
        setImportStatus({
          type: 'success',
          message: 'Database completely cleared.'
        });
      } catch (error) {
        setImportStatus({
          type: 'error',
          message: 'Failed to clear database.'
        });
      }
    }
  };

  return (
    <div className="p-6 max-w-lg mx-auto bg-white min-h-full">
      <div className="text-center mb-8">
        <Database className="mx-auto h-12 w-12 text-blue-500 mb-4" />
        <h2 className="text-2xl font-bold text-gray-900">Database Management</h2>
        <p className="text-gray-500 mt-2 text-sm">
          Since this app works entirely offline, you need to load the global book catalog into your device's memory.
        </p>
      </div>

      {importStatus.type !== 'idle' && (
        <div className={`p-4 rounded-xl mb-6 flex gap-3 ${
          importStatus.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'
        }`}>
          {importStatus.type === 'success' ? <CheckCircle2 className="shrink-0" /> : <AlertCircle className="shrink-0" />}
          <p className="text-sm font-medium">{importStatus.message}</p>
        </div>
      )}

      <div className="space-y-6">
        <div className="p-5 border border-gray-200 rounded-2xl shadow-sm">
          <h3 className="font-semibold text-gray-800 mb-2">1. Load Mock Data</h3>
          <p className="text-sm text-gray-500 mb-4">Quickly seed the database with 25 classic books to test the search functionality.</p>
          <button
            onClick={loadMockData}
            disabled={isImporting}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-medium py-2.5 px-4 rounded-xl transition-colors"
          >
            {isImporting ? 'Loading...' : 'Load Mock Books'}
          </button>
        </div>

        <div className="p-5 border border-gray-200 rounded-2xl shadow-sm">
          <h3 className="font-semibold text-gray-800 mb-2">2. Import from JSON File</h3>
          <p className="text-sm text-gray-500 mb-4">
            Upload a JSON file containing a massive array of books. Format should be: 
            <br/><code className="text-xs bg-gray-100 p-1 rounded mt-1 inline-block">[{`{"title": "...", "author": "..."}`}]</code>
          </p>
          
          <label className="flex items-center justify-center w-full bg-gray-50 border-2 border-dashed border-gray-300 hover:border-blue-400 hover:bg-blue-50 transition-colors py-4 rounded-xl cursor-pointer">
            <input 
              type="file" 
              accept=".json" 
              className="hidden" 
              onChange={handleFileUpload}
              disabled={isImporting}
            />
            <div className="flex flex-col items-center text-gray-500">
              <Upload size={24} className="mb-2" />
              <span className="text-sm font-medium">Select JSON File</span>
            </div>
          </label>
        </div>

        <div className="p-5 border border-red-100 bg-red-50 rounded-2xl">
          <h3 className="font-semibold text-red-800 mb-2">Danger Zone</h3>
          <p className="text-sm text-red-600 mb-4">This will wipe all data from the device, including the personal library.</p>
          <button
            onClick={clearDatabase}
            disabled={isImporting}
            className="w-full bg-red-600 hover:bg-red-700 disabled:bg-red-300 text-white font-medium py-2.5 px-4 rounded-xl transition-colors"
          >
            Clear All Data
          </button>
        </div>
      </div>
    </div>
  );
}
