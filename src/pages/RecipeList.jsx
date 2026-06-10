import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function RecipeList() {
  const [recipes, setRecipes] = useState([])
  const [loading, setLoading] = useState(true)
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

  return (
    <div className="pb-safe">
      <header className="px-5 pt-8 pb-4">
        <h1 className="text-2xl font-bold tracking-tight">Recipes</h1>
        <p className="text-gray-400 text-sm mt-1">Tap a recipe to scale it</p>
      </header>

      {loading ? (
        <div className="flex items-center justify-center h-48 text-gray-500">Loading…</div>
      ) : recipes.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-48 text-gray-500 gap-2">
          <span className="text-4xl">🍹</span>
          <p className="text-sm">No recipes yet. Tap + to add one.</p>
        </div>
      ) : (
        <ul className="px-4 space-y-3">
          {recipes.map(r => (
            <li key={r.id}>
              <button
                onClick={() => navigate(`/recipes/${r.id}`)}
                className="w-full text-left bg-surface-800 rounded-2xl px-5 py-4 active:bg-surface-700 transition-colors"
              >
                <p className="font-semibold text-base">{r.name}</p>
                {r.description && (
                  <p className="text-gray-400 text-sm mt-0.5 line-clamp-1">{r.description}</p>
                )}
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
