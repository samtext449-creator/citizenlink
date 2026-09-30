'use client'

export default function DownloadPage({ params }: { params: { id: string } }) {
  return (
    <div className="pt-20 pb-12">
      <div className="max-w-3xl mx-auto px-4">
        <div className="bg-white rounded-xl border border-gray-200 p-8">
          <h1 className="text-2xl font-bold text-gray-900">Download Your Document</h1>
          <p className="text-gray-500 mt-2">
            Reference Number: <span className="font-mono font-semibold text-gray-900">{params.id}</span>
          </p>
          <p className="text-sm text-gray-400 mt-6">
            This page will show the download button for your KRA document once the admin uploads it.
          </p>
        </div>
      </div>
    </div>
  )
}