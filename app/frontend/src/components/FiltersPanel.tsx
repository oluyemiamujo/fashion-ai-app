import { useState } from 'react'
import type { FilterOptions, SearchParams } from '../api/api'

interface Props {
  filters: FilterOptions | null
  selectedFilters: Partial<SearchParams>
  onChange: (filters: Partial<SearchParams>) => void
  loading: boolean
}

const FILTER_LABELS: Record<string, string> = {
  garment_type: 'Garment Type',
  style: 'Style',
  material: 'Material',
  color_palette: 'Colour',
  pattern: 'Pattern',
  season: 'Season',
  occasion: 'Occasion',
  continent: 'Continent',
  country: 'Country',
  city: 'City',
  designer: 'Designer',
}

const FILTER_ORDER = [
  'garment_type', 'style', 'material', 'pattern',
  'season', 'occasion', 'color_palette',
  'continent', 'country', 'city', 'designer',
] as const

type FilterKey = keyof FilterOptions

function FilterSelect({
  label,
  options,
  value,
  onChange,
}: {
  label: string
  options: string[]
  value: string
  onChange: (v: string) => void
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{label}</label>
      <div className="relative">
        <select
          value={value}
          onChange={e => onChange(e.target.value)}
          className="w-full appearance-none pl-3 pr-8 py-2 text-sm rounded-xl border border-gray-200
                     bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-brand-400
                     focus:border-transparent transition cursor-pointer"
        >
          <option value="">All</option>
          {options.map(opt => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
        <svg className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none"
          fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>
    </div>
  )
}

export default function FiltersPanel({ filters, selectedFilters, onChange, loading }: Props) {
  const [open, setOpen] = useState(true)

  const activeCount = Object.values(selectedFilters).filter(Boolean).length

  function handleChange(key: FilterKey, value: string) {
    onChange({ ...selectedFilters, [key]: value || undefined })
  }

  function clearAll() {
    onChange({})
  }

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="space-y-1.5">
            <div className="h-3 bg-gray-200 rounded w-1/2" />
            <div className="h-9 bg-gray-100 rounded-xl" />
          </div>
        ))}
      </div>
    )
  }

  if (!filters) return null

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => setOpen(o => !o)}
          className="flex items-center gap-2 font-semibold text-gray-800 text-sm"
        >
          <svg className={`w-4 h-4 transition-transform ${open ? 'rotate-0' : '-rotate-90'}`}
            fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
          Filters
          {activeCount > 0 && (
            <span className="ml-1 text-xs font-bold px-1.5 py-0.5 rounded-full bg-brand-100 text-brand-700">
              {activeCount}
            </span>
          )}
        </button>

        {activeCount > 0 && (
          <button
            onClick={clearAll}
            className="text-xs text-gray-400 hover:text-red-500 transition"
          >
            Clear all
          </button>
        )}
      </div>

      {open && (
        <div className="space-y-4">
          {FILTER_ORDER.map(key => {
            const opts = filters[key as FilterKey]
            if (!opts?.length) return null
            return (
              <FilterSelect
                key={key}
                label={FILTER_LABELS[key] ?? key}
                options={opts}
                value={(selectedFilters as Record<string, string>)[key] ?? ''}
                onChange={v => handleChange(key as FilterKey, v)}
              />
            )
          })}
        </div>
      )}
    </div>
  )
}
