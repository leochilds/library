import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './Layout';
import SearchScreen from './SearchScreen';
import LibraryScreen from './LibraryScreen';
import ImportDataScreen from './ImportDataScreen';
import BookDetailScreen from './BookDetailScreen';

function App() {
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<SearchScreen />} />
          <Route path="library" element={<LibraryScreen />} />
          <Route path="book/:id" element={<BookDetailScreen />} />
          <Route path="import" element={<ImportDataScreen />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
