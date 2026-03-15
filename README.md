# My Library App

An offline-first Progressive Web App (PWA) built for storing, searching, and managing a massive personal book collection. Features hybrid search combining local offline data with live API integration.

## Features

- **Hybrid Search:** Search both your local offline database AND live APIs (Google Books + Open Library) simultaneously
- **Offline-First:** Runs entirely in the browser using IndexedDB (via Dexie.js) to store thousands of books locally
- **PWA Support:** Can be installed on mobile devices directly from the browser, looking and feeling like a native app
- **Advanced Search & Filtering:** 
  - Basic text search across titles and authors
  - 6 advanced filters: title, author, publisher, subject, ISBN, and publish year
  - Multi-level sorting (up to 5 sort criteria) by title, author, publisher, publish year, or ISBN
- **Smart Deduplication:** Automatically combines and deduplicates results from local database and external APIs
- **Personal Library:** Add books from search results to a personal library collection with duplicate prevention
- **Data Import:** Easily import large datasets (JSON format) or seed the database with mock data for offline use

## Tech Stack

- **Framework:** React + TypeScript
- **Build Tool:** Vite
- **Styling:** Tailwind CSS
- **Database:** Dexie.js (IndexedDB wrapper)
- **Routing:** React Router
- **Icons:** Lucide React

## Getting Started

### Prerequisites

- Node.js (v24 or higher - see package.json engines requirement)
- npm

### Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd library-app
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Open your browser and navigate to `http://localhost:5173/library/`.
   - **Note:** The app uses `/library/` as the base path (configured in vite.config.ts)

### Building for Production

To build the application for production (including the PWA service worker):

```bash
npm run build
```

To preview the production build locally:

```bash
npm run preview
```

## How to Use

### Initial Setup

1. **First Launch:** When you first open the app, the local database will be empty
2. **Import Data (Optional):** Click the Download icon (⬇️) in the top right to access the Data Import screen:
   - **Option 1:** Load 25 classic mock books for testing
   - **Option 2:** Upload a custom JSON file with your book catalog
   - **Note:** You can skip this step and search live APIs directly, but importing data enables offline search

### Searching for Books

1. **Navigate to Search Tab:** Click the Search icon in the bottom navigation
2. **Basic Search:** Type in the main search box to query both:
   - Your local offline database
   - Google Books API
   - Open Library API
3. **Advanced Search:** Click the filter icon (sliders) to access:
   - Individual field filters (title, author, publisher, subject, ISBN, publish year)
   - Multi-level sorting options
   - Results automatically combine and deduplicate from all sources

### Managing Your Library

1. **Add to Library:** Click the "+" button next to any book in search results
   - Books from APIs are automatically saved to your local database first
   - Duplicates are prevented (green checkmark indicates already in library)
2. **View Library:** Switch to the Library tab to see your saved books in a grid view
3. **Remove Books:** Click the trash icon on any book card to remove from library
4. **Library Persistence:** Your library is stored locally and works completely offline

### Database Management

Access the Import Data screen (Download icon) to:
- Load mock data for testing
- Import custom book collections via JSON
- Clear all data (both catalog and library)

## JSON Import Format

When importing a custom dataset, the JSON file should contain an array of objects with the following format:

```json
[
  {
    "title": "The Great Gatsby",
    "author": "F. Scott Fitzgerald",
    "description": "A novel set in the Roaring Twenties...",
    "coverUrl": "https://example.com/cover.jpg",
    "publisher": "Scribner",
    "subject": "Fiction",
    "isbn": "9780743273565",
    "publishYear": "1925",
    "externalId": "custom_id_123"
  }
]
```

**Required fields:**
- `title` (string)
- `author` (string)

**Optional fields:**
- `description` (string) - Book description or synopsis
- `coverUrl` (string) - URL to cover image
- `publisher` (string) - Publisher name
- `subject` (string) - Genre or subject category
- `isbn` (string) - ISBN-10 or ISBN-13
- `publishYear` (string) - Year of publication
- `externalId` (string) - Unique identifier for deduplication
