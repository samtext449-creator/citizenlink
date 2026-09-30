'use client'

import Navigation from '@/components/Navigation'

const notifications = [
  {
    id: 1,
    title: 'Payment Received',
    message: 'Your payment of KES 250 has been confirmed.',
    time: '2 hours ago',
    read: false
  },
  {
    id: 2,
    title: 'Document Ready',
    message: 'Your KRA PIN certificate is ready for download.',
    time: '5 hours ago',
    read: false
  },
  {
    id: 3,
    title: 'Order Processing',
    message: 'Your request is being processed by our team.',
    time: '1 day ago',
    read: true
  }
]

export default function Notifications() {
  return (
    <div className="pt-20 pb-12">
      <Navigation />
      
      <div className="max-w-3xl mx-auto px-4">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Notifications</h1>
          <button className="text-sm text-blue-600 hover:text-blue-700">
            Mark all as read
          </button>
        </div>
        
        <div className="space-y-3">
          {notifications.map((notification) => (
            <div
              key={notification.id}
              className="bg-white rounded-lg p-4 border border-gray-200 hover:shadow-md transition-shadow"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold">{notification.title}</h3>
                  <p className="text-gray-600 text-sm mt-1">{notification.message}</p>
                  <p className="text-gray-400 text-xs mt-2">{notification.time}</p>
                </div>
                {!notification.read && (
                  <span className="w-2 h-2 bg-blue-500 rounded-full mt-2"></span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}