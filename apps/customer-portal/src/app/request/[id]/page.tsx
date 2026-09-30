'use client'

export default function RequestDetailPage({ params }: { params: { id: string } }) {
  return (
    <div className="pt-20 pb-12">
      <div className="max-w-3xl mx-auto px-4">
        <div className="bg-white rounded-xl border border-gray-200 p-8">
          <h1 className="text-2xl font-bold text-gray-900">Request Details</h1>
          <p className="text-gray-500 mt-2">
            Reference Number:{' '}
            <span className="font-mono font-semibold text-gray-900">{params.id}</span>
          </p>

          <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              Your request is being processed. We'll notify you when your document is ready.
            </p>
          </div>

          <a
            href="/"
            className="mt-6 inline-block text-blue-600 hover:text-blue-700 text-sm font-medium"
          >
            ← Back to home
          </a>
        </div>
      </div>
    </div>
  )
}