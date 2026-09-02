import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { BadgeCheck, ArrowRight, Wallet, FileText, ShieldCheck, Smartphone } from 'lucide-react';

export default function EgovHome() {
  return (
    <div className="min-h-[calc(100vh-4rem)]">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-egov-primary via-egov-primary to-[#0F3459] px-4 pb-16 pt-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <Badge
            variant="secondary"
            className="mb-6 bg-white/10 text-white hover:bg-white/20 border-0 backdrop-blur-sm"
          >
            Government Identity Authority
          </Badge>
          <h1 className="mb-6 text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl">
            e-Gov Portal
          </h1>
          <p className="mx-auto max-w-2xl text-lg text-white/90">
            Issue your National Mobile Identity Credential securely to your digital wallet. Your verified identity — always with you.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/egov/issue">
              <Button size="lg" className="bg-egov-accent hover:bg-egov-accent/90 text-egov-primary font-semibold shadow-lg">
                Issue National eID
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Main Action Card */}
      <section className="px-4 py-12 sm:px-6 lg:px-8 -mt-8">
        <div className="mx-auto max-w-4xl">
          <Card className="group relative overflow-hidden border-0 bg-white shadow-xl transition-all hover:shadow-2xl hover:-translate-y-1">
            <div className="absolute inset-0 bg-gradient-to-br from-egov-primary/5 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
            <div className="absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b from-egov-primary to-egov-accent" />
            <CardHeader className="relative">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-egov-primary to-[#0F3459] text-egov-accent shadow-lg transition-transform group-hover:scale-110">
                <BadgeCheck className="h-8 w-8" />
              </div>
              <CardTitle className="text-2xl text-egov-primary">Issue National Mobile Identity</CardTitle>
              <CardDescription className="text-base">
                Receive your official National Mobile Identity Credential issued by the Government Identity Authority. Store it in your digital wallet and use it to access government services.
              </CardDescription>
            </CardHeader>
            <CardContent className="relative">
              <div className="mb-6 flex flex-wrap gap-2">
                <Badge variant="outline" className="border-egov-primary/30 text-egov-primary">
                  NationalMobileIdentityCredential
                </Badge>
                <Badge variant="outline" className="border-egov-primary/30 text-egov-primary">
                  W3C VC • jwt_vc_json
                </Badge>
                <Badge className="bg-green-600 text-white">
                  <ShieldCheck className="mr-1 h-3 w-3" />
                  Issued by GIA
                </Badge>
              </div>
              <Link href="/egov/issue">
                <Button className="bg-egov-primary hover:bg-egov-primary/90 text-white">
                  Get Started
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </section>

      <Separator className="mx-auto max-w-4xl" />

      {/* Credential Info */}
      <section className="px-4 py-12 sm:px-6 lg:px-8 bg-egov-surface">
        <div className="mx-auto max-w-4xl">
          <div className="text-center mb-8">
            <Badge
              variant="secondary"
              className="mb-4 bg-egov-primary/10 text-egov-primary hover:bg-egov-primary/20"
            >
              Credential Details
            </Badge>
            <h2 className="text-2xl font-bold text-egov-primary">
              National Mobile Identity Credential
            </h2>
            <p className="mt-2 text-muted-foreground">
              Issued by the e-ID Department, Government Identity Authority
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {[
              { label: 'UID Number', desc: 'Unique national identifier' },
              { label: 'Name (English)', desc: 'Official English name' },
              { label: 'Native Name', desc: 'Name in native script' },
              { label: 'Date of Birth', desc: 'Verified date of birth' },
              { label: 'Gender', desc: 'As recorded in national registry' },
              { label: 'Nationality', desc: 'Confirmed citizenship status' },
              { label: 'National ID Number', desc: 'National identity document number' },
            ].map(({ label, desc }) => (
              <Card key={label} className="border-0 shadow-md bg-white">
                <CardContent className="pt-5 pb-5">
                  <div className="flex items-start gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-egov-primary/10">
                      <FileText className="h-4 w-4 text-egov-primary" />
                    </div>
                    <div>
                      <p className="font-semibold text-egov-primary text-sm">{label}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <Separator className="mx-auto max-w-4xl" />

      {/* How It Works */}
      <section className="px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <h2 className="mb-8 text-center text-2xl font-bold text-egov-primary">
            How It Works
          </h2>
          <div className="grid gap-4 sm:grid-cols-3">
            {[
              { step: 1, title: 'Log In', desc: 'Sign in to the portal with your citizen credentials', icon: FileText },
              { step: 2, title: 'Scan QR Code', desc: 'Use your digital wallet to scan the credential offer', icon: Smartphone },
              { step: 3, title: 'Use Anywhere', desc: 'Present your eID to access government services', icon: Wallet },
            ].map(({ step, title, desc, icon: Icon }) => (
              <Card key={step} className="border-0 shadow-md bg-white text-center">
                <CardContent className="pt-6">
                  <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-egov-primary text-white text-xl font-bold">
                    {step}
                  </div>
                  <div className="mx-auto mb-2 flex h-8 w-8 items-center justify-center text-egov-accent">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h4 className="font-semibold text-egov-primary">{title}</h4>
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
