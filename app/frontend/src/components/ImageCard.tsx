import { useNavigate } from 'react-router-dom'
import type { Garment } from '../api/api'

interface Props {
  garment: Garment
}

export default function ImageCard({ garment }: Props) {
  const navigate = useNavigate()

  return (
    <article
      onClick={() => navigate(`/image/${garment.id}`)}
      className="group cursor-pointer rounded-2xl overflow-hidden bg-white shadow-card hover:shadow-card-hover transition-all duration-300 hover:-translate-y-1"
    >
      {/* Thumbnail */}
      <div className="relative aspect-[3/4] overflow-hidden bg-gray-100">
        <img
          src={garment.thumbnail}
          alt={garment.garment_type}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
        />
        {/* Season badge */}
        <span className="absolute top-3 left-3 text-xs font-medium px-2.5 py-1 rounded-full bg-white/80 backdrop-blur-sm text-gray-700 shadow-sm">
          {garment.season}
        </span>
      </div>

      {/* Info */}
      <div className="p-4 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="font-semibold text-gray-900 leading-tight">{garment.garment_type}</p>
            <p className="text-sm text-gray-500">{garment.style}</p>
          </div>
          <span className="text-xs text-gray-400 whitespace-nowrap">
            {garment.location.city}
          </span>
        </div>

        {/* Color palette */}
        <div className="flex items-center gap-1.5">
          {garment.color_palette.slice(0, 5).map((c, i) => (
            <span
              key={i}
              title={c.name}
              style={{ backgroundColor: c.hex }}
              className="w-4 h-4 rounded-full border border-white shadow-sm"
            />
          ))}
        </div>

        {/* Tags */}
        {garment.tags && garment.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 pt-0.5">
            {garment.tags.slice(0, 3).map(tag => (
              <span
                key={tag}
                className="text-xs px-2 py-0.5 rounded-full bg-brand-50 text-brand-700 font-medium"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </article>
  )
}
