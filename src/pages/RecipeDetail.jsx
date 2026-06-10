import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function RecipeDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [recipe, setRecipe] = useState(null)
  const [ingredients, setIngredients] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const [{ data: r }, { data: ings }] = await Promise.all([
        supabase.from('recipes').select('*').eq('id', id).single(),
        supabase.from('ingredients').select('*').eq('recipe_id', id).order('position'),
      ])
      setRecipe(r)
      setIngredients(ings || [])
      setLoading(false)
    }
    load()
  }, [id])

  if (loading) return <div className="flex items-center justify-center h-screen text-gray-500">Loading…</div>
  if (!recipe) return <div className="flex items-center justify-center h-screen text-gray-500">Recipe not found</div>

  return (
    <div className="pb-safe">
      <header className="flex items-center gap-3 px-4 pt-8 pb-4">
        <button onClick={() => navigate('/recipes')} className="p-2 -ml-2 text-gray-400">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div className="flex-1">
          <h1 className="text-xl font-bold">{recipe.name}</h1>
          {recipe.description && <p className="text-gray-400 text-sm">{recipe.description}</p>}
        </div>
        <button onClick={() => navigate(`/recipes/${id}/edit`)} className="text-brand-500 text-sm font-medium px-2 py-1">
          Edit
        </button>
      </header>

      <div className="px-4 space-y-2 mb-6">
        {ingredients.map(ing => (
          <div key={ing.id} className="bg-surface-800 rounded-2xl px-5 py-3.5 flex items-center justify-between">
            <span className="text-white">{ing.name}</span>
            <span className="text-gray-300 font-mono">
              {ing.quantity} <span className="text-gray-500 text-sm">{ing.unit}</span>
            </span>
          </div>
        ))}
      </div>

      {recipe.notes && (
        <div className="px-4 mb-6">
          <p className="text-sm text-gray-400 font-medium mb-2">Notes</p>
          <div className="bg-surface-800 rounded-2xl px-5 py-4">
            <p className="text-gray-300 text-sm whitespace-pre-wrap leading-relaxed">{recipe.notes}</p>
          </div>
        </div>
      )}

      <div className="px-4">
        <button
          onClick={() => navigate(`/recipes/${id}/scale`)}
          className="w-full bg-brand-500 active:bg-brand-600 rounded-2xl py-4 text-white font-semibold text-base transition-colors"
        >
          Scale This Recipe
        </button>
      </div>
    </div>
  )
}
