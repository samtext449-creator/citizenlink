'use client'

import Link from 'next/link'
import { AlertCircle, ArrowLeft } from 'lucide-react'

export default function TermsPage() {
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
              Terms &amp; Conditions
            </h1>
            <p className="text-base text-gray-600 leading-relaxed mb-3">
              The terms governing your use of Taxflow Africa's KRA service platform.
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
              Welcome to Taxflow Africa. These Terms &amp; Conditions (&ldquo;Terms&rdquo;) govern your
              access to and use of our website, services, and any related tools (collectively, the
              &ldquo;Service&rdquo;) provided by Xeco Developers (&ldquo;we&rdquo;, &ldquo;us&rdquo;, or
              &ldquo;our&rdquo;) under the Ushuru Mashinani initiative.
            </p>
            <p className="text-[15px] sm:text-base text-gray-700 leading-7">
              By accessing or using the Service, you agree to be bound by these Terms. If you do not
              agree, please do not use the Service.
            </p>
          </section>

          {/* Table of contents — plain, no box */}
          <nav className="mb-12">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-500 mb-4">
              Contents
            </h2>
            <ol className="space-y-2 text-[15px] text-gray-700">
              <li><a href="#service" className="text-blue-700 hover:text-blue-800 hover:underline">1. The Service</a></li>
              <li><a href="#eligibility" className="text-blue-700 hover:text-blue-800 hover:underline">2. Eligibility</a></li>
              <li><a href="#responsibilities" className="text-blue-700 hover:text-blue-800 hover:underline">3. Your responsibilities</a></li>
              <li><a href="#accuracy" className="text-blue-700 hover:text-blue-800 hover:underline">4. Accuracy of information</a></li>
              <li><a href="#payment" className="text-blue-700 hover:text-blue-800 hover:underline">5. Payments and refunds</a></li>
              <li><a href="#ip" className="text-blue-700 hover:text-blue-800 hover:underline">6. Intellectual property</a></li>
              <li><a href="#thirdparty" className="text-blue-700 hover:text-blue-800 hover:underline">7. Third-party services</a></li>
              <li><a href="#liability" className="text-blue-700 hover:text-blue-800 hover:underline">8. Limitation of liability</a></li>
              <li><a href="#termination" className="text-blue-700 hover:text-blue-800 hover:underline">9. Termination</a></li>
              <li><a href="#changes" className="text-blue-700 hover:text-blue-800 hover:underline">10. Changes to these Terms</a></li>
              <li><a href="#law" className="text-blue-700 hover:text-blue-800 hover:underline">11. Governing law</a></li>
              <li><a href="#contact" className="text-blue-700 hover:text-blue-800 hover:underline">12. Contact</a></li>
            </ol>
          </nav>

          {/* 1. The Service */}
          <section id="service" className="scroll-mt-24 mb-12">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight mb-5">
              1. The Service
            </h2>
            <p className="text-[15px] sm:text-base text-gray-700 leading-7 mb-4">
              Taxflow Africa provides digital assistance for Kenyan taxpayers to access KRA services,
              including but not limited to retrieving KRA PINs, filing tax returns, and applying for
              Tax Compliance Certificates. Certain services are offered free of charge; others require
              payment.
            </p>
            <p className="text-[15px] sm:text-base text-gray-700 leading-7">
              We are an independent service provider. We are not the Kenya Revenue Authority (KRA),
              and we do not represent KRA in any official capacity. All tax filings and submissions
              are ultimately subject to KRA's review and approval.
            </p>
          </section>

          {/* 2. Eligibility */}
          <section id="eligibility" className="scroll-mt-24 mb-12">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight mb-5">
              2. Eligibility
            </h2>
            <p className="text-[15px] sm:text-base text-gray-700 leading-7 mb-4">
              To use the Service, you must:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-[15px] sm:text-base text-gray-700 leading-7">
              <li>Be at least 18 years of age.</li>
              <li>Be a Kenyan citizen, resident, or a person with a legitimate tax obligation in Kenya.</li>
              <li>Provide accurate and truthful information, including your valid National ID or Passport Number.</li>
              <li>Use the Service only for lawful, personal, or legitimate business purposes.</li>
            </ul>
          </section>

          {/* 3. Your Responsibilities */}
          <section id="responsibilities" className="scroll-mt-24 mb-12">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight mb-5">
              3. Your responsibilities
            </h2>
            <p className="text-[15px] sm:text-base text-gray-700 leading-7 mb-4">
              When using the Service, you agree to:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-[15px] sm:text-base text-gray-700 leading-7">
              <li>Provide only your own personal information, or information you are legally authorized to submit on behalf of another person.</li>
              <li>Not use the Service for fraud, identity theft, or any unlawful activity.</li>
              <li>Not attempt to interfere with, reverse engineer, or disrupt the Service.</li>
              <li>Not resell, sublicense, or commercially exploit the Service without our prior written consent.</li>
              <li>Keep any account credentials (if applicable) confidential and secure.</li>
            </ul>
          </section>

          {/* 4. Accuracy of Information */}
          <section id="accuracy" className="scroll-mt-24 mb-12">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight mb-5">
              4. Accuracy of information
            </h2>
            <p className="text-[15px] sm:text-base text-gray-700 leading-7 mb-4">
              You are solely responsible for the accuracy of the information you provide through the
              Service. We are not liable for any consequences — including failed submissions, rejected
              filings, or penalties — that arise from incorrect or incomplete information you have
              supplied.
            </p>
            <p className="text-[15px] sm:text-base text-gray-700 leading-7">
              Where the Service displays information retrieved from KRA or other third parties, that
              information is provided &ldquo;as is&rdquo; and may be subject to delays, errors, or
              availability limitations outside our control.
            </p>
          </section>

          {/* 5. Payments and Refunds */}
          <section id="payment" className="scroll-mt-24 mb-12">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight mb-5">
              5. Payments and refunds
            </h2>
            <p className="text-[15px] sm:text-base text-gray-700 leading-7 mb-4">
              Paid services are billed in Kenyan Shillings (KES) through our integrated M-Pesa payment
              gateway. By completing a payment, you confirm that:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-[15px] sm:text-base text-gray-700 leading-7 mb-5">
              <li>You are the authorized holder of the M-Pesa number used for the transaction, or have permission to use it.</li>
              <li>The payment amount is correct as shown at the time of checkout.</li>
            </ul>
            <p className="text-[15px] sm:text-base text-gray-700 leading-7 mb-3">
              <span className="font-semibold text-gray-900">Refund policy:</span> Because our services
              involve digital processing and third-party fees, payments are generally non-refundable
              once a request has been submitted. If a service fails due to a fault on our side, we
              will re-attempt the service or, where re-attempt is not possible, issue a refund at our
              discretion.
            </p>
            <p className="text-[15px] sm:text-base text-gray-700 leading-7">
              Refund requests should be sent to{' '}
              <a href="mailto:support@taxflow.africa" className="text-blue-700 hover:text-blue-800 underline underline-offset-2">
                support@taxflow.africa
              </a>{' '}
              within 14 days of the transaction.
            </p>
          </section>

          {/* 6. Intellectual Property */}
          <section id="ip" className="scroll-mt-24 mb-12">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight mb-5">
              6. Intellectual property
            </h2>
            <p className="text-[15px] sm:text-base text-gray-700 leading-7 mb-4">
              All content, trademarks, logos, software, and design elements that make up the Service
              are the property of Xeco Developers or its licensors and are protected under applicable
              Kenyan and international intellectual property law.
            </p>
            <p className="text-[15px] sm:text-base text-gray-700 leading-7">
              You may not copy, modify, distribute, or create derivative works from any part of the
              Service without our prior written permission.
            </p>
          </section>

          {/* 7. Third-Party Services */}
          <section id="thirdparty" className="scroll-mt-24 mb-12">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight mb-5">
              7. Third-party services
            </h2>
            <p className="text-[15px] sm:text-base text-gray-700 leading-7 mb-4">
              The Service relies on integrations with third-party platforms, including the Kenya
              Revenue Authority (KRA), Safaricom M-Pesa, and identity verification providers. Your use
              of those integrations is also subject to the terms and policies of those third parties.
            </p>
            <p className="text-[15px] sm:text-base text-gray-700 leading-7">
              We are not responsible for the availability, accuracy, or actions of any third-party
              service.
            </p>
          </section>

          {/* 8. Limitation of Liability */}
          <section id="liability" className="scroll-mt-24 mb-12">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight mb-5">
              8. Limitation of liability
            </h2>
            <p className="text-[15px] sm:text-base text-gray-700 leading-7 mb-4">
              The Service is provided on an &ldquo;as is&rdquo; and &ldquo;as available&rdquo; basis. To
              the maximum extent permitted by Kenyan law, we disclaim all warranties, express or
              implied, including warranties of merchantability, fitness for a particular purpose, and
              non-infringement.
            </p>
            <p className="text-[15px] sm:text-base text-gray-700 leading-7 mb-4">
              We are not liable for:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-[15px] sm:text-base text-gray-700 leading-7 mb-5">
              <li>Any indirect, incidental, or consequential damages arising from your use of the Service.</li>
              <li>Any interruption, delay, or unavailability of KRA systems, M-Pesa, or other third-party platforms.</li>
              <li>Loss of data, revenue, or opportunity arising from use of the Service.</li>
              <li>Any penalties, interest, or liability imposed by KRA arising from incorrect information supplied by you.</li>
            </ul>
            <p className="text-[15px] sm:text-base text-gray-700 leading-7">
              Where liability cannot be excluded, our total aggregate liability shall not exceed the
              amount you paid us for the specific service in question.
            </p>
          </section>

          {/* 9. Termination */}
          <section id="termination" className="scroll-mt-24 mb-12">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight mb-5">
              9. Termination
            </h2>
            <p className="text-[15px] sm:text-base text-gray-700 leading-7 mb-4">
              We may suspend or terminate your access to the Service at any time, without notice, if
              we reasonably believe you have violated these Terms, engaged in fraudulent or unlawful
              activity, or pose a risk to the Service or other users.
            </p>
            <p className="text-[15px] sm:text-base text-gray-700 leading-7">
              You may stop using the Service at any time.
            </p>
          </section>

          {/* 10. Changes to These Terms */}
          <section id="changes" className="scroll-mt-24 mb-12">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight mb-5">
              10. Changes to these Terms
            </h2>
            <p className="text-[15px] sm:text-base text-gray-700 leading-7 mb-4">
              We may update these Terms from time to time to reflect changes in our services, legal
              requirements, or business practices. When we make material changes, we will update the
              &ldquo;Last updated&rdquo; date at the top of this page.
            </p>
            <p className="text-[15px] sm:text-base text-gray-700 leading-7">
              Your continued use of the Service after changes are posted constitutes your acceptance
              of the revised Terms.
            </p>
          </section>

          {/* 11. Governing Law */}
          <section id="law" className="scroll-mt-24 mb-12">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight mb-5">
              11. Governing law
            </h2>
            <p className="text-[15px] sm:text-base text-gray-700 leading-7">
              These Terms are governed by and construed in accordance with the laws of the Republic
              of Kenya. Any dispute arising from or relating to these Terms or the Service shall be
              subject to the exclusive jurisdiction of the courts of Kenya.
            </p>
          </section>

          {/* 12. Contact */}
          <section id="contact" className="scroll-mt-24 mb-12">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight mb-5">
              12. Contact
            </h2>
            <p className="text-[15px] sm:text-base text-gray-700 leading-7 mb-4">
              For questions about these Terms, or to raise a concern, contact us at:
            </p>
            <dl className="text-[15px] sm:text-base text-gray-700 leading-7 space-y-2">
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
            <p className="text-sm text-gray-600 leading-6">
              By using Taxflow Africa, you acknowledge that you have read, understood, and agree to be
              bound by these Terms &amp; Conditions. If you have any questions, please contact us
              before using the Service.
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-3 text-center md:text-left">
            <div className="flex items-center gap-3">
              <span className="text-base font-bold text-white">
                Taxflow <span className="text-yellow-300">Africa</span>
              </span>
              <span className="hidden sm:inline-block h-3.5 w-px bg-slate-700"></span>
              <span className="text-[11px] text-slate-400">
                © {new Date().getFullYear()} All rights reserved.
              </span>
            </div>

            <nav className="flex items-center gap-3 sm:gap-4 text-[11px] sm:text-xs">
              <Link href="/terms" className="text-slate-300 hover:text-white transition-colors">
                Terms &amp; Conditions
              </Link>
              <span className="text-slate-700">·</span>
              <Link href="/privacy" className="text-slate-300 hover:text-white transition-colors">
                Privacy Policy
              </Link>
            </nav>

            <p className="text-[11px] text-slate-400">
              Official KRA Ushuru Mashinani Partner.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}