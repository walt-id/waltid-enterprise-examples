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
  BadgeCheck
} from 'lucide-react';

export default function BankDemoHome() {
  return (
    <div className="min-h-[calc(100vh-4rem)]">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-brand via-brand-light to-brand-accent px-4 pb-16 pt-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <Badge 
            variant="secondary" 
            className="mb-6 bg-white/10 text-white hover:bg-white/20 border-0 backdrop-blur-sm"
          >
            Connecting people, empowering communities
          </Badge>
          <h1 className="mb-6 text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl">
            Your Digital Bank
            <span className="block text-white/70">for tomorrow</span>
          </h1>
          <p className="mx-auto max-w-2xl text-lg text-white">
            Experience the future of banking with European digital identities.
            Open your account or apply for a loan with your EUDI Wallet.
          </p>
        </div>
      </section>

      {/* Main Actions */}
      <section className="px-4 py-12 sm:px-6 lg:px-8 -mt-8">
        <div className="mx-auto max-w-4xl">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Open Account Card */}
            <Card className="group relative overflow-hidden border-0 bg-white shadow-lg transition-all hover:shadow-xl hover:-translate-y-1">
              <div className="absolute inset-0 bg-gradient-to-br from-brand/5 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
              <div className="absolute top-0 left-0 w-1 h-full bg-brand" />
              <CardHeader className="relative">
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-brand to-brand-accent text-white shadow-lg transition-transform group-hover:scale-110">
                  <Landmark className="h-7 w-7" />
                </div>
                <CardTitle className="text-2xl text-brand">Open Account</CardTitle>
                <CardDescription className="text-base">
                  Open your checking account in minutes with your digital identity (PID).
                </CardDescription>
              </CardHeader>
              <CardContent className="relative">
                <Link href="/account">
                  <Button className="w-full bg-brand hover:bg-brand/90 text-white">
                    Get Started
                    <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Apply for Loan Card */}
            <Card className="group relative overflow-hidden border-0 bg-white shadow-lg transition-all hover:shadow-xl hover:-translate-y-1">
              <div className="absolute inset-0 bg-gradient-to-br from-brand-light/5 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
              <div className="absolute top-0 left-0 w-1 h-full bg-brand-light" />
              <CardHeader className="relative">
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-light to-brand-accent text-white shadow-lg transition-transform group-hover:scale-110">
                  <TrendingUp className="h-7 w-7" />
                </div>
                <CardTitle className="text-2xl text-brand">Apply for Loan</CardTitle>
                <CardDescription className="text-base">
                  Apply for your loan securely with PID and tax certificate.
                </CardDescription>
              </CardHeader>
              <CardContent className="relative">
                <Link href="/loan">
                  <Button className="w-full bg-brand-light hover:bg-brand-light/90 text-white">
                    Apply Now
                    <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* EUDI Wallet Section */}
      <section className="px-4 py-8 sm:px-6 lg:px-8 bg-gradient-to-b from-[#f8fafc] to-white">
        <div className="mx-auto max-w-4xl">
          <div className="text-center mb-8">
            <Badge 
              variant="secondary" 
              className="mb-4 bg-brand/10 text-brand hover:bg-brand/20"
            >
              New: EUDI Wallet Integration
            </Badge>
            <h2 className="text-2xl font-bold text-brand">
              Digital Identity for Secure Banking
            </h2>
            <p className="mt-2 text-muted-foreground">
              Use your EUDI Wallet for simplified and secure account opening and loan applications.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <Card className="border-0 shadow-md text-center transition-all hover:shadow-lg hover:-translate-y-1 bg-white">
              <CardContent className="pt-6">
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-brand to-brand-accent">
                  <BadgeCheck className="h-6 w-6 text-white" />
                </div>
                <h4 className="font-semibold text-brand">Get PID</h4>
                <p className="text-sm text-muted-foreground mt-1">
                  Load digital ID card into your wallet
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-md text-center transition-all hover:shadow-lg hover:-translate-y-1 bg-white">
              <CardContent className="pt-6">
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-brand-light to-brand-accent">
                  <FileText className="h-6 w-6 text-white" />
                </div>
                <h4 className="font-semibold text-brand">Tax Certificate</h4>
                <p className="text-sm text-muted-foreground mt-1">
                  Digital tax certificate from tax office
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-md text-center transition-all hover:shadow-lg hover:-translate-y-1 bg-white">
              <CardContent className="pt-6">
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-brand to-brand-accent">
                  <ShieldCheck className="h-6 w-6 text-white" />
                </div>
                <h4 className="font-semibold text-brand">Apply Securely</h4>
                <p className="text-sm text-muted-foreground mt-1">
                  Get an account or loan with just a few clicks
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="mt-8 text-center">
            <Link href="/issue">
              <Button variant="outline" className="border-brand text-brand hover:bg-brand/10">
                <Wallet className="mr-2 h-4 w-4" />
                To EUDI Wallet Demo
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <Separator className="mx-auto max-w-4xl" />

      {/* Products Section */}
      <section className="px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <h2 className="mb-8 text-center text-2xl font-bold text-brand">
            Our Products
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card className="border-0 shadow-md transition-all hover:shadow-lg hover:-translate-y-1 bg-white">
              <CardContent className="flex flex-col items-center gap-3 pt-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-brand/10 to-brand/5">
                  <PiggyBank className="h-6 w-6 text-brand" />
                </div>
                <h3 className="font-semibold text-brand">Savings</h3>
                <p className="text-center text-sm text-muted-foreground">
                  Demand and fixed-term deposits with attractive interest rates
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-md transition-all hover:shadow-lg hover:-translate-y-1 bg-white">
              <CardContent className="flex flex-col items-center gap-3 pt-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-brand-light/10 to-brand-light/5">
                  <CreditCard className="h-6 w-6 text-brand-light" />
                </div>
                <h3 className="font-semibold text-brand">Cards</h3>
                <p className="text-center text-sm text-muted-foreground">
                  Debit and credit cards for all occasions
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-md transition-all hover:shadow-lg hover:-translate-y-1 bg-white">
              <CardContent className="flex flex-col items-center gap-3 pt-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-brand/10 to-brand/5">
                  <Home className="h-6 w-6 text-brand" />
                </div>
                <h3 className="font-semibold text-brand">Mortgages</h3>
                <p className="text-center text-sm text-muted-foreground">
                  Make your dream of home ownership come true
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-md transition-all hover:shadow-lg hover:-translate-y-1 bg-white">
              <CardContent className="flex flex-col items-center gap-3 pt-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-brand-light/10 to-brand-light/5">
                  <Building2 className="h-6 w-6 text-brand-light" />
                </div>
                <h3 className="font-semibold text-brand">Retirement</h3>
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
