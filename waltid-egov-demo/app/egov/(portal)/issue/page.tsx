'use client';

import { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { InlineQRCode } from '@/components/QRCodeDisplay';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import {
  QrCode,
  RefreshCw,
  Loader2,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  BadgeCheck,
  LogIn,
  ShieldCheck,
} from 'lucide-react';
import Link from 'next/link';
import { nationalMobileIdDefaultValues } from '@/lib/schemas/national-mobile-id';

type Step = 'login' | 'preview' | 'qr';

const DEMO_ID = 'ID-POC-000001';
const DEMO_PASSWORD = 'demo1234';

export default function EgovIssuePage() {
  const [step, setStep] = useState<Step>('login');
  const [idNumber, setIdNumber] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // QR data URL for the inline offline-verification QR on the credential card
  const [offlineQrDataUrl, setOfflineQrDataUrl] = useState('');

  useEffect(() => {
    QRCode.toDataURL(nationalMobileIdDefaultValues.qr_data, {
      width: 96,
      margin: 1,
      color: { dark: '#ffffff', light: '#0F3459' },
    }).then(setOfflineQrDataUrl).catch(() => {});
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    if (!idNumber || !password) {
      setLoginError('Please enter your National ID number and password.');
      return;
    }
    setStep('preview');
  };

  const handleGenerateQR = async () => {
    setIsLoading(true);
    setError('');
    try {
      const response = await fetch('/api/egov/issue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credentialData: nationalMobileIdDefaultValues }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error generating QR code');
      }
      const data = await response.json();
      setQrCodeUrl(data.offerUrl);
      setStep('qr');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setStep('login');
    setIdNumber('');
    setPassword('');
    setLoginError('');
    setQrCodeUrl('');
    setError('');
  };

  const stepLabels = ['Login', 'eID Preview', 'Scan QR Code'];
  const currentStepIndex = step === 'login' ? 0 : step === 'preview' ? 1 : 2;

  const v = nationalMobileIdDefaultValues;

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-b from-egov-surface via-white to-white">
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="mb-8">
          <Link
            href="/egov"
            className="mb-4 inline-flex items-center text-sm text-muted-foreground transition-colors hover:text-egov-primary"
          >
            <ArrowLeft className="mr-1 h-4 w-4" />
            Back to e-Gov Portal
          </Link>
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-egov-primary text-egov-accent">
              <BadgeCheck className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-egov-primary">Issue National eID</h1>
              <p className="text-muted-foreground">Login to receive your National Mobile Identity Credential</p>
            </div>
          </div>
        </div>

        {/* Stepper */}
        <div className="mb-8">
          <div className="flex items-center">
            {stepLabels.map((label, index) => (
              <div key={label} className="flex flex-1 items-center">
                <div className="flex flex-col items-center">
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-full border-2 text-sm font-semibold transition-colors ${
                      currentStepIndex >= index
                        ? 'border-egov-primary bg-egov-primary text-white'
                        : 'border-muted-foreground/20 bg-background text-muted-foreground'
                    }`}
                  >
                    {currentStepIndex > index ? <CheckCircle2 className="h-5 w-5" /> : index + 1}
                  </div>
                  <span className={`mt-2 text-xs font-medium ${currentStepIndex >= index ? 'text-egov-primary' : 'text-muted-foreground'}`}>
                    {label}
                  </span>
                </div>
                {index < stepLabels.length - 1 && (
                  <div className={`mx-2 h-0.5 flex-1 transition-colors ${currentStepIndex > index ? 'bg-egov-primary' : 'bg-muted-foreground/20'}`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* ── Step 1: Login ── */}
        {step === 'login' && (
          <Card className="mb-6 border-egov-primary/20">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-egov-primary text-egov-accent">
                  <LogIn className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle className="text-xl text-egov-primary">Citizen Login</CardTitle>
                  <CardDescription>Sign in to the e-Gov Portal to request your National eID</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="idNumber" className="text-egov-primary font-medium">National ID Number</Label>
                  <Input
                    id="idNumber"
                    type="text"
                    placeholder="e.g. ID-POC-000001"
                    value={idNumber}
                    onChange={e => setIdNumber(e.target.value)}
                    className="border-egov-primary/20 focus:border-egov-primary"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-egov-primary font-medium">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="border-egov-primary/20 focus:border-egov-primary"
                  />
                </div>

                {loginError && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{loginError}</AlertDescription>
                  </Alert>
                )}

                <Button type="submit" size="lg" className="w-full bg-egov-primary hover:bg-egov-primary/90 text-white">
                  <LogIn className="mr-2 h-5 w-5" />
                  Login
                </Button>
              </form>

              {/* Demo hint */}
              <div className="mt-6 rounded-lg border border-egov-accent/40 bg-egov-accent/10 p-4">
                <p className="text-xs font-semibold text-egov-primary mb-2 uppercase tracking-wide">Demo credentials</p>
                <div className="space-y-1 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground w-28">National ID:</span>
                    <code className="rounded bg-white/70 px-2 py-0.5 text-egov-primary font-mono text-xs">{DEMO_ID}</code>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground w-28">Password:</span>
                    <code className="rounded bg-white/70 px-2 py-0.5 text-egov-primary font-mono text-xs">{DEMO_PASSWORD}</code>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* ── Step 2: Credential Preview ── */}
        {step === 'preview' && (
          <Card className="mb-6 border-egov-primary/20">
            <CardHeader>
              <div className="flex items-center gap-3">
                <Badge className="bg-egov-primary">Step 2</Badge>
                <CardTitle className="text-xl text-egov-primary">Your National eID</CardTitle>
              </div>
              <CardDescription>Review the credential details that will be issued to your wallet</CardDescription>
            </CardHeader>
            <CardContent>

              {/* ── Wallet credential card ── */}
              <div
                className="rounded-2xl overflow-hidden shadow-xl mb-6 select-none"
                style={{ background: 'linear-gradient(135deg, #081C30 0%, #0F3459 100%)' }}
              >
                {/* Gold foil bar */}
                <div className="h-1.5 w-full" style={{ background: 'linear-gradient(90deg, #D4AF37, #C59B27, #D4AF37)' }} />

                <div className="p-5">
                  {/* Card header */}
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-widest mb-0.5" style={{ color: '#D4AF37' }}>
                        Government Identity Authority
                      </p>
                      <p className="text-white font-bold text-base leading-tight">National Mobile Identity</p>
                      <p className="text-xs mt-0.5" style={{ color: '#94A3B8' }}>NationalMobileIdentityCredential</p>
                    </div>
                    <Badge className="text-xs border-0 shrink-0" style={{ background: '#10B981', color: '#fff' }}>
                      <CheckCircle2 className="mr-1 h-3 w-3" />
                      Active
                    </Badge>
                  </div>

                  {/* Identity fields */}
                  <div className="grid grid-cols-2 gap-x-6 gap-y-3 mb-4">
                    <div>
                      <p className="text-xs mb-0.5" style={{ color: '#94A3B8' }}>UID Number</p>
                      <p className="text-sm font-mono font-medium text-white">{v.uidNumber}</p>
                    </div>
                    <div>
                      <p className="text-xs mb-0.5" style={{ color: '#94A3B8' }}>National ID Number</p>
                      <p className="text-sm font-mono font-medium text-white">{v.nationalIdNumber}</p>
                    </div>
                    <div>
                      <p className="text-xs mb-0.5" style={{ color: '#94A3B8' }}>Native Name</p>
                      <p className="text-sm font-medium text-white">{v.nativeName}</p>
                    </div>
                    <div>
                      <p className="text-xs mb-0.5" style={{ color: '#94A3B8' }}>Name (English)</p>
                      <p className="text-sm font-medium text-white">{v.nameEnglish}</p>
                    </div>
                    <div>
                      <p className="text-xs mb-0.5" style={{ color: '#94A3B8' }}>Date of Birth</p>
                      <p className="text-sm font-mono font-medium text-white">{v.dateOfBirth}</p>
                    </div>
                    <div>
                      <p className="text-xs mb-0.5" style={{ color: '#94A3B8' }}>Gender</p>
                      <p className="text-sm font-medium text-white">{v.gender}</p>
                    </div>
                    <div>
                      <p className="text-xs mb-0.5" style={{ color: '#94A3B8' }}>Nationality</p>
                      <p className="text-sm font-medium text-white">{v.nationality}</p>
                    </div>
                    <div>
                      <p className="text-xs mb-0.5" style={{ color: '#94A3B8' }}>Over 18</p>
                      <p className="text-sm font-medium" style={{ color: '#10B981' }}>
                        {v.is_over_18 === 'true' ? '✓ Yes' : 'No'}
                      </p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-xs mb-0.5" style={{ color: '#94A3B8' }}>Address</p>
                      <p className="text-sm font-medium text-white">{v.address}</p>
                    </div>
                  </div>

                  {/* Offline QR */}
                  {offlineQrDataUrl && (
                    <div className="flex items-center gap-3 mt-2 pt-3 border-t border-white/10">
                      <img
                        src={offlineQrDataUrl}
                        alt="Offline verification QR"
                        width={64}
                        height={64}
                        className="rounded"
                      />
                      <div>
                        <p className="text-xs font-semibold" style={{ color: '#D4AF37' }}>Offline Verification</p>
                        <p className="text-xs" style={{ color: '#94A3B8' }}>Scan to verify without internet</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Issuer metadata */}
              <div className="rounded-lg bg-egov-surface border border-egov-primary/10 p-4 mb-6">
                <div className="flex items-start gap-3">
                  <ShieldCheck className="h-5 w-5 text-egov-primary mt-0.5 shrink-0" />
                  <div className="space-y-1 text-sm">
                    <div className="flex gap-2 flex-wrap">
                      <span className="text-muted-foreground font-medium w-24">Issuer:</span>
                      <span className="text-egov-primary">Government Identity Authority (GIA) / e-ID Department</span>
                    </div>
                    <div className="flex gap-2">
                      <span className="text-muted-foreground font-medium w-24">Type:</span>
                      <span className="font-mono text-egov-primary text-xs">NationalMobileIdentityCredential</span>
                    </div>
                    <div className="flex gap-2 items-center">
                      <span className="text-muted-foreground font-medium w-24">Format:</span>
                      <Badge variant="outline" className="text-xs h-5">W3C VC / jwt_vc_json</Badge>
                    </div>
                  </div>
                </div>
              </div>

              {error && (
                <Alert variant="destructive" className="mb-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <Button
                onClick={handleGenerateQR}
                disabled={isLoading}
                size="lg"
                className="w-full bg-egov-primary hover:bg-egov-primary/90 text-white"
              >
                {isLoading ? (
                  <><Loader2 className="mr-2 h-5 w-5 animate-spin" />Generating QR Code...</>
                ) : (
                  <><QrCode className="mr-2 h-5 w-5" />Generate QR Code</>
                )}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* ── Step 3: QR Code ── */}
        {step === 'qr' && qrCodeUrl && (
          <Card className="mb-6 border-egov-primary/30 bg-egov-primary/5">
            <CardHeader>
              <div className="flex items-center gap-3">
                <Badge className="bg-green-600">
                  <CheckCircle2 className="mr-1 h-3 w-3" />
                  Ready
                </Badge>
                <CardTitle className="text-xl text-egov-primary">Scan with Wallet</CardTitle>
              </div>
              <CardDescription>
                Open your wallet app and scan this QR code to receive your National eID Credential
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center">
              <InlineQRCode value={qrCodeUrl} />

              <Separator className="my-6" />

              <div className="w-full max-w-sm rounded-lg bg-white border border-egov-primary/20 p-4 text-center mb-4">
                <p className="text-sm font-medium text-egov-primary mb-1">Credential being issued</p>
                <p className="text-xs font-mono text-muted-foreground">NationalMobileIdentityCredential</p>
                <p className="text-xs text-muted-foreground">GIA / e-ID Department</p>
                <p className="text-xs font-medium text-egov-primary mt-2">
                  {v.nameEnglish} — {v.nationalIdNumber}
                </p>
              </div>

              <Button
                onClick={handleReset}
                variant="outline"
                className="border-egov-primary text-egov-primary hover:bg-egov-primary/10"
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Issue another credential
              </Button>
            </CardContent>
          </Card>
        )}

      </div>
    </div>
  );
}
