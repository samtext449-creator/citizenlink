'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { Turnstile } from '@marsidev/react-turnstile'
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
  Clock as ClockIcon,
  MapPin,
  Navigation,
  ExternalLink,
  Smartphone,
  ShieldCheck,
  ChevronLeft,
  FileCheck,
  Home,
  UserCheck,
  Receipt,
  ChevronDown
} from 'lucide-react'
import { getKraErrorMessage } from '@/lib/krataxErrors'

// 1. IMPORT THE NEW PRICING MODAL
import PricingModal from '@/components/PricingModal'

// ─── Config ─────────────
const XECOFLOW_PAY_BASE = process.env.NEXT_PUBLIC_XECOFLOW_PAY_URL || 'https://xecoflow-pay.onrender.com'

const TAXPAYER_TYPES = [
  { label: 'Kenyan Citizen', code: 'KE' },
  { label: 'Kenyan Resident', code: 'NKE' },
  { label: 'Non-Resident', code: 'NKENR' },
  { label: 'Company', code: 'COMP' },
]

const REPRINT_FEE = 25
const REPRINT_WINDOW = { startHour: 8, startMin: 0, endHour: 18, endMin: 30 }

function isReprintWindowOpen(): boolean {
  const now = new Date()
  const minutesNow = now.getHours() * 60 + now.getMinutes()
  const startMinutes = REPRINT_WINDOW.startHour * 60 + REPRINT_WINDOW.startMin
  const endMinutes = REPRINT_WINDOW.endHour * 60 + REPRINT_WINDOW.endMin
  return minutesNow >= startMinutes && minutesNow <= endMinutes
}

interface PinResult {
  kraPin: string
  taxpayerName: string
  taxpayerType: string
  taxpayerId: string
}

interface VerifyResult {
  kraPin: string
  taxpayerName: string
  taxpayerType: string
  status: string
}

interface Obligation {
  id: string
  name: string
  type: string
}

type ReprintFlowState = 'idle' | 'processing' | 'pending' | 'success' | 'error'

export default function CitizenLinkAfrica() {
  const [activeCard, setActiveCard] = useState<number | null>(null)
  const [isLoaded, setIsLoaded] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isSupplierDrawerOpen, setIsSupplierDrawerOpen] = useState(false)

  // 2. ADD STATE FOR PRICING MODAL
  const [showPricingModal, setShowPricingModal] = useState(false)

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
  const [agreedToTerms, setAgreedToTerms] = useState(false)

  // Verify KRA PIN
  const [showVerifyForm, setShowVerifyForm] = useState(false)
  const [verifyPin, setVerifyPin] = useState('')
  const [isVerifying, setIsVerifying] = useState(false)
  const [verifyResult, setVerifyResult] = useState<VerifyResult | null>(null)
  const [verifyError, setVerifyError] = useState('')

  // Check Obligations
  const [showObligationsForm, setShowObligationsForm] = useState(false)
  const [obligationsPin, setObligationsPin] = useState('')
  const [isFetchingObligations, setIsFetchingObligations] = useState(false)
  const [obligationsResult, setObligationsResult] = useState<Obligation[] | null>(null)
  const [obligationsError, setObligationsError] = useState('')

  // ── Turnstile State & Refs ──
  const [pinTurnstileToken, setPinTurnstileToken] = useState<string | null>(null)
  const [verifyTurnstileToken, setVerifyTurnstileToken] = useState<string | null>(null)
  const [obligationsTurnstileToken, setObligationsTurnstileToken] = useState<string | null>(null)
  
  const pinTurnstileTokenRef = useRef<string | null>(null)
  const verifyTurnstileTokenRef = useRef<string | null>(null)
  const obligationsTurnstileTokenRef = useRef<string | null>(null)
  
  const pinTurnstileRef = useRef<any>(null)
  const verifyTurnstileRef = useRef<any>(null)
  const obligationsTurnstileRef = useRef<any>(null)

  // ── Lookup mode: 'id' = fetch PIN (free), 'pin' = request cert (KES 25) ──
  const [lookupMode, setLookupMode] = useState<'id' | 'pin'>('id')

  // ── Reprint Form ──
  const [showReprintForm, setShowReprintForm] = useState(false)
  const [reprintFullName, setReprintFullName] = useState('')
  const [reprintIdOrPin, setReprintIdOrPin] = useState('')
  const [reprintEmail, setReprintEmail] = useState('')
  const [reprintPaymentNo, setReprintPaymentNo] = useState('')
  const [reprintError, setReprintError] = useState('')

  // ── Reprint-only form (KRA PIN mode) ──
  const [reprintOnlyEmail, setReprintOnlyEmail] = useState('')
  const [reprintOnlyPaymentNo, setReprintOnlyPaymentNo] = useState('')
  const [reprintOnlyError, setReprintOnlyError] = useState('')

  // ── Reprint Flow State Machine ──
  const [reprintFlow, setReprintFlow] = useState<ReprintFlowState>('idle')
  const [reprintPollCount, setReprintPollCount] = useState(0)
  const [reprintSuccess, setReprintSuccess] = useState<{
    amount: number
    receipt: string | null
    email: string
  } | null>(null)

  const reprintPollRef = useRef<ReturnType<typeof setInterval> | null>(null)

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
  const [paymentData, setPaymentData] = useState({ phoneNumber: '', amount: REPRINT_FEE })

  // Cleanup on unmount
  useEffect(
    () => () => {
      if (reprintPollRef.current) clearInterval(reprintPollRef.current)
    },
    []
  )

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

  const handlePinSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!pinId.trim()) return

    if (!agreedToTerms) {
      setPinError('You must agree to the Terms and Conditions to proceed.')
      return
    }

    const token = pinTurnstileTokenRef.current

    if (!token) {
      setPinError('Please complete the security check.')
      return
    }

    setIsLoadingPin(true)
    setShowPinResult(false)
    setPinError('')
    setPinResult(null)

    try {
      const res = await fetch(`${XECOFLOW_PAY_BASE}/v1/kratax/pin/fetch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          taxpayerType, 
          taxpayerId: pinId.trim(),
          turnstileToken: token
        }),
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
    } catch (err) {
      console.error('[KRA PIN] fetch error', err)
      setPinError('Network error. Please check your connection and try again.')
    } finally {
      setIsLoadingPin(false)
      pinTurnstileTokenRef.current = null
      pinTurnstileRef.current?.reset()
      setPinTurnstileToken(null)
    }
  }

  const handleVerifySubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const cleanPin = verifyPin.trim().toUpperCase()
    if (!cleanPin || cleanPin.length < 10) {
      setVerifyError('Please enter a valid KRA PIN (e.g. A0123456789Z).')
      return
    }

    const token = verifyTurnstileTokenRef.current

    if (!token) {
      setVerifyError('Please complete the security check.')
      return
    }

    setIsVerifying(true)
    setVerifyError('')
    setVerifyResult(null)

    try {
      const res = await fetch(`${XECOFLOW_PAY_BASE}/v1/kratax/pin/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          kraPin: cleanPin,
          turnstileToken: token
        }),
      })

      const data = await res.json().catch(() => ({}))

      if (!res.ok || !data.success) {
        setVerifyError(getKraErrorMessage(data, res.status))
        return
      }

      setVerifyResult({
        kraPin: data.data.kraPin,
        taxpayerName: data.data.taxpayerName,
        taxpayerType: data.data.taxpayerType,
        status: data.data.status,
      })
    } catch (err) {
      console.error('[KRA VERIFY] error', err)
      setVerifyError('Network error. Please check your connection and try again.')
    } finally {
      setIsVerifying(false)
      verifyTurnstileTokenRef.current = null
      verifyTurnstileRef.current?.reset()
      setVerifyTurnstileToken(null)
    }
  }

  const resetVerifyForm = () => {
    setVerifyPin('')
    setVerifyResult(null)
    setVerifyError('')
    setIsVerifying(false)
    setVerifyTurnstileToken(null)
    verifyTurnstileTokenRef.current = null
  }

  const handleObligationsSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const cleanPin = obligationsPin.trim().toUpperCase()
    if (!cleanPin || cleanPin.length < 10) {
      setObligationsError('Please enter a valid KRA PIN (e.g. A0123456789Z).')
      return
    }

    const token = obligationsTurnstileTokenRef.current

    if (!token) {
      setObligationsError('Please complete the security check.')
      return
    }

    setIsFetchingObligations(true)
    setObligationsError('')
    setObligationsResult(null)

    try {
      const res = await fetch(`${XECOFLOW_PAY_BASE}/v1/kratax/pin/obligations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          kraPin: cleanPin,
          turnstileToken: token
        }),
      })

      const data = await res.json().catch(() => ({}))

      if (!res.ok || !data.success) {
        setObligationsError(getKraErrorMessage(data, res.status))
        return
      }

      setObligationsResult(data.data.obligations)
    } catch (err) {
      console.error('[KRA OBLIGATIONS] error', err)
      setObligationsError('Network error. Please check your connection and try again.')
    } finally {
      setIsFetchingObligations(false)
      obligationsTurnstileTokenRef.current = null
      obligationsTurnstileRef.current?.reset()
      setObligationsTurnstileToken(null)
    }
  }

  const resetObligationsForm = () => {
    setObligationsPin('')
    setObligationsResult(null)
    setObligationsError('')
    setIsFetchingObligations(false)
    setObligationsTurnstileToken(null)
    obligationsTurnstileTokenRef.current = null
  }

  const handlePinModeSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setReprintOnlyError('')

    const cleanPin = pinId.trim().toUpperCase()
    if (!cleanPin || cleanPin.length < 10) {
      setReprintOnlyError('Please enter a valid KRA PIN (e.g. A0123456789Z).')
      return
    }
    if (!reprintOnlyEmail.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(reprintOnlyEmail)) {
      setReprintOnlyError('Please enter a valid email address.')
      return
    }
    const cleanPhone = reprintOnlyPaymentNo.replace(/\D/g, '')
    if (cleanPhone.length < 9) {
      setReprintOnlyError('Please enter a valid M-Pesa payment number.')
      return
    }

    setReprintFlow('processing')

    try {
      const res = await fetch(`${XECOFLOW_PAY_BASE}/v1/kratax/reprint/initiate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: 'KRA PIN Customer',
          idOrPin: cleanPin,
          email: reprintOnlyEmail.trim(),
          paymentPhone: reprintOnlyPaymentNo.trim(),
        }),
      })

      const data = await res.json().catch(() => ({}))

      if (!res.ok || !data?.success || !data?.data?.request_id) {
        setReprintFlow('error')
        setReprintOnlyError(data?.error?.message || 'Could not process the reprint request.')
        return
      }

      const requestId = data.data.request_id
      setReprintFlow('pending')
      startReprintPolling(requestId)
    } catch (err) {
      console.error('[REPRINT-PIN] init error', err)
      setReprintFlow('error')
      setReprintOnlyError('Something went wrong. Please try again.')
    }
  }

  const handleCopyPin = () => {
    if (!pinResult) return
    navigator.clipboard.writeText(pinResult.kraPin)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleOpenReprintForm = () => {
    if (pinResult) {
      const parts = (pinResult.taxpayerName || '').trim().split(/\s+/)
      const maskedName = parts.map((part, index) => {
        if (index === 0) return part
        if (part.length <= 1) return part
        return part[0] + '*'.repeat(part.length - 1)
      }).join(' ')

      setReprintFullName(maskedName)
      setReprintIdOrPin(pinResult.taxpayerId || '')
    }
    setReprintEmail('')
    setReprintPaymentNo('')
    setReprintError('')
    setReprintFlow('idle')
    setReprintSuccess(null)
    setReprintPollCount(0)
    setShowReprintForm(true)
  }

  const startReprintPolling = (requestId: string) => {
    setReprintPollCount(0)
    if (reprintPollRef.current) clearInterval(reprintPollRef.current)

    const POLL_INTERVAL_MS = 2500
    const POLL_MAX_ATTEMPTS = 40

    reprintPollRef.current = setInterval(async () => {
      setReprintPollCount((prev) => {
        if (prev + 1 >= POLL_MAX_ATTEMPTS && reprintPollRef.current) {
          clearInterval(reprintPollRef.current)
          reprintPollRef.current = null
          setReprintFlow('error')
          setReprintError('Payment is taking longer than expected. Check your M-Pesa messages.')
          setReprintOnlyError('Payment is taking longer than expected. Check your M-Pesa messages.')
        }
        return prev + 1
      })

      try {
        const res = await fetch(
          `${XECOFLOW_PAY_BASE}/v1/kratax/reprint/status/${requestId}`
        )
        const data = await res.json().catch(() => ({}))
        const status = data?.data?.status

        if (status === 'paid') {
          if (reprintPollRef.current) {
            clearInterval(reprintPollRef.current)
            reprintPollRef.current = null
          }
          setReprintSuccess({
            amount: data.data.amount || REPRINT_FEE,
            receipt: data.data.mpesa_receipt || null,
            email: lookupMode === 'pin' ? reprintOnlyEmail : reprintEmail,
          })
          setReprintFlow('success')
          setShowReprintForm(false)
        } else if (status === 'failed') {
          if (reprintPollRef.current) {
            clearInterval(reprintPollRef.current)
            reprintPollRef.current = null
          }
          setReprintFlow('error')
          const failMsg = data.data.result_desc || 'Payment failed. Please try again.'
          setReprintError(failMsg)
          setReprintOnlyError(failMsg)
        }
      } catch {
        // transient network error — keep polling
      }
    }, POLL_INTERVAL_MS)
  }

  const handleReprintSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setReprintError('')

    if (!reprintEmail.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(reprintEmail)) {
      setReprintError('Please enter a valid email address.')
      return
    }

    const cleanPayment = reprintPaymentNo.replace(/\D/g, '')
    if (cleanPayment.length < 9) {
      setReprintError('Please enter a valid M-Pesa payment number.')
      return
    }

    setReprintFlow('processing')

    try {
      const res = await fetch(`${XECOFLOW_PAY_BASE}/v1/kratax/reprint/initiate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: reprintFullName.trim(),
          idOrPin: reprintIdOrPin.trim(),
          email: reprintEmail.trim(),
          paymentPhone: reprintPaymentNo.trim(),
        }),
      })

      const data = await res.json().catch(() => ({}))

      if (!res.ok || !data?.success || !data?.data?.request_id) {
        setReprintFlow('error')
        setReprintError(data?.error?.message || 'Could not process the reprint request.')
        return
      }

      const requestId = data.data.request_id
      setReprintFlow('pending')
      setShowReprintForm(false)
      startReprintPolling(requestId)
    } catch (err) {
      console.error('[REPRINT] init error', err)
      setReprintFlow('error')
      setReprintError('Something went wrong. Please try again.')
    }
  }

  const resetReprintForm = () => {
    if (reprintPollRef.current) {
      clearInterval(reprintPollRef.current)
      reprintPollRef.current = null
    }
    setShowReprintForm(false)
    setReprintFullName('')
    setReprintIdOrPin('')
    setReprintEmail('')
    setReprintPaymentNo('')
    setReprintError('')
    setReprintFlow('idle')
    setReprintSuccess(null)
    setReprintPollCount(0)
  }

  const resetPinForm = () => {
    setPinId('')
    setTaxpayerType('KE')
    setShowPinResult(false)
    setIsLoadingPin(false)
    setPinError('')
    setPinResult(null)
    setCopied(false)
    setAgreedToTerms(false)
    setReprintOnlyEmail('')
    setReprintOnlyPaymentNo('')
    setReprintOnlyError('')
    setReprintFlow('idle')
    setLookupMode('id')
    setPinTurnstileToken(null)
    pinTurnstileTokenRef.current = null
    resetReprintForm()
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

  const serviceCards = [
    { title: 'Find My KRA PIN', desc: 'Retrieve your KRA PIN instantly', tag: 'Free', color: 'bg-sky-50 border-sky-200', hover: 'hover:border-sky-400 hover:shadow-sky-100', onClick: () => setShowFindPINForm(true), isActive: true },
    { title: 'Verify KRA PIN', desc: 'Confirm a KRA PIN is valid', tag: 'NEW', color: 'bg-violet-50 border-violet-200', hover: 'hover:border-violet-400 hover:shadow-violet-100', onClick: () => setShowVerifyForm(true), isActive: true },
    { title: 'Check My Obligations', desc: 'View all your active tax obligations', tag: 'NEW', color: 'bg-emerald-50 border-emerald-200', hover: 'hover:border-emerald-400 hover:shadow-emerald-100', onClick: () => setShowObligationsForm(true), isActive: true },
    { title: 'P9 / Employment Returns', desc: 'Annual P9/employment income filing', color: 'bg-slate-100', onClick: () => { setComingSoonTitle('P9 / Employment Returns'); setShowComingSoon(true) }, isActive: false },
    { title: 'Turnover Tax (TOT) Returns', desc: 'TOT filing for small businesses', color: 'bg-slate-100', onClick: () => { setComingSoonTitle('Turnover Tax (TOT) Returns'); setShowComingSoon(true) }, isActive: false },
    { title: 'Rental Tax Returns', desc: 'Filing for rental income properties', color: 'bg-slate-100', onClick: () => { setComingSoonTitle('Rental Tax Returns'); setShowComingSoon(true) }, isActive: false },
    { title: 'Verify Supplier', desc: 'Confirm supplier tax compliance status', color: 'bg-slate-100', onClick: () => { setComingSoonTitle('Verify Supplier'); setShowComingSoon(true) }, isActive: false },
    { title: 'Check My Tax Compliance', desc: 'View your overall tax compliance', color: 'bg-slate-100', onClick: () => { setComingSoonTitle('Check My Tax Compliance'); setShowComingSoon(true) }, isActive: false },
    { title: 'Nil Tax Automation', desc: 'Automate your nil tax returns seamlessly', color: 'bg-slate-100', onClick: () => { setComingSoonTitle('Nil Tax Automation'); setShowComingSoon(true) }, isActive: false },
    { title: 'Landlord Tax Management', desc: 'Manage and file your rental income tax', color: 'bg-slate-100', onClick: () => { setComingSoonTitle('Landlord Tax Management'); setShowComingSoon(true) }, isActive: false },
  ]

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
    <div className="min-h-screen flex flex-col bg-[#fafafa] font-sans selection:bg-blue-100 selection:text-blue-900">
      {/* ──────── HEADER ──────── */}
      <header className="sticky top-0 z-50 w-full bg-[#fafafa]/80 backdrop-blur-xl pt-3 sm:pt-4">
        <div className="w-full px-2 sm:px-4 lg:px-6 pb-3 sm:pb-4">
          <div className="bg-white rounded-full shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07),0_10px_20px_-2px_rgba(0,0,0,0.04)] border border-slate-200/60 px-4 sm:px-6 lg:px-8 py-2 flex items-center justify-between gap-4">
            
            {/* Logo */}
            <Link href="/" className="flex items-center flex-shrink-0">
              <span className="text-2xl font-extrabold tracking-tight text-[#0a2540]">
                Taxflow<span className="text-blue-600">.</span>
              </span>
            </Link>

            {/* Center Nav Links (Desktop) */}
            <nav className="hidden lg:flex items-center space-x-8">
              <button className="text-sm font-medium text-slate-600 hover:text-[#0a2540] transition-colors flex items-center gap-1">
                Products <ChevronRight className="w-4 h-4 rotate-90 text-slate-400" />
              </button>
              <button className="text-sm font-medium text-slate-600 hover:text-[#0a2540] transition-colors">
                Intergration
              </button>
              <button className="text-sm font-medium text-slate-600 hover:text-[#0a2540] transition-colors flex items-center gap-1">
                Solutions <ChevronRight className="w-4 h-4 rotate-90 text-slate-400" />
              </button>
              <button className="text-sm font-medium text-slate-600 hover:text-[#0a2540] transition-colors">
                eTIMS
              </button>
              <button className="text-sm font-medium text-slate-600 hover:text-[#0a2540] transition-colors">
                Resources
              </button>
              <button 
                onClick={() => setShowPricingModal(true)}
                className="text-sm font-medium text-slate-600 hover:text-[#0a2540] transition-colors"
              >
                Pricing
              </button>
              <button className="text-sm font-medium text-slate-600 hover:text-[#0a2540] transition-colors">
                Contact
              </button>
            </nav>

            {/* Right Action Area (Updated to match screenshot) */}
            <div className="flex items-center gap-3 sm:gap-4">
              
              {/* Search Icon */}
              <button
                onClick={() => setShowCheckStatus(true)}
                className="p-2 text-slate-500 hover:text-[#0a2540] hover:bg-slate-100 rounded-full transition-all"
                aria-label="Search"
              >
                <Search className="h-4 w-4" />
              </button>

              {/* Login Link */}
              <Link 
                href="/login" 
                className="hidden sm:inline-flex text-sm font-medium text-slate-600 hover:text-[#0a2540] transition-colors"
              >
                Log in
              </Link>

              {/* CTA Button */}
              <Link
              href="/signup"
              className="hidden sm:inline-flex bg-[#0a2540] hover:bg-[#112d4e] text-white text-xs sm:text-sm font-semibold px-5 py-2.5 rounded-full transition-all duration-300 shadow-md hover:shadow-lg hover:-translate-y-0.5"
              >
              Get Started
              </Link>

              {/* Hamburger Menu (Mobile) */}
              <button
                className="p-2 text-slate-500 hover:text-[#0a2540] hover:bg-slate-100 rounded-full transition-all lg:hidden"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                aria-label="Menu"
              >
                <Menu className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Drawer (Safaricom Style) */}
        {isMobileMenuOpen && (
          <div className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm lg:hidden" onClick={() => setIsMobileMenuOpen(false)}>
            <div className="absolute right-0 top-0 h-full w-[85vw] max-w-sm bg-white shadow-2xl flex flex-col" onClick={(e) => e.stopPropagation()}>
              
              <div className="p-4 border-b border-slate-100 flex justify-start">
                 <button onClick={() => setIsMobileMenuOpen(false)} className="text-slate-800 hover:text-slate-600 p-1">
                   <X className="w-6 h-6" />
                 </button>
              </div>
              
              <div className="flex-1 overflow-y-auto">
                 {[
                   'My Account',
                   'M-PESA Global Pay',
                   'M-PESA Foundation',
                   'Pamoja Tuungane',
                   'Safaricom Careers',
                   'Citizens of the Future',
                   'Safaricom Foundation',
                   'Safaricom Golf Tour',
                   'Safaricom Roaming',
                   'Safaricom Wholesale',
                   'Newsroom',
                   'Safaricom Chapa Dimba'
                 ].map((item, idx) => (
                   <button
                     key={idx}
                     onClick={() => {
                       setComingSoonTitle(item);
                       setShowComingSoon(true);
                       setIsMobileMenuOpen(false);
                     }}
                     className="w-full text-left px-5 py-4 border-b border-slate-100 text-green-600 font-medium text-sm hover:bg-slate-50 transition-colors"
                   >
                     {item}
                   </button>
                 ))}
              </div>
            </div>
          </div>
        )}
      </header>

      {/* ──────── MAIN CONTENT ──────── */}
      <main className="flex-1 w-full relative">
        {/* Abstract background blobs for premium feel */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-[400px] bg-blue-100/40 blur-[100px] rounded-full pointer-events-none -z-10" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-12 sm:pt-12 sm:pb-20">
          <div className={`transition-all duration-1000 ease-out ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-start">

              <div className="max-w-2xl mx-auto lg:mx-0">
                <div className="inline-flex items-center gap-2 bg-white text-blue-700 text-[11px] sm:text-xs font-bold px-3 py-1.5 rounded-full mb-6 shadow-sm ring-1 ring-slate-200/60 uppercase tracking-wide">
                  <span>Official KRA Ushuru Mashinani Partner</span>
                </div>

                <h1 className="text-4xl sm:text-5xl lg:text-[3.5rem] font-bold text-[#0a2540] leading-[1.1] mb-6 tracking-tight">
                  From Tax Complexity
                  <br />
                  <span className="text-blue-600">
                    to Simplicity.
                  </span>
                </h1>

                <p className="text-base sm:text-lg text-slate-600 mb-8 leading-relaxed max-w-lg">
                  Fulfilling your tax obligations shouldn't be complicated. Through the{' '}
                  <span className="font-semibold text-slate-800">Ushuru Mashinani</span> initiative,
                  Taxflow Africa simplifies KRA processes so you can file returns, get your KRA PIN,
                  and stay compliant from anywhere.
                </p>

                {/* ════════════ USEFUL LINKS SECTION ════════════ */}
                <div className="mt-8">
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-4">
                    Useful Links
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-5 max-w-lg">
                    
                    <div>
                      <h3 className="text-[15px] font-semibold text-[#0a2540]">New PIN Registration</h3>
                      <p className="text-[13px] text-slate-600 mt-1">
                        To get a new PIN, <Link href="#new-pin" className="text-blue-600 hover:underline">Click Here</Link>
                      </p>
                    </div>

                    <div>
                      <h3 className="text-[15px] font-semibold text-[#0a2540]">Tax Calculator</h3>
                      <p className="text-[13px] text-slate-600 mt-1">
                        Calculate your taxes, <Link href="#tax-calculator" className="text-blue-600 hover:underline">Click Here</Link>
                      </p>
                    </div>

                    <div>
                      <h3 className="text-[15px] font-semibold text-[#0a2540]">WhatsApp Tax Automation</h3>
                      <p className="text-[13px] text-slate-600 mt-1">
                        Automate via WhatsApp, <Link href="#whatsapp-tax" className="text-blue-600 hover:underline">Click Here</Link>
                      </p>
                    </div>

                    <div>
                      <h3 className="text-[15px] font-semibold text-[#0a2540]">Verify eTIMS Invoice</h3>
                      <p className="text-[13px] text-slate-600 mt-1">
                        Check an eTIMS invoice, <Link href="#verify-etims" className="text-blue-600 hover:underline">Click Here</Link>
                      </p>
                    </div>

                    <div>
                      <h3 className="text-[15px] font-semibold text-[#0a2540]">Verify Exemption Cert</h3>
                      <p className="text-[13px] text-slate-600 mt-1">
                        Validate a certificate, <Link href="#verify-exemption" className="text-blue-600 hover:underline">Click Here</Link>
                      </p>
                    </div>

                    <div>
                      <h3 className="text-[15px] font-semibold text-[#0a2540]">Check My Tax Station</h3>
                      <p className="text-[13px] text-slate-600 mt-1">
                        Find your station, <Link href="#tax-station" className="text-blue-600 hover:underline">Click Here</Link>
                      </p>
                    </div>

                  </div>
                </div>
                {/* ════════════ END USEFUL LINKS SECTION ════════════ */}
              </div>

              <div className="w-full">
                {/* Mobile Services List */}
                <div className="lg:hidden">
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-4">
                    Select a service to begin:
                  </p>
                  <div className="space-y-3">
                    {serviceCards.map((card, i) => (
                      <button
                        key={i}
                        onClick={card.onClick}
                        className={`w-full flex items-center gap-4 p-4 rounded-2xl border shadow-sm active:scale-[0.98] transition-all ${
                          card.isActive
                            ? `${card.color} border-slate-200`
                            : 'bg-slate-50 border-slate-200/60 opacity-80'
                        }`}
                      >
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${card.isActive ? 'bg-white shadow-sm' : 'bg-slate-200'}`}>
                          <FileText className={`h-4 w-4 ${card.isActive ? 'text-blue-600' : 'text-slate-500'}`} />
                        </div>
                        <div className="text-left flex-1">
                          <span className={`block text-sm font-bold ${card.isActive ? 'text-[#0a2540]' : 'text-slate-500'}`}>
                            {card.title}
                          </span>
                          <span className="block text-xs text-slate-500 mt-0.5">{card.desc}</span>
                        </div>
                        {card.isActive && card.tag && (
                          <span className={`text-[9px] font-bold px-2 py-1 rounded-full whitespace-nowrap uppercase tracking-wide flex-shrink-0 ${
                            card.tag === 'NEW' 
                              ? 'text-red-700 bg-red-100' 
                              : 'text-sky-700 bg-sky-100'
                          }`}>
                            {card.tag}
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Desktop Services Grid with Corner Arrow */}
                <div className="hidden lg:block relative pr-8">
                  
                  <div className="relative bg-white rounded-[2rem] shadow-[0_8px_40px_rgb(0,0,0,0.04)] ring-1 ring-slate-200/60 overflow-hidden">
                    <div className="h-1 w-full bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 opacity-80" />

                    <div className="p-5 sm:p-6">
                      <div className="grid grid-cols-2 gap-3 sm:gap-4">
                        {serviceCards.map((card, i) => (
                          <div
                            key={i}
                            className={`relative group/card cursor-pointer transition-all duration-300 ${!card.isActive ? 'opacity-90' : ''}`}
                            onClick={card.onClick}
                          >
                            <div className={`relative border rounded-xl p-4 flex flex-col transition-all duration-300 ${
                              card.isActive
                                ? `${card.color} ${card.hover} hover:shadow-md hover:-translate-y-0.5`
                                : 'bg-slate-100/50 border-slate-200 border-dashed hover:border-slate-300 hover:bg-slate-100'
                            }`}>
                              <div className="flex items-start justify-between gap-2 mb-1">
                                <h3 className={`font-bold text-sm ${card.isActive ? 'text-[#0a2540]' : 'text-slate-600'}`}>
                                  {card.title}
                                </h3>
                                {card.isActive && card.tag && (
                                  <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-full whitespace-nowrap uppercase tracking-wide flex-shrink-0 ${
                                    card.tag === 'NEW' 
                                      ? 'text-red-700 bg-red-100 ring-1 ring-red-200/50' 
                                      : 'text-sky-700 bg-sky-100 ring-1 ring-sky-200/50'
                                  }`}>
                                    {card.tag}
                                  </span>
                                )}
                                {!card.isActive && (
                                  <span className="text-[8px] font-bold text-slate-500 bg-slate-200/70 px-1.5 py-0.5 rounded-full whitespace-nowrap flex-shrink-0 uppercase tracking-wide">
                                    Soon
                                  </span>
                                )}
                              </div>
                              <p className={`text-xs leading-snug ${card.isActive ? 'text-slate-600' : 'text-slate-500'}`}>
                                {card.desc}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* ──────── FOOTER ──────── */}
      <footer className="w-full bg-[#0a2540] text-slate-300 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-xs">
            <div className="flex items-center gap-2">
              <span className="font-bold text-white tracking-tight text-sm">
                Taxflow<span className="text-blue-400">.</span>
              </span>
              <span className="text-slate-500">|</span>
              <span className="text-slate-400">
                © {new Date().getFullYear()} Taxflow Africa. All rights reserved.
              </span>
            </div>
            
            <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2">
              <Link href="/terms" className="hover:text-white transition-colors">
                Terms &amp; Conditions
              </Link>
              <Link href="/privacy" className="hover:text-white transition-colors">
                Privacy Policy
              </Link>
              <span className="text-slate-500">|</span>
              <span className="text-blue-400 font-medium">
                Official KRA Ushuru Mashinani Partner
              </span>
            </div>
          </div>
        </div>
      </footer>

      {/* ════════════════ FIXED CORNER ARROW (Spotify Style) ════════════════ */}
      {!isSupplierDrawerOpen && (
        <div 
          onClick={() => setIsSupplierDrawerOpen(true)}
          className="fixed right-0 top-1/2 -translate-y-1/2 w-6 h-16 bg-white rounded-l-xl shadow-[-4px_0_10px_rgba(0,0,0,0.1)] flex items-center justify-center cursor-pointer hover:bg-slate-50 transition-all z-40 hidden lg:flex border border-slate-200 border-r-0"
          title="Open Supplier Services"
        >
          <ChevronLeft className="w-5 h-5 text-slate-500" />
        </div>
      )}

      {/* ════════════════ SUPPLIER DRAWER ════════════════ */}
      {isSupplierDrawerOpen && (
        <div className="fixed inset-0 z-[100] bg-slate-900/40 backdrop-blur-sm flex justify-end" onClick={() => setIsSupplierDrawerOpen(false)}>
          <div className="w-full max-w-sm bg-white h-full shadow-2xl flex flex-col relative" onClick={(e) => e.stopPropagation()}>
            
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h2 className="text-lg font-bold text-[#0a2540]">Supplier Compliance</h2>
              <button onClick={() => setIsSupplierDrawerOpen(false)} className="text-slate-500 hover:text-slate-800 p-1 bg-white rounded-full border border-slate-200">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              {[
                { title: 'Nil Tax Automation', icon: FileCheck },
                { title: 'Landlord Tax Management', icon: Home },
                { title: 'Supplier Verification Compliance', icon: UserCheck },
                { title: 'Exempted Tax Check', icon: ShieldCheck },
                { title: 'Business Invoice Track', icon: Receipt },
              ].map((item, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setComingSoonTitle(item.title);
                    setShowComingSoon(true);
                    setIsSupplierDrawerOpen(false);
                  }}
                  className="w-full text-left px-5 py-4 border-b border-slate-100 flex items-center gap-4 hover:bg-slate-50 transition-colors group"
                >
                  <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                    <item.icon className="w-5 h-5" />
                  </div>
                  <span className="text-[15px] font-semibold text-slate-700 group-hover:text-[#0a2540]">{item.title}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ════════════════ MODALS ════════════════ */}

      {showNearestCyberForm && (
        <ModalOverlay onClose={() => setShowNearestCyberForm(false)} size="large">
          <div className="text-center mb-6 sm:mb-8">
            <div className="bg-blue-50 rounded-2xl p-4 w-14 h-14 sm:w-16 sm:h-16 flex items-center justify-center mx-auto mb-4 sm:mb-5 ring-1 ring-blue-100">
              <MapPin className="h-7 w-7 sm:h-8 sm:w-8 text-blue-600" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-[#0a2540] tracking-tight">Find Nearest Cyber/Print Point</h2>
            <p className="text-sm sm:text-base text-slate-500 mt-2">Locate cybercafés or print shops near your current location</p>
          </div>

          {isLocating ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-slate-500">Getting your location...</p>
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
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mb-6">
                <div className="flex items-center gap-2 mb-2">
                  <Navigation className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-semibold text-slate-700">Your Location</span>
                </div>
                <p className="text-xs text-slate-500 font-mono">
                  Lat: {userLocation.lat.toFixed(4)}, Lng: {userLocation.lng.toFixed(4)}
                </p>
              </div>

              <div className="space-y-3">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Nearby Cybercafés &amp; Print Points</p>
                {[
                  { name: 'Cyber Hub Kenya', dist: '0.3 km', address: 'Tom Mboya Street' },
                  { name: 'Digital Point Cyber', dist: '0.8 km', address: 'Moi Avenue' },
                  { name: 'E-Solutions Cyber', dist: '1.2 km', address: 'Kenyatta Avenue' },
                  { name: 'Quick Print & Cyber', dist: '1.5 km', address: 'River Road' },
                ].map((cyber, i) => (
                  <div key={i} className="flex items-start justify-between p-3 bg-white border border-slate-200 rounded-xl">
                    <div>
                      <p className="font-semibold text-slate-800 text-sm">{cyber.name}</p>
                      <p className="text-xs text-slate-400">{cyber.address}</p>
                    </div>
                    <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-full">{cyber.dist}</span>
                  </div>
                ))}
                <a
                  href={`https://www.google.com/maps/search/cybercafe/@${userLocation.lat},${userLocation.lng},14z`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full mt-4 bg-[#0a2540] text-white py-3.5 sm:py-4 rounded-xl font-semibold hover:bg-[#112d4e] transition-all flex items-center justify-center gap-2 text-base sm:text-lg shadow-lg shadow-slate-200"
                >
                  <ExternalLink className="h-5 w-5" />
                  Open in Google Maps
                </a>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-slate-500 mb-4">Click the button below to find cybercafés or print points near you.</p>
              <button onClick={handleFindNearestCyber} className="bg-[#0a2540] text-white px-8 py-4 rounded-xl font-semibold hover:bg-[#112d4e] transition-all text-base sm:text-lg shadow-lg">
                Locate Me
              </button>
            </div>
          )}
        </ModalOverlay>
      )}

      {showComingSoon && (
        <ModalOverlay onClose={() => setShowComingSoon(false)} size="large">
          <div className="text-center">
            <div className="bg-amber-50 rounded-full w-20 h-20 sm:w-24 sm:h-24 flex items-center justify-center mx-auto mb-5 sm:mb-6 ring-1 ring-amber-100">
              <ClockIcon className="h-10 w-10 sm:h-12 sm:w-12 text-amber-500" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-[#0a2540] tracking-tight">Coming Soon!</h2>
            <p className="text-sm sm:text-base text-slate-500 mt-2">
              <span className="font-semibold text-slate-700">{comingSoonTitle}</span> are currently in development.
            </p>
            <div className="bg-amber-50/50 border border-amber-200 rounded-xl p-4 mt-6">
              <div className="flex items-center justify-center gap-2">
                <AlertCircle className="h-5 w-5 text-amber-500" />
                <span className="text-sm text-amber-700">This feature will be available soon</span>
              </div>
            </div>
            <button onClick={() => setShowComingSoon(false)} className="w-full mt-6 bg-[#0a2540] text-white py-3.5 sm:py-4 rounded-xl font-semibold hover:bg-[#112d4e] transition-all text-base sm:text-lg shadow-lg">
              Got it
            </button>
          </div>
        </ModalOverlay>
      )}

      {showKRAPopup && (
        <ModalOverlay onClose={() => setShowKRAPopup(false)} size="large">
          <div className="text-center mb-6 sm:mb-8">
            <div className="bg-blue-50 rounded-2xl p-4 w-14 h-14 sm:w-16 sm:h-16 flex items-center justify-center mx-auto mb-4 sm:mb-5 ring-1 ring-blue-100">
              <FileText className="h-7 w-7 sm:h-8 sm:w-8 text-blue-600" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-[#0a2540] tracking-tight">KRA Tax Services</h2>
          </div>
          <div className="space-y-3 sm:space-y-4">
            <button
              onClick={() => { setShowKRAPopup(false); setShowCheckStatus(true) }}
              className="w-full flex items-center justify-between p-4 sm:p-5 bg-slate-50 hover:bg-slate-100 rounded-2xl transition-all border border-slate-200 hover:border-slate-300"
            >
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="bg-white rounded-xl p-2.5 shadow-sm ring-1 ring-slate-200">
                  <Search className="h-5 w-5 sm:h-6 sm:w-6 text-slate-700" />
                </div>
                <div className="text-left">
                  <span className="font-bold text-[#0a2540] text-base sm:text-lg">Track My Request</span>
                  <p className="text-xs sm:text-sm text-slate-500">Check your order progress</p>
                </div>
              </div>
              <ArrowRight className="h-5 w-5 text-slate-400" />
            </button>
          </div>
        </ModalOverlay>
      )}

      {/* ════════════ CHECK OBLIGATIONS FORM ════════════ */}
      {showObligationsForm && (
        <ModalOverlay onClose={() => { setShowObligationsForm(false); resetObligationsForm() }} size="large">
          <div className="text-center mb-6">
            <div className="bg-emerald-50 rounded-2xl p-4 w-14 h-14 sm:w-16 sm:h-16 flex items-center justify-center mx-auto mb-4 ring-1 ring-emerald-100">
              <FileText className="h-7 w-7 sm:h-8 sm:w-8 text-emerald-600" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-[#0a2540] tracking-tight">Check My Obligations</h2>
            <p className="text-sm sm:text-base text-slate-500 mt-1">View all your active tax obligations from KRA.</p>
          </div>

          <div className="bg-slate-50 rounded-xl p-4 mb-6 border border-slate-200/60">
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Your data is processed in line with the Kenya Data Protection Act, 2019.{' '}
              <a
                href="/privacy"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#0a2540] font-semibold underline underline-offset-2 hover:text-blue-600 transition-colors"
              >
                How we handle your data
              </a>
            </p>
          </div>

          {obligationsError && (
            <div className="mb-4 rounded-xl bg-red-50 border border-red-200 p-3 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700">{obligationsError}</p>
            </div>
          )}

          {!obligationsResult ? (
            <form className="space-y-4" onSubmit={handleObligationsSubmit}>
              <div>
                <label className="block text-sm font-semibold text-slate-800 mb-1.5">
                  KRA PIN <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={obligationsPin}
                  onChange={(e) => setObligationsPin(e.target.value.toUpperCase())}
                  placeholder="e.g. A020360004V"
                  disabled={isFetchingObligations}
                  className="w-full bg-white border border-slate-300 rounded-xl px-4 py-3 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0a2540]/20 focus:border-[#0a2540] transition-all font-mono uppercase disabled:bg-slate-50 disabled:cursor-not-allowed"
                />
              </div>

              <div className="flex justify-start my-2">
                <Turnstile
                  ref={obligationsTurnstileRef}
                  siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY!}
                  onSuccess={(token) => {
                    obligationsTurnstileTokenRef.current = token
                    setObligationsTurnstileToken(token)
                    setObligationsError('')
                  }}
                  onExpire={() => {
                    obligationsTurnstileTokenRef.current = null
                    setObligationsTurnstileToken(null)
                  }}
                  options={{ theme: 'light' }}
                />
              </div>

              <button
                type="submit"
                disabled={isFetchingObligations || !obligationsTurnstileToken}
                className={`w-full font-semibold text-base py-3.5 rounded-xl transition-all flex items-center justify-center gap-2 mt-2 ${
                  isFetchingObligations || !obligationsTurnstileToken
                    ? 'bg-slate-300 text-white cursor-wait'
                    : 'bg-[#0a2540] hover:bg-[#112d4e] text-white shadow-md'
                }`}
              >
                {isFetchingObligations ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Checking Obligations...
                  </>
                ) : (
                  <>Check Obligations<span className="text-lg leading-none">→</span></>
                )}
              </button>
            </form>
          ) : (
            <div className="mt-5 space-y-4">
              <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-sm">
                <div className="bg-emerald-50 px-4 py-3 border-b border-emerald-100 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-600" />
                  <span className="text-sm font-semibold text-emerald-800">Obligations Found ({obligationsResult.length})</span>
                </div>
                <div className="p-4 space-y-2 max-h-64 overflow-y-auto">
                  {obligationsResult.map((ob) => (
                    <div key={ob.id} className="flex items-start justify-between p-3 bg-slate-50 border border-slate-100 rounded-lg">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-slate-800 truncate">{ob.name}</p>
                        <p className="text-[10px] text-slate-500 font-mono uppercase">{ob.id}</p>
                      </div>
                      <span className="ml-3 px-2 py-0.5 rounded text-[10px] font-bold bg-white text-slate-600 border border-slate-200">
                        {ob.type}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <button
                onClick={resetObligationsForm}
                className="w-full bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold text-sm py-3 rounded-xl transition-all flex items-center justify-center gap-2"
              >
                Check Another PIN
              </button>
            </div>
          )}

          <div className="mt-6 pt-4 border-t border-slate-100 text-center">
            <p className="text-xs text-slate-400">
              Powered by <span className="font-semibold text-slate-500">Xeco Group</span>
            </p>
          </div>
        </ModalOverlay>
      )}

      {/* ════════════ VERIFY KRA PIN FORM ════════════ */}
      {showVerifyForm && (
        <ModalOverlay onClose={() => { setShowVerifyForm(false); resetVerifyForm() }} size="large">
          <div className="text-center mb-6">
            <div className="bg-violet-50 rounded-2xl p-4 w-14 h-14 sm:w-16 sm:h-16 flex items-center justify-center mx-auto mb-4 ring-1 ring-violet-100">
              <ShieldCheck className="h-7 w-7 sm:h-8 sm:w-8 text-violet-600" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-[#0a2540] tracking-tight">Verify KRA PIN</h2>
            <p className="text-sm sm:text-base text-slate-500 mt-1">Confirm a KRA PIN and check its status instantly.</p>
          </div>

          <div className="bg-slate-50 rounded-xl p-4 mb-6 border border-slate-200/60">
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Your data is processed in line with the Kenya Data Protection Act, 2019.{' '}
              <a
                href="/privacy"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#0a2540] font-semibold underline underline-offset-2 hover:text-blue-600 transition-colors"
              >
                How we handle your data
              </a>
            </p>
          </div>

          {verifyError && (
            <div className="mb-4 rounded-xl bg-red-50 border border-red-200 p-3 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700">{verifyError}</p>
            </div>
          )}

          {!verifyResult ? (
            <form className="space-y-4" onSubmit={handleVerifySubmit}>
              <div>
                <label className="block text-sm font-semibold text-slate-800 mb-1.5">
                  KRA PIN <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={verifyPin}
                  onChange={(e) => setVerifyPin(e.target.value.toUpperCase())}
                  placeholder="e.g. A020360004V"
                  disabled={isVerifying}
                  className="w-full bg-white border border-slate-300 rounded-xl px-4 py-3 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0a2540]/20 focus:border-[#0a2540] transition-all font-mono uppercase disabled:bg-slate-50 disabled:cursor-not-allowed"
                />
              </div>

              <div className="flex justify-start my-2">
                <Turnstile
                  ref={verifyTurnstileRef}
                  siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY!}
                  onSuccess={(token) => {
                    verifyTurnstileTokenRef.current = token
                    setVerifyTurnstileToken(token)
                    setVerifyError('')
                  }}
                  onExpire={() => {
                    verifyTurnstileTokenRef.current = null
                    setVerifyTurnstileToken(null)
                  }}
                  options={{ theme: 'light' }}
                />
              </div>

              <button
                type="submit"
                disabled={isVerifying || !verifyTurnstileToken}
                className={`w-full font-semibold text-base py-3.5 rounded-xl transition-all flex items-center justify-center gap-2 mt-2 ${
                  isVerifying || !verifyTurnstileToken
                    ? 'bg-slate-300 text-white cursor-wait'
                    : 'bg-[#0a2540] hover:bg-[#112d4e] text-white shadow-md'
                }`}
              >
                {isVerifying ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Verifying PIN...
                  </>
                ) : (
                  <>Verify KRA PIN<span className="text-lg leading-none">→</span></>
                )}
              </button>
            </form>
          ) : (
            <div className="mt-5 space-y-4">
              <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-sm">
                <div className="bg-emerald-50 px-4 py-3 border-b border-emerald-100 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-600" />
                  <span className="text-sm font-semibold text-emerald-800">PIN Verified Successfully</span>
                </div>
                <div className="p-4 space-y-3 text-sm">
                  <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                    <span className="text-slate-500">Taxpayer Name</span>
                    <span className="font-semibold text-slate-900">{verifyResult.taxpayerName}</span>
                  </div>
                  <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                    <span className="text-slate-500">KRA PIN</span>
                    <span className="font-mono font-bold text-[#0a2540]">{verifyResult.kraPin}</span>
                  </div>
                  <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                    <span className="text-slate-500">Status</span>
                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                      verifyResult.status === 'Active' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {verifyResult.status}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">Taxpayer Type</span>
                    <span className="font-semibold text-slate-900">{verifyResult.taxpayerType}</span>
                  </div>
                </div>
              </div>

              <button
                onClick={resetVerifyForm}
                className="w-full bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold text-sm py-3 rounded-xl transition-all flex items-center justify-center gap-2"
              >
                Verify Another PIN
              </button>
            </div>
          )}

          <div className="mt-6 pt-4 border-t border-slate-100 text-center">
            <p className="text-xs text-slate-400">
              Powered by <span className="font-semibold text-slate-500">Xeco Group</span>
            </p>
          </div>
        </ModalOverlay>
      )}

      {/* Find My KRA PIN Form */}
      {showFindPINForm && (
        <ModalOverlay onClose={() => { setShowFindPINForm(false); resetPinForm() }} size="large">
          <div className="text-center mb-6">
            <div className="bg-sky-50 rounded-2xl p-4 w-14 h-14 sm:w-16 sm:h-16 flex items-center justify-center mx-auto mb-4 ring-1 ring-sky-100">
              <Search className="h-7 w-7 sm:h-8 sm:w-8 text-sky-600" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-[#0a2540] tracking-tight">Find My KRA PIN</h2>
            <p className="text-sm sm:text-base text-slate-500 mt-1">Retrieve your KRA PIN or request a certificate</p>
          </div>

          <div className="bg-slate-50 rounded-xl p-4 mb-6 border border-slate-200/60">
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Your data is processed in line with the Kenya Data Protection Act, 2019.{' '}
              <a
                href="/privacy"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#0a2540] font-semibold underline underline-offset-2 hover:text-blue-600 transition-colors"
              >
                How we handle your data
              </a>
            </p>
          </div>

          <div className="mb-6">
            <label className="block text-xs font-bold text-slate-700 mb-2 uppercase tracking-wide">
              Use KRA PIN or ID?
            </label>
            <div className="inline-flex rounded-full border border-slate-200 bg-slate-100 p-1 w-full">
              <button
                type="button"
                onClick={() => { setLookupMode('id'); setPinId(''); setPinError(''); setReprintOnlyError('') }}
                className={`flex-1 px-4 py-2 rounded-full text-xs font-semibold transition-all ${
                  lookupMode === 'id'
                    ? 'bg-white text-[#0a2540] shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                Use ID (free)
              </button>
              <button
                type="button"
                onClick={() => { setLookupMode('pin'); setPinId(''); setPinError(''); setReprintOnlyError('') }}
                className={`flex-1 px-4 py-2 rounded-full text-xs font-semibold transition-all ${
                  lookupMode === 'pin'
                    ? 'bg-white text-[#0a2540] shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                Use KRA PIN ({REPRINT_FEE} KES)
              </button>
            </div>
          </div>

          {lookupMode === 'id' && (
            <>
              {pinError && (
                <div className="mb-4 rounded-xl bg-red-50 border border-red-200 p-3 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-700">{pinError}</p>
                </div>
              )}

              <form className="space-y-4" onSubmit={handlePinSubmit}>
                <div>
                  <label className="block text-sm font-semibold text-slate-800 mb-1.5">
                    ID / PASSPORT NUMBER <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={pinId}
                    onChange={(e) => setPinId(e.target.value)}
                    placeholder="e.g. 12345678"
                    disabled={isLoadingPin || showPinResult}
                    className="w-full bg-white border border-slate-300 rounded-xl px-4 py-3 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0a2540]/20 focus:border-[#0a2540] transition-all disabled:bg-slate-50 disabled:cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-800 mb-1.5">TAXPAYER TYPE</label>
                  <div className="relative">
                    <select
                      value={taxpayerType}
                      onChange={(e) => setTaxpayerType(e.target.value)}
                      disabled={isLoadingPin || showPinResult}
                      className="w-full bg-white border border-slate-300 rounded-xl px-4 py-3 text-slate-900 appearance-none focus:outline-none focus:ring-2 focus:ring-[#0a2540]/20 focus:border-[#0a2540] transition-all cursor-pointer disabled:bg-slate-50 disabled:cursor-not-allowed"
                    >
                      {TAXPAYER_TYPES.map((t) => (
                        <option key={t.code} value={t.code}>{t.label}</option>
                      ))}
                    </select>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                      <ChevronRight className="w-4 h-4 rotate-90" />
                    </div>
                  </div>
                </div>

                {!showPinResult && !isLoadingPin && (
                  <div className="pt-1">
                    <label className="flex items-start gap-3 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={agreedToTerms}
                        onChange={(e) => {
                          setAgreedToTerms(e.target.checked)
                          if (e.target.checked) setPinError('')
                        }}
                        className="mt-0.5 h-4 w-4 rounded border-slate-300 text-[#0a2540] focus:ring-[#0a2540] cursor-pointer"
                      />
                      <span className="text-xs sm:text-sm text-slate-600 leading-snug">
                        I agree to submit my information and accept the{' '}
                        <a
                          href="/terms"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[#0a2540] font-semibold underline underline-offset-2 hover:text-blue-600 transition-colors"
                          onClick={(e) => e.stopPropagation()}
                        >
                          Terms and Conditions
                        </a>.
                      </span>
                    </label>
                  </div>
                )}

                {!showPinResult && (
                  <>
                    <div className="flex justify-start my-2">
                      <Turnstile
                        ref={pinTurnstileRef}
                        siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY!}
                        onSuccess={(token) => {
                          pinTurnstileTokenRef.current = token
                          setPinTurnstileToken(token)
                          setPinError('')
                        }}
                        onExpire={() => {
                          pinTurnstileTokenRef.current = null
                          setPinTurnstileToken(null)
                        }}
                        options={{ theme: 'light' }}
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={isLoadingPin || !pinTurnstileToken || !agreedToTerms}
                      className={`w-full font-semibold text-base py-3.5 rounded-xl transition-all flex items-center justify-center gap-2 mt-2 ${
                        isLoadingPin || !pinTurnstileToken || !agreedToTerms
                          ? 'bg-slate-300 text-white cursor-wait'
                          : 'bg-[#0a2540] hover:bg-[#112d4e] text-white shadow-md'
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
                  </>
                )}
              </form>

              {isLoadingPin && !showPinResult && (
                <div className="mt-5 space-y-4 animate-pulse">
                  <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
                    <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 flex items-center gap-2">
                      <div className="w-4 h-4 rounded-full bg-slate-200" />
                      <div className="h-4 w-24 bg-slate-200 rounded" />
                    </div>
                    <div className="p-4 space-y-3">
                      <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                        <div className="h-4 w-20 bg-slate-200 rounded" />
                        <div className="h-4 w-32 bg-slate-200 rounded" />
                      </div>
                      <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                        <div className="h-4 w-16 bg-slate-200 rounded" />
                        <div className="h-4 w-28 bg-slate-200 rounded" />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {showPinResult && pinResult && (
                <div className="mt-5 space-y-4">
                  <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-sm">
                    <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-emerald-500" />
                      <span className="text-sm font-semibold text-slate-800">PIN Found</span>
                    </div>
                    <div className="p-4 space-y-3 text-sm">
                      <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                        <span className="text-slate-500">Taxpayer</span>
                        <span className="font-semibold text-slate-900">{maskName(pinResult.taxpayerName)}</span>
                      </div>
                      <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                        <span className="text-slate-500">KRA PIN</span>
                        <div className="flex items-center gap-2 relative">
                          <span className="font-mono font-bold text-[#0a2540] text-base">{pinResult.kraPin}</span>
                          <button onClick={handleCopyPin} className="text-slate-400 hover:text-slate-600 p-1" title="Copy PIN">
                            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                            </svg>
                          </button>
                          {copied && <span className="absolute -top-8 right-0 text-xs text-white font-medium bg-slate-800 px-2 py-1 rounded shadow-sm">Copied!</span>}
                        </div>
                      </div>
                    </div>
                  </div>

                  {reprintFlow === 'pending' && (
                    <div className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-6 text-center">
                      <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-white ring-4 ring-amber-100 shadow-sm">
                        <Smartphone className="h-7 w-7 animate-pulse text-amber-500" />
                      </div>
                      <p className="mt-4 text-[15px] font-bold text-amber-900">Waiting for confirmation</p>
                      <p className="mt-1 text-[11.5px] text-amber-700">
                        Check your phone and enter your M-Pesa PIN for KES {REPRINT_FEE}.
                      </p>
                      <p className="mt-2 text-[11px] text-amber-600/80">
                        {(reprintPollCount * 2.5).toFixed(0)}s elapsed
                      </p>
                    </div>
                  )}

                  {reprintFlow === 'success' && reprintSuccess && (
                    <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-6 text-center">
                      <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-white ring-4 ring-emerald-100 shadow-sm">
                        <CheckCircle className="h-7 w-7 text-emerald-500" />
                      </div>
                      <p className="mt-3 text-[17px] font-bold text-emerald-900">Payment Successful</p>
                      <p className="mt-1.5 text-[12.5px] text-emerald-700">
                        KES {reprintSuccess.amount} paid for certificate reprint
                      </p>
                      {reprintSuccess.receipt && (
                        <p className="mt-1 text-[11px] font-mono text-emerald-600">
                          Receipt: {reprintSuccess.receipt}
                        </p>
                      )}
                      <p className="mt-3 text-[12px] text-emerald-800">
                        Your certificate will be sent to{' '}
                        <span className="font-semibold">{reprintSuccess.email}</span>
                      </p>
                      <button
                        onClick={resetReprintForm}
                        className="mt-5 w-full h-11 rounded-xl bg-[#0a2540] text-white text-[13px] font-semibold hover:bg-[#112d4e] transition-colors"
                      >
                        Done
                      </button>
                    </div>
                  )}

                  {reprintFlow === 'error' && reprintError && (
                    <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-4">
                      <div className="flex items-start gap-2">
                        <AlertCircle className="h-4 w-4 mt-0.5 shrink-0 text-red-500" />
                        <div className="min-w-0 flex-1">
                          <p className="text-[13px] font-bold text-red-800">Payment Failed</p>
                          <p className="mt-0.5 text-[11.5px] leading-snug text-red-700">{reprintError}</p>
                        </div>
                      </div>
                      <button
                        onClick={resetReprintForm}
                        className="mt-3 h-9 rounded-lg bg-red-600 px-4 text-[12px] font-semibold text-white hover:bg-red-700"
                      >
                        Try Again
                      </button>
                    </div>
                  )}

                  {reprintFlow === 'idle' && isReprintWindowOpen() && (
                    <button
                      onClick={handleOpenReprintForm}
                      className="w-full bg-white border border-emerald-500 text-emerald-700 font-semibold text-sm py-3 rounded-xl hover:bg-emerald-50 transition-all flex items-center justify-center gap-2 shadow-sm"
                    >
                      <Download className="w-4 h-4" />
                      Reprint KRA Certificate
                    </button>
                  )}

                  <button
                    onClick={resetPinForm}
                    className="w-full bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold text-sm py-3 rounded-xl transition-all flex items-center justify-center gap-2"
                  >
                    Fetch Another PIN
                  </button>
                </div>
              )}
            </>
          )}

          {lookupMode === 'pin' && (
            <>
              {reprintOnlyError && (
                <div className="mb-4 rounded-xl bg-red-50 border border-red-200 p-3 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-700">{reprintOnlyError}</p>
                </div>
              )}

              <form className="space-y-4" onSubmit={handlePinModeSubmit}>
                <div>
                  <label className="block text-sm font-semibold text-slate-800 mb-1.5">
                    KRA PIN <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={pinId}
                    onChange={(e) => setPinId(e.target.value.toUpperCase())}
                    placeholder="e.g. A0123456789Z"
                    className="w-full bg-white border border-slate-300 rounded-xl px-4 py-3 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0a2540]/20 focus:border-[#0a2540] transition-all font-mono uppercase"
                  />
                  <p className="mt-1.5 text-[11px] text-slate-500">
                    Enter the KRA PIN you already have. We'll request the certificate from KRA and email it to you.
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-800 mb-1.5">
                    Email Address <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={reprintOnlyEmail}
                    onChange={(e) => setReprintOnlyEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full bg-white border border-slate-300 rounded-xl px-4 py-3 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0a2540]/20 focus:border-[#0a2540] transition-all"
                  />
                  <p className="mt-1.5 text-[11px] text-slate-500">
                    Your certificate will be sent here.
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-800 mb-1.5">
                    M-Pesa Payment Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    value={reprintOnlyPaymentNo}
                    onChange={(e) => setReprintOnlyPaymentNo(e.target.value)}
                    placeholder="e.g. 07XXXXXXXX"
                    className="w-full bg-white border border-slate-300 rounded-xl px-4 py-3 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0a2540]/20 focus:border-[#0a2540] transition-all"
                  />
                  <p className="mt-1.5 text-[11px] text-slate-500">
                    You'll receive an M-Pesa STK prompt for KES {REPRINT_FEE}.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={reprintFlow === 'processing'}
                  className={`w-full font-semibold text-base py-3.5 rounded-xl transition-all flex items-center justify-center gap-2 mt-2 ${
                    reprintFlow === 'processing'
                      ? 'bg-slate-300 text-white cursor-wait'
                      : 'bg-[#0a2540] hover:bg-[#112d4e] text-white shadow-md'
                  }`}
                >
                  {reprintFlow === 'processing' ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Sending request...
                    </>
                  ) : (
                    <>Pay KES {REPRINT_FEE} &amp; Request Certificate →</>
                  )}
                </button>
              </form>

              {reprintFlow === 'pending' && (
                <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-6 text-center">
                  <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-white ring-4 ring-amber-100 shadow-sm">
                    <Smartphone className="h-7 w-7 animate-pulse text-amber-500" />
                  </div>
                  <p className="mt-4 text-[15px] font-bold text-amber-900">Waiting for confirmation</p>
                  <p className="mt-1 text-[11.5px] text-amber-700">
                    Check your phone and enter your M-Pesa PIN for KES {REPRINT_FEE}.
                  </p>
                  <p className="mt-2 text-[11px] text-amber-600/80">
                    {(reprintPollCount * 2.5).toFixed(0)}s elapsed
                  </p>
                  <button
                    onClick={resetReprintForm}
                    className="mt-4 text-[11.5px] font-medium text-amber-800 underline underline-offset-2 hover:text-amber-900"
                  >
                    I didn't receive a prompt — start over
                  </button>
                </div>
              )}

              {reprintFlow === 'success' && reprintSuccess && (
                <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-6 text-center">
                  <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-white ring-4 ring-emerald-100 shadow-sm">
                    <CheckCircle className="h-7 w-7 text-emerald-500" />
                  </div>
                  <p className="mt-3 text-[17px] font-bold text-emerald-900">Payment Successful</p>
                  <p className="mt-1.5 text-[12.5px] text-emerald-700">
                    KES {reprintSuccess.amount} paid for certificate reprint
                  </p>
                  {reprintSuccess.receipt && (
                    <p className="mt-1 text-[11px] font-mono text-emerald-600">
                      Receipt: {reprintSuccess.receipt}
                    </p>
                  )}
                  <p className="mt-3 text-[12px] text-emerald-800">
                    Your certificate will be sent to{' '}
                    <span className="font-semibold">{reprintSuccess.email}</span>
                  </p>
                  <button
                    onClick={() => {
                      resetPinForm()
                      setLookupMode('id')
                      setReprintOnlyEmail('')
                      setReprintOnlyPaymentNo('')
                      setReprintFlow('idle')
                    }}
                    className="mt-5 w-full h-11 rounded-xl bg-[#0a2540] text-white text-[13px] font-semibold hover:bg-[#112d4e] transition-colors"
                  >
                    Done
                  </button>
                </div>
              )}

              {reprintFlow === 'error' && reprintOnlyError && (
                <div className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-4">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 mt-0.5 shrink-0 text-red-500" />
                    <div className="min-w-0 flex-1">
                      <p className="text-[13px] font-bold text-red-800">Payment Failed</p>
                      <p className="mt-0.5 text-[11.5px] leading-snug text-red-700">{reprintOnlyError}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => { setReprintFlow('idle'); setReprintOnlyError('') }}
                    className="mt-3 h-9 rounded-lg bg-red-600 px-4 text-[12px] font-semibold text-white hover:bg-red-700"
                  >
                    Try Again
                  </button>
                </div>
              )}
            </>
          )}

          <div className="mt-6 pt-4 border-t border-slate-100 text-center">
            <p className="text-xs text-slate-400">
              Powered by <span className="font-semibold text-slate-500">Xeco Group</span>
            </p>
          </div>
        </ModalOverlay>
      )}

      {showReprintForm && (
        <ModalOverlay onClose={() => { setShowReprintForm(false); resetReprintForm() }} size="compact">
          <div className="mb-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center flex-shrink-0 border border-slate-200">
                <FileText className="w-5 h-5 text-slate-700" />
              </div>
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-[#0a2540] tracking-tight">
                  KRA PIN Reprint
                </h2>
                <p className="text-[11px] sm:text-xs text-slate-500 leading-relaxed mt-0.5">
                  PDF will be shared to your email.
                </p>
              </div>
            </div>
          </div>

          {reprintError && (
            <div className="mb-4 rounded-xl bg-red-50 border border-red-200 p-3 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-red-700">{reprintError}</p>
            </div>
          )}

          <form onSubmit={handleReprintSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Full Name
              </label>
              <input
                type="text"
                value={reprintFullName}
                readOnly
                placeholder="Enter full name"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-slate-600 placeholder-slate-400 cursor-not-allowed text-sm font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                National ID or KRA PIN
              </label>
              <input
                type="text"
                value={reprintIdOrPin}
                readOnly
                placeholder="Enter National ID or KRA PIN"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-slate-600 placeholder-slate-400 cursor-not-allowed text-sm font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Email Address
              </label>
              <input
                type="email"
                required
                value={reprintEmail}
                onChange={(e) => setReprintEmail(e.target.value)}
                placeholder="Enter email address"
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2.5 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0a2540]/20 focus:border-[#0a2540] transition-all text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Payment No
              </label>
              <input
                type="tel"
                required
                value={reprintPaymentNo}
                onChange={(e) => setReprintPaymentNo(e.target.value)}
                placeholder="e.g. 07XXXXXXXX"
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2.5 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0a2540]/20 focus:border-[#0a2540] transition-all text-sm"
              />
              <p className="mt-1.5 text-[10px] text-slate-500">
                M-Pesa number that will receive the STK push prompt.
              </p>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => { setShowReprintForm(false); resetReprintForm() }}
                className="flex-1 bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 font-semibold text-sm py-3 rounded-xl transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={reprintFlow === 'processing'}
                className={`flex-1 font-semibold text-sm py-3 rounded-xl transition-all flex items-center justify-center gap-2 ${
                  reprintFlow === 'processing'
                    ? 'bg-slate-300 text-white cursor-wait'
                    : 'bg-[#0a2540] hover:bg-[#112d4e] text-white shadow-md'
                }`}
              >
                {reprintFlow === 'processing' ? (
                  <>
                    <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Sending...
                  </>
                ) : (
                  <>Pay Ksh {REPRINT_FEE}</>
                )}
              </button>
            </div>
          </form>
        </ModalOverlay>
      )}

      {showPayment && (
        <ModalOverlay onClose={() => setShowPayment(false)} size="large">
          <div className="text-center mb-6 sm:mb-8">
            <div className="bg-emerald-50 rounded-2xl p-4 w-14 h-14 sm:w-16 sm:h-16 flex items-center justify-center mx-auto mb-4 sm:mb-5 ring-1 ring-emerald-100">
              <CreditCard className="h-7 w-7 sm:h-8 sm:w-8 text-emerald-600" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-[#0a2540] tracking-tight">Complete Payment</h2>
            <p className="text-sm sm:text-base text-slate-500 mt-2">Pay KES {REPRINT_FEE} via M-Pesa</p>
          </div>
          <form onSubmit={handlePaymentSubmit} className="space-y-5">
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 text-center">
              <p className="text-sm text-slate-500 font-medium">Amount to Pay</p>
              <p className="text-3xl sm:text-4xl font-extrabold text-[#0a2540] mt-1">KES {REPRINT_FEE}.00</p>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">M-Pesa Phone Number</label>
              <input
                type="tel"
                required
                className="w-full px-4 py-3.5 rounded-xl border border-slate-300 focus:border-[#0a2540] focus:ring-2 focus:ring-[#0a2540]/20 outline-none transition-all text-base"
                placeholder="0712 345 678"
                value={paymentData.phoneNumber}
                onChange={(e) => setPaymentData({ ...paymentData, phoneNumber: e.target.value })}
              />
            </div>
            <button type="submit" className="w-full bg-[#0a2540] hover:bg-[#112d4e] text-white py-3.5 sm:py-4 rounded-xl font-semibold transition-all text-base sm:text-lg shadow-lg">
              Pay Now
            </button>
          </form>
        </ModalOverlay>
      )}

      {showSuccess && (
        <ModalOverlay onClose={() => setShowSuccess(false)} size="large">
          <div className="text-center">
            <div className="bg-emerald-50 rounded-full w-20 h-20 sm:w-24 sm:h-24 flex items-center justify-center mx-auto mb-5 sm:mb-6 ring-1 ring-emerald-100">
              <CheckCircle className="h-10 w-10 sm:h-12 sm:w-12 text-emerald-500" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-[#0a2540] tracking-tight">Payment Successful!</h2>
            <p className="text-sm sm:text-base text-slate-500 mt-2">Your KRA request has been received.</p>
            <div className="bg-slate-50 rounded-2xl p-4 mt-6 border border-slate-200">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Tracking Number</p>
              <p className="text-xl sm:text-2xl font-bold text-blue-600 tracking-wider font-mono">{trackingNumber}</p>
            </div>
            <button onClick={() => setShowSuccess(false)} className="w-full mt-6 bg-white border border-slate-300 text-slate-700 py-3.5 sm:py-4 rounded-xl font-semibold hover:bg-slate-50 transition-all text-base sm:text-lg">
              Close
            </button>
          </div>
        </ModalOverlay>
      )}

      {showCheckStatus && (
        <ModalOverlay onClose={() => setShowCheckStatus(false)} size="large">
          <div className="text-center mb-6 sm:mb-8">
            <div className="bg-indigo-50 rounded-2xl p-4 w-14 h-14 sm:w-16 sm:h-16 flex items-center justify-center mx-auto mb-4 sm:mb-5 ring-1 ring-indigo-100">
              <Search className="h-7 w-7 sm:h-8 sm:w-8 text-indigo-600" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-[#0a2540] tracking-tight">Track KRA Request</h2>
            <p className="text-sm sm:text-base text-slate-500 mt-2">
              Enter your Reference Number or M-Pesa Receipt
            </p>
          </div>
          <form onSubmit={(e) => { e.preventDefault(); handleTrackRequest() }} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Reference Number or M-Pesa Receipt</label>
              <input
                type="text"
                required
                className="w-full px-4 py-3.5 rounded-xl border border-slate-300 focus:border-[#0a2540] focus:ring-2 focus:ring-[#0a2540]/20 outline-none transition-all text-base"
                placeholder="e.g. CLA-2026-000154 or TGH5KD9L1M"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value.toUpperCase())}
              />
            </div>
            <button
              type="submit"
              disabled={isSearching}
              className="w-full bg-[#0a2540] hover:bg-[#112d4e] text-white py-3.5 sm:py-4 rounded-xl font-semibold transition-all text-base sm:text-lg shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSearching ? 'Searching...' : 'Track Request'}
            </button>
          </form>
        </ModalOverlay>
      )}

      {showOrderResult && (
        <ModalOverlay onClose={() => { setShowOrderResult(false); setOrderStatus('') }} size="large">
          <div className="text-center">
            <div className={`rounded-full w-20 h-20 sm:w-24 sm:h-24 flex items-center justify-center mx-auto mb-5 sm:mb-6 ${
              orderStatus === 'Ready for Download' ? 'bg-emerald-50 ring-1 ring-emerald-100' : 'bg-amber-50 ring-1 ring-amber-100'
            }`}>
              {orderStatus === 'Ready for Download'
                ? <CheckCircle className="h-10 w-10 sm:h-12 sm:w-12 text-emerald-500" />
                : <Clock className="h-10 w-10 sm:h-12 sm:w-12 text-amber-500" />}
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-[#0a2540] tracking-tight">Order Status</h2>
            <div className={`mt-3 inline-block px-4 py-1.5 rounded-full text-sm font-bold ${
              orderStatus === 'Ready for Download' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
            }`}>
              {orderStatus || 'Processing'}
            </div>
            <p className="text-sm sm:text-base text-slate-500 mt-4">
              Tracking Number: <span className="font-mono font-semibold text-slate-900">{trackingNumber}</span>
            </p>
            {isCounting && !isReady && (
              <div className="mt-4 bg-blue-50 border border-blue-100 rounded-xl p-4">
                <div className="flex items-center justify-center gap-2">
                  <Timer className="h-5 w-5 text-blue-500 animate-pulse" />
                  <span className="text-sm text-slate-700 font-medium">
                    Time remaining: <span className="font-bold text-blue-600">{formatTime(countdown)}</span>
                  </span>
                </div>
              </div>
            )}
            {orderStatus === 'Ready for Download' && (
              <button onClick={handleDownload} className="w-full mt-6 bg-[#0a2540] hover:bg-[#112d4e] text-white py-3.5 sm:py-4 rounded-xl font-semibold transition-all flex items-center justify-center gap-3 text-base sm:text-lg shadow-lg">
                <Download className="h-5 w-5 sm:h-6 sm:w-6" />
                Download Certificate
              </button>
            )}
            <button onClick={() => { setShowOrderResult(false); setOrderStatus('') }} className="w-full mt-3 bg-white border border-slate-300 text-slate-700 py-3.5 sm:py-4 rounded-xl font-semibold hover:bg-slate-50 transition-all text-base sm:text-lg">
              Close
            </button>
          </div>
        </ModalOverlay>
      )}

      {/* 4. ADD THE PRICING MODAL AT THE BOTTOM */}
      <PricingModal 
        isOpen={showPricingModal} 
        onClose={() => setShowPricingModal(false)} 
        onStartFree={() => {
          setShowFindPINForm(true)
        }} 
      />
    </div>
  )
}

// Reusable Modal
function ModalOverlay({ children, onClose, size = 'default' }: {
  children: React.ReactNode
  onClose: () => void
  size?: 'default' | 'large' | 'compact'
}) {
  const maxWidth =
    size === 'large' ? 'max-w-lg sm:max-w-xl' :
    size === 'compact' ? 'max-w-sm sm:max-w-md' :
    'max-w-sm sm:max-w-md'
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" onClick={onClose} />
      <div className={`relative bg-white rounded-[1.5rem] sm:rounded-[2rem] shadow-2xl w-full ${maxWidth} p-5 sm:p-7 md:p-8 border border-slate-100 overflow-y-auto max-h-[90vh] transform transition-all`}>
        <button
          onClick={onClose}
          className="absolute top-4 right-4 sm:top-5 sm:right-5 text-slate-400 hover:text-slate-700 bg-slate-50 hover:bg-slate-100 rounded-full p-2 transition-all z-10"
        >
          <X className="h-4 w-4" />
        </button>
        {children}
      </div>
    </div>
  )
}