import axios, { AxiosError } from 'axios'

const client = axios.create({
  baseURL: '/api',
  timeout: 10_000,
})

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ColorSwatch {
  hex: string
  name: string
}

export interface Location {
  continent: string
  country: string
  city: string
}

export interface Garment {
  id: string
  imageUrl: string
  thumbnail: string
  garment_type: string
  style: string
  material: string
  color_palette: ColorSwatch[]
  pattern: string
  season: string
  occasion: string
  consumer_profile: string
  trend_notes: string
  location: Location
  description: string
  designer?: string
  tags?: string[]
  notes?: string[]
}

export interface FilterOptions {
  garment_type: string[]
  style: string[]
  material: string[]
  color_palette: string[]
  pattern: string[]
  season: string[]
  occasion: string[]
  continent: string[]
  country: string[]
  city: string[]
  designer: string[]
}

export interface SearchParams {
  q?: string
  garment_type?: string
  style?: string
  material?: string
  color_palette?: string
  pattern?: string
  season?: string
  occasion?: string
  continent?: string
  country?: string
  city?: string
  designer?: string
}

// ─── Mock Data ────────────────────────────────────────────────────────────────

const MOCK_GARMENTS: Garment[] = [
  {
    id: '1',
    imageUrl: 'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?w=800',
    thumbnail: 'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?w=400',
    garment_type: 'Dress',
    style: 'Bohemian',
    material: 'Cotton',
    color_palette: [{ hex: '#E8C99A', name: 'Sand' }, { hex: '#8B6F5E', name: 'Mocha' }],
    pattern: 'Floral',
    season: 'Spring',
    occasion: 'Casual',
    consumer_profile: 'Young women 20–35 seeking expressive, artisan-inspired fashion',
    trend_notes: 'Artisan market revival; handcrafted embroidery trending in SS24',
    location: { continent: 'South America', country: 'Peru', city: 'Cusco' },
    description: 'A flowing bohemian cotton dress with hand-embroidered floral motifs, inspired by Andean textile traditions.',
    designer: 'Inca Roots Studio',
    tags: ['boho', 'embroidery', 'artisan'],
  },
  {
    id: '2',
    imageUrl: 'https://images.unsplash.com/photo-1552902865-b72c031ac5ea?w=800',
    thumbnail: 'https://images.unsplash.com/photo-1552902865-b72c031ac5ea?w=400',
    garment_type: 'Jacket',
    style: 'Streetwear',
    material: 'Nylon',
    color_palette: [{ hex: '#1A1A2E', name: 'Midnight' }, { hex: '#E94560', name: 'Neon Red' }],
    pattern: 'Colorblock',
    season: 'Autumn',
    occasion: 'Urban',
    consumer_profile: 'Gen Z streetwear enthusiasts, 16–28',
    trend_notes: 'Techwear crossover; oversized silhouettes dominating AW24 collections',
    location: { continent: 'Asia', country: 'Japan', city: 'Tokyo' },
    description: 'Oversized streetwear jacket in technical nylon with bold colorblock paneling and utility pockets.',
    designer: 'NXTGEN Tokyo',
    tags: ['streetwear', 'oversized', 'techwear'],
  },
  {
    id: '3',
    imageUrl: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=800',
    thumbnail: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=400',
    garment_type: 'Blouse',
    style: 'Minimalist',
    material: 'Silk',
    color_palette: [{ hex: '#F5F0EB', name: 'Ivory' }, { hex: '#C9B8A8', name: 'Warm Taupe' }],
    pattern: 'Solid',
    season: 'All Season',
    occasion: 'Business Casual',
    consumer_profile: 'Professional women 28–45 seeking versatile wardrobe essentials',
    trend_notes: 'Quiet luxury movement; investment pieces in neutral tones',
    location: { continent: 'Europe', country: 'France', city: 'Paris' },
    description: 'Fluid silk blouse with draped neckline in warm ivory — the cornerstone of a quiet luxury capsule wardrobe.',
    designer: 'Maison Calme',
    tags: ['minimal', 'silk', 'quiet luxury'],
  },
  {
    id: '4',
    imageUrl: 'https://images.unsplash.com/photo-1475180429745-4b8c9c78e0a0?w=800',
    thumbnail: 'https://images.unsplash.com/photo-1475180429745-4b8c9c78e0a0?w=400',
    garment_type: 'Coat',
    style: 'Classic',
    material: 'Wool',
    color_palette: [{ hex: '#3C3C3C', name: 'Charcoal' }, { hex: '#F0ECE3', name: 'Cream' }],
    pattern: 'Houndstooth',
    season: 'Winter',
    occasion: 'Formal',
    consumer_profile: 'Discerning professionals 30–55 valuing heritage craftsmanship',
    trend_notes: 'Heritage revival; British tailoring codes resurfacing across luxury houses',
    location: { continent: 'Europe', country: 'UK', city: 'London' },
    description: 'Double-breasted wool coat in classic houndstooth, tailored in the tradition of Savile Row craftsmanship.',
    designer: 'Aldwych Heritage',
    tags: ['classic', 'tailored', 'wool'],
  },
  {
    id: '5',
    imageUrl: 'https://images.unsplash.com/photo-1596703263926-eb0762ee17e4?w=800',
    thumbnail: 'https://images.unsplash.com/photo-1596703263926-eb0762ee17e4?w=400',
    garment_type: 'Kaftan',
    style: 'Resort',
    material: 'Linen',
    color_palette: [{ hex: '#2E86AB', name: 'Aegean' }, { hex: '#F6AE2D', name: 'Saffron' }],
    pattern: 'Geometric',
    season: 'Summer',
    occasion: 'Beach',
    consumer_profile: 'Affluent travellers 35–55 seeking resort-ready statement pieces',
    trend_notes: 'Destination dressing; Mediterranean colour stories dominating resort collections',
    location: { continent: 'Africa', country: 'Morocco', city: 'Marrakech' },
    description: 'Loose linen kaftan with hand-blocked geometric print in Aegean and saffron — resort-ready Mediterranean dressing.',
    designer: 'Souk Stories',
    tags: ['resort', 'linen', 'boho'],
  },
  {
    id: '6',
    imageUrl: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=800',
    thumbnail: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=400',
    garment_type: 'Jumpsuit',
    style: 'Contemporary',
    material: 'Crepe',
    color_palette: [{ hex: '#4A0E5C', name: 'Plum' }],
    pattern: 'Solid',
    season: 'Spring',
    occasion: 'Evening',
    consumer_profile: 'Fashion-forward women 25–40 seeking bold evening dressing',
    trend_notes: 'Power dressing reloaded; monochromatic suiting and jumpsuits surging in SS24',
    location: { continent: 'North America', country: 'USA', city: 'New York' },
    description: 'Wide-leg crepe jumpsuit in deep plum with cinched waist and statement lapels — confident evening dressing.',
    designer: 'Studio Volta',
    tags: ['jumpsuit', 'evening', 'contemporary'],
  },
  {
    id: '7',
    imageUrl: 'https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=800',
    thumbnail: 'https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=400',
    garment_type: 'Skirt',
    style: 'Folk',
    material: 'Cotton',
    color_palette: [{ hex: '#C0392B', name: 'Crimson' }, { hex: '#F1C40F', name: 'Gold' }, { hex: '#27AE60', name: 'Emerald' }],
    pattern: 'Embroidered',
    season: 'All Season',
    occasion: 'Festival',
    consumer_profile: 'Cultural fashion enthusiasts 20–45 drawn to global craft traditions',
    trend_notes: 'Global craft tourism influencing mainstream; embroidered folk pieces crossing over',
    location: { continent: 'Europe', country: 'Mexico', city: 'Oaxaca' },
    description: 'Tiered cotton skirt with vivid hand-embroidered folk motifs in crimson, gold and emerald, from Oaxacan artisans.',
    designer: 'Colores Oaxaca',
    tags: ['folk', 'embroidery', 'festival'],
  },
  {
    id: '8',
    imageUrl: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=800',
    thumbnail: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=400',
    garment_type: 'Blazer',
    style: 'Androgynous',
    material: 'Linen',
    color_palette: [{ hex: '#BDB5A6', name: 'Stone' }],
    pattern: 'Solid',
    season: 'Spring',
    occasion: 'Smart Casual',
    consumer_profile: 'Gender-fluid fashion consumers 22–38 valuing versatile tailoring',
    trend_notes: 'Genderless tailoring mainstream; unisex linen suiting key SS24 story',
    location: { continent: 'Europe', country: 'Italy', city: 'Milan' },
    description: 'Unstructured linen blazer in warm stone — gender-neutral Italian tailoring for the modern wardrobe.',
    designer: 'Forma Libera',
    tags: ['tailored', 'linen', 'androgynous'],
  },
]

const MOCK_FILTERS: FilterOptions = {
  garment_type: ['Dress', 'Jacket', 'Blouse', 'Coat', 'Kaftan', 'Jumpsuit', 'Skirt', 'Blazer'],
  style: ['Bohemian', 'Streetwear', 'Minimalist', 'Classic', 'Resort', 'Contemporary', 'Folk', 'Androgynous'],
  material: ['Cotton', 'Nylon', 'Silk', 'Wool', 'Linen', 'Crepe'],
  color_palette: ['Sand', 'Midnight', 'Ivory', 'Charcoal', 'Aegean', 'Plum', 'Crimson', 'Stone'],
  pattern: ['Floral', 'Colorblock', 'Solid', 'Houndstooth', 'Geometric', 'Embroidered'],
  season: ['Spring', 'Summer', 'Autumn', 'Winter', 'All Season'],
  occasion: ['Casual', 'Urban', 'Business Casual', 'Formal', 'Beach', 'Evening', 'Festival', 'Smart Casual'],
  continent: ['Africa', 'Asia', 'Europe', 'North America', 'South America'],
  country: ['Peru', 'Japan', 'France', 'UK', 'Morocco', 'USA', 'Mexico', 'Italy'],
  city: ['Cusco', 'Tokyo', 'Paris', 'London', 'Marrakech', 'New York', 'Oaxaca', 'Milan'],
  designer: ['Inca Roots Studio', 'NXTGEN Tokyo', 'Maison Calme', 'Aldwych Heritage', 'Souk Stories', 'Studio Volta', 'Colores Oaxaca', 'Forma Libera'],
}

// ─── API helpers ──────────────────────────────────────────────────────────────

function isMockMode(err: unknown): boolean {
  if (!(err instanceof AxiosError)) return false   // JS errors must surface, not fall back to mock
  return !err.response || err.code === 'ECONNREFUSED' || err.response.status === 503
}

/**
 * Curated colour-name → hex map for the most common AI-extracted palette names.
 * Keys are lowercase; matching is case-insensitive with a partial-substring
 * fallback so "dusty rose" still hits "rose".
 */
const COLOR_MAP: Record<string, string> = {
  // Neutrals
  white: '#FFFFFF', ivory: '#FFFFF0', cream: '#FFFDD0', off_white: '#FAF9F6',
  beige: '#F5F5DC', sand: '#E8C99A', linen: '#FAF0E6', parchment: '#F1E9D2',
  oatmeal: '#E8DCC8', stone: '#BDB5A6', taupe: '#B09080', warm_taupe: '#C9B8A8',
  mushroom: '#A8998A', greige: '#C4B9A8', ecru: '#C2B280',
  silver: '#C0C0C0', grey: '#808080', gray: '#808080', charcoal: '#3C3C3C',
  slate: '#708090', ash: '#B2BEB5', pewter: '#96A8A1',
  black: '#0A0A0A',
  // Browns
  tan: '#D2B48C', camel: '#C19A6B', mocha: '#8B6F5E', chocolate: '#7B3F00',
  espresso: '#4B2E2E', brown: '#A52A2A', rust: '#B7410E', terracotta: '#E2725B',
  sienna: '#A0522D', tobacco: '#7A5230', cognac: '#9A4C28',
  // Reds & Pinks
  red: '#E53935', crimson: '#DC143C', scarlet: '#FF2400', burgundy: '#800020',
  wine: '#722F37', maroon: '#800000', rose: '#FF007F', dusty_rose: '#DCAE96',
  blush: '#FFB6C1', pink: '#FFC0CB', hot_pink: '#FF69B4', fuchsia: '#FF00FF',
  coral: '#FF6B6B', salmon: '#FA8072', flamingo: '#FC8EAC',
  // Oranges & Yellows
  orange: '#FF8C00', amber: '#FFBF00', saffron: '#F6AE2D', mustard: '#FFDB58',
  gold: '#FFD700', yellow: '#FFE066', lemon: '#FFF44F', butter: '#FFFACD',
  ochre: '#CC7722', turmeric: '#C8962E',
  // Greens
  green: '#2E7D32', emerald: '#50C878', sage: '#8FAE88', olive: '#808000',
  moss: '#8A9A5B', forest: '#228B22', lime: '#AEEA00', mint: '#98FF98',
  jade: '#00A86B', teal: '#008080', seafoam: '#93E9BE', hunter: '#355E3B',
  avocado: '#568203', pistachio: '#93C572',
  // Blues
  blue: '#1565C0', navy: '#001F5B', midnight: '#1A1A2E', cobalt: '#0047AB',
  royal: '#4169E1', sky: '#87CEEB', baby_blue: '#89CFF0', powder: '#B0E0E6',
  aegean: '#2E86AB', cerulean: '#007BA7', indigo: '#4B0082', denim: '#1560BD',
  steel: '#4682B4', french: '#0072BB', periwinkle: '#CCCCFF',
  // Purples
  purple: '#7B1FA2', violet: '#7F00FF', lavender: '#E6E6FA', lilac: '#C8A2C8',
  mauve: '#E0B0FF', plum: '#4A0E5C', eggplant: '#614051', orchid: '#DA70D6',
  amethyst: '#9966CC', grape: '#6F2DA8',
  // Earth tones
  clay: '#BD8269', adobe: '#CC6600', brick: '#CB4154', pumpkin: '#FF7518',
}

/**
 * Resolve a human-readable colour name to a hex string.
 * Strategy:
 *   1. Exact match after normalisation (lowercase, spaces→underscore)
 *   2. Partial-word match — first token of the name that hits the map
 *   3. Deterministic HSL hash so every unknown name still gets a
 *      consistent, visually distinct colour rather than grey.
 */
function resolveColorHex(name: string): string {
  const key = name.toLowerCase().replace(/\s+/g, '_')

  // 1. Exact
  if (COLOR_MAP[key]) return COLOR_MAP[key]

  // 2. Partial — check each word in the name
  const words = key.split('_')
  for (const word of words) {
    if (COLOR_MAP[word]) return COLOR_MAP[word]
  }
  // Also check multi-word combos (e.g. "dusty rose" → "dusty_rose")
  for (let len = words.length - 1; len >= 1; len--) {
    for (let start = 0; start + len <= words.length; start++) {
      const combo = words.slice(start, start + len).join('_')
      if (COLOR_MAP[combo]) return COLOR_MAP[combo]
    }
  }

  // 3. Deterministic hash → HSL colour so it's always distinct and non-grey
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
  const hue = Math.abs(hash) % 360
  return `hsl(${hue}, 55%, 55%)`
}

/**
 * Map the raw backend response (flat snake_case fields, string color_palette)
 * to the frontend Garment shape (nested location, ColorSwatch[] palette).
 *
 * The backend always returns flat fields like `city`, `continent`, `image_url`
 * and `color_palette` as a comma-separated string.  This normaliser bridges
 * that gap so every real-API path yields a correctly typed Garment.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normaliseGarment(raw: any): Garment {
  // colour_palette: "ivory, dusty rose, charcoal"  →  ColorSwatch[]
  const rawPalette: string = raw.color_palette ?? ''
  const color_palette: ColorSwatch[] = rawPalette
    .split(',')
    .map((s: string) => s.trim())
    .filter(Boolean)
    .map((name: string) => ({ name, hex: resolveColorHex(name) }))

  const imageUrl: string = raw.image_url
    ? `${raw.image_url}`          // keep relative path; Vite proxy serves /uploads
    : raw.imageUrl ?? ''

  return {
    id:               String(raw.id),
    imageUrl,
    thumbnail:        imageUrl,
    garment_type:     raw.garment_type ?? '',
    style:            raw.style ?? '',
    material:         raw.material ?? '',
    color_palette,
    pattern:          raw.pattern ?? '',
    season:           raw.season ?? '',
    occasion:         raw.occasion ?? '',
    consumer_profile: raw.consumer_profile ?? '',
    trend_notes:      raw.trend_notes ?? '',
    description:      raw.description ?? '',
    designer:         raw.designer ?? undefined,
    tags:             raw.tags ?? [],
    notes:            raw.notes ?? [],
    location: {
      continent: raw.continent ?? raw.location?.continent ?? '',
      country:   raw.country   ?? raw.location?.country   ?? '',
      city:      raw.city      ?? raw.location?.city      ?? '',
    },
  }
}

// ─── API Functions ────────────────────────────────────────────────────────────

export async function getImages(params?: SearchParams): Promise<Garment[]> {
  try {
    const { data } = await client.get<any>('/images', { params })
    const results = Array.isArray(data) ? data : (data.results ?? [])
    return results.map(normaliseGarment)
  } catch (err) {
    if (isMockMode(err)) {
      let results = [...MOCK_GARMENTS]
      if (params?.q) {
        const q = params.q.toLowerCase()
        results = results.filter(g =>
          [g.garment_type, g.style, g.material, g.pattern, g.description, ...(g.tags ?? [])]
            .join(' ').toLowerCase().includes(q)
        )
      }
      Object.entries(params ?? {}).forEach(([key, val]) => {
        if (!val || key === 'q') return
        results = results.filter(g => {
          const field = (g as unknown as Record<string, unknown>)[key]
          if (key === 'continent' || key === 'country' || key === 'city') {
            return g.location[key as keyof Location]?.toLowerCase() === val.toLowerCase()
          }
          return String(field).toLowerCase() === val.toLowerCase()
        })
      })
      return results
    }
    throw err
  }
}

export async function getImageDetails(id: string): Promise<Garment> {
  try {
    const { data } = await client.get<any>(`/images/${id}`)
    return normaliseGarment(data)
  } catch (err) {
    if (isMockMode(err)) {
      const garment = MOCK_GARMENTS.find(g => g.id === id)
      if (!garment) throw new Error(`Garment ${id} not found`)
      return garment
    }
    throw err
  }
}

export async function searchImages(query: string): Promise<Garment[]> {
  try {
    const { data } = await client.get<any>('/search', { params: { q: query } })
    const results = Array.isArray(data) ? data : (data.results ?? [])
    return results.map(normaliseGarment)
  } catch (err) {
    if (isMockMode(err)) return getImages({ q: query })
    throw err
  }
}

/**
 * Unified search+filter call.
 * Hits /api/images/filter with any combination of text query and/or
 * structured filter params. The backend applies all non-null params as
 * AND conditions so combining search text with dropdowns works correctly.
 * Falls back to client-side mock filtering when the backend is unavailable.
 */
export async function filterImages(params: SearchParams): Promise<Garment[]> {
  // If the only param is a free-text query, delegate to the semantic search
  // endpoint which uses embeddings. Otherwise hit the structured filter route.
  const filterKeys = Object.keys(params).filter(k => k !== 'q' && params[k as keyof SearchParams])
  const hasFilters = filterKeys.length > 0
  const hasQuery   = Boolean(params.q)

  if (hasQuery && !hasFilters) {
    return searchImages(params.q!)
  }

  try {
    // /api/images/filter accepts all SearchParams fields as query params
    const { data } = await client.get<any>('/images/filter', { params })
    const results = Array.isArray(data) ? data : (data.results ?? [])
    return results.map(normaliseGarment)
  } catch (err) {
    if (isMockMode(err)) {
      // Client-side mock: apply text search then structured filters
      let results = [...MOCK_GARMENTS]
      if (hasQuery) {
        const q = params.q!.toLowerCase()
        results = results.filter(g =>
          [g.garment_type, g.style, g.material, g.pattern, g.description, ...(g.tags ?? [])]
            .join(' ').toLowerCase().includes(q)
        )
      }
      filterKeys.forEach(key => {
        const val = (params as Record<string, string>)[key]?.toLowerCase()
        if (!val) return
        results = results.filter(g => {
          if (key === 'continent' || key === 'country' || key === 'city') {
            return g.location[key as keyof Location]?.toLowerCase() === val
          }
          return String((g as unknown as Record<string, unknown>)[key]).toLowerCase() === val
        })
      })
      return results
    }
    throw err
  }
}

export async function getFilters(): Promise<FilterOptions> {
  try {
    const { data } = await client.get<FilterOptions>('/filters')
    return data
  } catch (err) {
    if (isMockMode(err)) return MOCK_FILTERS
    throw err
  }
}

/**
 * Upload a single garment image.
 * All metadata (description, type, style, material, colour palette, pattern,
 * season, occasion, consumer profile, trend notes, and location context) is
 * extracted automatically by the AI vision model — no form fields required.
 */
export async function uploadImage(file: File): Promise<Garment> {
  const form = new FormData()
  form.append('image', file)
  try {
    const { data } = await client.post<any>('/upload', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
      // Vision classification can take several seconds — extend timeout
      timeout: 60_000,
    })
    return normaliseGarment(data)
  } catch (err) {
    if (isMockMode(err)) {
      // Simulate processing delay in mock mode
      await new Promise(r => setTimeout(r, 2000))
      const base = MOCK_GARMENTS[Math.floor(Math.random() * MOCK_GARMENTS.length)]
      return {
        ...base,
        id: `mock-${Date.now()}`,
        imageUrl: URL.createObjectURL(file),
        thumbnail: URL.createObjectURL(file),
      }
    }
    throw err
  }
}

export async function addAnnotation(
  id: string,
  note: string,
  tag: string
): Promise<{ success: boolean }> {
  // Backend AnnotationCreate expects { garment_id: int, tag: str, note: str }
  // The frontend Garment.id is a string; cast to int before sending.
  const garment_id = parseInt(id, 10)
  if (isNaN(garment_id)) throw new Error(`Invalid garment id: "${id}"`)
  try {
    const { data } = await client.post(`/annotations`, { garment_id, note, tag })
    return data
  } catch (err) {
    if (isMockMode(err)) return { success: true }
    throw err
  }
}
