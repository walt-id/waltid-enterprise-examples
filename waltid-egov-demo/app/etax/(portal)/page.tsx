import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ArrowRight, ShieldCheck, FileText, BadgeCheck, Fingerprint } from 'lucide-react';

export default function EtaxHome() {
  return (
    <div className="min-h-[calc(100vh-4rem)]">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-etax-primary via-etax-primary to-[#13322B] px-4 pb-16 pt-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <Badge
            variant="secondary"
            className="mb-6 bg-white/10 text-white hover:bg-white/20 border-0 backdrop-blur-sm"
          >
            Revenue Authority
          </Badge>
          <h1 className="mb-6 text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl">
            e-Tax Portal
          </h1>
          <p className="mx-auto max-w-2xl text-lg text-white/90">
            Securely log in with your National eID and access your Tax Registration Certificate from the Revenue Authority.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/etax/login">
              <Button size="lg" className="bg-etax-accent hover:bg-etax-accent/90 text-white font-semibold shadow-lg">
                Login with National eID
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
            <div className="absolute inset-0 bg-gradient-to-br from-etax-primary/5 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
            <div className="absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b from-etax-primary to-etax-accent" />
            <CardHeader className="relative">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-etax-primary to-[#13322B] text-etax-accent shadow-lg transition-transform group-hover:scale-110">
                <Fingerprint className="h-8 w-8" />
              </div>
              <CardTitle className="text-2xl text-etax-primary">Login with National eID &amp; Claim Tax Certificate</CardTitle>
              <CardDescription className="text-base">
                Present your National Mobile Identity Credential to verify your identity, then receive your Tax Registration Certificate from the Revenue Authority.
              </CardDescription>
            </CardHeader>
            <CardContent className="relative">
              <div className="mb-6 flex flex-wrap gap-2">
                <Badge variant="outline" className="border-etax-primary/30 text-etax-primary">
                  Verifies: NationalMobileIdentityCredential
                </Badge>
                <Badge variant="outline" className="border-etax-primary/30 text-etax-primary">
                  Issues: TaxRegistrationCertificate
                </Badge>
                <Badge className="bg-green-600 text-white">
                  <ShieldCheck className="mr-1 h-3 w-3" />
                  Issued by RA
                </Badge>
              </div>
              <Link href="/etax/login">
                <Button className="bg-etax-primary hover:bg-etax-primary/90 text-white">
                  Login with National eID
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </section>

      <Separator className="mx-auto max-w-4xl" />

      {/* Credential Info */}
      <section className="px-4 py-12 sm:px-6 lg:px-8 bg-etax-surface">
        <div className="mx-auto max-w-4xl">
          <div className="text-center mb-8">
            <Badge
              variant="secondary"
              className="mb-4 bg-etax-primary/10 text-etax-primary hover:bg-etax-primary/20"
            >
              Tax Certificate Details
            </Badge>
            <h2 className="text-2xl font-bold text-etax-primary">
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
              <Card key={label} className="border-0 shadow-md bg-white">
                <CardContent className="pt-5 pb-5">
                  <div className="flex items-start gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-etax-primary/10">
                      <FileText className="h-4 w-4 text-etax-primary" />
                    </div>
                    <div>
                      <p className="font-semibold text-etax-primary text-sm">{label}</p>
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
          <h2 className="mb-8 text-center text-2xl font-bold text-etax-primary">
            How It Works
          </h2>
          <div className="grid gap-4 sm:grid-cols-3">
            {[
              { step: 1, title: 'Present National eID', desc: 'Scan the QR code with your wallet to present your National Mobile Identity', icon: Fingerprint },
              { step: 2, title: 'Identity Verified', desc: 'The Revenue Authority verifies your identity against the registry', icon: BadgeCheck },
              { step: 3, title: 'Claim Tax Certificate', desc: 'Receive your Tax Registration Certificate directly in your wallet', icon: FileText },
            ].map(({ step, title, desc, icon: Icon }) => (
              <Card key={step} className="border-0 shadow-md bg-white text-center">
                <CardContent className="pt-6">
                  <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-etax-primary text-white text-xl font-bold">
                    {step}
                  </div>
                  <div className="mx-auto mb-2 flex h-8 w-8 items-center justify-center text-etax-accent">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h4 className="font-semibold text-etax-primary">{title}</h4>
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
