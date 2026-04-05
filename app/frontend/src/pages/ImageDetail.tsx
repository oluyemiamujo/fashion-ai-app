import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getImageDetails, deleteImage } from '../api/api'
import type { Garment } from '../api/api'
import AnnotationPanel from '../components/AnnotationPanel'

const ATTR_ICONS: Record<string, string> = {
  garment_type: '👗',
  style: '✨',
  material: '🧵',
  pattern: '🎨',
  season: '🌿',
  occasion: '📍',
  consumer_profile: '👤',
  trend_notes: '📈',
}

function AttributeRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start gap-3 py-2.5 border-b border-gray-50 last:border-0">
      <span className="text-base mt-0.5">{ATTR_ICONS[label] ?? '•'}</span>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-0.5">
          {label.replace(/_/g, ' ')}
        </p>
        <p className="text-sm text-gray-800">{value}</p>
      </div>
    </div>
  )
}

export default function ImageDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [garment, setGarment]           = useState<Garment | null>(null)
  const [loading, setLoading]           = useState(true)
  const [error, setError]               = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting]         = useState(false)
  const [deleteError, setDeleteError]   = useState<string | null>(null)

  useEffect(() => {
    if (!id) return
    setLoading(true)
    getImageDetails(id)
      .then(setGarment)
      .catch(() => setError('Could not load garment details.'))
      .finally(() => setLoading(false))
  }, [id])

  async function handleDelete() {
    if (!garment) return
    setDeleting(true)
    setDeleteError(null)
    try {
      await deleteImage(garment.id)
      navigate('/', { state: { deleted: garment.id } })
    } catch {
      setDeleteError('Delete failed. Please try again.')
      setDeleting(false)
      setConfirmDelete(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-gray-400">
          <svg className="w-8 h-8 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <p className="text-sm">Loading garment…</p>
        </div>
      </div>
    )
  }

  if (error || !garment) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center space-y-3">
          <p className="text-gray-500">{error ?? 'Garment not found.'}</p>
          <button onClick={() => navigate('/')} className="text-sm text-brand-600 hover:underline">
            Back to library
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Top bar — back + delete */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 transition"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Library
          </button>

          {/* Delete controls */}
          <div className="flex items-center gap-3">
            {deleteError && (
              <p className="text-xs text-red-500">{deleteError}</p>
            )}
            {confirmDelete ? (
              <>
                <span className="text-sm text-gray-500">Delete this garment?</span>
                <button
                  onClick={() => setConfirmDelete(false)}
                  disabled={deleting}
                  className="text-sm px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600
                             hover:border-gray-300 transition disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg bg-red-600
                             hover:bg-red-700 text-white font-medium transition disabled:opacity-50"
                >
                  {deleting ? (
                    <>
                      <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                      </svg>
                      Deleting…
                    </>
                  ) : (
                    'Yes, delete'
                  )}
                </button>
              </>
            ) : (
              <button
                onClick={() => setConfirmDelete(true)}
                className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg border border-red-200
                           text-red-600 hover:bg-red-50 hover:border-red-300 transition"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Delete Image
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left — Image */}
          <div className="space-y-4">
            <div className="rounded-3xl overflow-hidden shadow-card-hover bg-white aspect-[3/4]">
              <img
                src={garment.imageUrl}
                alt={garment.garment_type}
                className="w-full h-full object-cover"
              />
            </div>

            {/* Color palette */}
            <div className="bg-white rounded-2xl shadow-card p-4">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Colour Palette</p>
              <div className="flex flex-wrap gap-3">
                {garment.color_palette.map((c, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span
                      style={{ backgroundColor: c.hex }}
                      className="w-7 h-7 rounded-full border-2 border-white shadow-sm flex-shrink-0"
                    />
                    <div>
                      <p className="text-xs font-medium text-gray-700">{c.name}</p>
                      <p className="text-xs text-gray-400">{c.hex}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right — Details */}
          <div className="space-y-5">
            {/* Header */}
            <div className="bg-white rounded-2xl shadow-card p-5">
              <div className="flex items-start justify-between gap-4 mb-3">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">{garment.garment_type}</h1>
                  <p className="text-gray-500 mt-0.5">
                    {garment.style} · {garment.location.city}, {garment.location.country}
                  </p>
                </div>
                {garment.designer && (
                  <span className="text-xs font-medium px-3 py-1.5 rounded-full bg-brand-50 text-brand-700 whitespace-nowrap">
                    {garment.designer}
                  </span>
                )}
              </div>

              {/* Description */}
              <p className="text-sm text-gray-600 leading-relaxed border-l-2 border-brand-200 pl-3">
                {garment.description}
              </p>
            </div>

            {/* Attributes */}
            <div className="bg-white rounded-2xl shadow-card p-5">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Attributes</p>
              {[
                ['garment_type', garment.garment_type],
                ['style', garment.style],
                ['material', garment.material],
                ['pattern', garment.pattern],
                ['season', garment.season],
                ['occasion', garment.occasion],
                ['consumer_profile', garment.consumer_profile],
                ['trend_notes', garment.trend_notes],
              ].map(([k, v]) => (
                <AttributeRow key={k} label={k} value={v} />
              ))}
            </div>

            {/* Location */}
            <div className="bg-white rounded-2xl shadow-card p-5">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Origin</p>
              <div className="flex items-center gap-4 text-sm text-gray-700">
                <div className="flex items-center gap-1.5">
                  <span className="text-base">🌍</span>
                  <span>{garment.location.continent}</span>
                </div>
                <span className="text-gray-200">·</span>
                <span>{garment.location.country}</span>
                <span className="text-gray-200">·</span>
                <span className="font-medium">{garment.location.city}</span>
              </div>
            </div>

            {/* Annotation Panel */}
            <AnnotationPanel
              garmentId={garment.id}
              existingTags={garment.tags}
              existingNotes={garment.notes}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
