import { useState, useRef, useEffect, type DragEvent, type ChangeEvent } from 'react'
import { uploadImage } from '../api/api'
import type { Garment } from '../api/api'

interface Props {
  onUploadSuccess: (garment: Garment) => void
}

// Processing stages shown while the AI works
const STAGES = [
  { key: 'upload',    label: 'Uploading image',                icon: '⬆' },
  { key: 'vision',   label: 'Analysing garment with AI vision', icon: '👁' },
  { key: 'classify', label: 'Extracting attributes',            icon: '🏷' },
  { key: 'embed',    label: 'Generating semantic embedding',    icon: '🔗' },
  { key: 'save',     label: 'Saving to library',                icon: '✦' },
]

type Stage = typeof STAGES[number]['key'] | 'idle' | 'done' | 'error'

function Spinner() {
  return (
    <svg className="w-4 h-4 animate-spin text-brand-500" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  )
}

function Check() {
  return (
    <svg className="w-4 h-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
    </svg>
  )
}

// Attribute pill shown in the result card
function Pill({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">{label}</span>
      <span className="text-xs text-gray-700 leading-snug">{value}</span>
    </div>
  )
}

export default function UploadPanel({ onUploadSuccess }: Props) {
  const [file, setFile]         = useState<File | null>(null)
  const [preview, setPreview]   = useState<string | null>(null)
  const [dragging, setDragging] = useState(false)
  const [stage, setStage]       = useState<Stage>('idle')
  const [activeStep, setActiveStep] = useState(0)
  const [error, setError]       = useState<string | null>(null)
  const [result, setResult]     = useState<Garment | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Advance the stage indicator while the request is in-flight
  useEffect(() => {
    if (stage !== 'vision' && stage !== 'classify' && stage !== 'embed') return
    const stageIdx = { vision: 1, classify: 2, embed: 3 } as Record<string, number>
    setActiveStep(stageIdx[stage] ?? 1)
  }, [stage])

  function pickFile(f: File) {
    if (!f.type.startsWith('image/')) { setError('Please select an image file.'); return }
    setError(null); setResult(null); setStage('idle'); setActiveStep(0)
    setFile(f); setPreview(URL.createObjectURL(f))
  }

  function handleDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault(); setDragging(false)
    const f = e.dataTransfer.files[0]; if (f) pickFile(f)
  }

  function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]; if (f) pickFile(f)
  }

  function reset() {
    setFile(null); setPreview(null); setStage('idle')
    setActiveStep(0); setError(null); setResult(null)
    if (inputRef.current) inputRef.current.value = ''
  }

  async function handleAnalyse() {
    if (!file || stage !== 'idle') return
    setError(null)

    // Step 1: upload
    setStage('upload'); setActiveStep(0)
    await new Promise(r => setTimeout(r, 300))

    // Step 2: vision (the real async work happens here)
    setStage('vision'); setActiveStep(1)

    try {
      // Simulate intermediate stage transitions while waiting for the response.
      // The actual API call does all work server-side; we advance UI steps
      // on a timed basis so the user understands what's happening.
      const timer1 = setTimeout(() => { setStage('classify'); setActiveStep(2) }, 4000)
      const timer2 = setTimeout(() => { setStage('embed');    setActiveStep(3) }, 8000)
      const timer3 = setTimeout(() => { setStage('save');     setActiveStep(4) }, 11000)

      const garment = await uploadImage(file)

      clearTimeout(timer1); clearTimeout(timer2); clearTimeout(timer3)

      setStage('done'); setActiveStep(STAGES.length)
      setResult(garment)
      onUploadSuccess(garment)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Upload failed. Please try again.'
      setError(msg); setStage('error'); setActiveStep(0)
    }
  }

  const isProcessing = stage !== 'idle' && stage !== 'done' && stage !== 'error'

  return (
    <div className="w-full space-y-4">

      {/* ── Drop zone ──────────────────────────────────────────────── */}
      <div
        onDragOver={e => { e.preventDefault(); if (!isProcessing) setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={e => { if (!isProcessing) handleDrop(e) }}
        onClick={() => { if (!isProcessing && !file) inputRef.current?.click() }}
        className={[
          'relative border-2 border-dashed rounded-2xl transition-all duration-200',
          !file ? 'p-8 text-center cursor-pointer' : 'p-4',
          dragging
            ? 'border-brand-400 bg-brand-50'
            : file
              ? 'border-gray-200 bg-gray-50'
              : 'border-gray-200 hover:border-brand-300 hover:bg-gray-50 cursor-pointer',
          isProcessing ? 'pointer-events-none' : '',
        ].join(' ')}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          className="hidden"
          onChange={handleFileChange}
        />

        {file && preview ? (
          /* ── File selected state ─────────────────────────────────── */
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-xl overflow-hidden flex-shrink-0 shadow-sm border border-gray-100">
              <img src={preview} alt="preview" className="w-full h-full object-cover" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-800 truncate">{file.name}</p>
              <p className="text-xs text-gray-400 mt-0.5">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
            </div>
            {!isProcessing && stage !== 'done' && (
              <button
                type="button"
                onClick={e => { e.stopPropagation(); reset() }}
                className="text-xs text-gray-400 hover:text-red-400 transition px-2 py-1 rounded-lg hover:bg-red-50"
              >
                Remove
              </button>
            )}
          </div>
        ) : (
          /* ── Empty state ─────────────────────────────────────────── */
          <div className="flex flex-col items-center gap-2.5">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${dragging ? 'bg-brand-100' : 'bg-gray-100'}`}>
              <svg className={`w-6 h-6 ${dragging ? 'text-brand-500' : 'text-gray-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-700">
                {dragging ? 'Drop to analyse' : 'Drag & drop or click to select'}
              </p>
              <p className="text-xs text-gray-400 mt-0.5 text-center">JPEG · PNG · WEBP · GIF</p>
            </div>
          </div>
        )}
      </div>

      {/* ── AI badge ───────────────────────────────────────────────── */}
      {!file && (
        <p className="text-[11px] text-center text-gray-400 leading-relaxed">
          Drop any garment image — the AI model automatically extracts the description,
          type, style, material, colour palette, pattern, season, occasion, consumer
          profile, trend notes, and location context.
        </p>
      )}

      {/* ── Analyse button ─────────────────────────────────────────── */}
      {file && stage === 'idle' && (
        <button
          type="button"
          onClick={handleAnalyse}
          className="w-full py-2.5 rounded-xl text-sm font-semibold transition
                     bg-brand-600 hover:bg-brand-700 text-white shadow-sm"
        >
          Analyse with AI
        </button>
      )}

      {/* ── Processing stages ──────────────────────────────────────── */}
      {isProcessing && (
        <div className="rounded-2xl border border-gray-100 bg-white shadow-sm divide-y divide-gray-50 overflow-hidden">
          {STAGES.map((s, i) => {
            const isDone    = i < activeStep
            const isActive  = i === activeStep
            const isPending = i > activeStep
            return (
              <div
                key={s.key}
                className={[
                  'flex items-center gap-3 px-4 py-3 transition-colors',
                  isActive  ? 'bg-brand-50' : '',
                  isPending ? 'opacity-40'  : '',
                ].join(' ')}
              >
                <span className="text-base w-5 text-center select-none">{s.icon}</span>
                <span className={`flex-1 text-sm ${isActive ? 'font-medium text-brand-700' : 'text-gray-600'}`}>
                  {s.label}
                </span>
                <span className="flex-shrink-0">
                  {isDone   && <Check />}
                  {isActive && <Spinner />}
                </span>
              </div>
            )
          })}
        </div>
      )}

      {/* ── Error state ────────────────────────────────────────────── */}
      {stage === 'error' && error && (
        <div className="rounded-xl bg-red-50 border border-red-100 px-4 py-3 flex items-start gap-2">
          <svg className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          <div className="flex-1">
            <p className="text-xs text-red-600 font-medium">{error}</p>
            <button onClick={reset} className="mt-1 text-xs text-red-400 hover:text-red-600 underline">
              Try again
            </button>
          </div>
        </div>
      )}

      {/* ── Result card ────────────────────────────────────────────── */}
      {stage === 'done' && result && (
        <div className="rounded-2xl border border-emerald-100 bg-emerald-50 overflow-hidden">
          {/* Header */}
          <div className="flex items-center gap-2 px-4 py-3 bg-emerald-100/60 border-b border-emerald-100">
            <Check />
            <p className="text-sm font-semibold text-emerald-700">Garment analysed &amp; saved</p>
          </div>

          {/* Image + description */}
          <div className="p-4 space-y-3">
            {preview && (
              <img
                src={preview}
                alt="Analysed garment"
                className="w-full h-40 object-cover rounded-xl border border-emerald-100"
              />
            )}
            {result.description && (
              <p className="text-xs text-gray-600 leading-relaxed italic">
                "{result.description}"
              </p>
            )}

            {/* Attribute grid */}
            <div className="grid grid-cols-2 gap-x-4 gap-y-3 pt-1">
              <Pill label="Type"             value={result.garment_type} />
              <Pill label="Style"            value={result.style} />
              <Pill label="Material"         value={result.material} />
              <Pill label="Pattern"          value={result.pattern} />
              <Pill label="Colour palette"   value={Array.isArray(result.color_palette)
                ? result.color_palette.map((c: { name: string }) => c.name).join(', ')
                : result.color_palette as string} />
              <Pill label="Season"           value={result.season} />
              <Pill label="Occasion"         value={result.occasion} />
              <Pill label="Location"         value={[result.location?.city, result.location?.country].filter(Boolean).join(', ')} />
            </div>

            {result.consumer_profile && (
              <div className="pt-1">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 mb-0.5">Consumer profile</p>
                <p className="text-xs text-gray-600 leading-snug">{result.consumer_profile}</p>
              </div>
            )}

            {result.trend_notes && (
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 mb-0.5">Trend notes</p>
                <p className="text-xs text-gray-600 leading-snug">{result.trend_notes}</p>
              </div>
            )}
          </div>

          {/* Upload another */}
          <div className="px-4 pb-4">
            <button
              onClick={reset}
              className="w-full py-2 rounded-xl text-xs font-medium border border-emerald-200
                         text-emerald-700 hover:bg-emerald-100 transition"
            >
              Upload another garment
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
