import { useEffect, useState, useCallback, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import { getImages, filterImages, getFilters } from '../api/api'
import type { Garment, FilterOptions, SearchParams } from '../api/api'
import ImageGrid from '../components/ImageGrid'
import SearchBar from '../components/SearchBar'
import FiltersPanel from '../components/FiltersPanel'
import UploadPanel from '../components/UploadPanel'

export default function Home() {
  const location = useLocation()
  const [garments, setGarments]             = useState<Garment[]>([])
  const [filters, setFilters]               = useState<FilterOptions | null>(null)
  const [selectedFilters, setSelectedFilters] = useState<Partial<SearchParams>>({})
  const [searchQuery, setSearchQuery]       = useState('')
  const [loadingImages, setLoadingImages]   = useState(true)
  const [loadingFilters, setLoadingFilters] = useState(true)
  const [showUpload, setShowUpload]         = useState(false)
  const [deletedToast, setDeletedToast]     = useState(false)

  // Abort controller ref — cancels in-flight requests when params change
  const abortRef = useRef<AbortController | null>(null)

  // Show a brief success toast when navigated back after a delete
  useEffect(() => {
    if ((location.state as { deleted?: string } | null)?.deleted) {
      setDeletedToast(true)
      const t = setTimeout(() => setDeletedToast(false), 4000)
      // Clear router state so a back/forward re-visit doesn't re-trigger
      window.history.replaceState({}, '')
      return () => clearTimeout(t)
    }
  }, [location.state])

  // Load filter options once
  useEffect(() => {
    getFilters()
      .then(setFilters)
      .finally(() => setLoadingFilters(false))
  }, [])

  /**
   * Single unified fetch that merges free-text query + structured filters.
   * - No params at all      → GET /api/images   (full list)
   * - Filters only          → GET /api/images/filter  (AND logic)
   * - Query only            → GET /api/search   (semantic, via filterImages)
   * - Query + filters       → GET /api/images/filter  (combined AND, via filterImages)
   */
  const fetchImages = useCallback(
    (query: string, activeFilters: Partial<SearchParams>) => {
      // Cancel any previous in-flight fetch
      abortRef.current?.abort()
      abortRef.current = new AbortController()

      setLoadingImages(true)

      const hasQuery   = query.trim().length > 0
      const filterKeys = Object.keys(activeFilters).filter(
        k => activeFilters[k as keyof SearchParams]
      )
      const hasFilters = filterKeys.length > 0

      const load: Promise<Garment[]> =
        hasQuery || hasFilters
          ? filterImages({ ...activeFilters, ...(hasQuery ? { q: query.trim() } : {}) })
          : getImages()

      load
        .then(result => setGarments(Array.isArray(result) ? result : []))
        .catch(err => {
          // Ignore aborted requests
          if (err?.code === 'ERR_CANCELED') return
          console.error('Failed to load garments:', err)
          setGarments([])
        })
        .finally(() => setLoadingImages(false))
    },
    []
  )

  // Re-fetch whenever the search query or filter selection changes
  useEffect(() => {
    fetchImages(searchQuery, selectedFilters)
  }, [searchQuery, selectedFilters, fetchImages])

  // Search updates query; filters are preserved so they work together
  function handleSearch(q: string) {
    setSearchQuery(q)
  }

  // Clear resets everything
  function handleClear() {
    setSearchQuery('')
    setSelectedFilters({})
  }

  // Filter change preserves current search query
  function handleFilterChange(f: Partial<SearchParams>) {
    setSelectedFilters(f)
  }

  // Prepend newly uploaded garment and close the panel
  function handleUploadSuccess(garment: Garment) {
    setGarments(prev => [garment, ...(Array.isArray(prev) ? prev : [])])
    setShowUpload(false)
  }



  const activeFilterCount = Object.values(selectedFilters).filter(Boolean).length

  return (
    <div className="min-h-screen bg-gray-50 font-sans">

      {/* ── Deleted toast ──────────────────────────────────────────── */}
      {deletedToast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2.5
                        px-5 py-3 rounded-2xl bg-gray-900 text-white text-sm shadow-xl animate-fade-in">
          <svg className="w-4 h-4 text-green-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          Garment deleted successfully
        </div>
      )}

      {/* ── Top Navigation ─────────────────────────────────────────── */}
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-gray-100 shadow-sm">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 h-16 flex items-center gap-4">
          {/* Logo */}
          <a href="/" className="flex items-center gap-2.5 flex-shrink-0 mr-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-brand-400 to-brand-700 flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
              </svg>
            </div>
            <span className="font-bold text-gray-900 hidden sm:block">Fashion AI</span>
          </a>

          {/* Search — takes remaining width */}
          <div className="flex-1 flex justify-center">
            <SearchBar
            onSearch={handleSearch}
            onClear={handleClear}
            initialValue={searchQuery}
            loading={loadingImages && !!searchQuery}
          />
          </div>

          {/* Upload button */}
          <button
            onClick={() => setShowUpload(o => !o)}
            className={`flex-shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition
              ${showUpload
                ? 'bg-brand-100 text-brand-700'
                : 'bg-brand-600 hover:bg-brand-700 text-white shadow-sm'}`}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            <span className="hidden sm:inline">Upload</span>
          </button>
        </div>
      </header>

      {/* ── Upload Panel (collapsible) ──────────────────────────────── */}
      {showUpload && (
        <div className="bg-white border-b border-gray-100 px-4 sm:px-6 py-6">
          <div className="max-w-2xl mx-auto">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-sm font-semibold text-gray-800">Upload Garment</h2>
                <p className="text-xs text-gray-400 mt-0.5">Image and Designer Name are required</p>
              </div>
              <button onClick={() => setShowUpload(false)} className="text-gray-400 hover:text-gray-600 transition">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <UploadPanel onUploadSuccess={handleUploadSuccess} />
          </div>
        </div>
      )}

      {/* ── Body ───────────────────────────────────────────────────── */}
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 py-6 flex gap-6">

        {/* ── Sidebar ─────────────────────────────────────────────── */}
        <aside className="hidden lg:block w-64 flex-shrink-0">
          <div className="sticky top-24 bg-white rounded-2xl shadow-card p-5">
            <FiltersPanel
              filters={filters}
              selectedFilters={selectedFilters}
              onChange={handleFilterChange}
              loading={loadingFilters}
            />
          </div>
        </aside>

        {/* ── Main ─────────────────────────────────────────────────── */}
        <main className="flex-1 min-w-0 space-y-5">
          {/* Results bar */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-semibold text-gray-800">
                {searchQuery
                  ? `Results for "${searchQuery}"`
                  : 'Garment Library'}
              </h2>
              {!loadingImages && (
                <p className="text-sm text-gray-400 mt-0.5">
                  {garments.length} garment{garments.length !== 1 ? 's' : ''}
                  {activeFilterCount > 0 && ` · ${activeFilterCount} filter${activeFilterCount > 1 ? 's' : ''} applied`}
                </p>
              )}
            </div>

            {/* Mobile filter toggle */}
            <button className="lg:hidden flex items-center gap-2 text-sm px-3 py-2 rounded-xl border border-gray-200 text-gray-600 hover:border-brand-400 transition">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707l-6.414 6.414A1 1 0 0014 13.414V19a1 1 0 01-.553.894l-4 2A1 1 0 018 21v-7.586a1 1 0 00-.293-.707L1.293 6.707A1 1 0 011 6V4z" />
              </svg>
              Filters
              {activeFilterCount > 0 && (
                <span className="text-xs font-bold px-1.5 py-0.5 rounded-full bg-brand-100 text-brand-700">
                  {activeFilterCount}
                </span>
              )}
            </button>

            {(searchQuery || activeFilterCount > 0) && (
              <button
                onClick={handleClear}
                className="text-sm text-gray-400 hover:text-red-500 transition"
              >
                Clear all
              </button>
            )}
          </div>

          <ImageGrid garments={garments} loading={loadingImages} />
        </main>
      </div>
    </div>
  )
}
