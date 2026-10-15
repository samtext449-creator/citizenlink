'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import {
  ArrowRight,
  ChevronRight,
  CreditCard,
  FileText,
  X,
  CheckCircle,
  Clock,
  Download,
  Search,
  Timer,
  Menu,
  AlertCircle,
  MapPin,
  Navigation,
  ExternalLink,
  Zap,
  PlayCircle,
  Shield,
  ShieldCheck,
  FileSearch,
  Workflow as WorkflowIcon,
  Database,
  Code,
  Link2,
  Network,
  Activity,
  Send,
  Save,
  Check,
  Settings,
  LayoutGrid,
  type LucideIcon,
} from 'lucide-react'
import { getKraErrorMessage } from '@/lib/krataxErrors'

// ─── Config ─────────────
const XECOFLOW_PAY_BASE = process.env.NEXT_PUBLIC_XECOFLOW_PAY_URL || 'https://xecoflow-pay.onrender.com'

const TAXPAYER_TYPES = [
  { label: 'Kenyan Citizen', code: 'KE' },
  { label: 'Kenyan Resident', code: 'NKE' },
  { label: 'Non-Resident', code: 'NKENR' },
  { label: 'Company', code: 'COMP' },
]

const CANVAS_W = 760
const CANVAS_H = 610

interface PinResult {
  kraPin: string
  taxpayerName: string
  taxpayerType: string
  taxpayerId: string
}

export default function CitizenLinkAfrica() {
  const [isLoaded, setIsLoaded] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  // Location
  const [userLocation, setUserLocation] = useState<{ lat: number, lng: number } | null>(null)
  const [locationError, setLocationError] = useState('')
  const [isLocating, setIsLocating] = useState(false)

  // Modals
  const [showKRAPopup, setShowKRAPopup] = useState(false)
  const [showCheckStatus, setShowCheckStatus] = useState(false)
  const [showPayment, setShowPayment] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [showComingSoon, setShowComingSoon] = useState(false)
  const [comingSoonTitle, setComingSoonTitle] = useState('')
  const [showFindPINForm, setShowFindPINForm] = useState(false)
  const [showNearestCyberForm, setShowNearestCyberForm] = useState(false)

  // Find KRA PIN
  const [pinId, setPinId] = useState('')
  const [taxpayerType, setTaxpayerType] = useState('KE')
  const [isLoadingPin, setIsLoadingPin] = useState(false)
  const [showPinResult, setShowPinResult] = useState(false)
  const [pinResult, setPinResult] = useState<PinResult | null>(null)
  const [pinError, setPinError] = useState('')
  const [copied, setCopied] = useState(false)

  // Opt-in (compact)
  const [optIn, setOptIn] = useState(false)
  const [subEmail, setSubEmail] = useState('')
  const [subscribeStatus, setSubscribeStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')

  // Tracking
  const [trackingNumber, setTrackingNumber] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [orderStatus, setOrderStatus] = useState('')
  const [showOrderResult, setShowOrderResult] = useState(false)
  const [isSearching, setIsSearching] = useState(false)

  // Countdown
  const TOTAL_SECONDS = 75
  const [countdown, setCountdown] = useState(TOTAL_SECONDS)
  const [isCounting, setIsCounting] = useState(false)
  const [isReady, setIsReady] = useState(false)
  const [countdownStartTime, setCountdownStartTime] = useState<number | null>(null)

  // Forms
  const [paymentData, setPaymentData] = useState({ phoneNumber: '', amount: 25 })

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const urlTracking = urlParams.get('ref')
    if (urlTracking) {
      setTrackingNumber(urlTracking)
      setSearchInput(urlTracking)
      setTimeout(() => handleTrackRequest(urlTracking), 500)
    } else {
      const savedTracking = localStorage.getItem('citizenlink_last_reference')
      if (savedTracking) {
        setTrackingNumber(savedTracking)
        setSearchInput(savedTracking)
      }
    }
    const savedCountdown = localStorage.getItem('citizenlink_countdown_state')
    if (savedCountdown) {
      try {
        const state = JSON.parse(savedCountdown)
        const elapsed = Math.floor((Date.now() - state.startTime) / 1000)
        const remaining = Math.max(0, state.totalSeconds - elapsed)
        if (remaining > 0) {
          setCountdown(remaining)
          setIsCounting(true)
          setCountdownStartTime(state.startTime)
          if (state.trackingNumber) {
            setTrackingNumber(state.trackingNumber)
            setSearchInput(state.trackingNumber)
            setOrderStatus(`Processing... ${formatTime(remaining)} remaining`)
          }
        } else if (remaining === 0 && state.trackingNumber) {
          setIsCounting(false)
          setIsReady(true)
          setOrderStatus('Ready for Download')
          localStorage.removeItem('citizenlink_countdown_state')
          localStorage.setItem('citizenlink_completed_state', JSON.stringify({
            trackingNumber: state.trackingNumber, completed: true, timestamp: Date.now()
          }))
        }
      } catch (e) { console.error('Error restoring countdown state:', e) }
    }
    const savedCompleted = localStorage.getItem('citizenlink_completed_state')
    if (savedCompleted) {
      try {
        const completedState = JSON.parse(savedCompleted)
        if (completedState.completed && completedState.trackingNumber) {
          setIsReady(true)
          setIsCounting(false)
          setTrackingNumber(completedState.trackingNumber)
          setSearchInput(completedState.trackingNumber)
          setOrderStatus('Ready for Download')
        }
      } catch (e) { console.error('Error restoring completed state:', e) }
    }
    setIsLoaded(true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (trackingNumber) localStorage.setItem('citizenlink_last_reference', trackingNumber)
  }, [trackingNumber])

  useEffect(() => {
    if (isCounting && trackingNumber && countdownStartTime) {
      localStorage.setItem('citizenlink_countdown_state', JSON.stringify({
        startTime: countdownStartTime,
        totalSeconds: TOTAL_SECONDS,
        trackingNumber,
        isReady,
      }))
    }
  }, [isCounting, countdown, trackingNumber, countdownStartTime, isReady])

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null
    if (isCounting && countdown > 0) {
      interval = setInterval(() => {
        setCountdown((prev) => {
          const newValue = prev - 1
          if (newValue <= 0) {
            setIsCounting(false)
            setIsReady(true)
            setOrderStatus('Ready for Download')
            localStorage.removeItem('citizenlink_countdown_state')
            localStorage.setItem('citizenlink_completed_state', JSON.stringify({
              trackingNumber, completed: true, timestamp: Date.now()
            }))
            return 0
          }
          setOrderStatus(`Processing... ${formatTime(newValue)} remaining`)
          return newValue
        })
      }, 1000)
    }
    return () => { if (interval) clearInterval(interval) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isCounting, countdown, trackingNumber])

  const handleFindNearestCyber = () => {
    setShowNearestCyberForm(true)
    setIsLocating(true)
    setLocationError('')
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by your browser')
      setIsLocating(false)
      return
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation({ lat: position.coords.latitude, lng: position.coords.longitude })
        setIsLocating(false)
      },
      () => {
        setLocationError('Unable to retrieve your location. Please enable location access.')
        setIsLocating(false)
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    )
  }

  const fireSubscribe = (identifier: string, fullName: string) => {
    if (!optIn || !subEmail.trim()) return
    setSubscribeStatus('saving')

    console.log('[XecoNotify MOCK] subscribe payload:', {
      full_name: fullName,
      identifier,
      email: subEmail.trim(),
      source_app: 'taxflow_africa',
      opt_in_marketing: true,
      channels: ['email'],
    })

    setTimeout(() => setSubscribeStatus('saved'), 400)
  }

  const handlePinSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!pinId.trim()) return

    if (optIn && !subEmail.trim()) {
      setPinError('Please enter your email to receive updates, or uncheck the box.')
      return
    }

    setIsLoadingPin(true)
    setShowPinResult(false)
    setPinError('')
    setPinResult(null)
    setSubscribeStatus('idle')

    try {
      const res = await fetch(`${XECOFLOW_PAY_BASE}/api/kratax/pin/fetch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taxpayerType, taxpayerId: pinId.trim() }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok || !data.success) {
        setPinError(getKraErrorMessage(data, res.status))
        return
      }
      const result: PinResult = {
        kraPin: data.data.kraPin,
        taxpayerName: data.data.taxpayerName,
        taxpayerType: data.data.taxpayerType,
        taxpayerId: data.data.taxpayerId,
      }
      setPinResult(result)
      setShowPinResult(true)

      fireSubscribe(result.kraPin, result.taxpayerName)
    } catch (err) {
      console.error('[KRA PIN] fetch error', err)
      setPinError('Network error. Please check your connection and try again.')
    } finally {
      setIsLoadingPin(false)
    }
  }

  const handleCopyPin = () => {
    if (!pinResult) return
    navigator.clipboard.writeText(pinResult.kraPin)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const resetPinForm = () => {
    setPinId('')
    setTaxpayerType('KE')
    setShowPinResult(false)
    setIsLoadingPin(false)
    setPinError('')
    setPinResult(null)
    setCopied(false)
    setOptIn(false)
    setSubEmail('')
    setSubscribeStatus('idle')
  }

  const maskName = (name: string) => {
    if (!name) return ''
    const parts = name.trim().split(/\s+/)
    return parts.map((part, index) => {
      if (index === 0) return part
      if (part.length <= 1) return part
      return part[0] + '*'.repeat(part.length - 1)
    }).join(' ')
  }

  // ── Free tools (single card in the hero) ──
  const freeTools = [
    {
      title: 'Find My KRA PIN',
      tag: 'Free',
      icon: Search,
      isActive: true,
      onClick: () => setShowFindPINForm(true),
    },
    {
      title: 'Verify KRA PIN',
      tag: 'Soon',
      icon: ShieldCheck,
      isActive: false,
      onClick: () => { setComingSoonTitle('Verify KRA PIN'); setShowComingSoon(true) },
    },
    {
      title: 'Tax Compliance Certificate',
      tag: 'Soon',
      icon: FileSearch,
      isActive: false,
      onClick: () => { setComingSoonTitle('Tax Compliance Certificate'); setShowComingSoon(true) },
    },
    {
      title: 'Check My Obligations',
      tag: 'Soon',
      icon: FileText,
      isActive: false,
      onClick: () => { setComingSoonTitle('Check My Obligations'); setShowComingSoon(true) },
    },
  ]

  // ── Top nav — human, natural labels ──
  const topNav = ['Workflows', 'Developers', 'Community', 'Resources']

  const scrollToTools = () => {
    const el = document.getElementById('free-tools')
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }

  const handlePaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setShowPayment(false)
    setShowFindPINForm(false)
    const year = new Date().getFullYear()
    const randomNum = Math.floor(Math.random() * 1000).toString().padStart(3, '0')
    const trackNo = `CLA-${year}-${randomNum}`
    setTrackingNumber(trackNo)
    setSearchInput(trackNo)
    localStorage.setItem('citizenlink_last_reference', trackNo)
    const url = new URL(window.location.href)
    url.searchParams.set('ref', trackNo)
    window.history.pushState({}, '', url.toString())
    const startTime = Date.now()
    setCountdownStartTime(startTime)
    setCountdown(TOTAL_SECONDS)
    setIsReady(false)
    setOrderStatus(`Processing... ${formatTime(TOTAL_SECONDS)} remaining`)
    setIsCounting(true)
    localStorage.setItem('citizenlink_countdown_state', JSON.stringify({
      startTime, totalSeconds: TOTAL_SECONDS, trackingNumber: trackNo, isReady: false,
    }))
    setShowSuccess(true)
  }

  const handleTrackRequest = (input?: string) => {
    const searchTerm = input || searchInput
    if (!searchTerm || searchTerm.trim() === '') {
      alert('Please enter a Reference Number or M-Pesa Receipt Number')
      return
    }
    setIsSearching(true)
    setTimeout(() => {
      setIsSearching(false)
      const savedCompleted = localStorage.getItem('citizenlink_completed_state')
      if (savedCompleted) {
        try {
          const completedState = JSON.parse(savedCompleted)
          if (completedState.trackingNumber === searchTerm && completedState.completed) {
            setOrderStatus('Ready for Download')
            setIsReady(true)
            setIsCounting(false)
            setShowOrderResult(true)
            setTrackingNumber(searchTerm)
            localStorage.setItem('citizenlink_last_reference', searchTerm)
            return
          }
        } catch (e) { console.error('Error parsing completed state:', e) }
      }
      const savedCountdown = localStorage.getItem('citizenlink_countdown_state')
      let remainingTime = 0
      let isDocReady = false
      if (savedCountdown) {
        try {
          const state = JSON.parse(savedCountdown)
          if (state.trackingNumber === searchTerm) {
            const elapsed = Math.floor((Date.now() - state.startTime) / 1000)
            remainingTime = Math.max(0, state.totalSeconds - elapsed)
            isDocReady = remainingTime === 0
          }
        } catch (e) { console.error('Error parsing countdown state:', e) }
      }
      if (isDocReady) {
        setOrderStatus('Ready for Download')
        setIsReady(true)
        setIsCounting(false)
        localStorage.removeItem('citizenlink_countdown_state')
        localStorage.setItem('citizenlink_completed_state', JSON.stringify({
          trackingNumber: searchTerm, completed: true, timestamp: Date.now()
        }))
      } else if (remainingTime > 0) {
        setOrderStatus(`Processing... ${formatTime(remainingTime)} remaining`)
        setIsCounting(true)
        setIsReady(false)
        setCountdown(remainingTime)
      } else {
        setOrderStatus('Processing')
      }
      setShowOrderResult(true)
      setTrackingNumber(searchTerm)
      localStorage.setItem('citizenlink_last_reference', searchTerm)
    }, 1500)
  }

  const handleDownload = () => alert('📄 Your KRA certificate is downloading...')

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
  }

  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* ──────── HEADER ──────── */}
      <header className="sticky top-0 z-50 w-full">
        {/* Amber disclaimer */}
        <div className="w-full bg-[#FBBF24]">
          <div className="max-w-[1550px] mx-auto px-3 sm:px-6 lg:px-8">
            <div className="flex items-center justify-center gap-2 py-2.5">
              <Shield className="h-4 w-4 text-[#3b2a05] fill-[#3b2a05]/20 flex-shrink-0" />
              <span className="text-[10px] sm:text-[13px] text-[#3b2a05] text-center leading-tight">
                <span className="font-bold">Authorized Ushuru Mashinani Partner:</span> Taxflow Africa is operated by Xeco Developers under Ushuru Mashinani.
              </span>
            </div>
          </div>
        </div>

        {/* Navy nav bar */}
        <div className="w-full bg-gradient-to-r from-[#0b1a73] via-[#1a2fb0] to-[#3548e6] shadow-lg">
          <div className="max-w-[1550px] mx-auto px-3 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16 sm:h-20 gap-4">

              {/* Left cluster: logo + Personal/Business toggle */}
              <div className="flex items-center gap-5 flex-shrink-0">
                <div className="flex items-center gap-3">
                  <LogoMark className="w-9 h-7 sm:w-11 sm:h-8" gradientId="logo-nav" />
                  <span className="text-2xl sm:text-[34px] font-extrabold tracking-tight text-white whitespace-nowrap leading-none">
                    Taxflow <span className="text-[#3fa9ff]">Africa</span>
                  </span>
                </div>

                {/* Personal / Business toggle */}
                <div className="hidden md:inline-flex items-center rounded-full border border-white/25 bg-white/10 p-0.5">
                  <button
                    type="button"
                    className="inline-flex items-center px-4 h-8 rounded-full text-[13px] font-semibold text-white bg-gradient-to-r from-[#2f5bf0] to-[#4a63f5] shadow-sm"
                    aria-current="true"
                  >
                    Business Solution
                  </button>
                  <Link
                    href="/personal"
                    className="inline-flex items-center px-4 h-8 rounded-full text-[13px] font-semibold text-white/75 hover:text-white transition-colors"
                  >
                    Personal
                  </Link>
                </div>
              </div>

              {/* Center nav — desktop */}
              <nav className="hidden lg:flex items-center gap-8">
                {topNav.map((label) => (
                  <button
                    key={label}
                    className="text-[15px] font-medium text-white/95 hover:text-white transition-colors"
                  >
                    {label}
                  </button>
                ))}
              </nav>

              {/* Right */}
              <div className="flex items-center gap-3 flex-shrink-0">
                <button
                  type="button"
                  disabled
                  aria-disabled="true"
                  className="hidden sm:inline-flex items-center justify-center px-6 h-[43px] text-base font-semibold text-white border border-white/70 rounded-full cursor-not-allowed"
                >
                  Sign in
                </button>
                <button
                  type="button"
                  disabled
                  aria-disabled="true"
                  className="hidden sm:inline-flex items-center justify-center px-6 h-[43px] text-base font-semibold text-white bg-gradient-to-r from-[#2f5bf0] to-[#4a63f5] rounded-full shadow-lg shadow-blue-900/30 cursor-not-allowed"
                >
                  Get started
                </button>

                {/* Mobile menu button */}
                <button
                  className="lg:hidden p-2 rounded-lg hover:bg-white/10 transition-colors"
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                  aria-label="Menu"
                >
                  <Menu className="h-5 w-5 text-white" />
                </button>
              </div>
            </div>

            {/* Mobile menu */}
            {isMobileMenuOpen && (
              <div className="lg:hidden py-3 border-t border-white/10">
                {/* Personal / Business toggle — mobile */}
                <div className="mb-3 inline-flex items-center rounded-full border border-white/25 bg-white/10 p-0.5">
                  <button
                    type="button"
                    className="inline-flex items-center px-4 h-8 rounded-full text-[13px] font-semibold text-white bg-gradient-to-r from-[#2f5bf0] to-[#4a63f5]"
                    aria-current="true"
                  >
                    Personal
                  </button>
                  <Link
                    href="/business"
                    className="inline-flex items-center px-4 h-8 rounded-full text-[13px] font-semibold text-white/75"
                  >
                    Business
                  </Link>
                </div>

                <nav className="grid grid-cols-1 gap-1">
                  {topNav.map((label) => (
                    <button
                      key={label}
                      className="w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium text-white hover:bg-white/10 transition-colors"
                    >
                      {label}
                    </button>
                  ))}
                  <div className="pt-2 mt-2 border-t border-white/10 flex gap-2">
                    <button className="flex-1 px-3 py-2 rounded-full text-sm font-semibold text-white border border-white/70">
                      Sign in
                    </button>
                    <button
                      onClick={() => { setIsMobileMenuOpen(false); scrollToTools() }}
                      className="flex-1 px-3 py-2 rounded-full text-sm font-semibold text-white bg-gradient-to-r from-[#2f5bf0] to-[#4a63f5]"
                    >
                      Get started
                    </button>
                  </div>
                </nav>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ──────── HERO ──────── */}
      <main className="flex-1 w-full bg-white">
        <section className="relative overflow-hidden bg-gradient-to-b from-[#f3f6ff] via-[#f7f9ff] to-white">
          {/* Decorative arcs */}
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute -bottom-40 -left-44 w-[520px] h-[520px] rounded-full border border-blue-200/60" />
            <div className="absolute -bottom-56 -left-56 w-[680px] h-[680px] rounded-full border border-blue-100/70" />
            <div className="absolute -bottom-40 -right-32 w-[420px] h-[420px] rounded-full bg-gradient-to-tr from-indigo-100/60 to-transparent" />
          </div>

          <div className="relative max-w-[1550px] mx-auto px-4 sm:px-6 lg:px-8 pt-10 sm:pt-14 lg:pt-16 pb-10 sm:pb-14">
            <div className={`grid grid-cols-1 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] gap-12 items-center transition-all duration-700 ease-out ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>

              {/* LEFT — copy */}
              <div>
                <div className="inline-flex items-center gap-2.5 bg-[#eaf0ff] border border-[#cddbfb] text-[#2a3bd0] text-[10px] sm:text-[11.5px] font-bold px-4 h-9 rounded-full mb-7 tracking-[0.16em] uppercase">
                  <Zap className="w-4 h-4 fill-[#2a3bd0]" />
                  TAX AUTOMATION SOLUTION FOR BUSINESS
                </div>

                <h1 className="text-[52px] sm:text-[68px] lg:text-[60px] xl:text-[76px] 2xl:text-[88px] font-extrabold text-[#0b1140] leading-[1.02] mb-7 tracking-[-0.045em]">
                  Tax compliance.
                  <br />
                  <span className="bg-gradient-to-r from-[#1d6bf3] via-[#4a45ee] to-[#8b3cf0] bg-clip-text text-transparent">
                    On autopilot.
                  </span>
                </h1>

                <p className="text-base sm:text-lg xl:text-[21px] text-[#4b5675] mb-9 leading-[1.7] max-w-[610px]">
                  Build smarter tax workflows, connect your business systems,
                  and simplify compliance operations — from one automation
                  platform.
                </p>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 mb-8">
                  <button
                    type="button"
                    disabled
                    aria-disabled="true"
                    className="inline-flex items-center justify-center gap-3 bg-[#2347e6] text-white px-8 h-[58px] rounded-xl font-semibold text-base sm:text-lg shadow-lg shadow-blue-600/25 cursor-not-allowed"
                  >
                    <ArrowRight className="w-6 h-6" />
                    Explore the platform
                  </button>
                  <button
                    type="button"
                    disabled
                    aria-disabled="true"
                    className="inline-flex items-center justify-center gap-3 bg-white/60 border border-[#3b5bf0] text-[#0b1140] px-8 h-[58px] rounded-xl font-semibold text-base sm:text-lg cursor-not-allowed"
                  >
                    <PlayCircle className="w-6 h-6 text-[#2347e6]" />
                    See how it works
                  </button>
                </div>

                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm sm:text-[15px] text-[#5d6a8a]">
                  <span>Workflow automation</span>
                  <span className="text-slate-400">·</span>
                  <span>API integrations</span>
                  <span className="text-slate-400">·</span>
                  <span>Compliance operations</span>
                </div>

                {/* Free tools — one card */}
                <div
                  id="free-tools"
                  className="mt-10 max-w-[600px] rounded-2xl border border-[#e3e9f6] bg-white shadow-[0_16px_40px_-20px_rgba(40,60,160,0.2)] overflow-hidden"
                >
                  <div className="flex items-center justify-between px-5 h-12 border-b border-slate-100">
                    <h2 className="text-[15px] font-bold text-[#0b1140]">Free tools to try</h2>
                    <span className="text-[12px] text-slate-500">No signup needed</span>
                  </div>
                  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-px bg-slate-100">
                    {freeTools.map((tool) => {
                      const Icon = tool.icon
                      return (
                        <li key={tool.title} className="bg-white">
                          <button
                            onClick={tool.onClick}
                            className="group w-full h-full flex items-center gap-3 px-4 py-4 text-left hover:bg-slate-50 transition-colors"
                          >
                            <span className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                              tool.isActive ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-500'
                            }`}>
                              <Icon className="w-[18px] h-[18px]" />
                            </span>
                            <span className="min-w-0 flex-1">
                              <span className={`block text-[14px] font-semibold leading-snug ${
                                tool.isActive ? 'text-[#0b1140]' : 'text-slate-700'
                              }`}>
                                {tool.title}
                              </span>
                              <span className="mt-1.5 flex items-center gap-2">
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                                  tool.isActive ? 'text-blue-700 bg-blue-100' : 'text-slate-500 bg-slate-100'
                                }`}>
                                  {tool.tag}
                                </span>
                                <span className={`inline-flex items-center gap-1 text-xs font-semibold whitespace-nowrap ${
                                  tool.isActive ? 'text-blue-600' : 'text-slate-400'
                                }`}>
                                  {tool.isActive ? 'Open tool' : 'Notify me'}
                                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                                </span>
                              </span>
                            </span>
                          </button>
                        </li>
                      )
                    })}
                  </ul>
                </div>
              </div>

              {/* RIGHT — workflow card */}
              <div className="relative min-w-0">
                <WorkflowCard />
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* ──────── FOOTER ──────── */}
      <footer className="w-full bg-slate-900 text-slate-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-[11px] sm:text-xs text-center">
            <span className="font-bold text-white">
              Taxflow <span className="text-blue-300">Africa</span>
            </span>
            <span className="text-slate-600">|</span>
            <span className="text-slate-400">
              © {new Date().getFullYear()} All rights reserved.
            </span>
            <span className="text-slate-600">|</span>
            <Link href="/terms" className="text-slate-300 hover:text-white transition-colors">
              Terms &amp; Conditions
            </Link>
            <span className="text-slate-600">|</span>
            <Link href="/privacy" className="text-slate-300 hover:text-white transition-colors">
              Privacy Policy
            </Link>
            <span className="text-slate-600">|</span>
            <span className="text-slate-400">
              Official KRA Ushuru Mashinani Partner.
            </span>
          </div>
        </div>
      </footer>

      {/* ════════════════ MODALS ════════════════ */}

      {/* Find Nearest Cyber */}
      {showNearestCyberForm && (
        <ModalOverlay onClose={() => setShowNearestCyberForm(false)} size="large">
          <div className="text-center mb-6 sm:mb-8">
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl p-4 w-14 h-14 sm:w-16 sm:h-16 flex items-center justify-center mx-auto mb-4 sm:mb-5">
              <MapPin className="h-7 w-7 sm:h-8 sm:w-8 text-white" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">Find Nearest Cyber/Print Point</h2>
            <p className="text-sm sm:text-base text-gray-500 mt-2">Locate cybercafés or print shops near your current location</p>
          </div>

          {isLocating ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-500">Getting your location...</p>
            </div>
          ) : locationError ? (
            <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
              <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-3" />
              <p className="text-red-700 font-semibold mb-2">Location Error</p>
              <p className="text-sm text-red-600">{locationError}</p>
              <button onClick={handleFindNearestCyber} className="mt-4 bg-red-600 text-white px-6 py-2 rounded-lg text-sm font-semibold hover:bg-red-700">
                Try Again
              </button>
            </div>
          ) : userLocation ? (
            <div>
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
                <div className="flex items-center gap-2 mb-2">
                  <Navigation className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-semibold text-gray-700">Your Location</span>
                </div>
                <p className="text-xs text-gray-500 font-mono">
                  Lat: {userLocation.lat.toFixed(4)}, Lng: {userLocation.lng.toFixed(4)}
                </p>
              </div>

              <div className="space-y-3">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Nearby Cybercafés &amp; Print Points</p>
                {[
                  { name: 'Cyber Hub Kenya', dist: '0.3 km', address: 'Tom Mboya Street' },
                  { name: 'Digital Point Cyber', dist: '0.8 km', address: 'Moi Avenue' },
                  { name: 'E-Solutions Cyber', dist: '1.2 km', address: 'Kenyatta Avenue' },
                  { name: 'Quick Print & Cyber', dist: '1.5 km', address: 'River Road' },
                ].map((cyber, i) => (
                  <div key={i} className="flex items-start justify-between p-3 bg-white border border-gray-200 rounded-xl">
                    <div>
                      <p className="font-semibold text-gray-800 text-sm">{cyber.name}</p>
                      <p className="text-xs text-gray-400">{cyber.address}</p>
                    </div>
                    <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-full">{cyber.dist}</span>
                  </div>
                ))}
                <a
                  href={`https://www.google.com/maps/search/cybercafe/@${userLocation.lat},${userLocation.lng},14z`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full mt-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3.5 sm:py-4 rounded-xl font-semibold hover:from-blue-700 hover:to-blue-800 transition-all flex items-center justify-center gap-2 text-base sm:text-lg shadow-lg shadow-blue-100"
                >
                  <ExternalLink className="h-5 w-5" />
                  Open in Google Maps
                </a>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500 mb-4">Click the button below to find cybercafés or print points near you.</p>
              <button onClick={handleFindNearestCyber} className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-8 py-4 rounded-xl font-semibold hover:from-blue-700 hover:to-blue-800 transition-all text-base sm:text-lg shadow-lg shadow-blue-100">
                Locate Me
              </button>
            </div>
          )}
        </ModalOverlay>
      )}

      {/* Coming Soon */}
      {showComingSoon && (
        <ModalOverlay onClose={() => setShowComingSoon(false)} size="large">
          <div className="text-center">
            <div className="bg-gradient-to-r from-amber-500 to-orange-500 rounded-full w-20 h-20 sm:w-24 sm:h-24 flex items-center justify-center mx-auto mb-5 sm:mb-6">
              <Clock className="h-10 w-10 sm:h-12 sm:w-12 text-white" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">Coming Soon!</h2>
            <p className="text-sm sm:text-base text-gray-500 mt-2">
              <span className="font-semibold text-gray-700">{comingSoonTitle}</span> are currently in development.
            </p>
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mt-6">
              <div className="flex items-center justify-center gap-2">
                <AlertCircle className="h-5 w-5 text-amber-500" />
                <span className="text-sm text-amber-700">This feature will be available soon</span>
              </div>
            </div>
            <button onClick={() => setShowComingSoon(false)} className="w-full mt-6 bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3.5 sm:py-4 rounded-xl font-semibold hover:from-blue-700 hover:to-blue-800 transition-all text-base sm:text-lg shadow-lg shadow-blue-100">
              Got it
            </button>
          </div>
        </ModalOverlay>
      )}

      {/* KRA Popup */}
      {showKRAPopup && (
        <ModalOverlay onClose={() => setShowKRAPopup(false)} size="large">
          <div className="text-center mb-6 sm:mb-8">
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl p-4 w-14 h-14 sm:w-16 sm:h-16 flex items-center justify-center mx-auto mb-4 sm:mb-5">
              <FileText className="h-7 w-7 sm:h-8 sm:w-8 text-white" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">KRA Tax Services</h2>
          </div>
          <div className="space-y-3 sm:space-y-4">
            <button
              onClick={() => { setShowKRAPopup(false); setShowCheckStatus(true) }}
              className="w-full flex items-center justify-between p-4 sm:p-5 bg-purple-50 hover:bg-purple-100 rounded-xl transition-all border-2 border-transparent hover:border-purple-200"
            >
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="bg-gradient-to-r from-purple-600 to-purple-700 rounded-xl p-2.5">
                  <Search className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                </div>
                <div className="text-left">
                  <span className="font-semibold text-gray-900 text-base sm:text-lg">Track My Request</span>
                  <p className="text-xs sm:text-sm text-gray-500">Check your order progress</p>
                </div>
              </div>
              <ArrowRight className="h-5 w-5 text-purple-600" />
            </button>
          </div>
        </ModalOverlay>
      )}

      {/* Find My KRA PIN Form */}
      {showFindPINForm && (
        <ModalOverlay onClose={() => { setShowFindPINForm(false); resetPinForm() }} size="large">
          <div className="text-center mb-6">
            <div className="bg-gradient-to-r from-sky-600 to-sky-700 rounded-2xl p-4 w-14 h-14 sm:w-16 sm:h-16 flex items-center justify-center mx-auto mb-4">
              <Search className="h-7 w-7 sm:h-8 sm:w-8 text-white" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">Find My KRA PIN</h2>
            <p className="text-sm sm:text-base text-gray-500 mt-1">Retrieve your KRA PIN instantly</p>
          </div>

          <div className="bg-[#E8F2EC] rounded-lg p-3.5 mb-5">
            <p className="text-xs sm:text-sm text-gray-700 leading-relaxed">
              We use your ID to retrieve your KRA PIN. Your data is processed in line with the Kenya Data Protection Act, 2019.{' '}
              <a
                href="/privacy"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#0a2540] font-semibold underline underline-offset-2 hover:text-[#1a3a5c] transition-colors"
              >
                How we handle your data
              </a>
            </p>
          </div>

          {pinError && (
            <div className="mb-4 rounded-lg bg-red-50 border border-red-200 p-3 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700">{pinError}</p>
            </div>
          )}

          <form className="space-y-4" onSubmit={handlePinSubmit}>
            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-1.5">
                ID / PASSPORT NUMBER <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={pinId}
                onChange={(e) => setPinId(e.target.value)}
                placeholder="e.g. 12345678"
                disabled={isLoadingPin || showPinResult}
                className="w-full bg-white border border-gray-300 rounded-lg px-3.5 py-2.5 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-[#0a2540] focus:border-[#0a2540] transition-all disabled:bg-gray-100 disabled:cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-1.5">TAXPAYER TYPE</label>
              <div className="relative">
                <select
                  value={taxpayerType}
                  onChange={(e) => setTaxpayerType(e.target.value)}
                  disabled={isLoadingPin || showPinResult}
                  className="w-full bg-white border border-gray-300 rounded-lg px-3.5 py-2.5 text-gray-900 appearance-none focus:outline-none focus:ring-1 focus:ring-[#0a2540] focus:border-[#0a2540] transition-all cursor-pointer disabled:bg-gray-100 disabled:cursor-not-allowed"
                >
                  {TAXPAYER_TYPES.map((t) => (
                    <option key={t.code} value={t.code}>{t.label}</option>
                  ))}
                </select>
                <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500">
                  <ChevronRight className="w-4 h-4 rotate-90" />
                </div>
              </div>
            </div>

            {!showPinResult && !isLoadingPin && (
              <div className="pt-1">
                <label className="flex items-start gap-2.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={optIn}
                    onChange={(e) => {
                      setOptIn(e.target.checked)
                      if (!e.target.checked) setSubEmail('')
                      setSubscribeStatus('idle')
                    }}
                    className="mt-0.5 h-4 w-4 rounded border-gray-300 text-[#0a2540] focus:ring-[#0a2540] cursor-pointer"
                  />
                  <span className="text-xs sm:text-sm text-gray-700 leading-snug">
                    Update me when other services are live
                  </span>
                </label>

                {optIn && (
                  <div className="mt-3">
                    <label className="block text-[11px] font-semibold text-gray-600 mb-1 uppercase tracking-wide">
                      Email <span className="text-gray-400 font-normal normal-case">(optional)</span>
                    </label>
                    <input
                      type="email"
                      value={subEmail}
                      onChange={(e) => setSubEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="w-full bg-white border border-gray-300 rounded-lg px-3.5 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-[#0a2540] focus:border-[#0a2540] transition-all"
                    />
                    {subscribeStatus === 'saved' && (
                      <p className="mt-1.5 text-[11px] text-green-600 flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" /> You&apos;re subscribed.
                      </p>
                    )}
                    {subscribeStatus === 'error' && (
                      <p className="mt-1.5 text-[11px] text-red-500">
                        Couldn&apos;t save your preference. You can try again.
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}

            {!showPinResult && (
              <button
                type="submit"
                disabled={isLoadingPin}
                className={`w-full font-semibold text-base py-3 rounded-lg transition-all shadow-sm flex items-center justify-center gap-2 mt-2 ${
                  isLoadingPin
                    ? 'bg-[#0a2540]/70 text-white cursor-wait'
                    : 'bg-[#0a2540] hover:bg-[#1a3a5c] text-white'
                }`}
              >
                {isLoadingPin ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Fetching your KRA PIN...
                  </>
                ) : (
                  <>Find My KRA PIN<span className="text-lg leading-none">→</span></>
                )}
              </button>
            )}
          </form>

          {isLoadingPin && !showPinResult && (
            <div className="mt-5 space-y-4 animate-pulse">
              <div className="border border-gray-200 rounded-lg overflow-hidden bg-white">
                <div className="bg-gray-50 px-4 py-2.5 border-b border-gray-200 flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-gray-200" />
                  <div className="h-4 w-24 bg-gray-200 rounded" />
                </div>
                <div className="p-4 space-y-3">
                  <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                    <div className="h-4 w-20 bg-gray-200 rounded" />
                    <div className="h-4 w-32 bg-gray-200 rounded" />
                  </div>
                  <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                    <div className="h-4 w-16 bg-gray-200 rounded" />
                    <div className="h-4 w-28 bg-gray-200 rounded" />
                  </div>
                </div>
              </div>
            </div>
          )}

          {showPinResult && pinResult && (
            <div className="mt-5 space-y-4">
              <div className="border border-gray-200 rounded-lg overflow-hidden bg-white">
                <div className="bg-gray-50 px-4 py-2.5 border-b border-gray-200 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span className="text-sm font-semibold text-gray-800">PIN Found</span>
                </div>
                <div className="p-4 space-y-3 text-sm">
                  <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                    <span className="text-gray-500">Taxpayer</span>
                    <span className="font-medium text-gray-900">{maskName(pinResult.taxpayerName)}</span>
                  </div>
                  <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                    <span className="text-gray-500">KRA PIN</span>
                    <div className="flex items-center gap-2 relative">
                      <span className="font-mono font-bold text-[#0a2540]">{pinResult.kraPin}</span>
                      <button onClick={handleCopyPin} className="text-gray-400 hover:text-gray-600" title="Copy PIN">
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                        </svg>
                      </button>
                      {copied && <span className="absolute -top-6 right-0 text-xs text-green-600 font-medium bg-white px-1.5 py-0.5 rounded shadow-sm border border-gray-100">Copied!</span>}
                    </div>
                  </div>
                </div>
              </div>

              {subscribeStatus === 'saved' && (
                <div className="rounded-lg bg-green-50 border border-green-200 px-3.5 py-2.5 flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                  <p className="text-xs sm:text-sm text-green-700">
                    You&apos;ll get an email when new services go live.
                  </p>
                </div>
              )}

              <button
                onClick={resetPinForm}
                className="w-full bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-semibold text-sm py-2.5 rounded-lg transition-all flex items-center justify-center gap-2"
              >
                Fetch Another PIN
              </button>
            </div>
          )}

          <div className="mt-6 pt-4 border-t border-gray-200 text-center">
            <p className="text-xs text-gray-400">
              Powered by <span className="font-semibold text-gray-500">Xeco Group</span>
            </p>
          </div>
        </ModalOverlay>
      )}

      {/* Payment Modal */}
      {showPayment && (
        <ModalOverlay onClose={() => setShowPayment(false)} size="large">
          <div className="text-center mb-6 sm:mb-8">
            <div className="bg-gradient-to-r from-green-600 to-green-700 rounded-2xl p-4 w-14 h-14 sm:w-16 sm:h-16 flex items-center justify-center mx-auto mb-4 sm:mb-5">
              <CreditCard className="h-7 w-7 sm:h-8 sm:w-8 text-white" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">Complete Payment</h2>
            <p className="text-sm sm:text-base text-gray-500 mt-2">Pay KES 25 via M-Pesa</p>
          </div>
          <form onSubmit={handlePaymentSubmit} className="space-y-5">
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 text-center">
              <p className="text-sm text-gray-600">Amount to Pay</p>
              <p className="text-3xl sm:text-4xl font-bold text-gray-900 mt-1">KES 25.00</p>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">M-Pesa Phone Number</label>
              <input
                type="tel"
                required
                className="w-full px-4 py-3.5 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none transition-all text-base"
                placeholder="0712 345 678"
                value={paymentData.phoneNumber}
                onChange={(e) => setPaymentData({ ...paymentData, phoneNumber: e.target.value })}
              />
            </div>
            <button type="submit" className="w-full bg-gradient-to-r from-green-600 to-green-700 text-white py-3.5 sm:py-4 rounded-xl font-semibold hover:from-green-700 hover:to-green-800 transition-all text-base sm:text-lg shadow-lg shadow-green-100">
              Pay Now
            </button>
          </form>
        </ModalOverlay>
      )}

      {/* Success Modal */}
      {showSuccess && (
        <ModalOverlay onClose={() => setShowSuccess(false)} size="large">
          <div className="text-center">
            <div className="bg-green-100 rounded-full w-20 h-20 sm:w-24 sm:h-24 flex items-center justify-center mx-auto mb-5 sm:mb-6">
              <CheckCircle className="h-10 w-10 sm:h-12 sm:w-12 text-green-600" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">Payment Successful!</h2>
            <p className="text-sm sm:text-base text-gray-500 mt-2">Your KRA request has been received.</p>
            <div className="bg-gray-50 rounded-xl p-4 mt-4 border border-gray-200">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Tracking Number</p>
              <p className="text-xl sm:text-2xl font-bold text-blue-600 tracking-wider font-mono">{trackingNumber}</p>
            </div>
            <button onClick={() => setShowSuccess(false)} className="w-full mt-4 bg-gray-100 text-gray-700 py-3.5 sm:py-4 rounded-xl font-semibold hover:bg-gray-200 transition-all text-base sm:text-lg">
              Close
            </button>
          </div>
        </ModalOverlay>
      )}

      {/* Track Request Modal */}
      {showCheckStatus && (
        <ModalOverlay onClose={() => setShowCheckStatus(false)} size="large">
          <div className="text-center mb-6 sm:mb-8">
            <div className="bg-gradient-to-r from-purple-600 to-purple-700 rounded-2xl p-4 w-14 h-14 sm:w-16 sm:h-16 flex items-center justify-center mx-auto mb-4 sm:mb-5">
              <Search className="h-7 w-7 sm:h-8 sm:w-8 text-white" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">Track KRA Request</h2>
            <p className="text-sm sm:text-base text-gray-500 mt-2">
              Enter your Reference Number or M-Pesa Receipt
            </p>
          </div>
          <form onSubmit={(e) => { e.preventDefault(); handleTrackRequest() }} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Reference Number or M-Pesa Receipt</label>
              <input
                type="text"
                required
                className="w-full px-4 py-3.5 rounded-xl border border-gray-200 focus:border-purple-500 focus:ring-4 focus:ring-purple-100 outline-none transition-all text-base"
                placeholder="e.g. CLA-2026-000154 or TGH5KD9L1M"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value.toUpperCase())}
              />
            </div>
            <button
              type="submit"
              disabled={isSearching}
              className="w-full bg-gradient-to-r from-purple-600 to-purple-700 text-white py-3.5 sm:py-4 rounded-xl font-semibold hover:from-purple-700 hover:to-purple-800 transition-all text-base sm:text-lg shadow-lg shadow-purple-100 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSearching ? 'Searching...' : 'Track Request'}
            </button>
          </form>
        </ModalOverlay>
      )}

      {/* Order Result Modal */}
      {showOrderResult && (
        <ModalOverlay onClose={() => { setShowOrderResult(false); setOrderStatus('') }} size="large">
          <div className="text-center">
            <div className={`rounded-full w-20 h-20 sm:w-24 sm:h-24 flex items-center justify-center mx-auto mb-5 sm:mb-6 ${
              orderStatus === 'Ready for Download' ? 'bg-green-100' : 'bg-amber-100'
            }`}>
              {orderStatus === 'Ready for Download'
                ? <CheckCircle className="h-10 w-10 sm:h-12 sm:w-12 text-green-600" />
                : <Clock className="h-10 w-10 sm:h-12 sm:w-12 text-amber-600" />}
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">Order Status</h2>
            <div className={`mt-3 inline-block px-4 py-1.5 rounded-full text-sm font-semibold ${
              orderStatus === 'Ready for Download' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
            }`}>
              {orderStatus || 'Processing'}
            </div>
            <p className="text-sm sm:text-base text-gray-500 mt-4">
              Tracking Number: <span className="font-mono font-semibold text-gray-900">{trackingNumber}</span>
            </p>
            {isCounting && !isReady && (
              <div className="mt-4 bg-blue-50 border border-blue-200 rounded-xl p-4">
                <div className="flex items-center justify-center gap-2">
                  <Timer className="h-5 w-5 text-blue-600 animate-pulse" />
                  <span className="text-sm text-gray-700">
                    Time remaining: <span className="font-bold text-blue-600">{formatTime(countdown)}</span>
                  </span>
                </div>
              </div>
            )}
            {orderStatus === 'Ready for Download' && (
              <button onClick={handleDownload} className="w-full mt-6 bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3.5 sm:py-4 rounded-xl font-semibold hover:from-blue-700 hover:to-blue-800 transition-all flex items-center justify-center gap-3 text-base sm:text-lg shadow-lg shadow-blue-100">
                <Download className="h-5 w-5 sm:h-6 sm:w-6" />
                Download Certificate
              </button>
            )}
            <button onClick={() => { setShowOrderResult(false); setOrderStatus('') }} className="w-full mt-3 bg-gray-100 text-gray-700 py-3.5 sm:py-4 rounded-xl font-semibold hover:bg-gray-200 transition-all text-base sm:text-lg">
              Close
            </button>
          </div>
        </ModalOverlay>
      )}
    </div>
  )
}

// ─── Logo mark (two slanted bars) ─────────────────────────────
function LogoMark({ className, gradientId }: { className?: string, gradientId: string }) {
  return (
    <svg className={className} viewBox="0 0 44 32" fill="none" aria-hidden="true">
      <defs>
        <linearGradient id={gradientId} x1="0" y1="32" x2="44" y2="0" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#3b82f6" />
          <stop offset="1" stopColor="#8b5cf6" />
        </linearGradient>
      </defs>
      <path d="M16 2 H42 L30 15 H4 Z" fill={`url(#${gradientId})`} />
      <path d="M14 18 H30 L24 30 H4 Z" fill={`url(#${gradientId})`} opacity="0.9" />
    </svg>
  )
}

// ─── Workflow card data ───────────────────────────────────────
type RailView = 'flow' | 'runs' | 'data' | 'apps' | 'api' | 'rules' | 'templates'

type FlowNode = {
  title: string
  subtitle: string
  status: string
  tone: 'ok' | 'review'
  time: string
  icon: LucideIcon
}

type Flow = {
  id: string
  tab: string
  name: string
  tasks: number
  lastRun: string
  runBase: number
  data: [string, string][]
  nodes: FlowNode[]
}

const FONT_STACK = "'Inter', 'Segoe UI Variable', 'Segoe UI', system-ui, -apple-system, Roboto, sans-serif"
const FONT_URL = 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap'

const FLOW_CSS = `
@keyframes tf-dash { to { stroke-dashoffset: -20; } }
@keyframes tf-glow {
  0% { box-shadow: 0 0 0 0 rgba(59,78,240,0.35); }
  70% { box-shadow: 0 0 0 12px rgba(59,78,240,0); }
  100% { box-shadow: 0 0 0 0 rgba(59,78,240,0); }
}
.tf-dash { stroke-dasharray: 6 4; animation: tf-dash 0.7s linear infinite; }
.tf-glow { animation: tf-glow 1.4s ease-out infinite; }
@media (prefers-reduced-motion: reduce) {
  .tf-dash, .tf-glow { animation: none; }
}
`

const RAIL: { id: RailView; label: string; icon: LucideIcon }[] = [
  { id: 'flow', label: 'Workflow', icon: Network },
  { id: 'runs', label: 'Run history', icon: WorkflowIcon },
  { id: 'data', label: 'Extracted data', icon: Database },
  { id: 'apps', label: 'Integrations', icon: Link2 },
  { id: 'api', label: 'API', icon: Code },
  { id: 'rules', label: 'Rules', icon: Settings },
  { id: 'templates', label: 'Templates', icon: LayoutGrid },
]

// Node geometry inside the 760 × 610 canvas
const NODE_W = 244
const NODE_H = 118
const NODE_POS = [
  { left: 24, top: 32 },
  { left: 24, top: 212 },
  { left: 316, top: 212 },
  { left: 128, top: 448 },
  { left: 438, top: 448 },
]
const STAGE_OF = [0, 1, 2, 3, 3]
const FINAL_TICK = 4

const NODE_ICON_BG = [
  'bg-gradient-to-br from-[#6d4cf5] to-[#8b5cf6]',
  'bg-gradient-to-br from-[#3b82f6] to-[#4f6ef7]',
  'bg-gradient-to-br from-[#10b981] to-[#22c55e]',
  'bg-gradient-to-br from-[#7c3aed] to-[#8b5cf6]',
  'bg-gradient-to-br from-[#3b82f6] to-[#5b8df8]',
]

const TONE_STYLE = {
  ok: 'bg-emerald-100 text-emerald-700',
  review: 'bg-orange-100 text-orange-600',
}

const BLUE = '#3b4ef0'
const VIOLET = '#7c3aed'
const IDLE = '#cbd5e1'

const SEGMENTS = [
  { d: 'M146 158 V204', target: 0 + 1, color: BLUE, from: [146, 158], to: [146, 204] },
  { d: 'M276 271 H308', target: 2, color: BLUE, from: [276, 271], to: [308, 271] },
  { d: 'M438 338 V374 Q438 390 422 390 H266 Q250 390 250 406 V440', target: 3, color: BLUE, from: [438, 338], to: [250, 440] },
  { d: 'M438 338 V374 Q438 390 454 390 H544 Q560 390 560 406 V440', target: 4, color: VIOLET, from: [438, 338], to: [560, 440] },
]

const FLOWS: Flow[] = [
  {
    id: 'tot',
    tab: 'TOT',
    name: 'Turnover Tax (TOT)',
    tasks: 12,
    lastRun: '2 min ago',
    runBase: 1048,
    data: [['Period', 'Sep 2026'], ['Invoices parsed', '38'], ['Gross sales', 'KES 1,240,000'], ['Return', 'Ready to file']],
    nodes: [
      { title: 'Invoice received', subtitle: 'Webhook • API', status: 'Automated', tone: 'ok', time: '2 mins ago', icon: Zap },
      { title: 'Extract tax data', subtitle: 'Parse • Transform', status: 'Needs review', tone: 'review', time: '3 mins ago', icon: FileText },
      { title: 'Validate details', subtitle: 'Rules • KRA checks', status: 'Completed', tone: 'ok', time: '2 mins ago', icon: Check },
      { title: 'Prepare return', subtitle: 'Generate • Format', status: 'Completed', tone: 'ok', time: '1 min ago', icon: FileText },
      { title: 'Send notification', subtitle: 'Email • SMS', status: 'Completed', tone: 'ok', time: '1 min ago', icon: Send },
    ],
  },
  {
    id: 'nil',
    tab: 'Nil return',
    name: 'Nil return filing',
    tasks: 8,
    lastRun: '4 min ago',
    runBase: 612,
    data: [['Period', 'Sep 2026'], ['Income declared', 'None'], ['Obligation', 'Income tax'], ['Return', 'Filed']],
    nodes: [
      { title: 'Nil request', subtitle: 'Form • API', status: 'Automated', tone: 'ok', time: '4 mins ago', icon: Zap },
      { title: 'Check period', subtitle: 'Filing • Obligations', status: 'Completed', tone: 'ok', time: '4 mins ago', icon: FileSearch },
      { title: 'Confirm nil', subtitle: 'Rules • KRA checks', status: 'Completed', tone: 'ok', time: '3 mins ago', icon: Check },
      { title: 'File return', subtitle: 'Submit • Confirm', status: 'Completed', tone: 'ok', time: '2 mins ago', icon: FileText },
      { title: 'Send notification', subtitle: 'Email • SMS', status: 'Completed', tone: 'ok', time: '2 mins ago', icon: Send },
    ],
  },
  {
    id: 'tcc',
    tab: 'TCC',
    name: 'Tax compliance certificate',
    tasks: 9,
    lastRun: '3 min ago',
    runBase: 327,
    data: [['Returns checked', '12 months'], ['Late filings', '0'], ['Open balances', 'None'], ['Certificate', 'Issued']],
    nodes: [
      { title: 'TCC request', subtitle: 'Form • API', status: 'Automated', tone: 'ok', time: '5 mins ago', icon: Zap },
      { title: 'Check filings', subtitle: 'Returns • Payments', status: 'Needs review', tone: 'review', time: '4 mins ago', icon: FileSearch },
      { title: 'Validate status', subtitle: 'Rules • KRA checks', status: 'Completed', tone: 'ok', time: '3 mins ago', icon: Check },
      { title: 'Issue certificate', subtitle: 'Generate • Format', status: 'Completed', tone: 'ok', time: '2 mins ago', icon: FileText },
      { title: 'Send notification', subtitle: 'Email • SMS', status: 'Completed', tone: 'ok', time: '1 min ago', icon: Send },
    ],
  },
  {
    id: 'pin',
    tab: 'KRA PIN',
    name: 'KRA PIN verification',
    tasks: 15,
    lastRun: '1 min ago',
    runBase: 2210,
    data: [['ID type', 'Kenyan Citizen'], ['ID number', '3****678'], ['KRA PIN', 'A00*****Z'], ['Match', 'Verified']],
    nodes: [
      { title: 'PIN submitted', subtitle: 'Form • API', status: 'Automated', tone: 'ok', time: '2 mins ago', icon: Zap },
      { title: 'Fetch taxpayer', subtitle: 'Lookup • KRA', status: 'Completed', tone: 'ok', time: '2 mins ago', icon: Search },
      { title: 'Match details', subtitle: 'Name • ID', status: 'Completed', tone: 'ok', time: '1 min ago', icon: Check },
      { title: 'Build result', subtitle: 'Mask • Format', status: 'Completed', tone: 'ok', time: '1 min ago', icon: FileText },
      { title: 'Send notification', subtitle: 'Email • SMS', status: 'Completed', tone: 'ok', time: '1 min ago', icon: Send },
    ],
  },
  {
    id: 'supplier',
    tab: 'Supplier',
    name: 'Supplier compliance verification',
    tasks: 11,
    lastRun: '5 min ago',
    runBase: 144,
    data: [['Suppliers checked', '24'], ['PIN valid', '22'], ['TCC valid', '20'], ['Flagged', '2']],
    nodes: [
      { title: 'Supplier added', subtitle: 'Upload • API', status: 'Automated', tone: 'ok', time: '6 mins ago', icon: Zap },
      { title: 'Verify PIN', subtitle: 'Lookup • KRA', status: 'Needs review', tone: 'review', time: '5 mins ago', icon: Search },
      { title: 'Check TCC status', subtitle: 'Validity • Expiry', status: 'Completed', tone: 'ok', time: '4 mins ago', icon: Check },
      { title: 'Build report', subtitle: 'Generate • Format', status: 'Completed', tone: 'ok', time: '3 mins ago', icon: FileText },
      { title: 'Send alert', subtitle: 'Email • SMS', status: 'Completed', tone: 'ok', time: '3 mins ago', icon: Send },
    ],
  },
]

const INTEGRATIONS = [
  { id: 'webhook', name: 'Webhook', desc: 'Receive invoices and events' },
  { id: 'email', name: 'Email', desc: 'Send notifications' },
  { id: 'sms', name: 'SMS', desc: 'Send text alerts' },
  { id: 'kra', name: 'KRA checks', desc: 'Validate PINs and returns' },
  { id: 'mpesa', name: 'M-Pesa', desc: 'Collect payments' },
]

const RULES = [
  { id: 'autoValidate', name: 'Validate automatically', desc: 'Run KRA checks on every request' },
  { id: 'humanReview', name: 'Hold unclear data for review', desc: 'Pause the run until someone confirms' },
  { id: 'notifyEmail', name: 'Email on completion', desc: 'Send an email when a run finishes' },
  { id: 'notifySms', name: 'SMS on completion', desc: 'Send a text when a run finishes' },
]

// ─── Workflow card ────────────────────────────────────────────
function WorkflowCard() {
  const [flowId, setFlowId] = useState(FLOWS[0].id)
  const [view, setView] = useState<RailView>('flow')
  const [toggles, setToggles] = useState<Record<string, boolean>>({
    webhook: true, email: true, sms: true, kra: true, mpesa: false,
    autoValidate: true, humanReview: true, notifyEmail: true, notifySms: false,
  })
  const flow = FLOWS.find((f) => f.id === flowId) ?? FLOWS[0]

  const panelRef = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(1)

  useEffect(() => {
    const el = panelRef.current
    if (!el) return
    const update = () => setScale(Math.min(1, el.clientWidth / CANVAS_W))
    update()
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const canvasHeight = CANVAS_H * scale
  const panelHeight = view === 'flow' ? canvasHeight : Math.max(canvasHeight, 420)
  const toggle = (id: string) => setToggles((t) => ({ ...t, [id]: !t[id] }))

  return (
    <div
      className="relative bg-white rounded-2xl border border-[#e3e9f6] shadow-[0_24px_60px_-20px_rgba(40,60,160,0.22)] overflow-hidden"
      style={{ fontFamily: FONT_STACK }}
    >
      <link rel="stylesheet" href={FONT_URL} />
      <style dangerouslySetInnerHTML={{ __html: FLOW_CSS }} />

      {/* Card header */}
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2 px-4 sm:px-5 py-2.5 2xl:py-0 2xl:h-[52px] border-b border-slate-100">
        <div className="order-1 flex items-center gap-2">
          <LogoMark className="w-7 h-5" gradientId="logo-card" />
          <span className="text-[18px] font-extrabold text-[#0b1140] tracking-tight whitespace-nowrap">
            Taxflow <span className="text-[#2f6bf0]">Africa</span>
          </span>
        </div>

        {/* Flow tabs */}
        <div
          role="tablist"
          aria-label="Workflow examples"
          className="order-3 w-full 2xl:order-2 2xl:w-auto min-w-0 flex items-center gap-1 rounded-lg bg-slate-100 p-1 overflow-x-auto"
        >
          {FLOWS.map((f) => {
            const active = f.id === flow.id
            return (
              <button
                key={f.id}
                role="tab"
                aria-selected={active}
                title={f.name}
                onClick={() => setFlowId(f.id)}
                className={`px-3.5 h-8 rounded-md text-[13px] font-semibold whitespace-nowrap transition-colors ${
                  active ? 'bg-white text-[#2f5bf0] shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {f.tab}
              </button>
            )
          })}
        </div>

        <div className="order-2 2xl:order-3 flex items-center gap-4">
          <span className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-600">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60 animate-ping" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
            </span>
            Live
          </span>
          <button className="inline-flex items-center gap-2 px-4 h-[34px] rounded-lg bg-slate-100 text-[#1e2a4a] text-sm font-semibold">
            <Save className="w-4 h-4" />
            Save
          </button>
        </div>
      </div>

      {/* Card body */}
      <div className="flex flex-col sm:flex-row">
        <nav
          aria-label="Workflow panels"
          className="flex flex-row sm:flex-col items-center gap-2 sm:w-[60px] flex-shrink-0 px-3 py-2 sm:px-0 sm:pt-3 sm:pb-0 overflow-x-auto border-b sm:border-b-0 sm:border-r border-slate-100 bg-white"
        >
          {RAIL.map((item) => {
            const Icon = item.icon
            const active = item.id === view
            return (
              <button
                key={item.id}
                onClick={() => setView(item.id)}
                title={item.label}
                aria-label={item.label}
                aria-pressed={active}
                className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors ${
                  active ? 'bg-[#e4ecff] text-[#2f5bf0]' : 'text-[#5d6a8a] hover:bg-slate-100 hover:text-[#2f5bf0]'
                }`}
              >
                <Icon className="w-[18px] h-[18px]" />
              </button>
            )
          })}
        </nav>

        <div
          ref={panelRef}
          className="relative flex-1 min-w-0 overflow-hidden bg-white"
          style={{
            height: panelHeight,
            backgroundImage: 'radial-gradient(circle at 1px 1px, rgb(203 213 225 / 0.55) 1px, transparent 0)',
            backgroundSize: '20px 20px',
          }}
        >
          {view === 'flow' && <FlowCanvas flow={flow} scale={scale} />}
          {view === 'runs' && <RunsView flow={flow} />}
          {view === 'data' && <DataView flow={flow} />}
          {view === 'apps' && <ToggleView title="Integrations" subtitle="Connect the systems this workflow talks to" items={INTEGRATIONS} toggles={toggles} onToggle={toggle} />}
          {view === 'api' && <ApiView flow={flow} />}
          {view === 'rules' && <ToggleView title="Rules" subtitle="Decide how each run behaves" items={RULES} toggles={toggles} onToggle={toggle} />}
          {view === 'templates' && (
            <TemplatesView
              activeId={flow.id}
              onPick={(id) => { setFlowId(id); setView('flow') }}
            />
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Animated flow canvas ─────────────────────────────────────
function FlowCanvas({ flow, scale }: { flow: Flow; scale: number }) {
  const [tick, setTick] = useState(0)
  const [reduced, setReduced] = useState(false)

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    setReduced(mq.matches)
    const onChange = (e: MediaQueryListEvent) => setReduced(e.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  useEffect(() => {
    setTick(reduced ? FINAL_TICK : 0)
  }, [flow.id, reduced])

  useEffect(() => {
    if (reduced) return
    const delay = tick === FINAL_TICK ? 2800 : 1400
    const t = setTimeout(() => setTick(tick === FINAL_TICK ? 0 : tick + 1), delay)
    return () => clearTimeout(t)
  }, [tick, reduced])

  const stateOf = (stage: number): 'pending' | 'active' | 'done' =>
    tick > stage ? 'done' : tick === stage ? 'active' : 'pending'

  const doneCount = STAGE_OF.filter((st) => tick > st).length
  const finished = tick === FINAL_TICK
  const tasks = flow.tasks - flow.nodes.length + doneCount

  return (
    <div className="relative" style={{ height: CANVAS_H * scale }}>
      <div
        className="absolute left-0 top-0"
        style={{ width: CANVAS_W, height: CANVAS_H, transform: `scale(${scale})`, transformOrigin: 'top left' }}
      >
        <svg className="absolute inset-0 pointer-events-none" width={CANVAS_W} height={CANVAS_H} viewBox={`0 0 ${CANVAS_W} ${CANVAS_H}`} fill="none">
          {SEGMENTS.map((seg, i) => {
            const st = stateOf(STAGE_OF[seg.target])
            const color = st === 'pending' ? IDLE : seg.color
            return (
              <g key={i}>
                <path
                  d={seg.d}
                  stroke={color}
                  strokeWidth="2"
                  strokeLinecap="round"
                  className={st === 'active' ? 'tf-dash' : undefined}
                />
                {[seg.from, seg.to].map(([cx, cy], k) => (
                  <g key={k}>
                    <circle cx={cx} cy={cy} r="6" fill={color} fillOpacity={st === 'pending' ? 0 : 0.15} />
                    <circle cx={cx} cy={cy} r="3.5" fill={color} />
                  </g>
                ))}
              </g>
            )
          })}
        </svg>

        {flow.nodes.map((node, i) => {
          const Icon = node.icon
          const st = stateOf(STAGE_OF[i])
          const status =
            st === 'done' ? node.status : st === 'active' ? 'Running' : 'Queued'
          const statusStyle =
            st === 'done' ? TONE_STYLE[node.tone] : st === 'active' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-500'
          const time = st === 'done' ? node.time : st === 'active' ? 'In progress' : 'Waiting'
          return (
            <NodeCard
              key={`${flow.id}-${i}`}
              pos={NODE_POS[i]}
              state={st}
              icon={<Icon className="w-[22px] h-[22px] text-white" strokeWidth={i === 2 ? 3 : 2} />}
              iconBg={NODE_ICON_BG[i]}
              title={node.title}
              subtitle={node.subtitle}
              status={status}
              statusStyle={statusStyle}
              time={time}
            />
          )
        })}

        {/* Workflow activity panel */}
        <div
          className="absolute rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden"
          style={{ left: 524, top: 28, width: 212, height: 140 }}
        >
          <div className="flex items-center gap-2.5 px-4 h-[46px] bg-slate-50/70 border-b border-slate-100">
            <Activity className="w-5 h-5 text-[#3b4ef0]" />
            <span className="text-[15px] font-semibold text-[#0b1140]">Workflow activity</span>
          </div>
          <div className="px-4 pt-3.5 space-y-3.5">
            <div className="flex items-center gap-2.5 text-[14px] text-slate-700">
              <span className="w-[22px] h-[22px] rounded-full bg-emerald-500 flex items-center justify-center flex-shrink-0">
                <Check className="w-3.5 h-3.5 text-white" strokeWidth={3.5} />
              </span>
              <span><span className="font-bold text-[#0b1140]">{tasks}</span> tasks completed</span>
            </div>
            <div className="flex items-center gap-2.5 text-[14px] text-slate-600">
              <Clock className="w-[22px] h-[22px] text-slate-400 flex-shrink-0" />
              <span>{finished ? `Last run ${flow.lastRun}` : 'Running now…'}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Workflow node card ──────────────────────────────────────
function NodeCard({
  pos,
  state,
  icon,
  iconBg,
  title,
  subtitle,
  status,
  statusStyle,
  time,
}: {
  pos: { left: number; top: number }
  state: 'pending' | 'active' | 'done'
  icon: React.ReactNode
  iconBg: string
  title: string
  subtitle: string
  status: string
  statusStyle: string
  time: string
}) {
  return (
    <div
      className={`absolute rounded-xl border bg-white px-4 py-3 transition-all duration-500 ${
        state === 'active'
          ? 'border-[#3b4ef0] tf-glow'
          : 'border-[#e6ebf5] shadow-[0_4px_14px_-4px_rgba(40,60,160,0.12)]'
      } ${state === 'pending' ? 'opacity-55' : 'opacity-100'}`}
      style={{ left: pos.left, top: pos.top, width: NODE_W, height: NODE_H }}
    >
      <div className="flex items-start gap-3.5">
        <div className={`w-11 h-11 rounded-lg ${iconBg} flex items-center justify-center flex-shrink-0`}>
          {icon}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[15px] font-semibold text-[#0b1140] leading-5 truncate">{title}</p>
          <p className="text-[13px] text-slate-500 leading-4 mt-0.5 truncate">{subtitle}</p>
          <span className={`inline-flex items-center gap-1.5 mt-2 text-[12px] font-semibold px-2.5 h-6 rounded-md ${statusStyle}`}>
            {state === 'active' && (
              <span className="w-3 h-3 rounded-full border-2 border-blue-300 border-t-blue-700 animate-spin" />
            )}
            {status}
          </span>
          <p className="flex items-center gap-1.5 text-[12px] text-slate-500 mt-1.5 leading-4">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            {time}
          </p>
        </div>
      </div>
    </div>
  )
}

// ─── Rail panels ─────────────────────────────────────────────
function PanelShell({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <div className="h-full overflow-y-auto p-5">
      <div className="mb-4">
        <h3 className="text-[17px] font-bold text-[#0b1140] leading-tight">{title}</h3>
        <p className="text-[13px] text-slate-500 mt-1">{subtitle}</p>
      </div>
      {children}
    </div>
  )
}

function RunsView({ flow }: { flow: Flow }) {
  const runs = [
    { status: 'Completed', tone: 'ok', dur: '1m 12s', when: flow.lastRun },
    { status: 'Completed', tone: 'ok', dur: '58s', when: '1 hr ago' },
    { status: 'Needs review', tone: 'review', dur: '2m 04s', when: '3 hrs ago' },
    { status: 'Completed', tone: 'ok', dur: '1m 31s', when: 'Yesterday' },
    { status: 'Completed', tone: 'ok', dur: '1m 05s', when: 'Yesterday' },
  ] as const
  return (
    <PanelShell title="Run history" subtitle={flow.name}>
      <ul className="space-y-2.5">
        {runs.map((r, n) => (
          <li key={n} className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3">
            <span className="font-mono text-[13px] text-slate-500 w-14">#{flow.runBase - n}</span>
            <span className={`inline-flex items-center h-6 px-2.5 rounded-md text-[12px] font-semibold ${TONE_STYLE[r.tone]}`}>
              {r.status}
            </span>
            <span className="ml-auto text-[13px] text-slate-500">{r.dur}</span>
            <span className="w-24 text-right text-[13px] text-slate-400">{r.when}</span>
          </li>
        ))}
      </ul>
    </PanelShell>
  )
}

function DataView({ flow }: { flow: Flow }) {
  return (
    <PanelShell title="Extracted data" subtitle={`${flow.name} · sample values`}>
      <dl className="rounded-xl border border-slate-200 bg-white divide-y divide-slate-100">
        {flow.data.map(([label, value]) => (
          <div key={label} className="flex items-center justify-between px-4 py-3.5">
            <dt className="text-[14px] text-slate-500">{label}</dt>
            <dd className="text-[14px] font-semibold text-[#0b1140]">{value}</dd>
          </div>
        ))}
      </dl>
    </PanelShell>
  )
}

function Switch({ checked, onChange, label }: { checked: boolean; onChange: () => void; label: string }) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={onChange}
      className={`relative w-11 h-6 rounded-full flex-shrink-0 transition-colors ${checked ? 'bg-[#2f5bf0]' : 'bg-slate-300'}`}
    >
      <span
        className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
          checked ? 'translate-x-5' : 'translate-x-0'
        }`}
      />
    </button>
  )
}

function ToggleView({
  title,
  subtitle,
  items,
  toggles,
  onToggle,
}: {
  title: string
  subtitle: string
  items: { id: string; name: string; desc: string }[]
  toggles: Record<string, boolean>
  onToggle: (id: string) => void
}) {
  return (
    <PanelShell title={title} subtitle={subtitle}>
      <ul className="space-y-2.5">
        {items.map((item) => (
          <li key={item.id} className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white px-4 py-3.5">
            <div className="min-w-0 flex-1">
              <p className="text-[14px] font-semibold text-[#0b1140]">{item.name}</p>
              <p className="text-[13px] text-slate-500 mt-0.5">{item.desc}</p>
            </div>
            <Switch checked={!!toggles[item.id]} onChange={() => onToggle(item.id)} label={item.name} />
          </li>
        ))}
      </ul>
    </PanelShell>
  )
}

function ApiView({ flow }: { flow: Flow }) {
  const code = `POST /v1/workflows/${flow.id}/runs
Content-Type: application/json

{
  "source": "webhook",
  "payload": { "taxpayer_id": "A00*****Z" }
}

// Response
{ "run": "#${flow.runBase + 1}", "status": "running" }`
  return (
    <PanelShell title="API" subtitle="Example request to start this workflow">
      <pre className="rounded-xl bg-[#0f172a] text-slate-100 text-[12.5px] leading-6 p-4 overflow-x-auto font-mono">
        <code>{code}</code>
      </pre>
    </PanelShell>
  )
}

function TemplatesView({ activeId, onPick }: { activeId: string; onPick: (id: string) => void }) {
  return (
    <PanelShell title="Templates" subtitle="Pick a workflow to open it on the canvas">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {FLOWS.map((f) => (
          <button
            key={f.id}
            onClick={() => onPick(f.id)}
            className={`text-left rounded-xl border px-4 py-3.5 transition-colors ${
              f.id === activeId ? 'border-[#3b4ef0] bg-[#f3f6ff]' : 'border-slate-200 bg-white hover:border-slate-300'
            }`}
          >
            <p className="text-[14px] font-semibold text-[#0b1140]">{f.name}</p>
            <p className="text-[13px] text-slate-500 mt-0.5">{f.nodes.length} steps</p>
          </button>
        ))}
      </div>
    </PanelShell>
  )
}

// ─── Reusable Modal ──────────────────────────────────────────
function ModalOverlay({ children, onClose, size = 'default' }: {
  children: React.ReactNode
  onClose: () => void
  size?: 'default' | 'large'
}) {
  const maxWidth = size === 'large' ? 'max-w-lg sm:max-w-2xl' : 'max-w-sm sm:max-w-md'
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className={`relative bg-white rounded-2xl sm:rounded-3xl shadow-2xl w-full ${maxWidth} p-5 sm:p-8 md:p-10 border border-gray-100 overflow-y-auto max-h-[90vh]`}>
        <button
          onClick={onClose}
          className="absolute top-3 right-3 sm:top-4 sm:right-4 text-gray-400 hover:text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl p-2 transition-all z-10"
        >
          <X className="h-5 w-5" />
        </button>
        {children}
      </div>
    </div>
  )
}