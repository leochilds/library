import { Outlet, NavLink } from 'react-router-dom';
import { Search, BookMarked, Download } from 'lucide-react';

export default function Layout() {
  return (
    <div className="flex flex-col h-screen w-full bg-gray-50 text-gray-900 overflow-hidden">
      <header className="bg-white border-b border-gray-200 px-4 py-3 flex justify-between items-center shrink-0">
        <h1 className="text-xl font-bold text-blue-600">My Library</h1>
        <NavLink 
          to="/import" 
          className={({ isActive }) => 
            `p-2 rounded-full ${isActive ? 'bg-blue-100 text-blue-600' : 'text-gray-500 hover:bg-gray-100'}`
          }
          title="Import Data"
        >
          <Download size={20} />
        </NavLink>
      </header>
      
      <main className="flex-1 overflow-y-auto w-full max-w-2xl mx-auto relative bg-white shadow-sm">
        <Outlet />
      </main>

      <nav className="bg-white border-t border-gray-200 shrink-0 pb-safe">
        <div className="flex justify-around items-center max-w-2xl mx-auto">
          <NavLink
            to="/"
            className={({ isActive }) =>
              `flex flex-col items-center justify-center w-full py-3 ${
                isActive ? 'text-blue-600' : 'text-gray-500 hover:text-blue-500'
              }`
            }
          >
            <Search size={24} />
            <span className="text-xs mt-1 font-medium">Search</span>
          </NavLink>
          <NavLink
            to="/library"
            className={({ isActive }) =>
              `flex flex-col items-center justify-center w-full py-3 ${
                isActive ? 'text-blue-600' : 'text-gray-500 hover:text-blue-500'
              }`
            }
          >
            <BookMarked size={24} />
            <span className="text-xs mt-1 font-medium">Library</span>
          </NavLink>
        </div>
      </nav>
    </div>
  );
}
