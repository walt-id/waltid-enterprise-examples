import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { branding } from "@/lib/branding";

export const metadata: Metadata = {
  title: branding.metadata.title,
  description: branding.metadata.description,
};

const navLinkClass =
  "text-sm font-medium text-brand-on-bar/80 transition-colors hover:text-brand-on-bar";

function Header() {
  return (
    <header className="sticky top-0 z-50 w-full bg-brand-bar text-brand-on-bar shadow-sm">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2">
            <Image
              src={branding.logo}
              alt={branding.logoAlt}
              width={branding.logoWidth}
              height={branding.logoHeight}
              className="h-10 w-auto"
              priority
            />
          </Link>
        </div>
        <nav className="flex items-center gap-6">
          <Link href="/" className={navLinkClass}>
            Personal Banking
          </Link>
          <Link href="/account" className={navLinkClass}>
            Open Account
          </Link>
          <Link href="/overview" className={navLinkClass}>
            Account Overview
          </Link>
          <Link href="/loan" className={navLinkClass}>
            Apply for Loan
          </Link>
          <Link href="/issue" className={navLinkClass}>
            EUDI Wallet
          </Link>
        </nav>
      </div>
    </header>
  );
}

function Footer() {
  return (
    <footer className="bg-brand-bar py-8 text-brand-on-bar">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-8 sm:grid-cols-3">
          <div>
            <h3 className="mb-4 font-semibold">Contact</h3>
            <p className="text-sm text-brand-on-bar/70">{branding.contact.name}</p>
          </div>
          <div>
            <h3 className="mb-4 font-semibold">Service</h3>
            <ul className="space-y-2 text-sm text-brand-on-bar/70">
              <li><Link href="/overview" className="hover:text-brand-on-bar">Account Overview</Link></li>
              <li><Link href="/account" className="hover:text-brand-on-bar">Open Account</Link></li>
              <li><Link href="/loan" className="hover:text-brand-on-bar">Apply for Loan</Link></li>
              <li><Link href="/issue" className="hover:text-brand-on-bar">EUDI Wallet Demo</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="mb-4 font-semibold">Legal</h3>
            <ul className="space-y-2 text-sm text-brand-on-bar/70">
              <li><Link href="#" className="hover:text-brand-on-bar">Imprint</Link></li>
              <li><Link href="#" className="hover:text-brand-on-bar">Privacy Policy</Link></li>
              <li><Link href="#" className="hover:text-brand-on-bar">Terms of Service</Link></li>
            </ul>
          </div>
        </div>
        <div className="mt-8 border-t border-brand-on-bar/20 pt-8 text-center">
          <p className="text-sm text-brand-on-bar/70">
            © {new Date().getFullYear()} {branding.copyright} - All rights reserved
          </p>
        </div>
      </div>
    </footer>
  );
}

export default function BankDemoLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex min-h-screen flex-col bg-white">
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
