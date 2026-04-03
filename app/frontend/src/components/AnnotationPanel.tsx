import { useState, type FormEvent } from 'react'
import { addAnnotation } from '../api/api'

interface Props {
  garmentId: string
  existingTags?: string[]
  existingNotes?: string[]
  onSaved?: () => void
}

export default function AnnotationPanel({ garmentId, existingTags = [], existingNotes = [], onSaved }: Props) {
  const [tag, setTag] = useState('')
  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [localTags, setLocalTags] = useState<string[]>(existingTags)
  const [localNotes, setLocalNotes] = useState<string[]>(existingNotes)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!tag.trim() && !note.trim()) return
    setSaving(true)
    setError(null)
    try {
      await addAnnotation(garmentId, note.trim(), tag.trim())
      if (tag.trim()) setLocalTags(t => [...t, tag.trim()])
      if (note.trim()) setLocalNotes(n => [...n, note.trim()])
      setTag('')
      setNote('')
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
      onSaved?.()
    } catch {
      setError('Failed to save annotation.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="bg-white rounded-2xl shadow-card p-5 space-y-5">
      <h3 className="font-semibold text-gray-800">Designer Annotations</h3>

      {/* Existing tags */}
      {localTags.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Tags</p>
          <div className="flex flex-wrap gap-1.5">
            {localTags.map(t => (
              <span key={t} className="text-xs px-2.5 py-1 rounded-full bg-brand-50 text-brand-700 font-medium">
                #{t}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Existing notes */}
      {localNotes.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Notes</p>
          <ul className="space-y-1.5">
            {localNotes.map((n, i) => (
              <li key={i} className="text-sm text-gray-600 flex items-start gap-2">
                <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-brand-400 flex-shrink-0" />
                {n}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-3 pt-1">
        <div className="space-y-1">
          <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Add Tag</label>
          <input
            type="text"
            value={tag}
            onChange={e => setTag(e.target.value)}
            placeholder="e.g. artisan, trending, archive"
            className="w-full px-3 py-2 text-sm rounded-xl border border-gray-200 focus:outline-none
                       focus:ring-2 focus:ring-brand-400 focus:border-transparent transition text-gray-700"
          />
        </div>

        <div className="space-y-1">
          <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Add Note</label>
          <textarea
            value={note}
            onChange={e => setNote(e.target.value)}
            placeholder="Your observations or styling notes…"
            rows={3}
            className="w-full px-3 py-2 text-sm rounded-xl border border-gray-200 focus:outline-none
                       focus:ring-2 focus:ring-brand-400 focus:border-transparent transition text-gray-700 resize-none"
          />
        </div>

        {error && <p className="text-xs text-red-500">{error}</p>}

        <button
          type="submit"
          disabled={saving || (!tag.trim() && !note.trim())}
          className="w-full py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 disabled:opacity-50
                     disabled:cursor-not-allowed text-white text-sm font-medium transition flex items-center justify-center gap-2"
        >
          {saving ? (
            <>
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Saving…
            </>
          ) : success ? (
            <>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Saved
            </>
          ) : 'Save Annotation'}
        </button>
      </form>
    </div>
  )
}
