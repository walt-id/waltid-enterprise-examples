import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ArrowRight, ShieldCheck, FileText, BadgeCheck, Fingerprint } from 'lucide-react';

export default function EtaxHome() {
  return (
    <div className="min-h-[calc(100vh-4rem)]">
      <section className="bg-etax-bar px-4 pb-16 pt-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <Badge
            variant="secondary"
            className="mb-6 border-0 bg-etax-on-bar/10 text-etax-on-bar hover:bg-etax-on-bar/20"
          >
            Revenue Authority
          </Badge>
          <h1 className="mb-6 text-4xl font-bold tracking-tight text-etax-on-bar sm:text-5xl lg:text-6xl">
            e-Tax Portal
          </h1>
          <p className="mx-auto max-w-2xl text-lg text-etax-on-bar/80">
            Securely log in with your National eID and access your Tax Registration Certificate from the Revenue Authority.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/etax/login">
              <Button size="lg" className="font-semibold shadow-lg">
                Login with National eID
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <section className="px-4 py-12 sm:px-6 lg:px-8 -mt-8">
        <div className="mx-auto max-w-4xl">
          <Card className="group relative overflow-hidden border-0 bg-white shadow-xl transition-all hover:shadow-2xl hover:-translate-y-1">
            <div className="absolute top-0 left-0 h-full w-1.5 bg-etax-ink" />
            <CardHeader className="relative">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-etax-ink text-etax-on-bar">
                <Fingerprint className="h-8 w-8" />
              </div>
              <CardTitle className="text-2xl text-etax-ink">Login with National eID &amp; Claim Tax Certificate</CardTitle>
              <CardDescription className="text-base">
                Present your National Mobile Identity Credential to verify your identity, then receive your Tax Registration Certificate from the Revenue Authority.
              </CardDescription>
            </CardHeader>
            <CardContent className="relative">
              <div className="mb-6 flex flex-wrap gap-2">
                <Badge variant="outline" className="border-etax-ink/30 text-etax-ink">
                  Verifies: NationalMobileIdentityCredential
                </Badge>
                <Badge variant="outline" className="border-etax-ink/30 text-etax-ink">
                  Issues: TaxRegistrationCertificate
                </Badge>
                <Badge className="bg-green-600 text-white">
                  <ShieldCheck className="mr-1 h-3 w-3" />
                  Issued by RA
                </Badge>
              </div>
              <Link href="/etax/login">
                <Button>
                  Login with National eID
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </section>

      <Separator className="mx-auto max-w-4xl" />

      <section className="bg-etax-surface px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <div className="text-center mb-8">
            <Badge
              variant="secondary"
              className="mb-4 bg-etax-ink/10 text-etax-ink hover:bg-etax-ink/20"
            >
              Tax Certificate Details
            </Badge>
            <h2 className="text-2xl font-bold text-etax-ink">
              Tax Registration Certificate
            </h2>
            <p className="mt-2 text-muted-foreground">
              Issued by the Revenue Authority (RA) / Tax Department
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {[
              { label: 'Taxpayer Name', desc: 'Official name as verified by National eID' },
              { label: 'TIN', desc: 'Taxpayer Identification Number issued by the Revenue Authority' },
              { label: 'Tax Office Branch', desc: 'Assigned tax branch for administration' },
              { label: 'Registration Date', desc: 'Date of initial tax registration' },
              { label: 'Taxpayer Status', desc: 'Current compliance status (Active / Compliant)' },
              { label: 'Linked UID', desc: 'National UID linking this certificate to your eID' },
            ].map(({ label, desc }) => (
              <Card key={label} className="border-0 bg-white shadow-md">
                <CardContent className="pt-5 pb-5">
                  <div className="flex items-start gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-etax-ink/10">
                      <FileText className="h-4 w-4 text-etax-ink" />
                    </div>
                    <div>
                      <p className="font-semibold text-etax-ink text-sm">{label}</p>
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
          <h2 className="mb-8 text-center text-2xl font-bold text-etax-ink">
            How It Works
          </h2>
          <div className="grid gap-4 sm:grid-cols-3">
            {[
              { step: 1, title: 'Present National eID', desc: 'Scan the QR code with your wallet to present your National Mobile Identity', icon: Fingerprint },
              { step: 2, title: 'Identity Verified', desc: 'The Revenue Authority verifies your identity against the registry', icon: BadgeCheck },
              { step: 3, title: 'Claim Tax Certificate', desc: 'Receive your Tax Registration Certificate directly in your wallet', icon: FileText },
            ].map(({ step, title, desc, icon: Icon }) => (
              <Card key={step} className="border-0 bg-white text-center shadow-md">
                <CardContent className="pt-6">
                  <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-etax-ink text-xl font-bold text-etax-on-bar">
                    {step}
                  </div>
                  <div className="mx-auto mb-2 flex h-8 w-8 items-center justify-center text-etax-ink">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h4 className="font-semibold text-etax-ink">{title}</h4>
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
