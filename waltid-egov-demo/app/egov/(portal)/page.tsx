import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { BadgeCheck, ArrowRight, Wallet, FileText, ShieldCheck, Smartphone } from 'lucide-react';

export default function EgovHome() {
  return (
    <div className="min-h-[calc(100vh-4rem)]">
      <section className="bg-egov-bar px-4 pb-16 pt-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <Badge
            variant="secondary"
            className="mb-6 border-0 bg-egov-on-bar/10 text-egov-on-bar hover:bg-egov-on-bar/20"
          >
            Government Identity Authority
          </Badge>
          <h1 className="mb-6 text-4xl font-bold tracking-tight text-egov-on-bar sm:text-5xl lg:text-6xl">
            e-Gov Portal
          </h1>
          <p className="mx-auto max-w-2xl text-lg text-egov-on-bar/80">
            Issue your National Mobile Identity Credential securely to your digital wallet. Your verified identity — always with you.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/egov/issue">
              <Button size="lg" className="font-semibold shadow-lg">
                Issue National eID
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <section className="px-4 py-12 sm:px-6 lg:px-8 -mt-8">
        <div className="mx-auto max-w-4xl">
          <Card className="group relative overflow-hidden border-0 bg-white shadow-xl transition-all hover:shadow-2xl hover:-translate-y-1">
            <div className="absolute top-0 left-0 h-full w-1.5 bg-egov-ink" />
            <CardHeader className="relative">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-egov-ink text-egov-on-bar">
                <BadgeCheck className="h-8 w-8" />
              </div>
              <CardTitle className="text-2xl text-egov-ink">Issue National Mobile Identity</CardTitle>
              <CardDescription className="text-base">
                Receive your official National Mobile Identity Credential issued by the Government Identity Authority. Store it in your digital wallet and use it to access government services.
              </CardDescription>
            </CardHeader>
            <CardContent className="relative">
              <div className="mb-6 flex flex-wrap gap-2">
                <Badge variant="outline" className="border-egov-ink/30 text-egov-ink">
                  NationalMobileIdentityCredential
                </Badge>
                <Badge variant="outline" className="border-egov-ink/30 text-egov-ink">
                  W3C VC • jwt_vc_json
                </Badge>
                <Badge className="bg-green-600 text-white">
                  <ShieldCheck className="mr-1 h-3 w-3" />
                  Issued by GIA
                </Badge>
              </div>
              <Link href="/egov/issue">
                <Button>
                  Get Started
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </section>

      <Separator className="mx-auto max-w-4xl" />

      <section className="bg-egov-surface px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <div className="text-center mb-8">
            <Badge
              variant="secondary"
              className="mb-4 bg-egov-ink/10 text-egov-ink hover:bg-egov-ink/20"
            >
              Credential Details
            </Badge>
            <h2 className="text-2xl font-bold text-egov-ink">
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
              <Card key={label} className="border-0 bg-white shadow-md">
                <CardContent className="pt-5 pb-5">
                  <div className="flex items-start gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-egov-ink/10">
                      <FileText className="h-4 w-4 text-egov-ink" />
                    </div>
                    <div>
                      <p className="font-semibold text-egov-ink text-sm">{label}</p>
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

      <section className="px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <h2 className="mb-8 text-center text-2xl font-bold text-egov-ink">
            How It Works
          </h2>
          <div className="grid gap-4 sm:grid-cols-3">
            {[
              { step: 1, title: 'Log In', desc: 'Sign in to the portal with your citizen credentials', icon: FileText },
              { step: 2, title: 'Scan QR Code', desc: 'Use your digital wallet to scan the credential offer', icon: Smartphone },
              { step: 3, title: 'Use Anywhere', desc: 'Present your eID to access government services', icon: Wallet },
            ].map(({ step, title, desc, icon: Icon }) => (
              <Card key={step} className="border-0 bg-white text-center shadow-md">
                <CardContent className="pt-6">
                  <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-egov-ink text-xl font-bold text-egov-on-bar">
                    {step}
                  </div>
                  <div className="mx-auto mb-2 flex h-8 w-8 items-center justify-center text-egov-ink">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h4 className="font-semibold text-egov-ink">{title}</h4>
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
