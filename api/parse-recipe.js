export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const { text } = req.body
  if (!text) return res.status(400).json({ error: 'No text provided' })

  const prompt = `Extract all recipes and their ingredients from the following text. There may be one or multiple recipes.

Return ONLY valid JSON as an array, nothing else:
[
  {
    "name": "Recipe Name",
    "description": "brief one-line description or empty string",
    "ingredients": [
      { "name": "ingredient name", "quantity": 1.5, "unit": "oz" }
    ]
  }
]

Rules:
- return an array even if there is only one recipe
- quantity must be a number (convert fractions like 1/2 to 0.5)
- unit must be one of: ml, oz, L, tsp, tbsp, cup, dash, barspoon, g, kg, pinch, each
- if no unit is specified, use "each"
- if quantity is not specified, use 1
- do not include instructions, just ingredients

Recipe text:
${text}`

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.1 },
        }),
      }
    )

    const data = await response.json()
    console.log('Gemini response:', JSON.stringify(data, null, 2))
    const raw = data.candidates?.[0]?.content?.parts?.[0]?.text || ''
    console.log('Raw text:', raw)

    // Strip markdown code fences and any leading/trailing non-JSON text
    let cleaned = raw
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/\s*```$/, '')
      .trim()

    // Extract just the JSON array or object if there's surrounding text
    const arrayMatch = cleaned.match(/(\[[\s\S]*\])/)
    const objectMatch = cleaned.match(/(\{[\s\S]*\})/)
    if (arrayMatch) cleaned = arrayMatch[1]
    else if (objectMatch) cleaned = objectMatch[1]

    if (!cleaned) throw new Error('Gemini returned no parseable content')

    const parsed = JSON.parse(cleaned)
    res.status(200).json(parsed)
  } catch (e) {
    res.status(500).json({ error: 'Failed to parse recipe: ' + e.message })
  }
}
