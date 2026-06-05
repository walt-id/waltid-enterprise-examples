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
    <header className="sticky top-0 z-50 w-full border-b border-gov-primary/10 bg-white/95 backdrop-blur-sm shadow-sm">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2.5">
            <Image
              src={branding.logo}
              alt={branding.logoAlt}
              width={140}
              height={40}
              className="h-8 w-auto sm:h-10"
              priority
            />
          </Link>
        </div>
        <nav className="flex items-center gap-1 sm:gap-6">
          <Link
            href="/"
            className="rounded-md px-2 py-1.5 text-sm font-medium text-gov-primary transition-colors hover:bg-gov-primary/5 hover:text-gov-accent"
          >
            Home
          </Link>
          <Link
            href="/issue"
            className="rounded-md px-2 py-1.5 text-sm font-medium text-gov-primary transition-colors hover:bg-gov-primary/5 hover:text-gov-accent"
          >
            Issue Credentials
          </Link>
          <Link
            href="/verify"
            className="rounded-md px-2 py-1.5 text-sm font-medium text-gov-primary transition-colors hover:bg-gov-primary/5 hover:text-gov-accent"
          >
            Verify Identity
          </Link>
        </nav>
      </div>
    </header>
  );
}

function Footer() {
  return (
    <footer className="border-t border-gov-primary/10 bg-gov-primary text-white">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid gap-8 sm:grid-cols-3">
          <div>
            <h3 className="mb-4 font-semibold text-white">Contact</h3>
            <p className="text-sm text-white/70">{branding.contact.name}</p>
          </div>
          <div>
            <h3 className="mb-4 font-semibold text-white">Services</h3>
            <ul className="space-y-2 text-sm text-white/70">
              <li><Link href="/issue" className="hover:text-gov-accent transition-colors">Issue Credentials</Link></li>
              <li><Link href="/verify" className="hover:text-gov-accent transition-colors">Verify Identity</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="mb-4 font-semibold text-white">Legal</h3>
            <ul className="space-y-2 text-sm text-white/70">
              <li><Link href="#" className="hover:text-gov-accent transition-colors">Privacy Policy</Link></li>
              <li><Link href="#" className="hover:text-gov-accent transition-colors">Terms of Service</Link></li>
              <li><Link href="#" className="hover:text-gov-accent transition-colors">Accessibility</Link></li>
            </ul>
          </div>
        </div>
        <div className="mt-8 border-t border-white/10 pt-8 text-center">
          <p className="text-sm text-white/50">
            &copy; {new Date().getFullYear()} {branding.copyright} &mdash; All rights reserved
          </p>
        </div>
      </div>
    </footer>
  );
}

export default function GovLayout({
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