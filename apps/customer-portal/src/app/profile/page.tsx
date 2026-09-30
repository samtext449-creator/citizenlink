'use client'

import Navigation from '@/components/Navigation'

export default function Profile() {
  return (
    <div className="pt-20 pb-12">
      <Navigation />
      
      <div className="max-w-2xl mx-auto px-4">
        <h1 className="text-2xl font-bold mb-6">My Profile</h1>
        
        <div className="card">
          <div className="flex items-center space-x-4 mb-6 pb-6 border-b border-gray-200">
            <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center text-3xl">
              👤
            </div>
            <div>
              <h2 className="text-xl font-semibold">Sam Test</h2>
              <p className="text-gray-500">sam@test.com</p>
            </div>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="label">Full Name</label>
              <input type="text" className="input-field" value="Sam Test" readOnly />
            </div>
            
            <div>
              <label className="label">Email</label>
              <input type="email" className="input-field" value="sam@test.com" readOnly />
            </div>
            
            <div>
              <label className="label">Phone</label>
              <input type="tel" className="input-field" value="0712 345 678" readOnly />
            </div>
            
            <div>
              <label className="label">ID Number</label>
              <input type="text" className="input-field" value="12345678" readOnly />
            </div>
            
            <div>
              <label className="label">KRA PIN (Optional)</label>
              <input type="text" className="input-field" value="A001234A" readOnly />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
