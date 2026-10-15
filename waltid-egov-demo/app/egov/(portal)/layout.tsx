import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "e-Gov Portal — National eID Portal",
  description: "Issue your National Mobile Identity Credential securely to your digital wallet.",
};

const navLinkClass =
  "text-sm font-medium text-egov-on-bar/80 transition-colors hover:text-egov-on-bar";

function Header() {
  return (
    <header className="sticky top-0 z-50 w-full bg-egov-bar text-egov-on-bar shadow-sm">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/egov" className="flex items-center gap-2">
          <span className="font-bold text-lg tracking-tight">e-Gov Portal</span>
          <span className="hidden sm:block text-xs text-egov-on-bar/70 border border-egov-on-bar/30 rounded-full px-2 py-0.5 ml-1">
            e-ID Dept
          </span>
        </Link>
        <nav className="flex items-center gap-6">
          <Link href="/egov" className={navLinkClass}>
            Home
          </Link>
          <Link href="/egov/issue" className={navLinkClass}>
            Issue eID
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
    <footer className="bg-egov-bar py-8 text-egov-on-bar">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-6 sm:grid-cols-3 mb-6">
          <div>
            <h3 className="font-semibold mb-2">e-Gov Portal</h3>
            <p className="text-sm text-egov-on-bar/70">
              Government Identity Authority (GIA)
            </p>
            <p className="text-sm text-egov-on-bar/70">e-ID Department</p>
          </div>
          <div>
            <h3 className="mb-3 font-semibold">Services</h3>
            <ul className="space-y-1.5 text-sm text-egov-on-bar/70">
              <li><Link href="/egov/issue" className="hover:text-egov-on-bar transition-colors">Issue National eID</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="mb-3 font-semibold">Legal</h3>
            <ul className="space-y-1.5 text-sm text-egov-on-bar/70">
              <li><Link href="#" className="hover:text-egov-on-bar transition-colors">Privacy Policy</Link></li>
              <li><Link href="#" className="hover:text-egov-on-bar transition-colors">Terms of Service</Link></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-egov-on-bar/20 pt-6 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-sm text-egov-on-bar/70">
            © 2026 Government Identity Authority (GIA) — e-ID Department
          </p>
          <p className="text-xs text-egov-on-bar/50">Powered by walt.id</p>
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
    <div className="egov-portal flex min-h-screen flex-col bg-white">
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
