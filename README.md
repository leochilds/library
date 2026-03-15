# My Library App

An offline-first Progressive Web App (PWA) built for storing, searching, and managing a massive personal book collection without needing an internet connection.

## Features

- **Offline-First:** Runs entirely in the browser using IndexedDB (via Dexie.js) to store thousands of books locally.
- **PWA Support:** Can be installed on mobile devices directly from the browser, looking and feeling like a native app.
- **Fast Search:** Search through the global catalog instantly.
- **Personal Library:** Add books from the global catalog to a personal library collection. Prevents duplicate entries.
- **Data Import:** Easily import large datasets (JSON format) or seed the database with mock data.

## Tech Stack

- **Framework:** React + TypeScript
- **Build Tool:** Vite
- **Styling:** Tailwind CSS
- **Database:** Dexie.js (IndexedDB wrapper)
- **Routing:** React Router
- **Icons:** Lucide React

## Getting Started

### Prerequisites

- Node.js (v18 or higher recommended)
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

4. Open your browser and navigate to `http://localhost:5173/`.

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

1. **Seed the Database:** When you first open the app, it will be empty. Click the Download icon (⬇️) in the top right to navigate to the Data Import screen. You can either load the included mock data or upload a custom JSON file containing book data.
2. **Search Books:** Go to the "Search" tab to find books from the loaded catalog.
3. **Add to Library:** Click the "+" button next to any book in the search results to add it to your personal library.
4. **View Library:** Switch to the "Library" tab to see all your saved books. You can also remove books from here.

## JSON Import Format

When importing a custom dataset, the JSON file should contain an array of objects with the following format:

```json
[
  {
    "title": "The Great Gatsby",
    "author": "F. Scott Fitzgerald",
    "description": "A novel set in the Roaring Twenties...",
    "coverUrl": "https://example.com/cover.jpg"
  }
]
```
*(Note: `description` and `coverUrl` are optional)*
