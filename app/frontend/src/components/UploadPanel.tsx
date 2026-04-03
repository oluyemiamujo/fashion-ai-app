import { useState, useRef, type DragEvent, type ChangeEvent, type FormEvent } from 'react'
import { uploadImage } from '../api/api'
import type { Garment, UploadMetadata } from '../api/api'

interface Props {
  onUploadSuccess: (garment: Garment) => void
}

const CONTINENTS = ['Africa', 'Asia', 'Europe', 'North America', 'Oceania', 'South America']
const SEASONS    = ['Spring', 'Summer', 'Fall', 'Winter']
const OCCASIONS  = ['Casual', 'Formal', 'Streetwear', 'Business', 'Evening']

const EMPTY_META: UploadMetadata = {
  designer: '', continent: '', country: '', city: '',
  season: '', occasion: '', notes: '',
}

const inputCls =
  'w-full px-3 py-2 text-sm rounded-xl border border-gray-200 bg-white text-gray-800 ' +
  'focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-transparent transition placeholder-gray-400'

const selectCls =
  'w-full appearance-none pl-3 pr-8 py-2 text-sm rounded-xl border border-gray-200 bg-white text-gray-800 ' +
  'focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-transparent transition cursor-pointer'

function FieldLabel({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
      {children}{required && <span className="text-brand-500 ml-0.5">*</span>}
    </label>
  )
}

function ChevronDown() {
  return (
    <svg className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none"
      fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
    </svg>
  )
}

export default function UploadPanel({ onUploadSuccess }: Props) {
  const [file, setFile]         = useState<File | null>(null)
  const [preview, setPreview]   = useState<string | null>(null)
  const [dragging, setDragging] = useState(false)
  const [meta, setMeta]         = useState<UploadMetadata>(EMPTY_META)
  const [uploading, setUploading] = useState(false)
  const [success, setSuccess]   = useState(false)
  const [error, setError]       = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const canSubmit = !!file && meta.designer.trim().length > 0 && !uploading

  function pickFile(f: File) {
    if (!f.type.startsWith('image/')) { setError('Please select an image file.'); return }
    setError(null); setSuccess(false)
    setFile(f); setPreview(URL.createObjectURL(f))
  }

  function handleDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault(); setDragging(false)
    const f = e.dataTransfer.files[0]; if (f) pickFile(f)
  }

  function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]; if (f) pickFile(f)
  }

  function setField<K extends keyof UploadMetadata>(key: K, value: UploadMetadata[K]) {
    setMeta(prev => ({ ...prev, [key]: value }))
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!canSubmit) return
    setUploading(true); setError(null)
    try {
      const garment = await uploadImage(file!, meta)
      onUploadSuccess(garment)
      setSuccess(true); setFile(null); setPreview(null); setMeta(EMPTY_META)
      if (inputRef.current) inputRef.current.value = ''
    } catch {
      setError('Upload failed. Please try again.')
    } finally {
      setUploading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="w-full space-y-5">

      {/* ── Drop zone ──────────────────────────────────────────────── */}
      <div
        onDragOver={e => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => !uploading && inputRef.current?.click()}
        className={[
          'relative border-2 border-dashed rounded-2xl p-5 text-center cursor-pointer transition-all duration-200',
          dragging ? 'border-brand-400 bg-brand-50' : 'border-gray-200 hover:border-brand-300 hover:bg-gray-50',
          uploading ? 'pointer-events-none opacity-70' : '',
        ].join(' ')}
      >
        <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />

        {preview ? (
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 shadow-sm border border-gray-100">
              <img src={preview} alt="preview" className="w-full h-full object-cover" />
            </div>
            <div className="text-left">
              <p className="text-sm font-medium text-gray-800 truncate max-w-[200px]">{file?.name}</p>
              <p className="text-xs text-gray-400 mt-0.5">{file ? (file.size / 1024 / 1024).toFixed(1) : 0} MB</p>
              <button
                type="button"
                onClick={e => { e.stopPropagation(); setFile(null); setPreview(null) }}
                className="mt-1.5 text-xs text-red-400 hover:text-red-600 transition"
              >
                Remove
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 py-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${dragging ? 'bg-brand-100' : 'bg-gray-100'}`}>
              <svg className={`w-5 h-5 ${dragging ? 'text-brand-500' : 'text-gray-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
            </div>
            <p className="text-sm font-medium text-gray-700">{dragging ? 'Drop to upload' : 'Drag & drop or click to select'}</p>
            <p className="text-xs text-gray-400">PNG, JPG, WEBP up to 20 MB</p>
          </div>
        )}
      </div>

      {/* ── Metadata form ──────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Designer — required */}
        <div className="sm:col-span-2">
          <FieldLabel required>Designer Name</FieldLabel>
          <input type="text" value={meta.designer} onChange={e => setField('designer', e.target.value)}
            placeholder="e.g. Maison Calme" className={inputCls} />
        </div>

        {/* Continent */}
        <div>
          <FieldLabel>Continent</FieldLabel>
          <div className="relative">
            <select value={meta.continent} onChange={e => setField('continent', e.target.value)} className={selectCls}>
              <option value="">Select continent</option>
              {CONTINENTS.map(c => <option key={c} value={c}>{c}</option>)}
            </select><ChevronDown />
          </div>
        </div>

        {/* Country */}
        <div>
          <FieldLabel>Country</FieldLabel>
          <input type="text" value={meta.country} onChange={e => setField('country', e.target.value)}
            placeholder="e.g. France" className={inputCls} />
        </div>

        {/* City */}
        <div>
          <FieldLabel>City</FieldLabel>
          <input type="text" value={meta.city} onChange={e => setField('city', e.target.value)}
            placeholder="e.g. Paris" className={inputCls} />
        </div>

        {/* Season */}
        <div>
          <FieldLabel>Season</FieldLabel>
          <div className="relative">
            <select value={meta.season} onChange={e => setField('season', e.target.value)} className={selectCls}>
              <option value="">Select season</option>
              {SEASONS.map(s => <option key={s} value={s}>{s}</option>)}
            </select><ChevronDown />
          </div>
        </div>

        {/* Occasion */}
        <div className="sm:col-span-2">
          <FieldLabel>Occasion</FieldLabel>
          <div className="relative">
            <select value={meta.occasion} onChange={e => setField('occasion', e.target.value)} className={selectCls}>
              <option value="">Select occasion</option>
              {OCCASIONS.map(o => <option key={o} value={o}>{o}</option>)}
            </select><ChevronDown />
          </div>
        </div>

        {/* Notes */}
        <div className="sm:col-span-2">
          <FieldLabel>Notes</FieldLabel>
          <textarea value={meta.notes} onChange={e => setField('notes', e.target.value)}
            placeholder="Styling notes, trend observations, sourcing details…"
            rows={3} className={`${inputCls} resize-none`} />
        </div>
      </div>

      {/* ── Validation hints ───────────────────────────────────────── */}
      {!file && !meta.designer && (
        <p className="text-xs text-gray-400"><span className="text-brand-500">*</span> Image and Designer Name are required</p>
      )}
      {file && !meta.designer && (
        <p className="text-xs text-amber-500 flex items-center gap-1">
          <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          Designer Name is required before uploading
        </p>
      )}

      {/* ── Error ──────────────────────────────────────────────────── */}
      {error && (
        <p className="text-xs text-red-500 flex items-center gap-1">
          <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          {error}
        </p>
      )}

      {/* ── Success ────────────────────────────────────────────────── */}
      {success && (
        <div className="flex items-center gap-2 text-sm text-emerald-600 font-medium bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-2.5">
          <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          Garment uploaded and added to library
        </div>
      )}

      {/* ── Submit ─────────────────────────────────────────────────── */}
      <button
        type="submit"
        disabled={!canSubmit}
        className="w-full py-2.5 rounded-xl text-sm font-medium transition flex items-center justify-center gap-2
                   bg-brand-600 hover:bg-brand-700 text-white
                   disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-brand-600"
      >
        {uploading ? (
          <>
            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Uploading…
          </>
        ) : 'Upload Garment'}
      </button>
    </form>
  )
}
