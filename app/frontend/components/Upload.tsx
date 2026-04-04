import React, { useState, useRef } from "react";
import axios from "axios";
interface Props {
  onUploadSuccess: () => void;
}
const Upload: React.FC<Props> = ({ onUploadSuccess }) => {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSuccess(false);
    setError(null);
    setFile(e.target.files?.[0] ?? null);
  };
  const handleUpload = async () => {
    if (!file) return;
    setLoading(true);
    setError(null);
    setSuccess(false);
    try {
      const formData = new FormData();
      formData.append("image", file);
      await axios.post("/api/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setSuccess(true);
      setFile(null);
      if (inputRef.current) inputRef.current.value = "";
      onUploadSuccess();
    } catch {
      setError("Upload failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="p-4 bg-white rounded-xl shadow space-y-3 max-w-md">
      <h2 className="text-sm font-semibold text-gray-700">Upload Garment</h2>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="block w-full text-sm text-gray-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-sm file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200 cursor-pointer"
      />
      <button
        onClick={handleUpload}
        disabled={!file || loading}
        className="w-full py-2 px-4 rounded-lg bg-gray-900 text-white text-sm font-medium hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      >
        {loading ? "UploadingΓÇª" : "Upload"}
      </button>
      {loading && (
        <p className="text-xs text-gray-400 animate-pulse">ProcessingΓÇª</p>
      )}
      {success && (
        <p className="text-xs text-green-600 font-medium">Upload successful!</p>
      )}
      {error && (
        <p className="text-xs text-red-500">{error}</p>
      )}
    </div>
  );
};
export default Upload;
