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
    <header className="sticky top-0 z-50 w-full border-b border-jp-primary/10 bg-white shadow-sm">
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
            className="text-sm font-medium text-jp-primary transition-colors hover:text-jp-accent"
          >
            Home
          </Link>
          <Link
            href="/idv"
            className="text-sm font-medium text-jp-primary transition-colors hover:text-jp-accent"
          >
            Identity Verification
          </Link>
          <Link
            href="/authenticate"
            className="text-sm font-medium text-jp-primary transition-colors hover:text-jp-accent"
          >
            Authenticate
          </Link>
        </nav>
      </div>
    </header>
  );
}

function Footer() {
  return (
    <footer className="border-t border-jp-primary/10 bg-gradient-to-b from-[#f8fafc] to-white py-8">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-8 sm:grid-cols-3">
          <div>
            <h3 className="mb-4 font-semibold text-jp-primary">Contact</h3>
            <p className="text-sm text-muted-foreground">{branding.contact.name}</p>
          </div>
          <div>
            <h3 className="mb-4 font-semibold text-jp-primary">Services</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/idv" className="hover:text-jp-accent">Identity Verification</Link></li>
              <li><Link href="/authenticate" className="hover:text-jp-accent">Authenticate</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="mb-4 font-semibold text-jp-primary">Legal</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="#" className="hover:text-jp-accent">Privacy Policy</Link></li>
              <li><Link href="#" className="hover:text-jp-accent">Terms of Service</Link></li>
              <li><Link href="#" className="hover:text-jp-accent">Accessibility</Link></li>
            </ul>
          </div>
        </div>
        <div className="mt-8 border-t border-jp-primary/10 pt-8 text-center">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} {branding.copyright} - All rights reserved
          </p>
        </div>
      </div>
    </footer>
  );
}

export default function AcmeLayout({
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
