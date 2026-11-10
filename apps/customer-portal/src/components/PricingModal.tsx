'use client'

import { useState } from 'react'
import Link from 'next/link'
import { 
  X, 
  Check, 
  AlertCircle, 
  MessageSquare, 
  Image as ImageIcon, 
  Folder, 
  Code
} from 'lucide-react'

interface PricingModalProps {
  isOpen: boolean
  onClose: () => void
  onStartFree: () => void
}

export default function PricingModal({ isOpen, onClose, onStartFree }: PricingModalProps) {
  const [activeTab, setActiveTab] = useState<'monthly' | 'annual'>('monthly')

  if (!isOpen) return null

  return (
    // Full screen, solid background to look like a separate page
    <div className="fixed inset-0 z-[100] flex flex-col bg-white overflow-y-auto">
      
      {/* Top Navigation Bar */}
      <div className="w-full flex items-center justify-between px-6 py-5 sm:px-10">
        {/* Logo */}
        <Link href="/" className="flex items-center flex-shrink-0" onClick={onClose}>
          <span className="text-xl font-bold tracking-tight text-[#0a2540]">
            Taxflow<span className="text-blue-600">.</span>
          </span>
        </Link>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="p-2 text-slate-500 hover:text-slate-900 bg-transparent hover:bg-slate-100 rounded-full transition-all"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 w-full flex flex-col items-center justify-start pt-6 pb-20 px-4 sm:px-6">
        
        {/* Header & Tabs */}
        <div className="text-center mb-10 w-full max-w-2xl">
          <h2 className="text-[28px] sm:text-[32px] font-semibold text-[#0d0d0d] tracking-tight mb-3">
            Upgrade your plan
          </h2>
          
          <p className="text-[13px] text-slate-500 mb-8 max-w-lg mx-auto leading-relaxed">
            Cancel at any time. By subscribing, you agree to the terms for{' '}
            <Link href="/terms" className="text-blue-600 hover:underline">Taxflow</Link> and offers. See how we{' '}
            <Link href="/privacy" className="text-blue-600 hover:underline">handles your data</Link>.
          </p>
          
          {/* Toggle Tabs */}
          <div className="inline-flex items-center p-1 bg-[#f0f1f2] rounded-full">
            <button
              onClick={() => setActiveTab('monthly')}
              className={`px-8 py-2 rounded-full text-[13px] font-medium transition-all ${
                activeTab === 'monthly' 
                  ? 'bg-[#0b57d0] text-white shadow-sm' 
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setActiveTab('annual')}
              className={`px-8 py-2 rounded-full text-[13px] font-medium transition-all ${
                activeTab === 'annual' 
                  ? 'bg-[#0b57d0] text-white shadow-sm' 
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Annual
            </button>
          </div>
        </div>

        {/* Single Card Container (Centered) */}
        <div className="w-full max-w-[420px]">
          
          {/* Free Tier Card */}
          <div className="bg-white rounded-[24px] border border-[#e5e5e5] p-8 flex flex-col relative shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)]">
            
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-[#0d0d0d] mb-1">Free</h3>
              <p className="text-2xl font-bold text-[#0d0d0d] mb-6">Try Taxflow</p>
              <p className="text-[13px] text-slate-500">
                See how our platform works.
              </p>
            </div>

            <div className="mb-8">
              <span className="text-3xl font-bold text-[#0d0d0d]">KES 0</span>
              <span className="text-[13px] text-slate-500 font-medium"> / month</span>
            </div>

            {/* CTA Button */}
            <button 
              onClick={() => {
                onClose()
                onStartFree()
              }}
              className="w-full bg-white border border-[#d1d5db] hover:bg-slate-50 text-[#0d0d0d] font-medium py-3.5 rounded-full transition-all mb-8 text-sm"
            >
              Your current plan
            </button>

            {/* Features List */}
            <div className="flex-1">
              <ul className="space-y-4">
                {[
                  { icon: MessageSquare, text: '15 Free KRA PIN checks per day' },
                  { icon: ImageIcon, text: '5 Free KRA obligation checks per day' },
                  { icon: Folder, text: 'Basic KRA PIN & status verification' },
                  { icon: Code, text: 'No account, password, or sign-up needed' },
                  { icon: Check, text: 'Standard community support' }
                ].map((feature, i) => (
                  <li key={i} className="flex items-center gap-3">
                    <feature.icon className="w-4 h-4 text-[#8e8e8e] flex-shrink-0" strokeWidth={1.5} />
                    <span className="text-[13px] text-[#0d0d0d]">{feature.text}</span>
                  </li>
                ))}
              </ul>

              {/* Warning Note */}
              <div className="mt-8 bg-[#f9f9f9] border border-[#e5e5e5] rounded-xl p-3 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-[#8e8e8e] flex-shrink-0 mt-0.5" />
                <p className="text-[11px] text-[#8e8e8e] leading-relaxed">
                  <strong>Note:</strong> Official PIN certificate download requires a small service fee of KES 25 per document.
                </p>
              </div>
            </div>

            {/* Replaced Footer Note (Free Plan specific) */}
            <div className="mt-8 pt-4 border-t border-[#e5e5e5] text-center">
              <p className="text-[11px] text-[#8e8e8e] leading-relaxed">
                The Free tier is maintained to ensure basic tax services remain accessible to all Kenyans under the{' '}
                <span className="font-semibold">Ushuru Mashinani</span> initiative. No credit card required.
              </p>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}