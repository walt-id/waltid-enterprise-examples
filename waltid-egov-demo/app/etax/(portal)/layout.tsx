import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "e-Tax Portal — Revenue Authority",
  description: "Log in with your National eID and manage your Tax Registration Certificate.",
};

const navLinkClass =
  "text-sm font-medium text-etax-on-bar/80 transition-colors hover:text-etax-on-bar";

function Header() {
  return (
    <header className="sticky top-0 z-50 w-full bg-etax-bar text-etax-on-bar shadow-sm">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/etax" className="flex items-center gap-2">
          <span className="font-bold text-lg tracking-tight">e-Tax Portal</span>
          <span className="hidden sm:block text-xs text-etax-on-bar/70 border border-etax-on-bar/30 rounded-full px-2 py-0.5 ml-1">
            RA
          </span>
        </Link>
        <nav className="flex items-center gap-6">
          <Link href="/etax" className={navLinkClass}>
            Home
          </Link>
          <Link href="/etax/login" className={navLinkClass}>
            Login with eID
          </Link>
          <Link href="/" className={navLinkClass}>
            All Portals
          </Link>
        </nav>
      </div>
    </header>
  );
}

function Footer() {
  return (
    <footer className="bg-etax-bar py-8 text-etax-on-bar">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-6 sm:grid-cols-3 mb-6">
          <div>
            <h3 className="font-semibold mb-2">e-Tax Portal</h3>
            <p className="text-sm text-etax-on-bar/70">
              Revenue Authority (RA)
            </p>
            <p className="text-sm text-etax-on-bar/70">Tax Department</p>
          </div>
          <div>
            <h3 className="mb-3 font-semibold">Services</h3>
            <ul className="space-y-1.5 text-sm text-etax-on-bar/70">
              <li><Link href="/etax/login" className="hover:text-etax-on-bar transition-colors">Login with National eID</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="mb-3 font-semibold">Legal</h3>
            <ul className="space-y-1.5 text-sm text-etax-on-bar/70">
              <li><Link href="#" className="hover:text-etax-on-bar transition-colors">Privacy Policy</Link></li>
              <li><Link href="#" className="hover:text-etax-on-bar transition-colors">Terms of Service</Link></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-etax-on-bar/20 pt-6 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-sm text-etax-on-bar/70">
            © 2026 Revenue Authority (RA) — Tax Department
          </p>
          <p className="text-xs text-etax-on-bar/50">Powered by walt.id</p>
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
    <div className="etax-portal flex min-h-screen flex-col bg-white">
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
