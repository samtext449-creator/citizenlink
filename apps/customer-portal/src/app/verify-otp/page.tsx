'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function VerifyOtpPage() {
  const router = useRouter()
  const [otp, setOtp] = useState('')
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const pendingEmail = sessionStorage.getItem('pendingEmail')
    if (!pendingEmail) {
      router.replace('/login')
    } else {
      setEmail(pendingEmail)
    }
  }, [router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    const apiUrl = process.env.NEXT_PUBLIC_API_URL

    if (!apiUrl) {
      setError('Configuration error: API URL is missing.')
      return
    }

    setIsLoading(true)

    try {
      const res = await fetch(`${apiUrl}/v1/auth/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include', // ⚠️ CRITICAL: Sends the xeco_otp cookie and receives session cookies
        body: JSON.stringify({ 
          code: otp // ⚠️ IMPORTANT: Your backend expects "code", not "otp"
        }),
      })

      const text = await res.text()
      let data: any = {}
      try { 
        data = text ? JSON.parse(text) : {} 
      } catch {
        setError(`Server error (${res.status}). Please try again.`)
        return
      }

      if (!res.ok) {
        setError(data.message || 'Invalid or expired code.')
        return
      }

      // Success! The backend successfully set the httpOnly xeco_session cookie.
      // We just need to clean up and route to the dashboard.
      sessionStorage.removeItem('pendingEmail')
      sessionStorage.removeItem('rememberMe')
      
      router.push('/dashboard')
      router.refresh()

    } catch (err) {
      console.error(err)
      setError('Something went wrong. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#fafafa] font-sans">
      <div className="w-full max-w-[400px] bg-white p-8 border border-slate-200 shadow-sm rounded-xl text-center">
        
        <div className="flex flex-col items-center mb-6">
          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mb-4">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-[#0a2540] mb-2">Check your email</h1>
          <p className="text-sm text-slate-500">
            We sent a verification code to <br/>
            <strong className="text-slate-800">{email}</strong>
          </p>
        </div>

        {error && (
          <div className="mb-4 rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700 text-left">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              type="text"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))} // Only numbers
              placeholder="Enter 6-digit code"
              maxLength={6}
              className="w-full text-center tracking-[0.5em] text-2xl border border-slate-300 rounded-lg px-4 py-3 text-slate-900 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
              required
            />
          </div>

          <button
            type="submit"
            disabled={isLoading || otp.length < 6}
            className={`w-full font-bold py-3 rounded-lg text-sm transition-colors flex justify-center items-center
              ${isLoading || otp.length < 6
                ? 'bg-slate-200 text-slate-500 cursor-not-allowed'
                : 'bg-[#0a2540] hover:bg-[#0d2f4f] text-white'
              }`}
          >
            {isLoading ? 'Verifying...' : 'Verify Code'}
          </button>
        </form>

        <div className="mt-8 text-center">
          <p className="text-[13px] text-slate-600 font-medium">
            Didn't receive the code?{' '}
            <button type="button" className="text-blue-600 font-bold hover:underline">
              Resend
            </button>
          </p>
          <Link href="/login" className="text-[13px] text-slate-500 hover:text-slate-800 mt-2 inline-block">
            Back to Login
          </Link>
        </div>

      </div>
    </div>
  )
}