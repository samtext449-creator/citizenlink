'use client'

export default function RequestDetailPage({ params }: { params: { id: string } }) {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-gray-900">Request Details</h1>
      <p className="text-gray-500 mt-2">
        Request ID: <span className="font-mono font-semibold text-gray-900">{params.id}</span>
      </p>
    </div>
  )
}