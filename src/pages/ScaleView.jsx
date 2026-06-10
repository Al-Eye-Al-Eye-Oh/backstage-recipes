import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { UNITS, convert, formatQuantity, canConvert } from '../lib/units'

export default function ScaleView() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [recipe, setRecipe] = useState(null)
  const [ingredients, setIngredients] = useState([])
  const [loading, setLoading] = useState(true)

  // Scaling state
  const [anchorId, setAnchorId] = useState(null)       // which ingredient we're scaling from
  const [anchorQty, setAnchorQty] = useState('')        // desired quantity of that ingredient
  const [anchorUnit, setAnchorUnit] = useState(null)    // unit for the anchor input

  // Per-ingredient display unit overrides
  const [unitOverrides, setUnitOverrides] = useState({})

  useEffect(() => {
    async function load() {
      const [{ data: r }, { data: ings }] = await Promise.all([
        supabase.from('recipes').select('*').eq('id', id).single(),
        supabase.from('ingredients').select('*').eq('recipe_id', id).order('position'),
      ])
      setRecipe(r)
      const ingList = ings || []
      setIngredients(ingList)
      if (ingList.length > 0) {
        setAnchorId(ingList[0].id)
        setAnchorUnit(ingList[0].unit)
      }
      setLoading(false)
    }
    load()
  }, [id])

  const anchor = ingredients.find(i => i.id === anchorId)

  // Compute scale factor from anchor ingredient
  const scaleFactor = (() => {
    if (!anchor || !anchorQty || isNaN(parseFloat(anchorQty))) return null
    const targetInBase = convert(parseFloat(anchorQty), anchorUnit, 'ml')
    const originalInBase = convert(anchor.quantity, anchor.unit, 'ml')
    if (originalInBase === 0) return null
    return targetInBase / originalInBase
  })()

  function scaledQty(ing) {
    if (scaleFactor == null) return null
    return ing.quantity * scaleFactor
  }

  function displayUnit(ing) {
    return unitOverrides[ing.id] || ing.unit
  }

  function displayQty(ing) {
    const sq = scaledQty(ing)
    if (sq == null) return null
    const unit = displayUnit(ing)
    if (unit !== ing.unit && canConvert(ing.unit, unit)) {
      return convert(sq, ing.unit, unit)
    }
    return sq
  }

  function setUnitOverride(ingId, unit) {
    setUnitOverrides(prev => ({ ...prev, [ingId]: unit }))
  }

  function handleAnchorChange(ingId) {
    const ing = ingredients.find(i => i.id === ingId)
    setAnchorId(ingId)
    setAnchorUnit(ing.unit)
    setAnchorQty('')
  }

  function copyToClipboard() {
    if (scaleFactor == null) return
    const lines = [
      `${recipe.name} — scaled`,
      '',
      ...ingredients.map(ing => {
        const qty = displayQty(ing)
        const unit = displayUnit(ing)
        return `${formatQuantity(qty)} ${unit}  ${ing.name}`
      })
    ]
    navigator.clipboard.writeText(lines.join('\n'))
  }

  if (loading) return <div className="flex items-center justify-center h-screen text-gray-500">Loading…</div>

  return (
    <div className="pb-safe">
      <header className="flex items-center gap-3 px-4 pt-8 pb-4">
        <button onClick={() => navigate(`/recipes/${id}`)} className="p-2 -ml-2 text-gray-400">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="text-xl font-bold flex-1">Scale: {recipe?.name}</h1>
        {scaleFactor != null && (
          <button onClick={copyToClipboard} className="text-brand-500 text-sm font-medium px-2 py-1">
            Copy
          </button>
        )}
      </header>

      {/* Anchor selector */}
      <div className="px-4 mb-5 space-y-3">
        <p className="text-sm text-gray-400 font-medium">Scale from ingredient</p>
        <div className="bg-surface-800 rounded-2xl p-4 space-y-3">
          <select
            value={anchorId || ''}
            onChange={e => handleAnchorChange(parseInt(e.target.value))}
            className="w-full bg-surface-700 rounded-xl px-3 py-2.5 text-white text-sm outline-none focus:ring-2 focus:ring-brand-500"
          >
            {ingredients.map(ing => (
              <option key={ing.id} value={ing.id}>{ing.name} (original: {ing.quantity} {ing.unit})</option>
            ))}
          </select>

          <div className="flex gap-2">
            <input
              type="number"
              inputMode="decimal"
              value={anchorQty}
              onChange={e => setAnchorQty(e.target.value)}
              placeholder="Target amount"
              className="flex-1 bg-surface-700 rounded-xl px-3 py-2.5 text-white placeholder-gray-500 text-sm outline-none focus:ring-2 focus:ring-brand-500"
            />
            <select
              value={anchorUnit || ''}
              onChange={e => setAnchorUnit(e.target.value)}
              className="w-28 bg-surface-700 rounded-xl px-3 py-2.5 text-white text-sm outline-none focus:ring-2 focus:ring-brand-500"
            >
              {UNITS.filter(u => anchor ? canConvert(anchor.unit, u) || u === anchor.unit : true).map(u => (
                <option key={u} value={u}>{u}</option>
              ))}
            </select>
          </div>

          {scaleFactor != null && (
            <p className="text-center text-xs text-gray-500">
              Scale factor: <span className="text-brand-500 font-semibold">{formatQuantity(scaleFactor)}×</span>
            </p>
          )}
        </div>
      </div>

      {/* Scaled ingredients */}
      <div className="px-4 space-y-2">
        <p className="text-sm text-gray-400 font-medium mb-3">Scaled quantities</p>
        {ingredients.map(ing => {
          const qty = displayQty(ing)
          const unit = displayUnit(ing)
          const isAnchor = ing.id === anchorId

          return (
            <div
              key={ing.id}
              className={`rounded-2xl px-4 py-3.5 flex items-center justify-between gap-3 ${isAnchor ? 'bg-brand-500/10 border border-brand-500/30' : 'bg-surface-800'}`}
            >
              <span className={`flex-1 text-sm ${isAnchor ? 'text-brand-500 font-medium' : 'text-white'}`}>
                {ing.name}
              </span>

              <div className="flex items-center gap-2 shrink-0">
                <span className="font-mono text-sm text-white w-16 text-right">
                  {qty != null ? formatQuantity(qty) : <span className="text-gray-600">{ing.quantity}</span>}
                </span>
                <select
                  value={unit}
                  onChange={e => setUnitOverride(ing.id, e.target.value)}
                  className="bg-surface-700 rounded-lg px-2 py-1 text-gray-300 text-xs outline-none focus:ring-2 focus:ring-brand-500"
                >
                  {UNITS.filter(u => canConvert(ing.unit, u) || u === ing.unit).map(u => (
                    <option key={u} value={u}>{u}</option>
                  ))}
                </select>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
