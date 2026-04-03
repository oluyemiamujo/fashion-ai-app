import ImageCard from './ImageCard'
import type { Garment } from '../api/api'

interface Props {
  garments: Garment[]
  loading: boolean
}

function SkeletonCard() {
  return (
    <div className="rounded-2xl overflow-hidden bg-white shadow-card animate-pulse">
      <div className="aspect-[3/4] bg-gray-200" />
      <div className="p-4 space-y-3">
        <div className="h-4 bg-gray-200 rounded w-3/4" />
        <div className="h-3 bg-gray-100 rounded w-1/2" />
        <div className="flex gap-1.5">
          {[1, 2, 3].map(i => (
            <div key={i} className="w-4 h-4 rounded-full bg-gray-200" />
          ))}
        </div>
      </div>
    </div>
  )
}

export default function ImageGrid({ garments, loading }: Props) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        {Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)}
      </div>
    )
  }

  if (garments.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mb-4">
          <svg className="w-9 h-9 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
        <p className="text-gray-500 font-medium">No garments found</p>
        <p className="text-sm text-gray-400 mt-1">Try adjusting your search or filters</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
      {garments.map(garment => (
        <ImageCard key={garment.id} garment={garment} />
      ))}
    </div>
  )
}
