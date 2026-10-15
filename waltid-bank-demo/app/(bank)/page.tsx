import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Wallet, 
  ShieldCheck, 
  ArrowRight, 
  Building2,
  Landmark,
  PiggyBank,
  TrendingUp,
  CreditCard,
  Home,
  FileText,
  BadgeCheck,
  LayoutDashboard
} from 'lucide-react';
import { branding } from '@/lib/branding';

const iconTileClass =
  "flex items-center justify-center rounded-2xl bg-brand-ink text-brand-on-bar";

export default function BankDemoHome() {
  return (
    <div className="min-h-[calc(100vh-4rem)]">
      <section className="bg-brand-bar px-4 pb-16 pt-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <Badge 
            variant="secondary" 
            className="mb-6 border-0 bg-brand-on-bar/10 text-brand-on-bar hover:bg-brand-on-bar/20"
          >
            Connecting people, empowering communities
          </Badge>
          <h1 className="mb-6 text-4xl font-bold tracking-tight text-brand-on-bar sm:text-5xl lg:text-6xl">
            {branding.tagline}
          </h1>
          <p className="mx-auto max-w-2xl text-lg text-brand-on-bar/80">
            {branding.description}
          </p>
        </div>
      </section>

      <section className="px-4 py-12 sm:px-6 lg:px-8 -mt-8">
        <div className="mx-auto max-w-4xl">
          <div className="grid gap-6 md:grid-cols-2">
            <Card className="group relative overflow-hidden border-0 bg-white shadow-lg transition-all hover:shadow-xl hover:-translate-y-1">
              <div className="absolute top-0 left-0 h-full w-1 bg-brand-ink" />
              <CardHeader className="relative">
                <div className={`mb-4 h-14 w-14 ${iconTileClass}`}>
                  <Landmark className="h-7 w-7" />
                </div>
                <CardTitle className="text-2xl text-brand-ink">Open Account</CardTitle>
                <CardDescription className="text-base">
                  Open your checking account in minutes with your digital identity (PID).
                </CardDescription>
              </CardHeader>
              <CardContent className="relative">
                <Link href="/account">
                  <Button className="w-full">
                    Get Started
                    <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Card className="group relative overflow-hidden border-0 bg-white shadow-lg transition-all hover:shadow-xl hover:-translate-y-1">
              <div className="absolute top-0 left-0 h-full w-1 bg-brand-ink" />
              <CardHeader className="relative">
                <div className={`mb-4 h-14 w-14 ${iconTileClass}`}>
                  <TrendingUp className="h-7 w-7" />
                </div>
                <CardTitle className="text-2xl text-brand-ink">Apply for Loan</CardTitle>
                <CardDescription className="text-base">
                  Apply for your loan securely with PID and tax certificate.
                </CardDescription>
              </CardHeader>
              <CardContent className="relative">
                <Link href="/loan">
                  <Button className="w-full">
                    Apply Now
                    <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <section className="px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <Card className="group relative overflow-hidden border border-brand-ink/15 bg-white shadow-md transition-all hover:shadow-lg">
            <div className="flex flex-col sm:flex-row items-center gap-6 p-8">
              <div className={`h-16 w-16 shrink-0 ${iconTileClass}`}>
                <LayoutDashboard className="h-8 w-8" />
              </div>
              <div className="flex-1 text-center sm:text-left">
                <h3 className="text-xl font-bold text-brand-ink">Account Overview</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Already a customer? View your balance, transactions, and manage your account.
                </p>
              </div>
              <Link href="/overview">
                <Button className="shrink-0">
                  View Dashboard
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Button>
              </Link>
            </div>
          </Card>
        </div>
      </section>

      <section className="bg-muted px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <div className="text-center mb-8">
            <Badge 
              variant="secondary" 
              className="mb-4 bg-brand-ink/10 text-brand-ink hover:bg-brand-ink/20"
            >
              New: EUDI Wallet Integration
            </Badge>
            <h2 className="text-2xl font-bold text-brand-ink">
              Digital Identity for Secure Banking
            </h2>
            <p className="mt-2 text-muted-foreground">
              Use your EUDI Wallet for simplified and secure account opening and loan applications.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <Card className="border-0 bg-white text-center shadow-md transition-all hover:-translate-y-1 hover:shadow-lg">
              <CardContent className="pt-6">
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-brand-ink text-brand-on-bar">
                  <BadgeCheck className="h-6 w-6" />
                </div>
                <h4 className="font-semibold text-brand-ink">Get PID</h4>
                <p className="text-sm text-muted-foreground mt-1">
                  Load digital ID card into your wallet
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 bg-white text-center shadow-md transition-all hover:-translate-y-1 hover:shadow-lg">
              <CardContent className="pt-6">
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-brand-ink text-brand-on-bar">
                  <FileText className="h-6 w-6" />
                </div>
                <h4 className="font-semibold text-brand-ink">Tax Certificate</h4>
                <p className="text-sm text-muted-foreground mt-1">
                  Digital tax certificate from tax office
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 bg-white text-center shadow-md transition-all hover:-translate-y-1 hover:shadow-lg">
              <CardContent className="pt-6">
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-brand-ink text-brand-on-bar">
                  <ShieldCheck className="h-6 w-6" />
                </div>
                <h4 className="font-semibold text-brand-ink">Apply Securely</h4>
                <p className="text-sm text-muted-foreground mt-1">
                  Get an account or loan with just a few clicks
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="mt-8 text-center">
            <Link href="/issue">
              <Button variant="outline" className="border-brand-ink text-brand-ink hover:bg-brand-ink/10">
                <Wallet className="mr-2 h-4 w-4" />
                To EUDI Wallet Demo
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <Separator className="mx-auto max-w-4xl" />

      <section className="px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <h2 className="mb-8 text-center text-2xl font-bold text-brand-ink">
            Our Products
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card className="border-0 bg-white shadow-md transition-all hover:-translate-y-1 hover:shadow-lg">
              <CardContent className="flex flex-col items-center gap-3 pt-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-ink/10">
                  <PiggyBank className="h-6 w-6 text-brand-ink" />
                </div>
                <h3 className="font-semibold text-brand-ink">Savings</h3>
                <p className="text-center text-sm text-muted-foreground">
                  Demand and fixed-term deposits with attractive interest rates
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 bg-white shadow-md transition-all hover:-translate-y-1 hover:shadow-lg">
              <CardContent className="flex flex-col items-center gap-3 pt-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-ink/10">
                  <CreditCard className="h-6 w-6 text-brand-ink" />
                </div>
                <h3 className="font-semibold text-brand-ink">Cards</h3>
                <p className="text-center text-sm text-muted-foreground">
                  Debit and credit cards for all occasions
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 bg-white shadow-md transition-all hover:-translate-y-1 hover:shadow-lg">
              <CardContent className="flex flex-col items-center gap-3 pt-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-ink/10">
                  <Home className="h-6 w-6 text-brand-ink" />
                </div>
                <h3 className="font-semibold text-brand-ink">Mortgages</h3>
                <p className="text-center text-sm text-muted-foreground">
                  Make your dream of home ownership come true
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 bg-white shadow-md transition-all hover:-translate-y-1 hover:shadow-lg">
              <CardContent className="flex flex-col items-center gap-3 pt-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-ink/10">
                  <Building2 className="h-6 w-6 text-brand-ink" />
                </div>
                <h3 className="font-semibold text-brand-ink">Retirement</h3>
                <p className="text-center text-sm text-muted-foreground">
                  Plan for a secure future
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </div>
  );
}
