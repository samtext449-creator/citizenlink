'use client'

import { useState, useEffect } from 'react'
import { 
  ArrowRight,
  Shield,
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
  Bell,
  MapPin,
  Navigation,
  ExternalLink,
} from 'lucide-react'

// ─── Config ─────────────
// Replace this with your deployed XecoFlow-Pay domain
const XECOFLOW_PAY_BASE = process.env.NEXT_PUBLIC_XECOFLOW_PAY_URL || 'https://your-xecoflow-pay-domain.com'

const TAXPAYER_TYPES = [
  { label: 'Kenyan Citizen', code: 'KE' },
  { label: 'Kenyan Resident', code: 'NKE' },
  { label: 'Non-Resident', code: 'NKENR' },
]

interface PinResult {
  kraPin: string
  taxpayerName: string
  taxpayerType: string
  taxpayerId: string
}

export default function CitizenLinkAfrica() {
  const [activeCard, setActiveCard] = useState<number | null>(null)
  const [isLoaded, setIsLoaded] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isNotificationOpen, setIsNotificationOpen] = useState(false)

  // Notification State
  const [notifications, setNotifications] = useState<{ id: string, title: string, status: string, time: string }[]>([])
  const [hasUnread, setHasUnread] = useState(false)

  // Location State
  const [userLocation, setUserLocation] = useState<{ lat: number, lng: number } | null>(null)
  const [locationError, setLocationError] = useState('')
  const [isLocating, setIsLocating] = useState(false)

  // Main Modals
  const [showKRAPopup, setShowKRAPopup] = useState(false)
  const [showCheckStatus, setShowCheckStatus] = useState(false)
  const [showPayment, setShowPayment] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [showComingSoon, setShowComingSoon] = useState(false)
  const [comingSoonTitle, setComingSoonTitle] = useState('')
  
  // Specific Service Form States
  const [showFindPINForm, setShowFindPINForm] = useState(false)
  const [showNearestCyberForm, setShowNearestCyberForm] = useState(false)
  
  // Find KRA PIN States
  const [pinId, setPinId] = useState('')
  const [taxpayerType, setTaxpayerType] = useState('KE')
  const [isLoadingPin, setIsLoadingPin] = useState(false)
  const [showPinResult, setShowPinResult] = useState(false)
  const [pinResult, setPinResult] = useState<PinResult | null>(null)
  const [pinError, setPinError] = useState('')
  const [copied, setCopied] = useState(false)

  // Tracking States
  const [trackingNumber, setTrackingNumber] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [orderStatus, setOrderStatus] = useState('')
  const [showOrderResult, setShowOrderResult] = useState(false)
  const [isSearching, setIsSearching] = useState(false)

  // Countdown States
  const TOTAL_SECONDS = 75
  const [countdown, setCountdown] = useState(TOTAL_SECONDS)
  const [isCounting, setIsCounting] = useState(false)
  const [isReady, setIsReady] = useState(false)
  const [countdownStartTime, setCountdownStartTime] = useState<number | null>(null)

  // Form States
  const [formData, setFormData] = useState({
    firstName: '',
    phone: '',
    idNumber: '',
  })
  const [paymentData, setPaymentData] = useState({
    phoneNumber: '',
    amount: 25,
  })

  // Load notifications from localStorage on mount
  useEffect(() => {
    const savedNotifications = localStorage.getItem('citizenlink_notifications')
    if (savedNotifications) {
      try {
        const parsed = JSON.parse(savedNotifications)
        setNotifications(parsed)
        if (parsed.some((n: any) => n.status === 'Ready')) {
          setHasUnread(true)
        }
      } catch (e) {
        console.error('Error loading notifications:', e)
      }
    }
  }, [])

  // Save notifications whenever they change
  useEffect(() => {
    if (notifications.length > 0) {
      localStorage.setItem('citizenlink_notifications', JSON.stringify(notifications))
    }
  }, [notifications])

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
          setIsReady(false)
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
            trackingNumber: state.trackingNumber,
            completed: true,
            timestamp: Date.now()
          }))
          addNotification(state.trackingNumber, 'Ready')
        }
      } catch (e) {
        console.error('Error restoring countdown state:', e)
      }
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
          addNotification(completedState.trackingNumber, 'Ready')
        }
      } catch (e) {
        console.error('Error restoring completed state:', e)
      }
    }
    
    setIsLoaded(true)
  }, [])

  useEffect(() => {
    if (trackingNumber) {
      localStorage.setItem('citizenlink_last_reference', trackingNumber)
    }
  }, [trackingNumber])

  useEffect(() => {
    if (isCounting && trackingNumber && countdownStartTime) {
      const state = {
        startTime: countdownStartTime,
        totalSeconds: TOTAL_SECONDS,
        trackingNumber: trackingNumber,
        isReady: isReady
      }
      localStorage.setItem('citizenlink_countdown_state', JSON.stringify(state))
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
              trackingNumber: trackingNumber,
              completed: true,
              timestamp: Date.now()
            }))
            addNotification(trackingNumber, 'Ready')
            return 0
          }
          setOrderStatus(`Processing... ${formatTime(newValue)} remaining`)
          return newValue
        })
      }, 1000)
    }

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [isCounting, countdown, trackingNumber])

  const addNotification = (ref: string, status: string) => {
    setNotifications(prev => {
      const exists = prev.find(n => n.id === ref)
      if (exists) {
        return prev.map(n => n.id === ref ? { ...n, status, time: 'Just now' } : n)
      }
      return [{ id: ref, title: `Request ${ref}`, status, time: 'Just now' }, ...prev]
    })
    if (status === 'Ready') {
      setHasUnread(true)
    }
  }

  const handleNotificationClick = (ref: string) => {
    setSearchInput(ref)
    setTrackingNumber(ref)
    setIsNotificationOpen(false)
    handleTrackRequest(ref)
  }

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
        setUserLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        })
        setIsLocating(false)
      },
      (error) => {
        setLocationError('Unable to retrieve your location. Please enable location access.')
        setIsLocating(false)
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    )
  }

  const handlePinSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!pinId.trim()) return

    setIsLoadingPin(true)
    setShowPinResult(false)
    setPinError('')
    setPinResult(null)

    try {
      // Call the deployed XecoFlow-Pay API endpoint
      const res = await fetch(`${XECOFLOW_PAY_BASE}/api/kratax/pin/fetch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          taxpayerType,
          taxpayerId: pinId.trim(),
        }),
      })

      const data = await res.json().catch(() => ({}))

      if (!res.ok || !data.success) {
        const msg =
          data.error ||
          (data.code === 'KRA_INVALID_ID'
            ? 'This ID number was not found in KRA records.'
            : data.code === 'KRA_TIMEOUT'
            ? 'KRA is taking too long to respond. Please try again.'
            : data.code === 'RATE_LIMITED'
            ? 'Too many requests. Please try again in an hour.'
            : 'Could not retrieve KRA PIN. Please check the ID and try again.')
        setPinError(msg)
        setIsLoadingPin(false)
        return
      }

      setPinResult({
        kraPin: data.data.kraPin,
        taxpayerName: data.data.taxpayerName,
        taxpayerType: data.data.taxpayerType,
        taxpayerId: data.data.taxpayerId,
      })
      setShowPinResult(true)
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
  }

  const maskName = (name: string) => {
    if (!name) return ''
    const parts = name.trim().split(/\s+/)
    return parts
      .map((part, index) => {
        if (index === 0) return part
        if (part.length <= 1) return part
        return part[0] + '*'.repeat(part.length - 1)
      })
      .join(' ')
  }

  const serviceCards = [
    { 
      title: 'Find My KRA PIN', 
      desc: 'Retrieve your KRA PIN instantly',
      tag: 'Free',
      color: 'bg-sky-50 border-sky-200',
      onClick: () => { setShowFindPINForm(true); },
      isActive: true,
    },
    { 
      title: 'Verify KRA PIN', 
      desc: 'Confirm a KRA PIN is valid',
      color: 'bg-violet-50 border-violet-200',
      onClick: () => { setComingSoonTitle('Verify KRA PIN'); setShowComingSoon(true); },
      isActive: false,
    },
    { 
      title: 'Nil Returns Filing', 
      desc: 'Fast annual/monthly Nil Returns submission',
      color: 'bg-emerald-50 border-emerald-200',
      onClick: () => { setComingSoonTitle('Nil Returns Filing'); setShowComingSoon(true); },
      isActive: false,
    },
    { 
      title: 'P9 / Employment Returns', 
      desc: 'Annual P9 and employment income filing',
      color: 'bg-blue-50 border-blue-200',
      onClick: () => { setComingSoonTitle('P9 / Employment Returns'); setShowComingSoon(true); },
      isActive: false,
    },
    { 
      title: 'Turnover Tax (TOT) Returns', 
      desc: 'TOT filing for small businesses',
      color: 'bg-purple-50 border-purple-200',
      onClick: () => { setComingSoonTitle('Turnover Tax (TOT) Returns'); setShowComingSoon(true); },
      isActive: false,
    },
    { 
      title: 'Rental Tax Returns', 
      desc: 'Filing for rental income properties',
      color: 'bg-amber-50 border-amber-200',
      onClick: () => { setComingSoonTitle('Rental Tax Returns'); setShowComingSoon(true); },
      isActive: false,
    },
    { 
      title: 'KRA PIN Services', 
      desc: 'New Registration & Certificate Retrieval',
      color: 'bg-rose-50 border-rose-200',
      onClick: () => { setComingSoonTitle('KRA PIN Services'); setShowComingSoon(true); },
      isActive: false,
    },
    { 
      title: 'Tax Compliance Certificate', 
      desc: 'TCC application and status verification',
      color: 'bg-cyan-50 border-cyan-200',
      onClick: () => { setComingSoonTitle('Tax Compliance Certificate'); setShowComingSoon(true); },
      isActive: false,
    },
    { 
      title: 'iTax Profile Updates', 
      desc: 'Change phone number, email, or password reset',
      color: 'bg-indigo-50 border-indigo-200',
      onClick: () => { setComingSoonTitle('iTax Profile Updates'); setShowComingSoon(true); },
      isActive: false,
    },
    { 
      title: 'eTIMS Onboarding', 
      desc: 'System setup and assistance for traders',
      color: 'bg-teal-50 border-teal-200',
      onClick: () => { setComingSoonTitle('eTIMS Onboarding'); setShowComingSoon(true); },
      isActive: false,
    },
  ]

  const handleKRAClick = (action: string) => {
    setShowKRAPopup(false)
    if (action === 'status') {
      setShowCheckStatus(true)
    }
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
    
    const state = {
      startTime: startTime,
      totalSeconds: TOTAL_SECONDS,
      trackingNumber: trackNo,
      isReady: false
    }
    localStorage.setItem('citizenlink_countdown_state', JSON.stringify(state))
    
    addNotification(trackNo, 'Processing')
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
        } catch (e) {
          console.error('Error parsing completed state:', e)
        }
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
        } catch (e) {
          console.error('Error parsing countdown state:', e)
        }
      }
      
      if (isDocReady) {
        setOrderStatus('Ready for Download')
        setIsReady(true)
        setIsCounting(false)
        localStorage.removeItem('citizenlink_countdown_state')
        localStorage.setItem('citizenlink_completed_state', JSON.stringify({
          trackingNumber: searchTerm,
          completed: true,
          timestamp: Date.now()
        }))
        addNotification(searchTerm, 'Ready')
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

  const handleDownload = () => {
    alert('📄 Your KRA certificate is downloading...')
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
  }

  const progressPercentage = ((TOTAL_SECONDS - countdown) / TOTAL_SECONDS) * 100

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-blue-50 via-white to-indigo-50/30">
      {/* Professional Header */}
      <header className="sticky top-0 z-50 bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-700 shadow-lg w-full">
        {/* Disclaimer Banner */}
        <div className="w-full bg-amber-500/95 backdrop-blur-sm border-b border-amber-400/30">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-center gap-2 py-2">
              <AlertCircle className="h-4 w-4 text-amber-900 animate-pulse flex-shrink-0" />
              <span className="text-[10px] sm:text-xs font-medium text-amber-900 text-center leading-tight max-w-3xl">
                Authorized KRA Partner: Taxflow Africa is operated by Xeco Developers under Ushuru Mashinani. Final approvals belong to KRA.
              </span>
            </div>
          </div>
        </div>

        {/* Main Nav */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-20">
            <div className="flex items-center flex-shrink-0">
              <span className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white whitespace-nowrap">
                Taxflow <span className="text-yellow-300">Africa</span>
              </span>
            </div>

            <nav className="hidden md:flex items-center flex-1 justify-center px-4">
              <button 
                onClick={() => setShowCheckStatus(true)}
                className="text-base font-semibold text-white hover:text-yellow-300 transition-colors"
              >
                Track KRA Request Status
              </button>
            </nav>

            {/* Notification Bell - Placed at the far right corner */}
            <div className="relative flex items-center gap-2">
              <button 
                onClick={() => { setIsNotificationOpen(!isNotificationOpen); setHasUnread(false); }}
                className="relative p-2 rounded-lg hover:bg-white/10 transition-colors"
              >
                <Bell className="h-6 w-6 text-white" />
                {hasUnread && (
                  <span className="absolute top-1 right-1 h-2.5 w-2.5 bg-red-500 rounded-full border-2 border-blue-600"></span>
                )}
              </button>

              <button 
                className="md:hidden p-2 rounded-lg hover:bg-white/10 transition-colors"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              >
                <Menu className="h-6 w-6 text-white" />
              </button>

              {/* Notification Dropdown */}
              {isNotificationOpen && (
                <div className="absolute right-0 top-12 mt-2 w-80 bg-white rounded-xl shadow-2xl border border-gray-100 overflow-hidden z-50">
                  <div className="p-3 bg-gray-50 border-b border-gray-100">
                    <h4 className="font-semibold text-gray-800 text-sm">Your Requests</h4>
                  </div>
                  <div className="max-h-64 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="p-4 text-center text-gray-400 text-sm">No requests yet</div>
                    ) : (
                      notifications.map((n, i) => (
                        <button
                          key={i}
                          onClick={() => handleNotificationClick(n.id)}
                          className="w-full text-left px-4 py-3 hover:bg-blue-50 transition-colors border-b border-gray-50 last:border-0 flex items-start gap-3"
                        >
                          <div className={`mt-0.5 w-2 h-2 rounded-full flex-shrink-0 ${n.status === 'Ready' ? 'bg-green-500' : 'bg-blue-500'}`} />
                          <div>
                            <p className="text-sm font-medium text-gray-800">{n.title}</p>
                            <p className={`text-xs ${n.status === 'Ready' ? 'text-green-600 font-semibold' : 'text-gray-400'}`}>{n.status}</p>
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Mobile Menu with Services */}
          {isMobileMenuOpen && (
            <div className="md:hidden py-4 border-t border-white/10 space-y-3">
              <button 
                onClick={() => { setShowCheckStatus(true); setIsMobileMenuOpen(false) }}
                className="block w-full text-left text-base font-semibold text-white hover:text-yellow-300 transition-colors px-2 py-2"
              >
                Track KRA Request Status
              </button>
              
              <div className="border-t border-white/10 pt-3">
                <p className="text-xs font-semibold text-blue-200 uppercase tracking-wider px-2 mb-2">Our Services</p>
                <div className="grid grid-cols-1 gap-1.5">
                  {serviceCards.map((card, i) => (
                    <button
                      key={i}
                      onClick={() => { card.onClick(); setIsMobileMenuOpen(false) }}
                      className="w-full text-left px-3 py-2.5 rounded-lg bg-white/10 hover:bg-white/20 transition-colors flex items-center gap-3"
                    >
                      <div className={`w-2 h-2 rounded-full ${card.isActive ? 'bg-gradient-to-r from-sky-600 to-sky-700' : 'bg-gray-400'}`} />
                      <span className="text-sm font-medium text-white">{card.title}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 w-full">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-16">
          <div className={`transition-all duration-700 ease-out ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-start">
              
              {/* LEFT COLUMN — Hero (Desktop Only) */}
              <div className="hidden lg:block max-w-2xl lg:pt-6">
                {/* Desktop Badge */}
                <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 text-sm font-semibold px-4 py-2 rounded-full mb-6">
                  <span>Authorized KRA Ushuru Mashinani Partner</span>
                </div>

                {/* Headline */}
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-gray-900 leading-[1.1] mb-6 tracking-tight">
                  Fast & Reliable
                  <br />
                  <span className="relative inline-block">
                    <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
                      KRA Services at Your Fingertips.
                    </span>
                    <div className="absolute -bottom-2 left-0 right-0 h-1 bg-gradient-to-r from-blue-600/40 via-indigo-600/40 to-purple-600/40 rounded-full blur-sm" />
                  </span>
                </h1>

                {/* Subtitle */}
                <p className="text-base sm:text-lg text-gray-600 mb-8 leading-relaxed">
                  Taxflow Africa simplifies your KRA tax obligations under the{' '}
                  <span className="font-semibold text-gray-800">Ushuru Mashinani</span> initiative. 
                  File returns, apply for compliance certificates, and retrieve PINs instantly.
                </p>
                
                {/* Service Bullets */}
                <div className="space-y-3 mb-8">
                  {[
                    'Find My KRA PIN',
                    'Filing Nil, Individual & Business Returns',
                    'Tax Compliance Certificates (TCC)',
                    'iTax Profile Updates (Phone & Email)',
                    'eTIMS Onboarding & Assistance',
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-3 text-sm sm:text-base text-gray-700">
                      <div className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center">
                        <svg className="h-3 w-3 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <span>{item}</span>
                    </div>
                  ))}
                </div>

                {/* Desktop CTA Buttons */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                  <button 
                    onClick={() => setShowKRAPopup(true)}
                    className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-blue-700 text-white px-8 py-4 rounded-xl text-base sm:text-lg font-bold hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg shadow-blue-200 inline-flex items-center justify-center gap-2"
                  >
                    File / Request KRA Service <ChevronRight className="h-5 w-5" />
                  </button>
                </div>
              </div>

              {/* RIGHT COLUMN — Service Cards & Mobile List */}
              <div className="w-full">
                {/* Mobile Service List (Visible on Mobile) */}
                <div className="lg:hidden">
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4">Select a service to begin:</p>
                  <div className="space-y-2">
                    {serviceCards.map((card, i) => (
                      <button
                        key={i}
                        onClick={card.onClick}
                        className={`w-full flex items-center gap-4 p-4 rounded-xl border shadow-sm active:scale-[0.98] transition-transform ${
                          card.isActive 
                            ? 'bg-white border-gray-200 hover:border-sky-300 hover:shadow-md' 
                            : 'bg-gray-50 border-gray-200 opacity-70'
                        }`}
                      >
                        <FileText className={`h-5 w-5 flex-shrink-0 ${card.isActive ? 'text-gray-400' : 'text-gray-300'}`} />
                        <span className={`text-sm font-semibold text-left flex-1 ${card.isActive ? 'text-gray-800' : 'text-gray-500'}`}>
                          {card.title}
                        </span>
                        {card.isActive && card.tag && (
                          <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap uppercase tracking-wide flex-shrink-0 ${
                            card.tag === 'NEW' ? 'bg-blue-700 text-white' : 'text-sky-700 bg-sky-100'
                          }`}>
                            {card.tag}
                          </span>
                        )}
                        {!card.isActive && (
                          <span className="text-[9px] font-semibold text-gray-400 bg-gray-200 px-2 py-0.5 rounded-full whitespace-nowrap flex-shrink-0">
                            Soon
                          </span>
                        )}
                        <ChevronRight className={`h-4 w-4 flex-shrink-0 ${card.isActive ? 'text-gray-400' : 'text-gray-300'}`} />
                      </button>
                    ))}
                  </div>
                  <div className="mt-6">
                    <button 
                      onClick={() => setShowCheckStatus(true)}
                      className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 flex items-center justify-center gap-2"
                    >
                      Track Request Status <ArrowRight className="h-5 w-5" />
                    </button>
                  </div>
                </div>

                {/* Desktop Service Grid (Visible on Desktop) */}
                <div className="hidden lg:block">
                  {/* Section Header */}
                  <div className="mb-6 text-center">
                    <h3 className="text-base sm:text-lg font-bold text-gray-700 inline-flex items-center gap-3">
                      <span className="w-12 h-px bg-blue-300"></span>
                      Our Services
                      <span className="w-12 h-px bg-blue-300"></span>
                    </h3>
                  </div>

                  {/* Cards Container */}
                  <div className="relative bg-white rounded-3xl p-6 shadow-xl shadow-blue-100/50">
                    <div className="grid grid-cols-2 gap-4">
                      {serviceCards.map((card, i) => (
                        <div
                          key={i}
                          className={`relative group/card cursor-pointer transition-all duration-300 ${
                            !card.isActive ? 'opacity-70' : ''
                          }`}
                          onMouseEnter={() => setActiveCard(i)}
                          onMouseLeave={() => setActiveCard(null)}
                          onClick={card.onClick}
                        >
                          <div className={`relative border rounded-2xl p-4 h-full flex flex-col justify-between overflow-hidden transition-all duration-300 ${
                            card.isActive 
                              ? `${card.color} hover:shadow-lg` 
                              : 'bg-gray-50 border-gray-200 border-dashed'
                          }`}>
                            <div className="relative z-10">
                              {/* Title Row */}
                              <div className="flex items-start justify-between gap-2 mb-1.5">
                                <h3 className={`font-bold text-sm sm:text-base ${card.isActive ? 'text-gray-900' : 'text-gray-400'}`}>
                                  {card.title}
                                </h3>
                                {card.isActive && card.tag && (
                                  <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap uppercase tracking-wide flex-shrink-0 ${
                                    card.tag === 'NEW' ? 'bg-blue-700 text-white' : 'text-sky-700 bg-sky-100'
                                  }`}>
                                    {card.tag}
                                  </span>
                                )}
                                {!card.isActive && (
                                  <span className="text-[9px] font-semibold text-gray-400 bg-gray-200 px-2 py-0.5 rounded-full whitespace-nowrap flex-shrink-0">
                                    Soon
                                  </span>
                                )}
                              </div>
                              {/* Description */}
                              <p className={`text-xs sm:text-sm leading-snug ${card.isActive ? 'text-gray-500' : 'text-gray-400'}`}>
                                {card.desc}
                              </p>
                            </div>
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
      </main>

      {/* Footer */}
      <footer className="w-full bg-slate-900 text-slate-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="text-lg font-bold text-white">
                Taxflow <span className="text-yellow-300">Africa</span>
              </span>
              <span className="hidden sm:inline-block h-4 w-px bg-slate-700"></span>
              <span className="text-xs text-slate-400">
                © {new Date().getFullYear()} All rights reserved.
              </span>
            </div>
            <p className="text-xs text-slate-400 text-center md:text-right">
              Authorized ICT-enabled service point under KRA Ushuru Mashinani.
            </p>
          </div>
        </div>
      </footer>

      {/* ==================== MODALS ==================== */}

      {/* Find Nearest Cyber Modal */}
      {showNearestCyberForm && (
        <ModalOverlay onClose={() => setShowNearestCyberForm(false)} size="large">
          <div className="text-center mb-8">
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl p-4 w-16 h-16 flex items-center justify-center mx-auto mb-5">
              <MapPin className="h-8 w-8 text-white" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 tracking-tight">Find Nearest Cyber/Print Point</h2>
            <p className="text-base text-gray-500 mt-2">Locate cybercafés or print shops near your current location</p>
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
              <button
                onClick={handleFindNearestCyber}
                className="mt-4 bg-red-600 text-white px-6 py-2 rounded-lg text-sm font-semibold hover:bg-red-700"
              >
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
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Nearby Cybercafés & Print Points</p>
                
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
                    <div className="text-right">
                      <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-full">{cyber.dist}</span>
                    </div>
                  </div>
                ))}

                <a
                  href={`https://www.google.com/maps/search/cybercafe/@${userLocation.lat},${userLocation.lng},14z`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full mt-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white py-4 rounded-xl font-semibold hover:from-blue-700 hover:to-blue-800 transition-all flex items-center justify-center gap-2 text-lg shadow-lg shadow-blue-100"
                >
                  <ExternalLink className="h-5 w-5" />
                  Open in Google Maps
                </a>

                <p className="text-center text-xs text-gray-400 mt-2">
                  Showing generic results. Enable location for accurate nearby search.
                </p>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500 mb-4">Click the button below to find cybercafés or print points near you.</p>
              <button
                onClick={handleFindNearestCyber}
                className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-8 py-4 rounded-xl font-semibold hover:from-blue-700 hover:to-blue-800 transition-all text-lg shadow-lg shadow-blue-100"
              >
                Locate Me
              </button>
            </div>
          )}
        </ModalOverlay>
      )}

      {/* Coming Soon Modal */}
      {showComingSoon && (
        <ModalOverlay onClose={() => setShowComingSoon(false)} size="large">
          <div className="text-center">
            <div className="bg-gradient-to-r from-amber-500 to-orange-500 rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-6">
              <ClockIcon className="h-12 w-12 text-white" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 tracking-tight">Coming Soon!</h2>
            <p className="text-base text-gray-500 mt-2">
              <span className="font-semibold text-gray-700">{comingSoonTitle}</span> are currently in development.
            </p>
            <p className="text-sm text-gray-400 mt-1">
              We're working hard to bring you this service. Stay tuned!
            </p>
            
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mt-6">
              <div className="flex items-center justify-center gap-2">
                <AlertCircle className="h-5 w-5 text-amber-500" />
                <span className="text-sm text-amber-700">This feature will be available soon</span>
              </div>
            </div>

            <button
              onClick={() => setShowComingSoon(false)}
              className="w-full mt-6 bg-gradient-to-r from-blue-600 to-blue-700 text-white py-4 rounded-xl font-semibold hover:from-blue-700 hover:to-blue-800 transition-all text-lg shadow-lg shadow-blue-100"
            >
              Got it
            </button>
          </div>
        </ModalOverlay>
      )}

      {/* KRA Services Popup */}
      {showKRAPopup && (
        <ModalOverlay onClose={() => setShowKRAPopup(false)} size="large">
          <div className="text-center mb-8">
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl p-4 w-16 h-16 flex items-center justify-center mx-auto mb-5">
              <FileText className="h-8 w-8 text-white" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 tracking-tight">KRA Tax Services</h2>
            <p className="text-base text-gray-500 mt-2">What would you like to do today?</p>
          </div>

          <div className="space-y-4">
            <button
              onClick={() => handleKRAClick('status')}
              className="w-full flex items-center justify-between p-5 bg-purple-50 hover:bg-purple-100 rounded-xl transition-all group border-2 border-transparent hover:border-purple-200"
            >
              <div className="flex items-center gap-4">
                <div className="bg-gradient-to-r from-purple-600 to-purple-700 rounded-xl p-2.5">
                  <Search className="h-6 w-6 text-white" />
                </div>
                <div className="text-left">
                  <span className="font-semibold text-gray-900 text-lg">Track My Request</span>
                  <p className="text-sm text-gray-500">Check your order progress</p>
                </div>
              </div>
              <ArrowRight className="h-5 w-5 text-purple-600 group-hover:translate-x-1 transition" />
            </button>
          </div>
        </ModalOverlay>
      )}

      {/* Find My KRA PIN Form (Integrated with API) */}
      {showFindPINForm && (
        <ModalOverlay onClose={() => { setShowFindPINForm(false); resetPinForm(); }} size="large">
          <div className="text-center mb-6">
            <div className="bg-gradient-to-r from-sky-600 to-sky-700 rounded-2xl p-4 w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <Search className="h-8 w-8 text-white" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 tracking-tight">Find My KRA PIN</h2>
            <p className="text-base text-gray-500 mt-1">Retrieve your KRA PIN instantly</p>
          </div>

          {/* Info Box */}
          <div className="bg-[#E8F2EC] rounded-lg p-3.5 mb-5">
            <p className="text-sm text-gray-700 leading-relaxed">
              Retrieve your KRA PIN instantly using your National ID or Passport Number. It's free and instant.
            </p>
          </div>

          {/* Error Banner */}
          {pinError && (
            <div className="mb-4 rounded-lg bg-red-50 border border-red-200 p-3 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700">{pinError}</p>
            </div>
          )}

          {/* Form */}
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
              <label className="block text-sm font-semibold text-gray-800 mb-1.5">
                TAXPAYER TYPE
              </label>
              <div className="relative">
                <select
                  value={taxpayerType}
                  onChange={(e) => setTaxpayerType(e.target.value)}
                  disabled={isLoadingPin || showPinResult}
                  className="w-full bg-white border border-gray-300 rounded-lg px-3.5 py-2.5 text-gray-900 appearance-none focus:outline-none focus:ring-1 focus:ring-[#0a2540] focus:border-[#0a2540] transition-all cursor-pointer disabled:bg-gray-100 disabled:cursor-not-allowed"
                >
                  {TAXPAYER_TYPES.map((t) => (
                    <option key={t.code} value={t.code}>
                      {t.label}
                    </option>
                  ))}
                </select>
                <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500">
                  <ChevronRight className="w-4 h-4 rotate-90" />
                </div>
              </div>
            </div>

            {!showPinResult && (
              <button
                type="submit"
                disabled={isLoadingPin}
                className={`w-full font-semibold text-base py-3 rounded-lg transition-all shadow-sm flex items-center justify-center gap-2 mt-2 ${
                  isLoadingPin
                    ? 'bg-[#A3E5F3] text-gray-600 cursor-not-allowed'
                    : 'bg-[#0a2540] hover:bg-[#1a3a5c] text-white'
                }`}
              >
                {isLoadingPin ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-gray-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Fetching your KRA PIN...
                  </>
                ) : (
                  <>
                    Find My KRA PIN
                    <span className="text-lg leading-none">→</span>
                  </>
                )}
              </button>
            )}
          </form>

          {/* Result State */}
          {showPinResult && pinResult && (
            <div className="mt-5 space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="border border-gray-200 rounded-lg overflow-hidden bg-white">
                <div className="bg-gray-50 px-4 py-2.5 border-b border-gray-200 flex items-center gap-2">
                  <svg className="w-4 h-4 text-green-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                    <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <span className="text-sm font-semibold text-gray-800">PIN Found</span>
                </div>
                <div className="p-4 space-y-3 text-sm">
                  <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                    <span className="text-gray-500">Taxpayer</span>
                    <span className="font-medium text-gray-900">
                      {maskName(pinResult.taxpayerName)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                    <span className="text-gray-500">KRA PIN</span>
                    <div className="flex items-center gap-2 relative">
                      <span className="font-mono font-bold text-[#0a2540]">{pinResult.kraPin}</span>
                      <button
                        onClick={handleCopyPin}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                        title="Copy PIN"
                      >
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                        </svg>
                      </button>
                      {copied && (
                        <span className="absolute -top-6 right-0 text-xs text-green-600 font-medium bg-white px-1.5 py-0.5 rounded shadow-sm border border-gray-100">
                          Copied!
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <button
                onClick={resetPinForm}
                className="w-full bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-semibold text-sm py-2.5 rounded-lg transition-all flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Fetch Another PIN
              </button>
            </div>
          )}

          {/* Footer */}
          <div className="mt-6 pt-4 border-t border-gray-200 text-center">
            <p className="text-xs text-gray-400">
              Powered by <span className="font-semibold text-gray-500">XecoFlow Verify</span>
            </p>
          </div>
        </ModalOverlay>
      )}

      {/* Payment Modal */}
      {showPayment && (
        <ModalOverlay onClose={() => setShowPayment(false)} size="large">
          <div className="text-center mb-8">
            <div className="bg-gradient-to-r from-green-600 to-green-700 rounded-2xl p-4 w-16 h-16 flex items-center justify-center mx-auto mb-5">
              <CreditCard className="h-8 w-8 text-white" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 tracking-tight">Complete Payment</h2>
            <p className="text-base text-gray-500 mt-2">Pay KES 25 via M-Pesa</p>
          </div>

          <form onSubmit={handlePaymentSubmit} className="space-y-5">
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 text-center">
              <p className="text-sm text-gray-600">Amount to Pay</p>
              <p className="text-4xl font-bold text-gray-900 mt-1">KES 25.00</p>
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
              <p className="text-sm text-gray-400 mt-2">You will receive an M-Pesa prompt on your phone</p>
            </div>

            <button
              type="submit"
              className="w-full bg-gradient-to-r from-green-600 to-green-700 text-white py-4 rounded-xl font-semibold hover:from-green-700 hover:to-green-800 transition-all text-lg shadow-lg shadow-green-100"
            >
              Pay Now
            </button>
          </form>
        </ModalOverlay>
      )}

      {/* Success Modal */}
      {showSuccess && (
        <ModalOverlay onClose={() => setShowSuccess(false)} size="large">
          <div className="text-center">
            <div className="bg-green-100 rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="h-12 w-12 text-green-600" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 tracking-tight">Payment Successful!</h2>
            <p className="text-base text-gray-500 mt-2">Your KRA request has been received.</p>
            
            <div className="bg-gradient-to-br from-blue-50/80 to-indigo-50/80 backdrop-blur-sm rounded-2xl p-8 mt-6 border border-blue-100 shadow-lg shadow-blue-100/20">
              <div className="flex items-center justify-center gap-3 mb-4">
                <div className={`p-2 rounded-xl ${isCounting ? 'bg-blue-100 animate-pulse' : 'bg-green-100'}`}>
                  <Timer className={`h-6 w-6 ${isCounting ? 'text-blue-600' : 'text-green-600'}`} />
                </div>
                <span className="text-sm font-semibold text-gray-700">
                  {isReady ? 'Request Complete!' : 'Our team is processing your request...'}
                </span>
              </div>
              
              <div className="relative inline-flex items-center justify-center">
                <div className="relative w-32 h-32">
                  <svg className="w-32 h-32 transform -rotate-90">
                    <circle cx="64" cy="64" r="56" stroke="#e5e7eb" strokeWidth="8" fill="none" />
                    <circle
                      cx="64" cy="64" r="56"
                      stroke={isReady ? "#22c55e" : "#3b82f6"}
                      strokeWidth="8"
                      fill="none"
                      strokeLinecap="round"
                      strokeDasharray={`${2 * Math.PI * 56}`}
                      strokeDashoffset={`${2 * Math.PI * 56 * (1 - progressPercentage / 100)}`}
                      className="transition-all duration-1000 ease-out"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    {isReady ? (
                      <>
                        <CheckCircle className="h-8 w-8 text-green-500" />
                        <span className="text-xs font-semibold text-green-600 mt-1">Ready!</span>
                      </>
                    ) : (
                      <>
                        <span className="text-3xl font-bold text-blue-600 font-mono tracking-wider">
                          {formatTime(countdown)}
                        </span>
                        <span className="text-[10px] text-gray-400 font-medium uppercase tracking-wider mt-1">
                          Remaining
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-6 w-full max-w-xs mx-auto">
                <div className="flex justify-between text-xs text-gray-400 mb-1">
                  <span>Processing</span>
                  <span>{isReady ? 'Complete' : `${Math.round(progressPercentage)}%`}</span>
                </div>
                <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className={`h-full transition-all duration-1000 ease-out rounded-full ${isReady ? 'bg-green-500' : 'bg-blue-600'}`}
                    style={{ width: `${isReady ? 100 : progressPercentage}%` }}
                  />
                </div>
              </div>
            </div>
            
            <div className="bg-gray-50 rounded-xl p-4 mt-4 border border-gray-200">
              <div className="flex items-center justify-center gap-2 mb-1">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Tracking Number</span>
                <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">Save this</span>
              </div>
              <p className="text-2xl font-bold text-blue-600 tracking-wider font-mono">{trackingNumber}</p>
              <p className="text-xs text-gray-400 mt-2 flex items-center justify-center gap-1">
                <span>💡</span>
                <span>Use this number to check your order later</span>
              </p>
            </div>

            {isReady && (
              <button
                onClick={handleDownload}
                className="w-full mt-6 bg-gradient-to-r from-blue-600 to-blue-700 text-white py-4 rounded-xl font-semibold hover:from-blue-700 hover:to-blue-800 transition-all flex items-center justify-center gap-3 text-lg shadow-lg shadow-blue-100"
              >
                <Download className="h-6 w-6" />
                Download Certificate
              </button>
            )}

            <button
              onClick={() => setShowSuccess(false)}
              className="w-full mt-3 bg-gray-100 text-gray-700 py-4 rounded-xl font-semibold hover:bg-gray-200 transition-all text-lg"
            >
              Close
            </button>
          </div>
        </ModalOverlay>
      )}

      {/* Track Request Modal */}
      {showCheckStatus && (
        <ModalOverlay onClose={() => setShowCheckStatus(false)} size="large">
          <div className="text-center mb-8">
            <div className="bg-gradient-to-r from-purple-600 to-purple-700 rounded-2xl p-4 w-16 h-16 flex items-center justify-center mx-auto mb-5">
              <Search className="h-8 w-8 text-white" />
            </div>
            
            <div className="relative flex items-center justify-center gap-4 mb-4">
              <div className="flex-1 max-w-20 h-px bg-gradient-to-r from-transparent to-purple-300"></div>
              <h2 className="text-3xl font-bold text-gray-900 tracking-tight whitespace-nowrap">
                Track KRA Request
              </h2>
              <div className="flex-1 max-w-20 h-px bg-gradient-to-l from-transparent to-purple-300"></div>
            </div>
            
            <p className="text-base text-gray-500">
              Enter your <span className="font-semibold text-gray-700">Reference Number</span> or <span className="font-semibold text-gray-700">M-Pesa Receipt</span>
            </p>
          </div>

          <form onSubmit={(e) => { e.preventDefault(); handleTrackRequest(); }} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Reference Number or M-Pesa Receipt
              </label>
              <input
                type="text"
                required
                className="w-full px-4 py-3.5 rounded-xl border border-gray-200 focus:border-purple-500 focus:ring-4 focus:ring-purple-100 outline-none transition-all text-base"
                placeholder="e.g. CLA-2026-000154 or TGH5KD9L1M"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value.toUpperCase())}
              />
              <p className="text-xs text-gray-400 mt-2">
                You can use either your Reference Number or the M-Pesa confirmation code
              </p>
            </div>

            <button
              type="submit"
              disabled={isSearching}
              className="w-full bg-gradient-to-r from-purple-600 to-purple-700 text-white py-4 rounded-xl font-semibold hover:from-purple-700 hover:to-purple-800 transition-all text-lg shadow-lg shadow-purple-100 disabled:opacity-50 disabled:cursor-not-allowed"
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
            <div className={`rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-6 ${
              orderStatus === 'Ready for Download' ? 'bg-green-100' : 'bg-amber-100'
            }`}>
              {orderStatus === 'Ready for Download' ? (
                <CheckCircle className="h-12 w-12 text-green-600" />
              ) : (
                <Clock className="h-12 w-12 text-amber-600" />
              )}
            </div>
            
            <h2 className="text-3xl font-bold text-gray-900 tracking-tight">Order Status</h2>
            <div className={`mt-3 inline-block px-4 py-1.5 rounded-full text-sm font-semibold ${
              orderStatus === 'Ready for Download' 
                ? 'bg-green-100 text-green-700' 
                : 'bg-amber-100 text-amber-700'
            }`}>
              {orderStatus || 'Processing'}
            </div>
            
            <p className="text-base text-gray-500 mt-4">
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
                <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden mt-2">
                  <div 
                    className="h-full transition-all duration-1000 ease-out rounded-full bg-blue-600"
                    style={{ width: `${Math.max(0, (1 - countdown / TOTAL_SECONDS) * 100)}%` }}
                  />
                </div>
              </div>
            )}

            <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 mt-4">
              <p className="text-xs text-gray-500">
                💡 You can also search using your <span className="font-semibold">M-Pesa Receipt Number</span> if you have it
              </p>
            </div>

            {orderStatus === 'Ready for Download' && (
              <button
                onClick={handleDownload}
                className="w-full mt-6 bg-gradient-to-r from-blue-600 to-blue-700 text-white py-4 rounded-xl font-semibold hover:from-blue-700 hover:to-blue-800 transition-all flex items-center justify-center gap-3 text-lg shadow-lg shadow-blue-100"
              >
                <Download className="h-6 w-6" />
                Download Certificate
              </button>
            )}

            <button
              onClick={() => { setShowOrderResult(false); setOrderStatus('') }}
              className="w-full mt-3 bg-gray-100 text-gray-700 py-4 rounded-xl font-semibold hover:bg-gray-200 transition-all text-lg"
            >
              Close
            </button>
          </div>
        </ModalOverlay>
      )}
    </div>
  )
}

// Reusable Modal Component
function ModalOverlay({ 
  children, 
  onClose, 
  size = 'default' 
}: { 
  children: React.ReactNode; 
  onClose: () => void;
  size?: 'default' | 'large';
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