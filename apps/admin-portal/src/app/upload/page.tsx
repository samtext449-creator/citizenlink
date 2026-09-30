'use client'

export default function UploadPage() {
  return (
    <div className="p-8">
      <div className="max-w-4xl">
        <h1 className="text-2xl font-bold text-gray-900">Upload Document</h1>
        <p className="text-gray-500 mt-2">
          Upload a KRA certificate or PIN and attach it to a customer request.
        </p>

        <div className="mt-6 bg-white rounded-xl border-2 border-dashed border-gray-300 p-12 text-center">
          <p className="text-gray-500">Drag and drop a PDF here, or click to browse</p>
          <button className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
            Select File
          </button>
        </div>
      </div>
    </div>
  )
}