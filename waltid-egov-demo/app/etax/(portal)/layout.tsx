import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "e-Tax Portal — Revenue Authority",
  description: "Log in with your National eID and manage your Tax Registration Certificate.",
};

function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-etax-primary/10 bg-white shadow-sm">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/etax" className="flex items-center gap-2">
          <span className="font-bold text-etax-primary text-lg tracking-tight">e-Tax Portal</span>
          <span className="hidden sm:block text-xs text-etax-text-muted border border-etax-primary/20 rounded-full px-2 py-0.5 ml-1">
            RA
          </span>
        </Link>
        <nav className="flex items-center gap-6">
          <Link
            href="/etax"
            className="text-sm font-medium text-etax-primary transition-colors hover:text-etax-accent"
          >
            Home
          </Link>
          <Link
            href="/etax/login"
            className="text-sm font-medium text-etax-primary transition-colors hover:text-etax-accent"
          >
            Login with eID
          </Link>
          <Link
            href="/"
            className="text-sm font-medium text-slate-400 transition-colors hover:text-slate-600"
          >
            All Portals
          </Link>
        </nav>
      </div>
    </header>
  );
}

function Footer() {
  return (
    <footer className="bg-etax-primary text-white py-8">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-6 sm:grid-cols-3 mb-6">
          <div>
            <h3 className="font-semibold text-white mb-2">e-Tax Portal</h3>
            <p className="text-sm text-white/70">
              Revenue Authority (RA)
            </p>
            <p className="text-sm text-white/70">Tax Department</p>
          </div>
          <div>
            <h3 className="mb-3 font-semibold text-white/90">Services</h3>
            <ul className="space-y-1.5 text-sm text-white/70">
              <li><Link href="/etax/login" className="hover:text-etax-accent transition-colors">Login with National eID</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="mb-3 font-semibold text-white/90">Legal</h3>
            <ul className="space-y-1.5 text-sm text-white/70">
              <li><Link href="#" className="hover:text-etax-accent transition-colors">Privacy Policy</Link></li>
              <li><Link href="#" className="hover:text-etax-accent transition-colors">Terms of Service</Link></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-white/10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-sm text-white/60">
            © 2026 Revenue Authority (RA) — Tax Department
          </p>
          <p className="text-xs text-white/40">Powered by walt.id</p>
        </div>
      </div>
    </footer>
  );
}

export default function EtaxLayout({
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
