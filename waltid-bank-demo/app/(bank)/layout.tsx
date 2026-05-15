import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { branding } from "@/lib/branding";

export const metadata: Metadata = {
  title: branding.metadata.title,
  description: branding.metadata.description,
};

function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-brand/10 bg-white shadow-sm">
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
          <Link
             href="/"
            className="text-sm font-medium text-brand transition-colors hover:text-brand-light"
          >
            Personal Banking
          </Link>
          <Link
             href="/account"
            className="text-sm font-medium text-brand transition-colors hover:text-brand-light"
          >
            Open Account
          </Link>
          <Link
             href="/overview"
            className="text-sm font-medium text-brand transition-colors hover:text-brand-light"
          >
            Account Overview
          </Link>
          <Link
             href="/loan"
            className="text-sm font-medium text-brand transition-colors hover:text-brand-light"
          >
            Apply for Loan
          </Link>
          <Link
            href="/issue"
            className="text-sm font-medium text-brand-light transition-colors hover:text-brand-light/80"
          >
            EUDI Wallet
          </Link>
        </nav>
      </div>
    </header>
  );
}

function Footer() {
  return (
    <footer className="border-t border-brand/10 bg-gradient-to-b from-[#f8fafc] to-white py-8">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-8 sm:grid-cols-3">
          <div>
            <h3 className="mb-4 font-semibold text-brand">Contact</h3>
            <p className="text-sm text-muted-foreground">{branding.contact.name}</p>
          </div>
          <div>
            <h3 className="mb-4 font-semibold text-brand">Service</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/overview" className="hover:text-brand-light">Account Overview</Link></li>
              <li><Link href="/account" className="hover:text-brand-light">Open Account</Link></li>
              <li><Link href="/loan" className="hover:text-brand-light">Apply for Loan</Link></li>
              <li><Link href="/issue" className="hover:text-brand-light">EUDI Wallet Demo</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="mb-4 font-semibold text-brand">Legal</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="#" className="hover:text-brand-light">Imprint</Link></li>
              <li><Link href="#" className="hover:text-brand-light">Privacy Policy</Link></li>
              <li><Link href="#" className="hover:text-brand-light">Terms of Service</Link></li>
            </ul>
          </div>
        </div>
        <div className="mt-8 border-t border-brand/10 pt-8 text-center">
          <p className="text-sm text-muted-foreground">
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
