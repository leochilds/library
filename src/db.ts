import Dexie, { type Table } from 'dexie';

export interface Book {
  id?: number;
  title: string;
  author: string;
  coverUrl?: string;
  description?: string;
  externalId?: string;
}

export interface LibraryEntry {
  id?: number;
  bookId: number; // reference to books table
  dateAdded: number;
}

export class LibraryDatabase extends Dexie {
  books!: Table<Book>;
  library!: Table<LibraryEntry>;

  constructor() {
    super('LibraryAppDB');
    this.version(1).stores({
      books: '++id, title, author, [title+author]', // index on title, author, and compound
      library: '++id, bookId, dateAdded' // index on bookId and dateAdded
    });
    this.version(2).stores({
      books: '++id, title, author, externalId, [title+author]',
      library: '++id, bookId, dateAdded'
    });
  }
}

export const db = new LibraryDatabase();
