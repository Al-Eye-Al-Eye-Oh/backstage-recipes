import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { UNITS } from '../lib/units'

const emptyIngredient = () => ({ name: '', quantity: '', unit: 'oz' })

export default function RecipeForm() {
  const { id } = useParams()
  const isEdit = Boolean(id)
  const navigate = useNavigate()

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [notes, setNotes] = useState('')
  const [ingredients, setIngredients] = useState([emptyIngredient()])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!isEdit) return
    async function load() {
      const { data: recipe } = await supabase.from('recipes').select('*').eq('id', id).single()
      const { data: ings } = await supabase.from('ingredients').select('*').eq('recipe_id', id).order('position')
      if (recipe) { setName(recipe.name); setDescription(recipe.description || ''); setNotes(recipe.notes || '') }
      if (ings?.length) setIngredients(ings.map(i => ({ id: i.id, name: i.name, quantity: String(i.quantity), unit: i.unit })))
    }
    load()
  }, [id, isEdit])

  function updateIngredient(index, field, value) {
    setIngredients(prev => prev.map((ing, i) => i === index ? { ...ing, [field]: value } : ing))
  }

  function addIngredient() {
    setIngredients(prev => [...prev, emptyIngredient()])
  }

  function removeIngredient(index) {
    setIngredients(prev => prev.filter((_, i) => i !== index))
  }

  async function handleSave() {
    if (!name.trim()) { setError('Recipe name is required'); return }
    const validIngs = ingredients.filter(i => i.name.trim() && i.quantity !== '')
    if (validIngs.length === 0) { setError('Add at least one ingredient'); return }

    setSaving(true)
    setError(null)

    try {
      let recipeId = id
      if (isEdit) {
        await supabase.from('recipes').update({ name: name.trim(), description: description.trim(), notes: notes.trim() }).eq('id', id)
        await supabase.from('ingredients').delete().eq('recipe_id', id)
      } else {
        const { data, error: err } = await supabase
          .from('recipes')
          .insert({ name: name.trim(), description: description.trim(), notes: notes.trim() })
          .select()
          .single()
        if (err) throw err
        recipeId = data.id
      }

      const rows = validIngs.map((ing, position) => ({
        recipe_id: recipeId,
        name: ing.name.trim(),
        quantity: parseFloat(ing.quantity),
        unit: ing.unit,
        position,
      }))
      const { error: ingErr } = await supabase.from('ingredients').insert(rows)
      if (ingErr) throw ingErr

      navigate(`/recipes/${recipeId}`)
    } catch (e) {
      setError(e.message)
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!window.confirm('Delete this recipe?')) return
    await supabase.from('ingredients').delete().eq('recipe_id', id)
    await supabase.from('recipes').delete().eq('id', id)
    navigate('/recipes')
  }

  return (
    <div className="pb-safe">
      <header className="flex items-center gap-3 px-4 pt-8 pb-4">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-gray-400">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="text-xl font-bold flex-1">{isEdit ? 'Edit Recipe' : 'New Recipe'}</h1>
        {isEdit && (
          <button onClick={handleDelete} className="text-red-400 text-sm font-medium px-2 py-1">
            Delete
          </button>
        )}
      </header>

      <div className="px-4 space-y-4">
        {error && <p className="text-red-400 text-sm bg-red-950 rounded-xl px-4 py-3">{error}</p>}

        <div className="space-y-2">
          <label className="text-sm text-gray-400 font-medium">Recipe Name</label>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="e.g. Batch Negroni"
            className="w-full bg-surface-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 text-base outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm text-gray-400 font-medium">Description <span className="text-gray-600">(optional)</span></label>
          <input
            type="text"
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="e.g. 10-serving batch, stirred"
            className="w-full bg-surface-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 text-base outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>

        <div className="space-y-3">
          <label className="text-sm text-gray-400 font-medium">Ingredients</label>

          {ingredients.map((ing, i) => (
            <div key={i} className="bg-surface-800 rounded-2xl p-3 space-y-2">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={ing.name}
                  onChange={e => updateIngredient(i, 'name', e.target.value)}
                  placeholder="Ingredient name"
                  className="flex-1 bg-surface-700 rounded-xl px-3 py-2.5 text-white placeholder-gray-500 text-sm outline-none focus:ring-2 focus:ring-brand-500"
                />
                {ingredients.length > 1 && (
                  <button onClick={() => removeIngredient(i)} className="text-gray-500 p-1 shrink-0">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
              <div className="flex gap-2">
                <input
                  type="number"
                  inputMode="decimal"
                  value={ing.quantity}
                  onChange={e => updateIngredient(i, 'quantity', e.target.value)}
                  placeholder="Amount"
                  className="w-28 bg-surface-700 rounded-xl px-3 py-2.5 text-white placeholder-gray-500 text-sm outline-none focus:ring-2 focus:ring-brand-500"
                />
                <select
                  value={ing.unit}
                  onChange={e => updateIngredient(i, 'unit', e.target.value)}
                  className="flex-1 bg-surface-700 rounded-xl px-3 py-2.5 text-white text-sm outline-none focus:ring-2 focus:ring-brand-500"
                >
                  {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                </select>
              </div>
            </div>
          ))}

          <button
            onClick={addIngredient}
            className="w-full border border-dashed border-surface-600 rounded-2xl py-3 text-gray-400 text-sm active:bg-surface-800 transition-colors"
          >
            + Add Ingredient
          </button>
        </div>

        <div className="space-y-2">
          <label className="text-sm text-gray-400 font-medium">Notes <span className="text-gray-600">(optional)</span></label>
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="e.g. Stir 60 sec over ice, strain into growler. Keeps refrigerated for 2 weeks."
            rows={4}
            className="w-full bg-surface-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 text-sm outline-none focus:ring-2 focus:ring-brand-500 resize-none"
          />
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full bg-brand-500 active:bg-brand-600 rounded-2xl py-4 text-white font-semibold text-base transition-colors disabled:opacity-50 mt-2"
        >
          {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Recipe'}
        </button>
      </div>
    </div>
  )
}
