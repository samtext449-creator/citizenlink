'use client'

import Navigation from '@/components/Navigation'

export default function Help() {
  return (
    <div className="pt-20 pb-12">
      <Navigation />
      
      <div className="max-w-3xl mx-auto px-4">
        <h1 className="text-2xl font-bold mb-6">Help & Support</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="card hover:shadow-md transition-shadow cursor-pointer">
            <div className="text-3xl mb-2">📋</div>
            <h3 className="font-semibold">FAQs</h3>
            <p className="text-sm text-gray-600">Common questions answered</p>
          </div>
          
          <div className="card hover:shadow-md transition-shadow cursor-pointer">
            <div className="text-3xl mb-2">💬</div>
            <h3 className="font-semibold">WhatsApp</h3>
            <p className="text-sm text-gray-600">Chat with us on WhatsApp</p>
          </div>
          
          <div className="card hover:shadow-md transition-shadow cursor-pointer">
            <div className="text-3xl mb-2">📞</div>
            <h3 className="font-semibold">Call Support</h3>
            <p className="text-sm text-gray-600">Speak to our team</p>
          </div>
          
          <div className="card hover:shadow-md transition-shadow cursor-pointer">
            <div className="text-3xl mb-2">✉️</div>
            <h3 className="font-semibold">Email Support</h3>
            <p className="text-sm text-gray-600">Send us an email</p>
          </div>
        </div>
      </div>
    </div>
  )
}
