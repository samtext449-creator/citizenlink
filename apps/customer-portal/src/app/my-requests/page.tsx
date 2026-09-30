'use client'

import Navigation from '@/components/Navigation'

// Mock data for demonstration
const mockRequests = [
  {
    id: '#CL1001',
    service: 'KRA PIN Registration',
    status: 'Completed',
    date: '2024-01-15',
    amount: 'KES 250'
  },
  {
    id: '#CL1002',
    service: 'KRA PIN Registration',
    status: 'Processing',
    date: '2024-01-14',
    amount: 'KES 250'
  },
  {
    id: '#CL1003',
    service: 'KRA PIN Registration',
    status: 'Ready',
    date: '2024-01-13',
    amount: 'KES 250'
  }
]

// Map statuses to Tailwind badge classes
const statusColors: Record<string, string> = {
  'Pending': 'bg-amber-100 text-amber-800',
  'Processing': 'bg-blue-100 text-blue-800',
  'Ready': 'bg-emerald-100 text-emerald-800',
  'Completed': 'bg-green-100 text-green-800'
}

export default function MyRequests() {
  return (
    <div className="pt-20 pb-12">
      <Navigation />
      
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-2xl font-bold mb-6">My Requests</h1>
        
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
          {mockRequests.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">No requests yet</p>
              <a href="/" className="bg-blue-600 text-white px-4 py-2 rounded-lg inline-block mt-4 hover:bg-blue-700">
                Make a Request
              </a>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Order</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Service</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Status</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Date</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-gray-600">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {mockRequests.map((request) => (
                    <tr key={request.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4 font-medium">{request.id}</td>
                      <td className="py-3 px-4 text-sm">{request.service}</td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[request.status] || 'bg-gray-100 text-gray-800'}`}>
                          {request.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-sm">{request.date}</td>
                      <td className="py-3 px-4 text-right">
                        {request.status === 'Ready' && (
                          <button className="bg-green-600 text-white px-4 py-1 rounded-lg text-sm hover:bg-green-700">
                            Pay Now
                          </button>
                        )}
                        {request.status === 'Completed' && (
                          <button className="bg-blue-600 text-white px-4 py-1 rounded-lg text-sm hover:bg-blue-700">
                            Download
                          </button>
                        )}
                        {request.status === 'Processing' && (
                          <span className="text-sm text-gray-400">In Progress</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}