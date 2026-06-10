// All conversions relative to ml as the base unit
export const UNITS = ['ml', 'oz', 'L', 'tsp', 'tbsp', 'cup', 'dash', 'barspoon', 'g', 'kg', 'pinch', 'each']

const TO_ML = {
  ml: 1,
  oz: 29.5735,
  L: 1000,
  tsp: 4.92892,
  tbsp: 14.7868,
  cup: 236.588,
  dash: 0.6,
  barspoon: 5,
  pinch: 0.3,
  each: null, // non-liquid, no conversion
  g: null,    // weight, no liquid conversion
  kg: null,   // weight, no liquid conversion
}

// Weight units can convert among themselves
const WEIGHT_TO_G = {
  g: 1,
  kg: 1000,
}

const NON_CONVERTIBLE = new Set(['each', 'pinch'])
const WEIGHT_UNITS = new Set(['g', 'kg'])

export function canConvert(fromUnit, toUnit) {
  if (fromUnit === toUnit) return true
  if (NON_CONVERTIBLE.has(fromUnit) || NON_CONVERTIBLE.has(toUnit)) return false
  if (WEIGHT_UNITS.has(fromUnit) && WEIGHT_UNITS.has(toUnit)) return true
  if (WEIGHT_UNITS.has(fromUnit) || WEIGHT_UNITS.has(toUnit)) return false
  return TO_ML[fromUnit] != null && TO_ML[toUnit] != null
}

export function convert(quantity, fromUnit, toUnit) {
  if (fromUnit === toUnit) return quantity
  if (!canConvert(fromUnit, toUnit)) return quantity
  if (WEIGHT_UNITS.has(fromUnit) && WEIGHT_UNITS.has(toUnit)) {
    return quantity * WEIGHT_TO_G[fromUnit] / WEIGHT_TO_G[toUnit]
  }
  const inMl = quantity * TO_ML[fromUnit]
  return inMl / TO_ML[toUnit]
}

export function formatQuantity(value) {
  if (value == null || isNaN(value)) return '—'
  if (value < 0.1) return value.toFixed(2)
  if (value < 10) return parseFloat(value.toFixed(2)).toString()
  if (value < 100) return parseFloat(value.toFixed(1)).toString()
  return Math.round(value).toString()
}

// Given a scaled quantity, suggest the most readable unit in the same family
export function suggestUnit(quantity, unit) {
  if (NON_LIQUID.has(unit)) return unit
  const ml = convert(quantity, unit, 'ml')
  if (ml >= 500) return 'L'
  if (ml >= 30) return 'ml'
  if (ml < 1) return 'dash'
  return unit
}
