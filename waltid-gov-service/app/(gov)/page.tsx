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
  Building2,
  Users,
  FileText,
  CreditCard,
  Receipt
} from 'lucide-react';
import { branding } from '@/lib/branding';
import { IconKey, issuerCards, OpenIdCardMetadata } from '@/lib/config';
import { SignedMetadataBadge } from '@/components/SignedMetadataBadge';

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
        className={`${className || 'h-6 w-6 rounded'} bg-contain bg-center bg-no-repeat`}
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
      <section className="relative overflow-hidden h-[500px]">
        {/* Background image — path comes from branding.heroImage */}
        <div
          className="absolute inset-0 bg-cover bg-left bg-no-repeat"
          style={{
            backgroundImage: branding.heroFallbackImage
              ? `url('${branding.heroImage}'), url('${branding.heroFallbackImage}')`
              : `url('${branding.heroImage}')`,
          }}
        />
        {/* Dark overlay — opacity controlled by --gov-hero-overlay in globals.css */}
        <div className="absolute inset-0" style={{ backgroundColor: 'var(--gov-hero-overlay)' }} />

        {/* Optional decorative image (e.g. flag) — set branding.heroDecoration to null to remove */}
        {branding.heroDecoration && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={branding.heroDecoration}
            alt=""
            aria-hidden="true"
            className="absolute right-0 top-0 h-full w-auto pointer-events-none select-none object-right-top"
            style={{ maxWidth: '42%' }}
          />
        )}

        {/* Centered content */}
        <div className="relative z-10 flex flex-col items-center justify-center h-full px-4 text-center">
          {/* Badge pill — text from branding.heroBadge */}
          {branding.heroBadge && (
            <Badge
              variant="outline"
              className="mb-5 border-white/60 bg-transparent text-white text-xs tracking-wide px-4 py-1 rounded-full"
            >
              {branding.heroBadge}
            </Badge>
          )}

          <h1 className="mb-3 text-4xl font-bold tracking-tight text-white sm:text-5xl">
            {branding.tagline}
            {branding.headlineAccent && (
              <>
                <br />
                <span className="text-gov-accent">{branding.headlineAccent}</span>
              </>
            )}
          </h1>

          <p className="mb-8 text-sm text-white/80 sm:text-base max-w-xl">
            {branding.description}
          </p>

          {/* Action Cards */}
          <div className="grid gap-4 grid-cols-2 w-full max-w-2xl">
            {/* Issue Credentials Card */}
            <Card className="group border-0 bg-white shadow-lg transition-all hover:shadow-xl hover:-translate-y-1">
              <CardContent className="px-5 pt-5 pb-5 flex flex-col h-full gap-3">
                <div className="flex items-center gap-3">
                  {/* Icon circle colour: --gov-icon-bg in globals.css */}
                  <div className="shrink-0 flex h-9 w-9 items-center justify-center rounded-full bg-[var(--gov-icon-bg)] text-white">
                    <FileText className="h-4 w-4" />
                  </div>
                  <span className="text-sm font-bold text-foreground">Issue Credentials</span>
                </div>
                <p className="flex-1 text-xs text-muted-foreground leading-relaxed">
                  {branding.issueCard.description}
                </p>
                <Link href="/issue">
                  <Button className="w-full bg-gov-primary text-white hover:bg-gov-primary/90 font-semibold h-9 text-sm">
                    {branding.issueCard.buttonLabel}
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Verify Identity Card */}
            <Card className="group border-0 bg-white shadow-lg transition-all hover:shadow-xl hover:-translate-y-1">
              <CardContent className="px-5 pt-5 pb-5 flex flex-col h-full gap-3">
                <div className="flex items-center gap-3">
                  {/* Icon circle colour: --gov-icon-bg in globals.css */}
                  <div className="shrink-0 flex h-9 w-9 items-center justify-center rounded-full bg-[var(--gov-icon-bg)] text-white">
                    <ShieldCheck className="h-4 w-4" />
                  </div>
                  <span className="text-sm font-bold text-foreground">Verify Identity</span>
                </div>
                <p className="flex-1 text-xs text-muted-foreground leading-relaxed">
                  {branding.verifyCard.description}
                </p>
                <Link href="/verify">
                  <Button className="w-full bg-gov-accent text-white hover:bg-gov-accent/90 font-semibold h-9 text-sm">
                    {branding.verifyCard.buttonLabel}
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Departments Section */}
      <section className="px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
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
                    <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-xl ${
                      issuer.metadata?.logoUri ? 'bg-white shadow-sm ring-1 ring-gov-primary/10' : 'bg-gradient-to-br from-gov-primary to-gov-accent text-white'
                    }`}>
                      <MetadataIcon
                        metadata={issuer.metadata}
                        fallbackIcon={issuer.fallbackIcon}
                        className="h-8 w-8 rounded"
                      />
                    </div>
                    <div className="flex-1">
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
                        <SignedMetadataBadge metadata={issuer.metadata} className="text-xs" />
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

      <Separator className="mx-auto max-w-7xl" />

      {/* How It Works Section */}
      <section className="px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
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
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-gov-accent text-white text-xl font-bold">
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