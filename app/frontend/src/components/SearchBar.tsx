import { useState, useRef, useEffect, type FormEvent, type KeyboardEvent } from 'react'

interface Props {
  onSearch: (query: string) => void
  onClear: () => void
  initialValue?: string
  loading?: boolean
}

const SUGGESTIONS = [
  'embroidered neckline',
  'streetwear jacket',
  'artisan market dress',
  'quiet luxury blouse',
  'resort linen kaftan',
]

/** Debounce delay in ms before live-search fires while the user is typing */
const DEBOUNCE_MS = 400

export default function SearchBar({ onSearch, onClear, initialValue = '', loading = false }: Props) {
  const [value, setValue]     = useState(initialValue)
  const [focused, setFocused] = useState(false)
  const inputRef   = useRef<HTMLInputElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Keep local value in sync when the parent resets initialValue (e.g. on clear)
  useEffect(() => {
    setValue(initialValue)
  }, [initialValue])

  function fireSearch(q: string) {
    if (q.trim()) {
      onSearch(q.trim())
    } else {
      onClear()
    }
  }

  function handleChange(val: string) {
    setValue(val)
    // Debounce: cancel the previous timer and schedule a new one
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => fireSearch(val), DEBOUNCE_MS)
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    // Immediate submit — cancel any pending debounce
    if (debounceRef.current) clearTimeout(debounceRef.current)
    fireSearch(value)
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Escape') clear()
  }

  function clear() {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    setValue('')
    onClear()
    inputRef.current?.focus()
  }

  function applySuggestion(s: string) {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    setValue(s)
    onSearch(s)
    setFocused(false)
  }

  return (
    <div className="relative w-full max-w-2xl">
      <form onSubmit={handleSubmit} className="relative flex items-center">

        {/* Search icon / spinner */}
        <span className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
          {loading ? (
            <svg className="w-4 h-4 text-brand-500 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          ) : (
            <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
            </svg>
          )}
        </span>

        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={e => handleChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setTimeout(() => setFocused(false), 150)}
          onKeyDown={handleKeyDown}
          placeholder="Search garments — e.g. streetwear jacket, embroidered dress…"
          className="w-full pl-11 pr-24 py-3.5 rounded-2xl border border-gray-200 bg-white shadow-sm
                     focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-transparent
                     text-gray-800 placeholder-gray-400 text-sm transition"
        />

        {/* Clear (X) button — only visible when text exists */}
        {value && (
          <button
            type="button"
            onClick={clear}
            aria-label="Clear search"
            className="absolute right-[4.5rem] top-1/2 -translate-y-1/2
                       w-5 h-5 flex items-center justify-center rounded-full
                       text-gray-400 hover:text-gray-700 hover:bg-gray-100
                       transition-all duration-150"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}

        {/* Search button */}
        <button
          type="submit"
          disabled={!value.trim() || loading}
          className="absolute right-2 top-1/2 -translate-y-1/2 px-4 py-2 rounded-xl
                     bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium transition
                     disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Search
        </button>
      </form>

      {/* Suggestions dropdown — only when focused and no text entered */}
      {focused && !value && (
        <div className="absolute top-full mt-2 w-full bg-white rounded-2xl shadow-card-hover border border-gray-100 z-20 py-2 overflow-hidden">
          <p className="text-xs text-gray-400 font-medium px-4 py-1 uppercase tracking-wider">Suggestions</p>
          {SUGGESTIONS.map(s => (
            <button
              key={s}
              onMouseDown={() => applySuggestion(s)}
              className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-brand-50 hover:text-brand-700 transition flex items-center gap-3"
            >
              <svg className="w-4 h-4 text-gray-300 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
              </svg>
              {s}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
