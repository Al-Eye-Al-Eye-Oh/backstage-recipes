import { NavLink } from 'react-router-dom'

export default function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-surface-800 border-t border-surface-600 flex"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
      <NavLink
        to="/recipes"
        className={({ isActive }) =>
          `flex-1 flex flex-col items-center py-3 text-xs gap-1 transition-colors ${isActive ? 'text-brand-500' : 'text-gray-400'}`
        }
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
        Recipes
      </NavLink>
      <NavLink
        to="/recipes/new"
        className={({ isActive }) =>
          `flex-1 flex flex-col items-center py-3 text-xs gap-1 transition-colors ${isActive ? 'text-brand-500' : 'text-gray-400'}`
        }
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
        </svg>
        New Recipe
      </NavLink>
      <NavLink
        to="/import"
        className={({ isActive }) =>
          `flex-1 flex flex-col items-center py-3 text-xs gap-1 transition-colors ${isActive ? 'text-brand-500' : 'text-gray-400'}`
        }
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        Import PDF
      </NavLink>
    </nav>
  )
}
