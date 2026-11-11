'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Mail, Phone, Lock, Eye, EyeOff, ChevronDown, User } from 'lucide-react'

export default function SignupPage() {
  const [formData, setFormData] = useState({
    accountType: 'individual', 
    fullName: '',
    phone: '',
    email: '',
    password: '',
    confirmPassword: '',
  })
  
  const [showPassword, setShowPassword] = useState(false)
  const [agreedToTerms, setAgreedToTerms] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    // Button is disabled, so this won't trigger for now
    console.log(formData)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#f8f9fb] font-sans py-12 px-4">
      
      {/* ──────── MAIN CARD ──────── */}
      <div className="w-full max-w-[480px] bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
        
        {/* Header Title */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-[#0d0d0d] tracking-tight mb-2">
            Sign up to Taxflow
          </h1>
          <p className="text-[13px] text-slate-500 leading-relaxed max-w-xs mx-auto">
            Create your account to sync all your tax obligations and stay compliant.
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Google Button */}
        <button
          type="button"
          onClick={() => alert('Google sign up clicked')}
          className="w-full flex items-center justify-center gap-3 bg-white border border-[#dadce0] hover:bg-slate-50 text-[#3c4043] font-medium py-2.5 rounded-lg transition-all text-sm mb-6"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
          </svg>
          Continue with Google
        </button>

        {/* Divider */}
        <div className="relative flex items-center justify-center mb-6">
          <div className="flex-grow border-t border-slate-100"></div>
          <span className="flex-shrink-0 mx-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            or
          </span>
          <div className="flex-grow border-t border-slate-100"></div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Account Type */}
          <div>
            <label className="block text-[12px] font-semibold text-slate-700 mb-1">
              Account Type <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <select
                name="accountType"
                value={formData.accountType}
                onChange={handleChange}
                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-slate-900 appearance-none focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all cursor-pointer"
              >
                <option value="individual">Individual</option>
                <option value="business">Business</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            </div>
          </div>

          {/* Full Name */}
          <div>
            <label className="block text-[12px] font-semibold text-slate-700 mb-1">
              Full Name <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <input
                type="text"
                name="fullName"
                required
                value={formData.fullName}
                onChange={handleChange}
                placeholder="John Doe"
                className="w-full bg-white border border-slate-200 rounded-lg pl-9 pr-3 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all"
              />
            </div>
          </div>

          {/* Phone Number */}
          <div>
            <label className="block text-[12px] font-semibold text-slate-700 mb-1">
              Phone Number <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <input
                type="tel"
                name="phone"
                required
                value={formData.phone}
                onChange={handleChange}
                placeholder="0712 345 678"
                className="w-full bg-white border border-slate-200 rounded-lg pl-9 pr-3 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all"
              />
            </div>
          </div>

          {/* Email Address */}
          <div>
            <label className="block text-[12px] font-semibold text-slate-700 mb-1">
              Email Address <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <input
                type="email"
                name="email"
                required
                value={formData.email}
                onChange={handleChange}
                placeholder="you@example.com"
                className="w-full bg-white border border-slate-200 rounded-lg pl-9 pr-3 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all"
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="block text-[12px] font-semibold text-slate-700 mb-1">
              Password <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                required
                value={formData.password}
                onChange={handleChange}
                placeholder="••••••••"
                className="w-full bg-white border border-slate-200 rounded-lg pl-9 pr-9 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all"
              />
            </div>
          </div>

          {/* Confirm Password */}
          <div>
            <label className="block text-[12px] font-semibold text-slate-700 mb-1">
              Confirm Password <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                name="confirmPassword"
                required
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="••••••••"
                className="w-full bg-white border border-slate-200 rounded-lg pl-9 pr-9 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          {/* Terms Checkbox */}
          <div className="pt-2">
            <label className="flex items-start gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={agreedToTerms}
                onChange={(e) => {
                  setAgreedToTerms(e.target.checked)
                  if (e.target.checked) setError('')
                }}
                className="mt-0.5 h-4 w-4 rounded border-slate-300 text-[#0a2540] focus:ring-[#0a2540] cursor-pointer"
              />
              <span className="text-[12px] text-slate-600 leading-snug">
                I agree to submit my information and accept the{' '}
                <Link href="/terms" className="text-blue-600 hover:underline font-medium">Terms</Link> and{' '}
                <Link href="/privacy" className="text-blue-600 hover:underline font-medium">Privacy Policy</Link>.
              </span>
            </label>
          </div>

          {/* Submit Button (Disabled for now) */}
          <button
            type="submit"
            disabled={true}
            className="w-full text-slate-500 font-bold py-3 rounded-lg transition-colors mt-2 text-sm bg-slate-200 cursor-not-allowed flex items-center justify-center"
          >
            Register
          </button>
        </form>

      </div>

      {/* ──────── BOTTOM LINK ──────── */}
      <div className="mt-8 text-center">
        <p className="text-[13px] text-slate-600 font-medium">
          Already have an account?{' '}
          <Link href="/login" className="text-blue-600 font-bold hover:underline">
            Log in
          </Link>
        </p>
      </div>

    </div>
  )
}