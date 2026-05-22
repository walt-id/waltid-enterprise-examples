'use client';

import { useEffect, useMemo, useState } from 'react';
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
  Users,
  FileText,
  BadgeCheck,
  CreditCard,
  Receipt
} from 'lucide-react';
import { branding } from '@/lib/branding';
import { IconKey, issuerCards, OpenIdCardMetadata } from '@/lib/config';

const iconMap: Record<IconKey, React.ElementType> = {
  users: Users,
  'file-text': FileText,
  receipt: Receipt,
  'credit-card': CreditCard,
  building: Building2,
  'shield-check': ShieldCheck,
};

function MetadataIcon({
  metadata,
  fallbackIcon,
  className,
}: {
  metadata?: OpenIdCardMetadata;
  fallbackIcon: IconKey;
  className?: string;
}) {
  const Icon = iconMap[fallbackIcon];

  if (metadata?.logoUri) {
    return (
      <span
        aria-label={metadata.logoAltText || metadata.name || 'OpenID metadata logo'}
        role="img"
        className={className || 'h-6 w-6 rounded bg-contain bg-center bg-no-repeat'}
        style={{ backgroundImage: `url(${metadata.logoUri})` }}
      />
    );
  }

  return <Icon className={className || 'h-6 w-6'} />;
}

export default function GovHome() {
  const [issuerMetadata, setIssuerMetadata] = useState<Record<string, OpenIdCardMetadata>>({});

  useEffect(() => {
    let cancelled = false;

    fetch('/api/issuers/metadata')
      .then(response => (response.ok ? response.json() : undefined))
      .then(data => {
        if (cancelled || !Array.isArray(data?.issuers)) return;

        setIssuerMetadata(
          Object.fromEntries(
            data.issuers.map((issuer: { id: string; metadata?: OpenIdCardMetadata }) => [
              issuer.id,
              issuer.metadata || {},
            ])
          )
        );
      })
      .catch(() => {
        // Metadata is optional; the cards render their static fallbacks.
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const issuerCardsWithMetadata = useMemo(
    () => issuerCards.map(issuer => ({ ...issuer, metadata: issuerMetadata[issuer.id] })),
    [issuerMetadata],
  );

  return (
    <div className="min-h-[calc(100vh-4rem)]">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-gov-primary via-gov-primary to-gov-accent px-4 pb-16 pt-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <Badge 
            variant="secondary" 
            className="mb-6 bg-white/10 text-white hover:bg-white/20 border-0 backdrop-blur-sm"
          >
            Digital Government Services
          </Badge>
          <h1 className="mb-6 text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl">
            {branding.tagline}
          </h1>
          <p className="mx-auto max-w-2xl text-lg text-white/90">
            {branding.description}
          </p>
        </div>
      </section>

      {/* Main Actions */}
      <section className="px-4 py-12 sm:px-6 lg:px-8 -mt-8">
        <div className="mx-auto max-w-4xl">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Issue Credentials Card */}
            <Card className="group relative overflow-hidden border-0 bg-white shadow-lg transition-all hover:shadow-xl hover:-translate-y-1">
              <div className="absolute inset-0 bg-gradient-to-br from-gov-primary/5 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
              <div className="absolute top-0 left-0 w-1 h-full bg-gov-primary" />
              <CardHeader className="relative">
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-gov-primary to-gov-accent text-white shadow-lg transition-transform group-hover:scale-110">
                  <BadgeCheck className="h-7 w-7" />
                </div>
                <CardTitle className="text-2xl text-gov-primary">Issue Credentials</CardTitle>
                <CardDescription className="text-base">
                  Issue digital credentials from government departments to your wallet.
                </CardDescription>
              </CardHeader>
              <CardContent className="relative">
                <Link href="/issue">
                  <Button className="w-full bg-gov-primary hover:bg-gov-primary/90 text-white">
                    Get Started
                    <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Verify Identity Card */}
            <Card className="group relative overflow-hidden border-0 bg-white shadow-lg transition-all hover:shadow-xl hover:-translate-y-1">
              <div className="absolute inset-0 bg-gradient-to-br from-gov-accent/5 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
              <div className="absolute top-0 left-0 w-1 h-full bg-gov-accent" />
              <CardHeader className="relative">
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-gov-accent to-gov-primary text-white shadow-lg transition-transform group-hover:scale-110">
                  <ShieldCheck className="h-7 w-7" />
                </div>
                <CardTitle className="text-2xl text-gov-primary">Verify Identity</CardTitle>
                <CardDescription className="text-base">
                  Present your credentials to verify your identity with government services.
                </CardDescription>
              </CardHeader>
              <CardContent className="relative">
                <Link href="/verify">
                  <Button className="w-full bg-gov-accent hover:bg-gov-accent/90 text-white">
                    Verify Now
                    <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Departments Section */}
      <section className="px-4 py-8 sm:px-6 lg:px-8 bg-gradient-to-b from-[#f8fafc] to-white">
        <div className="mx-auto max-w-4xl">
          <div className="text-center mb-8">
            <Badge 
              variant="secondary" 
              className="mb-4 bg-gov-primary/10 text-gov-primary hover:bg-gov-primary/20"
            >
              Government Departments
            </Badge>
            <h2 className="text-2xl font-bold text-gov-primary">
              Available Credential Issuers
            </h2>
            <p className="mt-2 text-muted-foreground">
              Each department can issue specific types of verifiable credentials.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {issuerCardsWithMetadata.map(issuer => (
              <Card key={issuer.id} className="border-0 shadow-md transition-all hover:shadow-lg hover:-translate-y-1 bg-white">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-gov-primary to-gov-accent text-white">
                      <MetadataIcon
                        metadata={issuer.metadata}
                        fallbackIcon={issuer.fallbackIcon}
                        className="h-6 w-6 rounded object-contain"
                      />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gov-primary">
                        {issuer.metadata?.name || issuer.fallbackName}
                      </h4>
                      <p className="text-sm text-muted-foreground mt-1">
                        {issuer.metadata?.description || issuer.fallbackDescription}
                      </p>
                      <div className="flex gap-1 mt-2 flex-wrap">
                        {issuer.badges.map(badge => (
                          <Badge
                            key={badge.label}
                            variant={badge.variant || 'default'}
                            className={`text-xs ${badge.className || ''}`.trim()}
                          >
                            {badge.label}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="mt-8 text-center">
            <Link href="/issue">
              <Button variant="outline" className="border-gov-primary text-gov-primary hover:bg-gov-primary/10">
                <Wallet className="mr-2 h-4 w-4" />
                Issue Credentials to Your Wallet
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <Separator className="mx-auto max-w-4xl" />

      {/* How It Works Section */}
      <section className="px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <h2 className="mb-8 text-center text-2xl font-bold text-gov-primary">
            How It Works
          </h2>
          <div className="grid gap-4 sm:grid-cols-3">
            <Card className="border-0 shadow-md transition-all hover:shadow-lg bg-white text-center">
              <CardContent className="pt-6">
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-gov-primary text-white text-xl font-bold">
                  1
                </div>
                <h4 className="font-semibold text-gov-primary">Select Department</h4>
                <p className="text-sm text-muted-foreground mt-1">
                  Choose the government department for your credential
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-md transition-all hover:shadow-lg bg-white text-center">
              <CardContent className="pt-6">
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-gov-primary text-white text-xl font-bold">
                  2
                </div>
                <h4 className="font-semibold text-gov-primary">Scan QR Code</h4>
                <p className="text-sm text-muted-foreground mt-1">
                  Use your wallet to scan the credential offer
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-md transition-all hover:shadow-lg bg-white text-center">
              <CardContent className="pt-6">
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-gov-primary text-white text-xl font-bold">
                  3
                </div>
                <h4 className="font-semibold text-gov-primary">Use Anywhere</h4>
                <p className="text-sm text-muted-foreground mt-1">
                  Present your credentials to verify your identity
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </div>
  );
}
