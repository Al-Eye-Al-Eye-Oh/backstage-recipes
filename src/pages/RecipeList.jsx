import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function RecipeList() {
  const [recipes, setRecipes] = useState([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('recipes')
        .select('*')
        .order('created_at', { ascending: false })
      setRecipes(data || [])
      setLoading(false)
    }
    load()
  }, [])

  const filtered = recipes.filter(r =>
    r.name.toLowerCase().includes(query.toLowerCase())
  )

  return (
    <div className="pb-safe">
      <header className="px-5 pt-8 pb-4">
        <h1 className="text-2xl font-bold tracking-tight">Recipes</h1>
        <p className="text-gray-400 text-sm mt-1">Tap a recipe to scale it</p>
      </header>

      <div className="px-4 mb-4">
        <div className="flex items-center bg-surface-700 rounded-xl px-3 gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-gray-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
          </svg>
          <input
            type="search"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search recipes…"
            className="flex-1 bg-transparent py-3 text-white placeholder-gray-500 text-sm outline-none"
          />
          {query && (
            <button onClick={() => setQuery('')} className="text-gray-500 p-1">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48 text-gray-500">Loading…</div>
      ) : recipes.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-48 text-gray-500 gap-2">
          <span className="text-4xl">🍹</span>
          <p className="text-sm">No recipes yet. Tap + to add one.</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-48 text-gray-500 gap-2">
          <p className="text-sm">No recipes match "{query}"</p>
        </div>
      ) : (
        <ul className="px-4 space-y-3">
          {filtered.map(r => (
            <li key={r.id}>
              <button
                onClick={() => navigate(`/recipes/${r.id}`)}
                className="w-full text-left bg-surface-800 rounded-2xl px-5 py-4 active:bg-surface-700 transition-colors"
              >
                <p className="font-semibold text-base">{r.name}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {new Date(r.created_at).toLocaleDateString()}
                </p>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
