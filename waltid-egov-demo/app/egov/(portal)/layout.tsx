import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "e-Gov Portal — National eID Portal",
  description: "Issue your National Mobile Identity Credential securely to your digital wallet.",
};

function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-egov-primary/10 bg-white shadow-sm">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/egov" className="flex items-center gap-2">
          <span className="font-bold text-egov-primary text-lg tracking-tight">e-Gov Portal</span>
          <span className="hidden sm:block text-xs text-egov-text-muted border border-egov-primary/20 rounded-full px-2 py-0.5 ml-1">
            e-ID Dept
          </span>
        </Link>
        <nav className="flex items-center gap-6">
          <Link
            href="/egov"
            className="text-sm font-medium text-egov-primary transition-colors hover:text-egov-accent"
          >
            Home
          </Link>
          <Link
            href="/egov/issue"
            className="text-sm font-medium text-egov-primary transition-colors hover:text-egov-accent"
          >
            Issue eID
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
    <footer className="bg-egov-primary text-white py-8">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-6 sm:grid-cols-3 mb-6">
          <div>
            <h3 className="font-semibold text-white mb-2">e-Gov Portal</h3>
            <p className="text-sm text-white/70">
              Government Identity Authority (GIA)
            </p>
            <p className="text-sm text-white/70">e-ID Department</p>
          </div>
          <div>
            <h3 className="mb-3 font-semibold text-white/90">Services</h3>
            <ul className="space-y-1.5 text-sm text-white/70">
              <li><Link href="/egov/issue" className="hover:text-egov-accent transition-colors">Issue National eID</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="mb-3 font-semibold text-white/90">Legal</h3>
            <ul className="space-y-1.5 text-sm text-white/70">
              <li><Link href="#" className="hover:text-egov-accent transition-colors">Privacy Policy</Link></li>
              <li><Link href="#" className="hover:text-egov-accent transition-colors">Terms of Service</Link></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-white/10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-sm text-white/60">
            © 2026 Government Identity Authority (GIA) — e-ID Department
          </p>
          <p className="text-xs text-white/40">Powered by walt.id</p>
        </div>
      </div>
    </footer>
  );
}

export default function EgovLayout({
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
