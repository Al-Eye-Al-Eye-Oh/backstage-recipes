import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import * as pdfjsLib from 'pdfjs-dist'
import { supabase } from '../lib/supabase'
import { UNITS } from '../lib/units'

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).toString()

const STEPS = { idle: 'idle', extracting: 'extracting', parsing: 'parsing', review: 'review', saving: 'saving', done: 'done' }

function normalizeRecipes(parsed) {
  const arr = Array.isArray(parsed) ? parsed : [parsed]
  return arr.map(r => ({
    name: r.name || '',
    description: r.description || '',
    ingredients: (r.ingredients || []).map(i => ({
      name: i.name,
      quantity: String(i.quantity),
      unit: UNITS.includes(i.unit) ? i.unit : 'each',
    })),
  }))
}

export default function ImportRecipe() {
  const navigate = useNavigate()
  const fileRef = useRef()

  const [step, setStep] = useState(STEPS.idle)
  const [error, setError] = useState(null)

  // All parsed recipes
  const [recipes, setRecipes] = useState([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [savedCount, setSavedCount] = useState(0)

  // Editable fields for current recipe
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [ingredients, setIngredients] = useState([])

  function loadRecipeIntoForm(recipe) {
    setName(recipe.name)
    setDescription(recipe.description)
    setIngredients(recipe.ingredients)
  }

  async function handleFile(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setError(null)

    try {
      setStep(STEPS.extracting)
      const arrayBuffer = await file.arrayBuffer()
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise
      const pages = await Promise.all(
        Array.from({ length: pdf.numPages }, (_, i) =>
          pdf.getPage(i + 1).then(p => p.getTextContent()).then(tc => tc.items.map(i => i.str).join(' '))
        )
      )
      const text = pages.join('\n')

      setStep(STEPS.parsing)
      const res = await fetch('/api/parse-recipe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      })
      if (!res.ok) throw new Error((await res.json()).error || 'Parse failed')
      const parsed = await res.json()

      const normalized = normalizeRecipes(parsed)
      setRecipes(normalized)
      setCurrentIndex(0)
      setSavedCount(0)
      loadRecipeIntoForm(normalized[0])
      setStep(STEPS.review)
    } catch (e) {
      setError(e.message)
      setStep(STEPS.idle)
    }
  }

  function updateIngredient(index, field, value) {
    setIngredients(prev => prev.map((ing, i) => i === index ? { ...ing, [field]: value } : ing))
  }

  function removeIngredient(index) {
    setIngredients(prev => prev.filter((_, i) => i !== index))
  }

  function addIngredient() {
    setIngredients(prev => [...prev, { name: '', quantity: '', unit: 'oz' }])
  }

  async function handleSave() {
    if (!name.trim()) { setError('Recipe name is required'); return }
    const valid = ingredients.filter(i => i.name.trim() && i.quantity !== '')
    if (!valid.length) { setError('Add at least one ingredient'); return }

    setStep(STEPS.saving)
    setError(null)
    try {
      const { data: recipe, error: rErr } = await supabase
        .from('recipes')
        .insert({ name: name.trim(), description: description.trim() })
        .select().single()
      if (rErr) throw rErr

      const rows = valid.map((ing, position) => ({
        recipe_id: recipe.id,
        name: ing.name.trim(),
        quantity: parseFloat(ing.quantity),
        unit: ing.unit,
        position,
      }))
      const { error: iErr } = await supabase.from('ingredients').insert(rows)
      if (iErr) throw iErr

      const newSavedCount = savedCount + 1
      setSavedCount(newSavedCount)

      const nextIndex = currentIndex + 1
      if (nextIndex < recipes.length) {
        setCurrentIndex(nextIndex)
        loadRecipeIntoForm(recipes[nextIndex])
        setStep(STEPS.review)
      } else {
        setStep(STEPS.done)
      }
    } catch (e) {
      setError(e.message)
      setStep(STEPS.review)
    }
  }

  function handleSkip() {
    const nextIndex = currentIndex + 1
    if (nextIndex < recipes.length) {
      setCurrentIndex(nextIndex)
      loadRecipeIntoForm(recipes[nextIndex])
    } else {
      setStep(STEPS.done)
    }
  }

  const busy = step === STEPS.extracting || step === STEPS.parsing || step === STEPS.saving
  const statusLabel = {
    [STEPS.extracting]: 'Reading PDF…',
    [STEPS.parsing]: 'Parsing recipes…',
    [STEPS.saving]: 'Saving…',
  }[step]

  return (
    <div className="pb-safe">
      <header className="flex items-center gap-3 px-4 pt-8 pb-4">
        <button onClick={() => navigate('/recipes')} className="p-2 -ml-2 text-gray-400">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="text-xl font-bold flex-1">Import from PDF</h1>
      </header>

      <div className="px-4 space-y-4">
        {error && <p className="text-red-400 text-sm bg-red-950 rounded-xl px-4 py-3">{error}</p>}

        {/* Idle: upload prompt */}
        {step === STEPS.idle && (
          <button
            onClick={() => fileRef.current.click()}
            className="w-full border-2 border-dashed border-surface-600 rounded-2xl py-12 flex flex-col items-center gap-3 text-gray-400 active:bg-surface-800 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span className="text-sm font-medium">Tap to upload a PDF</span>
            <span className="text-xs text-gray-500">Single or multi-recipe PDFs supported</span>
          </button>
        )}

        {/* Loading spinner */}
        {busy && (
          <div className="flex flex-col items-center justify-center py-16 gap-4 text-gray-400">
            <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm">{statusLabel}</p>
          </div>
        )}

        {/* Done state */}
        {step === STEPS.done && (
          <div className="flex flex-col items-center justify-center py-16 gap-4">
            <span className="text-5xl">🍹</span>
            <p className="text-white font-semibold text-lg">All done!</p>
            <p className="text-gray-400 text-sm">{savedCount} recipe{savedCount !== 1 ? 's' : ''} saved</p>
            <button
              onClick={() => navigate('/recipes')}
              className="mt-2 bg-brand-500 active:bg-brand-600 rounded-2xl px-8 py-3 text-white font-semibold"
            >
              View Recipes
            </button>
            <button
              onClick={() => { setStep(STEPS.idle); setError(null); fileRef.current.value = '' }}
              className="text-gray-400 text-sm py-2"
            >
              Import another PDF
            </button>
          </div>
        )}

        {/* Review form */}
        {step === STEPS.review && (
          <div className="space-y-4">
            {/* Progress indicator */}
            {recipes.length > 1 && (
              <div className="flex items-center justify-between">
                <p className="text-sm text-brand-500 font-medium">
                  Recipe {currentIndex + 1} of {recipes.length}
                </p>
                <div className="flex gap-1">
                  {recipes.map((_, i) => (
                    <div
                      key={i}
                      className={`h-1.5 w-6 rounded-full transition-colors ${i < currentIndex ? 'bg-green-500' : i === currentIndex ? 'bg-brand-500' : 'bg-surface-600'}`}
                    />
                  ))}
                </div>
              </div>
            )}

            <p className="text-sm text-green-400 bg-green-950 rounded-xl px-4 py-3">
              {recipes.length > 1
                ? `Found ${recipes.length} recipes — review and save each one.`
                : 'Recipe parsed — review and edit before saving.'}
            </p>

            <div className="space-y-2">
              <label className="text-sm text-gray-400 font-medium">Recipe Name</label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full bg-surface-700 rounded-xl px-4 py-3 text-white text-base outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm text-gray-400 font-medium">Description <span className="text-gray-600">(optional)</span></label>
              <input
                type="text"
                value={description}
                onChange={e => setDescription(e.target.value)}
                className="w-full bg-surface-700 rounded-xl px-4 py-3 text-white text-base outline-none focus:ring-2 focus:ring-brand-500"
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
                    <button onClick={() => removeIngredient(i)} className="text-gray-500 p-1 shrink-0">
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
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
                className="w-full border border-dashed border-surface-600 rounded-2xl py-3 text-gray-400 text-sm active:bg-surface-800"
              >
                + Add Ingredient
              </button>
            </div>

            <button
              onClick={handleSave}
              className="w-full bg-brand-500 active:bg-brand-600 rounded-2xl py-4 text-white font-semibold text-base transition-colors"
            >
              {currentIndex < recipes.length - 1 ? 'Save & Next →' : 'Save Recipe'}
            </button>

            {recipes.length > 1 && (
              <button
                onClick={handleSkip}
                className="w-full text-gray-400 text-sm py-2"
              >
                Skip this recipe
              </button>
            )}

            <button
              onClick={() => { setStep(STEPS.idle); setError(null); fileRef.current.value = '' }}
              className="w-full text-gray-600 text-xs py-1"
            >
              Upload a different PDF
            </button>
          </div>
        )}

        <input ref={fileRef} type="file" accept="application/pdf" className="hidden" onChange={handleFile} />
      </div>
    </div>
  )
}
