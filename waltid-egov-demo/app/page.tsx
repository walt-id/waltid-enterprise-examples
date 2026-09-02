import Link from 'next/link';
import { ArrowRight, BadgeCheck, FileText, Shield } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 shadow-sm">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-800 text-lg">Digital Government Services Demo</span>
          </div>
          <span className="text-xs text-slate-500 hidden sm:block">Powered by walt.id</span>
        </div>
      </header>

      {/* Hero */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 text-center">
        <div className="mx-auto max-w-3xl">
          <div className="inline-flex items-center gap-2 bg-white border border-slate-200 rounded-full px-4 py-1.5 text-sm text-slate-600 mb-8 shadow-sm">
            <Shield className="h-4 w-4 text-slate-500" />
            Digital Government Services
          </div>
          <h1 className="text-5xl font-bold text-slate-900 mb-6 tracking-tight">
            Digital Government Services
          </h1>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto">
            Access secure digital government services using verifiable credentials. Issue your National eID and manage your tax registration.
          </p>
        </div>
      </section>

      {/* Portal Cards */}
      <section className="px-4 sm:px-6 lg:px-8 pb-20">
        <div className="mx-auto max-w-4xl grid gap-6 md:grid-cols-2">

          {/* e-Gov Portal */}
          <div className="group relative bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden transition-all hover:shadow-xl hover:-translate-y-1">
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#0A2540] to-[#C59B27]" />
            <div className="p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="h-14 w-14 rounded-2xl bg-[#0A2540] flex items-center justify-center shadow-lg">
                  <BadgeCheck className="h-7 w-7 text-[#C59B27]" />
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Issuer Portal</p>
                  <h2 className="text-xl font-bold text-[#0A2540]">e-Gov Portal</h2>
                </div>
              </div>
              <p className="text-slate-600 mb-2 text-sm font-medium">
                Government Identity Authority (GIA)
              </p>
              <p className="text-slate-500 mb-8 text-sm">
                Issue your National Mobile Identity Credential to your digital wallet. Secure, verifiable, and recognized across government services.
              </p>
              <div className="flex items-center gap-2 text-xs text-slate-400 mb-6">
                <span className="inline-flex items-center gap-1 bg-slate-100 rounded-full px-2.5 py-1">
                  <FileText className="h-3 w-3" />
                  NationalMobileIdentityCredential
                </span>
                <span className="inline-flex items-center gap-1 bg-slate-100 rounded-full px-2.5 py-1">
                  W3C VC
                </span>
              </div>
              <Link
                href="/egov"
                className="flex items-center justify-center gap-2 w-full bg-[#0A2540] text-white py-3 px-6 rounded-xl font-medium hover:bg-[#0A2540]/90 transition-colors group"
              >
                Issue National eID
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>
          </div>

          {/* e-Tax Portal */}
          <div className="group relative bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden transition-all hover:shadow-xl hover:-translate-y-1">
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#1E4035] to-[#D97706]" />
            <div className="p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="h-14 w-14 rounded-2xl bg-[#1E4035] flex items-center justify-center shadow-lg">
                  <FileText className="h-7 w-7 text-[#D97706]" />
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Verifier + Issuer</p>
                  <h2 className="text-xl font-bold text-[#1E4035]">e-Tax Portal</h2>
                </div>
              </div>
              <p className="text-slate-600 mb-2 text-sm font-medium">
                Revenue Authority (RA)
              </p>
              <p className="text-slate-500 mb-8 text-sm">
                Log in with your National eID and claim your Tax Registration Certificate. Seamless identity-based access to tax services.
              </p>
              <div className="flex items-center gap-2 text-xs text-slate-400 mb-6">
                <span className="inline-flex items-center gap-1 bg-slate-100 rounded-full px-2.5 py-1">
                  <FileText className="h-3 w-3" />
                  TaxRegistrationCertificate
                </span>
                <span className="inline-flex items-center gap-1 bg-slate-100 rounded-full px-2.5 py-1">
                  W3C VC
                </span>
              </div>
              <Link
                href="/etax"
                className="flex items-center justify-center gap-2 w-full bg-[#1E4035] text-white py-3 px-6 rounded-xl font-medium hover:bg-[#1E4035]/90 transition-colors group"
              >
                Login &amp; Manage Tax
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-8 px-4 text-center">
        <p className="text-sm text-slate-400">
          Secured by{' '}
          <span className="font-medium text-slate-600">walt.id</span>
          {' '}— Verifiable Credentials Infrastructure
        </p>
      </footer>
    </div>
  );
}
