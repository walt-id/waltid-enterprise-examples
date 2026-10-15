import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Wallet, 
  ShieldCheck, 
  ArrowRight, 
  Users,
  FileText,
  BadgeCheck,
  CreditCard,
  Receipt
} from 'lucide-react';
import { branding } from '@/lib/branding';
import { departments } from '@/lib/config';

const iconTileClass =
  "flex shrink-0 items-center justify-center rounded-xl bg-gov-ink text-gov-on-bar";

export default function GovHome() {
  return (
    <div className="min-h-[calc(100vh-4rem)]">
      <section className="bg-gov-bar px-4 pb-16 pt-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <Badge 
            variant="secondary" 
            className="mb-6 border-0 bg-gov-on-bar/10 text-gov-on-bar hover:bg-gov-on-bar/20"
          >
            Digital Government Services
          </Badge>
          <h1 className="mb-6 text-4xl font-bold tracking-tight text-gov-on-bar sm:text-5xl lg:text-6xl">
            {branding.tagline}
          </h1>
          <p className="mx-auto max-w-2xl text-lg text-gov-on-bar/80">
            {branding.description}
          </p>
        </div>
      </section>

      <section className="px-4 py-12 sm:px-6 lg:px-8 -mt-8">
        <div className="mx-auto max-w-4xl">
          <div className="grid gap-6 md:grid-cols-2">
            <Card className="group relative overflow-hidden border-0 bg-white shadow-lg transition-all hover:shadow-xl hover:-translate-y-1">
              <div className="absolute top-0 left-0 h-full w-1 bg-gov-ink" />
              <CardHeader className="relative">
                <div className={`mb-4 h-14 w-14 rounded-2xl ${iconTileClass}`}>
                  <BadgeCheck className="h-7 w-7" />
                </div>
                <CardTitle className="text-2xl text-gov-ink">Issue Credentials</CardTitle>
                <CardDescription className="text-base">
                  Issue digital credentials from government departments to your wallet.
                </CardDescription>
              </CardHeader>
              <CardContent className="relative">
                <Link href="/issue">
                  <Button className="w-full">
                    Get Started
                    <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Card className="group relative overflow-hidden border-0 bg-white shadow-lg transition-all hover:shadow-xl hover:-translate-y-1">
              <div className="absolute top-0 left-0 h-full w-1 bg-gov-ink" />
              <CardHeader className="relative">
                <div className={`mb-4 h-14 w-14 rounded-2xl ${iconTileClass}`}>
                  <ShieldCheck className="h-7 w-7" />
                </div>
                <CardTitle className="text-2xl text-gov-ink">Verify Identity</CardTitle>
                <CardDescription className="text-base">
                  Present your credentials to verify your identity with government services.
                </CardDescription>
              </CardHeader>
              <CardContent className="relative">
                <Link href="/verify">
                  <Button className="w-full">
                    Verify Now
                    <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <section className="bg-muted px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <div className="text-center mb-8">
            <Badge 
              variant="secondary" 
              className="mb-4 bg-gov-ink/10 text-gov-ink hover:bg-gov-ink/20"
            >
              Government Departments
            </Badge>
            <h2 className="text-2xl font-bold text-gov-ink">
              Available Credential Issuers
            </h2>
            <p className="mt-2 text-muted-foreground">
              Each department can issue specific types of verifiable credentials.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Card className="border-0 bg-white shadow-md transition-all hover:-translate-y-1 hover:shadow-lg">
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <div className={`h-12 w-12 ${iconTileClass}`}>
                    <Users className="h-6 w-6" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gov-ink">{departments.hr.name}</h4>
                    <p className="text-sm text-muted-foreground mt-1">
                      {departments.hr.description}
                    </p>
                    <Badge variant="outline" className="mt-2 text-xs">Employee Status</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 bg-white shadow-md transition-all hover:-translate-y-1 hover:shadow-lg">
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <div className={`h-12 w-12 ${iconTileClass}`}>
                    <FileText className="h-6 w-6" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gov-ink">{departments.identity.name}</h4>
                    <p className="text-sm text-muted-foreground mt-1">
                      {departments.identity.description}
                    </p>
                    <div className="flex gap-1 mt-2 flex-wrap">
                      <Badge variant="outline" className="text-xs">Photo ID</Badge>
                      <Badge variant="outline" className="text-xs">Address Proof</Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 bg-white shadow-md transition-all hover:-translate-y-1 hover:shadow-lg">
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <div className={`h-12 w-12 ${iconTileClass}`}>
                    <Receipt className="h-6 w-6" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gov-ink">{departments.revenue.name}</h4>
                    <p className="text-sm text-muted-foreground mt-1">
                      {departments.revenue.description}
                    </p>
                    <Badge variant="outline" className="mt-2 text-xs">Tax Registration</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 bg-white shadow-md transition-all hover:-translate-y-1 hover:shadow-lg">
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <div className={`h-12 w-12 ${iconTileClass}`}>
                    <CreditCard className="h-6 w-6" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gov-ink">{departments.finance.name}</h4>
                    <p className="text-sm text-muted-foreground mt-1">
                      {departments.finance.description}
                    </p>
                    <Badge variant="outline" className="mt-2 text-xs">Bank Account</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="mt-8 text-center">
            <Link href="/issue">
              <Button variant="outline" className="border-gov-ink text-gov-ink hover:bg-gov-ink/10">
                <Wallet className="mr-2 h-4 w-4" />
                Issue Credentials to Your Wallet
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <Separator className="mx-auto max-w-4xl" />

      <section className="px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <h2 className="mb-8 text-center text-2xl font-bold text-gov-ink">
            How It Works
          </h2>
          <div className="grid gap-4 sm:grid-cols-3">
            {[
              { step: 1, title: 'Select Department', desc: 'Choose the government department for your credential' },
              { step: 2, title: 'Scan QR Code', desc: 'Use your wallet to scan the credential offer' },
              { step: 3, title: 'Use Anywhere', desc: 'Present your credentials to verify your identity' },
            ].map(({ step, title, desc }) => (
              <Card key={step} className="border-0 bg-white text-center shadow-md transition-all hover:shadow-lg">
                <CardContent className="pt-6">
                  <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-gov-ink text-xl font-bold text-gov-on-bar">
                    {step}
                  </div>
                  <h4 className="font-semibold text-gov-ink">{title}</h4>
                  <p className="text-sm text-muted-foreground mt-1">{desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
