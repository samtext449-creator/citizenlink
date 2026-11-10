'use client'

import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default function PrivacyPage() {
  const lastUpdated = 'October 2026'

  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* ──────── HEADER ──────── */}
      <header className="sticky top-0 z-50 w-full bg-white border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center flex-shrink-0">
              <span className="text-xl font-bold tracking-tight text-[#0d0d0d]">
                Taxflow<span className="text-blue-600">.</span>
              </span>
            </Link>
            <Link
              href="/"
              className="flex items-center gap-2 text-[#8e8e8e] hover:text-[#0d0d0d] text-sm font-medium transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Link>
          </div>
        </div>
      </header>

      {/* ──────── DOCUMENT BODY ──────── */}
      <main className="flex-1 w-full flex justify-center">
        <article className="max-w-3xl w-full px-6 sm:px-8 py-12 sm:py-20">

          {/* Title block */}
          <header className="mb-12">
            <p className="text-[13px] font-medium text-[#8e8e8e] mb-3">
              Legal · Taxflow Africa
            </p>
            <h1 className="text-4xl sm:text-5xl font-semibold text-[#0d0d0d] tracking-tight leading-tight mb-6">
              Privacy Policy
            </h1>
            <p className="text-lg text-[#0d0d0d] leading-relaxed mb-6">
              How Taxflow Africa collects, uses, and protects your personal data under the
              Kenya Data Protection Act, 2019.
            </p>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[13px] text-[#8e8e8e]">
              <span>Last updated: {lastUpdated}</span>
              <span>Effective: {lastUpdated}</span>
            </div>
          </header>

          {/* Intro */}
          <section className="mb-12">
            <p className="text-[15px] text-[#0d0d0d] leading-7 mb-4">
              Taxflow Africa (operated by Xeco Developers under the Ushuru Mashinani initiative)
              is committed to protecting your personal data. This policy explains what we collect,
              why we collect it, how we keep it safe, and the rights you have under the Kenya
              Data Protection Act, 2019.
            </p>
            <p className="text-[15px] text-[#0d0d0d] leading-7">
              We keep this simple because our service is simple: we retrieve your KRA PIN using
              your National ID or Passport Number, and — only if you opt in — we send you email
              updates about new services.
            </p>
          </section>

          {/* Table of contents */}
          <nav className="mb-16">
            <h2 className="text-[13px] font-medium text-[#8e8e8e] mb-4">
              Contents
            </h2>
            <ol className="space-y-3 text-[15px] text-[#0d0d0d]">
              <li><a href="#collect" className="hover:text-blue-600 transition-colors">1. Information we collect</a></li>
              <li><a href="#use" className="hover:text-blue-600 transition-colors">2. How we use your data</a></li>
              <li><a href="#sharing" className="hover:text-blue-600 transition-colors">3. Data sharing and third parties</a></li>
              <li><a href="#retention" className="hover:text-blue-600 transition-colors">4. Data retention</a></li>
              <li><a href="#rights" className="hover:text-blue-600 transition-colors">5. Your rights</a></li>
              <li><a href="#protect" className="hover:text-blue-600 transition-colors">6. How we protect your data</a></li>
              <li><a href="#contact" className="hover:text-blue-600 transition-colors">7. Contact us</a></li>
            </ol>
          </nav>

          {/* 1. Information We Collect */}
          <section id="collect" className="scroll-mt-24 mb-12">
            <h2 className="text-xl font-semibold text-[#0d0d0d] mb-4">
              1. Information we collect
            </h2>

            <h3 className="text-[15px] font-semibold text-[#0d0d0d] mb-2">Identification data</h3>
            <p className="text-[15px] text-[#0d0d0d] leading-7 mb-6">
              When you use our KRA PIN retrieval service, we collect your National ID or Passport
              Number. This is required to look up your KRA PIN from the Kenya Revenue Authority on
              your behalf. It is used solely for that purpose and is not stored on our servers after
              your request is complete.
            </p>

            <h3 className="text-[15px] font-semibold text-[#0d0d0d] mb-2">Email address (optional)</h3>
            <p className="text-[15px] text-[#0d0d0d] leading-7 mb-6">
              If — and only if — you tick the &ldquo;Update me when other services are live&rdquo; box, we collect
              your email address to send you occasional service updates. This is completely optional.
              If you do not opt in, we do not collect or store your email.
            </p>

            <h3 className="text-[15px] font-semibold text-[#0d0d0d] mb-2">Technical data</h3>
            <p className="text-[15px] text-[#0d0d0d] leading-7 mb-6">
              We automatically log your IP address, browser type, and basic request metadata for
              security, fraud prevention, and debugging purposes. This data is retained for a limited
              period and is not linked to your identity.
            </p>

            <h3 className="text-[15px] font-semibold text-[#0d0d0d] mb-2">What we do not collect:</h3>
            <ul className="list-disc pl-5 space-y-1.5 text-[15px] text-[#0d0d0d] leading-7">
              <li>KYC photos, selfies, or biometric data.</li>
              <li>Business registration or KYB documents.</li>
              <li>Your iTax password or any KRA account credentials.</li>
            </ul>
          </section>

          {/* 2. How We Use Your Data */}
          <section id="use" className="scroll-mt-24 mb-12">
            <h2 className="text-xl font-semibold text-[#0d0d0d] mb-4">
              2. How we use your data
            </h2>
            <ul className="list-disc pl-5 space-y-2 text-[15px] text-[#0d0d0d] leading-7">
              <li>
                <span className="font-semibold">Service delivery</span> — to retrieve
                your KRA PIN from the Kenya Revenue Authority using your ID or Passport Number.
              </li>
              <li>
                <span className="font-semibold">Service updates (opt-in only)</span> —
                to email you when new services are launched, if you have chosen to receive them.
              </li>
              <li>
                <span className="font-semibold">Security and fraud prevention</span> —
                to detect abuse, suspicious activity, or unauthorized access to our platform.
              </li>
              <li>
                <span className="font-semibold">Legal compliance</span> — to meet our
                obligations under the Kenya Data Protection Act, 2019 and other applicable Kenyan law.
              </li>
            </ul>
          </section>

          {/* 3. Data Sharing */}
          <section id="sharing" className="scroll-mt-24 mb-12">
            <h2 className="text-xl font-semibold text-[#0d0d0d] mb-4">
              3. Data sharing and third parties
            </h2>
            <p className="text-[15px] text-[#0d0d0d] leading-7 mb-4">
              We share the minimum data necessary to deliver the service. Specifically:
            </p>
            <ul className="list-disc pl-5 space-y-2 text-[15px] text-[#0d0d0d] leading-7 mb-6">
              <li>
                <span className="font-semibold">Kenya Revenue Authority (KRA)</span> —
                your ID or Passport Number is transmitted to KRA to retrieve your PIN. This is inherent
                to the service.
              </li>
              <li>
                <span className="font-semibold">Xeco Group</span> — our parent
                infrastructure, which provides the notification engine used for service updates
                (opt-in only).
              </li>
              <li>
                <span className="font-semibold">Legal disclosures</span> — we may
                disclose data if required by law, court order, or a competent regulatory authority
                acting under lawful authority.
              </li>
            </ul>

            <p className="text-[15px] font-semibold text-[#0d0d0d] leading-7 mb-2">
              We never sell your data.
            </p>
            <p className="text-[15px] text-[#0d0d0d] leading-7">
              We do not sell, rent, or trade your personal data to advertisers, data brokers, or any
              third party for commercial purposes.
            </p>
          </section>

          {/* 4. Data Retention */}
          <section id="retention" className="scroll-mt-24 mb-12">
            <h2 className="text-xl font-semibold text-[#0d0d0d] mb-4">
              4. Data retention
            </h2>
            <ul className="list-disc pl-5 space-y-2 text-[15px] text-[#0d0d0d] leading-7">
              <li>
                <span className="font-semibold">Your ID / Passport Number</span> —
                discarded immediately after your KRA PIN request is processed. Not stored.
              </li>
              <li>
                <span className="font-semibold">Your email address</span> — retained
                only while you remain subscribed to service updates. Deleted upon your request or if
                you unsubscribe.
              </li>
              <li>
                <span className="font-semibold">Technical logs</span> — retained for a
                limited period (typically up to 90 days) for security and debugging, then
                automatically purged.
              </li>
            </ul>
          </section>

          {/* 5. Your Rights */}
          <section id="rights" className="scroll-mt-24 mb-12">
            <h2 className="text-xl font-semibold text-[#0d0d0d] mb-4">
              5. Your rights
            </h2>
            <p className="text-[15px] text-[#0d0d0d] leading-7 mb-4">
              Under the Data Protection Act, 2019, you have the right to:
            </p>
            <ul className="list-disc pl-5 space-y-2 text-[15px] text-[#0d0d0d] leading-7 mb-6">
              <li><span className="font-semibold">Access</span> — know what personal data we hold about you.</li>
              <li><span className="font-semibold">Correction</span> — request that inaccurate data be corrected.</li>
              <li><span className="font-semibold">Deletion</span> — request deletion of your personal data.</li>
              <li><span className="font-semibold">Withdraw consent</span> — unsubscribe from service updates at any time.</li>
              <li><span className="font-semibold">Complain</span> — lodge a complaint with the Office of the Data Protection Commissioner (ODPC).</li>
            </ul>
            <p className="text-[15px] text-[#0d0d0d] leading-7">
              To exercise any of these rights, email our Data Protection Officer at{' '}
              <a href="mailto:dpo@taxflow.africa" className="text-blue-600 hover:underline underline-offset-2">
                dpo@taxflow.africa
              </a>. We respond to all requests within 30 days.
            </p>
          </section>

          {/* 6. How We Protect */}
          <section id="protect" className="scroll-mt-24 mb-12">
            <h2 className="text-xl font-semibold text-[#0d0d0d] mb-4">
              6. How we protect your data
            </h2>
            <ul className="list-disc pl-5 space-y-2 text-[15px] text-[#0d0d0d] leading-7">
              <li>
                <span className="font-semibold">Encryption in transit</span> — all data
                is transmitted over HTTPS (TLS 1.2 or higher).
              </li>
              <li>
                <span className="font-semibold">Restricted access</span> — access to
                production systems is limited to authorized personnel under role-based controls.
              </li>
              <li>
                <span className="font-semibold">Breach notification</span> — in the
                event of a data breach that poses a risk to your rights, we will notify affected users
                and the ODPC within 72 hours of discovery, in line with the Act.
              </li>
              <li>
                <span className="font-semibold">No third-party tracking</span> — we do
                not use advertising trackers, fingerprinting, or analytics that profile you across
                other websites.
              </li>
            </ul>
          </section>

          {/* 7. Contact */}
          <section id="contact" className="scroll-mt-24 mb-12">
            <h2 className="text-xl font-semibold text-[#0d0d0d] mb-4">
              7. Contact us
            </h2>
            <p className="text-[15px] text-[#0d0d0d] leading-7 mb-4">
              For privacy-related queries or to exercise your rights:
            </p>
            <div className="space-y-2 text-[15px] text-[#0d0d0d] leading-7">
              <div>
                <span className="font-semibold">Data Protection Officer: </span>
                <a href="mailto:dpo@taxflow.africa" className="text-blue-600 hover:underline underline-offset-2">
                  dpo@taxflow.africa
                </a>
              </div>
              <div>
                <span className="font-semibold">General support: </span>
                <a href="mailto:support@taxflow.africa" className="text-blue-600 hover:underline underline-offset-2">
                  support@taxflow.africa
                </a>
              </div>
              <div>
                <span className="font-semibold">Operator: </span>
                Xeco Developers, Kenya
              </div>
            </div>
          </section>

          {/* Footer note */}
          <footer className="pt-8 border-t border-gray-100">
            <p className="text-[15px] text-[#8e8e8e] leading-7 mb-4">
              If you are not satisfied with how we have handled your data, you have the right to
              lodge a complaint with the <span className="font-medium text-[#0d0d0d]">Office of the Data Protection Commissioner (ODPC)</span>, Kenya.
              Visit <a href="https://www.odpc.go.ke" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline underline-offset-2">odpc.go.ke</a> for more information.
            </p>
            <p className="text-[13px] text-[#8e8e8e]">
              This policy may be updated from time to time. The &ldquo;Last updated&rdquo; date at the top
              reflects the most recent revision.
            </p>
          </footer>

          {/* Back link */}
          <div className="mt-12 pt-8 border-t border-gray-100">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-sm font-medium text-[#8e8e8e] hover:text-[#0d0d0d] transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Taxflow Africa
            </Link>
          </div>

        </article>
      </main>

      {/* ──────── FOOTER ──────── */}
      <footer className="w-full border-t border-gray-100 py-8">
        <div className="max-w-4xl mx-auto px-6 sm:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-[13px] text-[#8e8e8e]">
            <div className="flex items-center gap-2">
              <span className="font-bold text-[#0d0d0d]">
                Taxflow<span className="text-blue-600">.</span>
              </span>
              <span>© {new Date().getFullYear()} All rights reserved.</span>
            </div>
            <p>
              Official KRA Ushuru Mashinani Partner.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}