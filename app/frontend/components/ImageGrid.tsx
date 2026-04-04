import React from "react";
interface Garment {
  id: number;
  image_url: string;
  garment_type?: string;
  style?: string;
  color_palette?: string;
}
interface Props {
  garments: Garment[];
}
const ImageGrid: React.FC<Props> = ({ garments }) => {
  const safeGarments = Array.isArray(garments) ? garments : [];
  if (safeGarments.length === 0) {
    return (
      <div className="flex items-center justify-center py-16 text-gray-400 text-sm">
        No garments uploaded yet
      </div>
    );
  }
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-4">
      {safeGarments.map((garment) => (
        <div
          key={garment.id}
          className="bg-white rounded-xl shadow hover:shadow-md transition-shadow overflow-hidden"
        >
          <img
            src={garment.image_url}
            alt={garment.garment_type ?? "Garment"}
            className="w-full h-48 object-cover"
          />
          <div className="p-3 space-y-1">
            {garment.garment_type && (
              <p className="text-sm font-medium text-gray-800 capitalize">
                {garment.garment_type}
              </p>
            )}
            {garment.style && (
              <p className="text-xs text-gray-500 capitalize">{garment.style}</p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};
export default ImageGrid;
