'use client'

import Link from 'next/link'
import { AlertCircle, ArrowLeft } from 'lucide-react'

export default function PrivacyPage() {
  const lastUpdated = 'October 2026'

  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* ──────── HEADER (matches main site) ──────── */}
      <header className="sticky top-0 z-50 bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-700 shadow-md w-full">
        <div className="w-full bg-amber-500/95 border-b border-amber-400/30">
          <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
            <div className="flex items-center justify-center gap-2 py-1 sm:py-1.5">
              <AlertCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-amber-900 flex-shrink-0" />
              <span className="text-[10px] sm:text-xs font-medium text-amber-900 text-center leading-tight">
                Authorized KRA Partner: Taxflow Africa is operated by Xeco Developers under Ushuru Mashinani.
              </span>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14 sm:h-16">
            <Link href="/" className="flex items-center flex-shrink-0">
              <span className="text-xl sm:text-2xl md:text-3xl font-extrabold tracking-tight text-white whitespace-nowrap">
                Taxflow <span className="text-yellow-300">Africa</span>
              </span>
            </Link>
            <Link
              href="/"
              className="flex items-center gap-2 text-white/90 hover:text-white text-xs sm:text-sm font-medium px-3 py-1.5 rounded-md hover:bg-white/10 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Link>
          </div>
        </div>
      </header>

      {/* ──────── DOCUMENT BODY ──────── */}
      <main className="flex-1 w-full">
        <article className="max-w-3xl mx-auto px-5 sm:px-8 py-12 sm:py-16">

          {/* Title block */}
          <header className="mb-10 pb-8 border-b border-gray-200">
            <p className="text-xs font-semibold uppercase tracking-widest text-blue-700 mb-3">
              Legal · Taxflow Africa
            </p>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 tracking-tight leading-tight mb-4">
              Privacy Policy
            </h1>
            <p className="text-base text-gray-600 leading-relaxed mb-3">
              How Taxflow Africa collects, uses, and protects your personal data under the
              Kenya Data Protection Act, 2019.
            </p>
            <p className="text-sm text-gray-500">
              <span className="font-medium text-gray-700">Last updated:</span> {lastUpdated}
              <span className="mx-2 text-gray-300">·</span>
              <span className="font-medium text-gray-700">Effective:</span> {lastUpdated}
            </p>
          </header>

          {/* Intro */}
          <section className="mb-10">
            <p className="text-[15px] sm:text-base text-gray-700 leading-7 mb-4">
              Taxflow Africa (operated by Xeco Developers under the Ushuru Mashinani initiative)
              is committed to protecting your personal data. This policy explains what we collect,
              why we collect it, how we keep it safe, and the rights you have under the Kenya
              Data Protection Act, 2019.
            </p>
            <p className="text-[15px] sm:text-base text-gray-700 leading-7">
              We keep this simple because our service is simple: we retrieve your KRA PIN using
              your National ID or Passport Number, and — only if you opt in — we send you email
              updates about new services.
            </p>
          </section>

          {/* Table of contents — plain, no box */}
          <nav className="mb-12">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-500 mb-4">
              Contents
            </h2>
            <ol className="space-y-2 text-[15px] text-gray-700">
              <li><a href="#collect" className="text-blue-700 hover:text-blue-800 hover:underline">1. Information we collect</a></li>
              <li><a href="#use" className="text-blue-700 hover:text-blue-800 hover:underline">2. How we use your data</a></li>
              <li><a href="#sharing" className="text-blue-700 hover:text-blue-800 hover:underline">3. Data sharing and third parties</a></li>
              <li><a href="#retention" className="text-blue-700 hover:text-blue-800 hover:underline">4. Data retention</a></li>
              <li><a href="#rights" className="text-blue-700 hover:text-blue-800 hover:underline">5. Your rights</a></li>
              <li><a href="#protect" className="text-blue-700 hover:text-blue-800 hover:underline">6. How we protect your data</a></li>
              <li><a href="#contact" className="text-blue-700 hover:text-blue-800 hover:underline">7. Contact us</a></li>
            </ol>
          </nav>

          {/* 1. Information We Collect */}
          <section id="collect" className="scroll-mt-24 mb-12">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight mb-5">
              1. Information we collect
            </h2>

            <h3 className="text-base font-semibold text-gray-900 mb-2">Identification data</h3>
            <p className="text-[15px] sm:text-base text-gray-700 leading-7 mb-5">
              When you use our KRA PIN retrieval service, we collect your National ID or Passport
              Number. This is required to look up your KRA PIN from the Kenya Revenue Authority on
              your behalf. It is used solely for that purpose and is not stored on our servers after
              your request is complete.
            </p>

            <h3 className="text-base font-semibold text-gray-900 mb-2">Email address (optional)</h3>
            <p className="text-[15px] sm:text-base text-gray-700 leading-7 mb-5">
              If — and only if — you tick the &ldquo;Update me when other services are live&rdquo; box, we collect
              your email address to send you occasional service updates. This is completely optional.
              If you do not opt in, we do not collect or store your email.
            </p>

            <h3 className="text-base font-semibold text-gray-900 mb-2">Technical data</h3>
            <p className="text-[15px] sm:text-base text-gray-700 leading-7 mb-5">
              We automatically log your IP address, browser type, and basic request metadata for
              security, fraud prevention, and debugging purposes. This data is retained for a limited
              period and is not linked to your identity.
            </p>

            <p className="text-[15px] sm:text-base text-gray-700 leading-7 mb-2 font-medium">
              What we do not collect:
            </p>
            <ul className="list-disc pl-6 space-y-1.5 text-[15px] sm:text-base text-gray-700 leading-7">
              <li>KYC photos, selfies, or biometric data.</li>
              <li>Business registration or KYB documents.</li>
              <li>Your iTax password or any KRA account credentials.</li>
            </ul>
          </section>

          {/* 2. How We Use Your Data */}
          <section id="use" className="scroll-mt-24 mb-12">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight mb-5">
              2. How we use your data
            </h2>
            <ul className="list-disc pl-6 space-y-2 text-[15px] sm:text-base text-gray-700 leading-7">
              <li>
                <span className="font-semibold text-gray-900">Service delivery</span> — to retrieve
                your KRA PIN from the Kenya Revenue Authority using your ID or Passport Number.
              </li>
              <li>
                <span className="font-semibold text-gray-900">Service updates (opt-in only)</span> —
                to email you when new services are launched, if you have chosen to receive them.
              </li>
              <li>
                <span className="font-semibold text-gray-900">Security and fraud prevention</span> —
                to detect abuse, suspicious activity, or unauthorized access to our platform.
              </li>
              <li>
                <span className="font-semibold text-gray-900">Legal compliance</span> — to meet our
                obligations under the Kenya Data Protection Act, 2019 and other applicable Kenyan law.
              </li>
            </ul>
          </section>

          {/* 3. Data Sharing */}
          <section id="sharing" className="scroll-mt-24 mb-12">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight mb-5">
              3. Data sharing and third parties
            </h2>
            <p className="text-[15px] sm:text-base text-gray-700 leading-7 mb-4">
              We share the minimum data necessary to deliver the service. Specifically:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-[15px] sm:text-base text-gray-700 leading-7 mb-5">
              <li>
                <span className="font-semibold text-gray-900">Kenya Revenue Authority (KRA)</span> —
                your ID or Passport Number is transmitted to KRA to retrieve your PIN. This is inherent
                to the service.
              </li>
              <li>
                <span className="font-semibold text-gray-900">Xeco Group</span> — our parent
                infrastructure, which provides the notification engine used for service updates
                (opt-in only).
              </li>
              <li>
                <span className="font-semibold text-gray-900">Legal disclosures</span> — we may
                disclose data if required by law, court order, or a competent regulatory authority
                acting under lawful authority.
              </li>
            </ul>

            <p className="text-[15px] sm:text-base text-gray-900 leading-7 font-semibold mb-1">
              We never sell your data.
            </p>
            <p className="text-[15px] sm:text-base text-gray-700 leading-7">
              We do not sell, rent, or trade your personal data to advertisers, data brokers, or any
              third party for commercial purposes.
            </p>
          </section>

          {/* 4. Data Retention */}
          <section id="retention" className="scroll-mt-24 mb-12">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight mb-5">
              4. Data retention
            </h2>
            <ul className="list-disc pl-6 space-y-2 text-[15px] sm:text-base text-gray-700 leading-7">
              <li>
                <span className="font-semibold text-gray-900">Your ID / Passport Number</span> —
                discarded immediately after your KRA PIN request is processed. Not stored.
              </li>
              <li>
                <span className="font-semibold text-gray-900">Your email address</span> — retained
                only while you remain subscribed to service updates. Deleted upon your request or if
                you unsubscribe.
              </li>
              <li>
                <span className="font-semibold text-gray-900">Technical logs</span> — retained for a
                limited period (typically up to 90 days) for security and debugging, then
                automatically purged.
              </li>
            </ul>
          </section>

          {/* 5. Your Rights */}
          <section id="rights" className="scroll-mt-24 mb-12">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight mb-5">
              5. Your rights
            </h2>
            <p className="text-[15px] sm:text-base text-gray-700 leading-7 mb-4">
              Under the Data Protection Act, 2019, you have the right to:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-[15px] sm:text-base text-gray-700 leading-7 mb-5">
              <li><span className="font-semibold text-gray-900">Access</span> — know what personal data we hold about you.</li>
              <li><span className="font-semibold text-gray-900">Correction</span> — request that inaccurate data be corrected.</li>
              <li><span className="font-semibold text-gray-900">Deletion</span> — request deletion of your personal data.</li>
              <li><span className="font-semibold text-gray-900">Withdraw consent</span> — unsubscribe from service updates at any time.</li>
              <li><span className="font-semibold text-gray-900">Complain</span> — lodge a complaint with the Office of the Data Protection Commissioner (ODPC).</li>
            </ul>
            <p className="text-[15px] sm:text-base text-gray-700 leading-7">
              To exercise any of these rights, email our Data Protection Officer at{' '}
              <a href="mailto:dpo@taxflow.africa" className="text-blue-700 hover:text-blue-800 underline underline-offset-2">
                dpo@taxflow.africa
              </a>. We respond to all requests within 30 days.
            </p>
          </section>

          {/* 6. How We Protect */}
          <section id="protect" className="scroll-mt-24 mb-12">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight mb-5">
              6. How we protect your data
            </h2>
            <ul className="list-disc pl-6 space-y-2 text-[15px] sm:text-base text-gray-700 leading-7">
              <li>
                <span className="font-semibold text-gray-900">Encryption in transit</span> — all data
                is transmitted over HTTPS (TLS 1.2 or higher).
              </li>
              <li>
                <span className="font-semibold text-gray-900">Restricted access</span> — access to
                production systems is limited to authorized personnel under role-based controls.
              </li>
              <li>
                <span className="font-semibold text-gray-900">Breach notification</span> — in the
                event of a data breach that poses a risk to your rights, we will notify affected users
                and the ODPC within 72 hours of discovery, in line with the Act.
              </li>
              <li>
                <span className="font-semibold text-gray-900">No third-party tracking</span> — we do
                not use advertising trackers, fingerprinting, or analytics that profile you across
                other websites.
              </li>
            </ul>
          </section>

          {/* 7. Contact */}
          <section id="contact" className="scroll-mt-24 mb-12">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight mb-5">
              7. Contact us
            </h2>
            <p className="text-[15px] sm:text-base text-gray-700 leading-7 mb-4">
              For privacy-related queries or to exercise your rights:
            </p>
            <dl className="text-[15px] sm:text-base text-gray-700 leading-7 space-y-2">
              <div>
                <dt className="inline font-semibold text-gray-900">Data Protection Officer: </dt>
                <dd className="inline">
                  <a href="mailto:dpo@taxflow.africa" className="text-blue-700 hover:text-blue-800 underline underline-offset-2">
                    dpo@taxflow.africa
                  </a>
                </dd>
              </div>
              <div>
                <dt className="inline font-semibold text-gray-900">General support: </dt>
                <dd className="inline">
                  <a href="mailto:support@taxflow.africa" className="text-blue-700 hover:text-blue-800 underline underline-offset-2">
                    support@taxflow.africa
                  </a>
                </dd>
              </div>
              <div>
                <dt className="inline font-semibold text-gray-900">Operator: </dt>
                <dd className="inline">Xeco Developers, Kenya</dd>
              </div>
            </dl>
          </section>

          {/* Footer note */}
          <footer className="pt-8 border-t border-gray-200">
            <p className="text-sm text-gray-600 leading-6 mb-4">
              If you are not satisfied with how we have handled your data, you have the right to
              lodge a complaint with the <span className="font-medium text-gray-800">Office of the Data Protection Commissioner (ODPC)</span>, Kenya.
              Visit <a href="https://www.odpc.go.ke" target="_blank" rel="noopener noreferrer" className="text-blue-700 hover:text-blue-800 underline underline-offset-2">odpc.go.ke</a> for more information.
            </p>
            <p className="text-xs text-gray-400">
              This policy may be updated from time to time. The &ldquo;Last updated&rdquo; date at the top
              reflects the most recent revision.
            </p>
          </footer>

          {/* Back link */}
          <div className="mt-12 pt-8 border-t border-gray-200">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Taxflow Africa
            </Link>
          </div>

        </article>
      </main>

      {/* ──────── FOOTER ──────── */}
      <footer className="w-full bg-slate-900 text-slate-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-center md:text-left">
            <div className="flex items-center gap-3">
              <span className="text-lg font-bold text-white">
                Taxflow <span className="text-yellow-300">Africa</span>
              </span>
              <span className="hidden sm:inline-block h-4 w-px bg-slate-700"></span>
              <span className="text-xs text-slate-400">
                © {new Date().getFullYear()} All rights reserved.
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Official KRA Ushuru Mashinani Partner.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}