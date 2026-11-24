'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const router = useRouter()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [rememberMe, setRememberMe] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    const apiUrl = process.env.NEXT_PUBLIC_API_URL
    if (!apiUrl) {
      setError('Configuration error: API URL is not set.')
      console.error('NEXT_PUBLIC_API_URL is undefined')
      return
    }

    setIsLoading(true)

    try {
      const res = await fetch(`${apiUrl}/v1/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include', // ⚠️ CRITICAL: Saves the xeco_otp cookie from the backend
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          password,
        }),
      })

      // Safely parse JSON or HTML error page
      const text = await res.text()
      let data: any = {}
      try {
        data = text ? JSON.parse(text) : {}
      } catch {
        setError(`Server error (${res.status}). Please try again.`)
        return
      }

      if (!res.ok) {
        setError(data.message || 'Invalid email or password.')
        return
      }

      // ── Handle OTP Requirement ──
      if (data.requiresOTP) {
        // Save the email so the OTP page knows who is verifying
        sessionStorage.setItem('pendingEmail', email.trim().toLowerCase())
        sessionStorage.setItem('rememberMe', String(rememberMe))
        
        // Redirect to the OTP page
        router.push('/verify-otp')
        return // Stop execution here, do not look for a token yet
      }

      // ── Normal Flow (If your backend ever skips OTP) ──
      // Note: Since your backend uses httpOnly cookies, the token isn't in the JSON response.
      // If it succeeds without OTP, we just redirect to the dashboard.
      router.push('/dashboard')
      router.refresh()

    } catch (err) {
      console.error(err)
      setError('Something went wrong. Please check your connection and try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#fafafa] font-sans">
      <div className="w-full max-w-[460px] bg-white p-8 sm:p-10 border border-slate-200 shadow-sm rounded-xl">

        {/* Logo */}
        <div className="flex flex-col items-center mb-10">
          <div className="w-16 h-16 bg-[#0a2540] rounded-2xl flex items-center justify-center mb-4 shadow-md">
            <svg className="w-8 h-8 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
              <path d="M8 11l3 3 5-5"></path>
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-[#0a2540] tracking-tight">
            Log in to Taxflow
          </h1>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-4 rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Email */}
          <div>
            <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">
              Email address or ID number <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setError('') }}
              placeholder="Enter your Email address or ID number"
              className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm font-medium text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-all"
              required
            />
          </div>

          {/* Password */}
          <div>
            <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">
              Password <span className="text-red-500">*</span>
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError('') }}
              placeholder="••••••••••••"
              className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm font-medium text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-all"
              required
            />
          </div>

          {/* Remember + Forgot */}
          <div className="flex items-center justify-between pt-1">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-600"
              />
              <span className="text-[13px] text-slate-700 font-semibold">Remember Me</span>
            </label>
            <Link href="/forgot-password" className="text-[13px] text-blue-600 font-bold hover:underline">
              Forgot Password
            </Link>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={isLoading}
            className={`w-full font-bold py-3 rounded-lg mt-2 text-sm flex items-center justify-center transition-colors
              ${isLoading
                ? 'bg-slate-200 text-slate-500 cursor-not-allowed'
                : 'bg-[#0a2540] hover:bg-[#0d2f4f] text-white'
              }`}
          >
            {isLoading ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Logging in...
              </>
            ) : (
              'Log in'
            )}
          </button>
        </form>

        {/* Divider */}
        <div className="relative flex items-center justify-center my-6">
          <div className="flex-grow border-t border-slate-200"></div>
          <span className="flex-shrink-0 mx-4 text-[13px] font-semibold text-slate-400">
            Or continue with
          </span>
          <div className="flex-grow border-t border-slate-200"></div>
        </div>

        {/* Google */}
        <button
          type="button"
          onClick={() => alert('Google login clicked')}
          className="w-full flex items-center justify-center gap-3 border border-slate-300 rounded-lg py-3 hover:bg-slate-50 transition-colors text-sm font-bold text-slate-700"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
          </svg>
          Log in with Google
        </button>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-[13px] text-slate-600 font-medium">
            Need an account?{' '}
            <Link href="/signup" className="text-blue-600 font-bold hover:underline">
              Sign Up
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}